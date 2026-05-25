import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface UserSession {
  id: number;
  name: string;
  allowedCompanies: { id: number; name: string }[];
}

export const useAuthStore = defineStore("auth", () => {
  const user = useCookie<UserSession | null>("auth_user", {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  const currentCompanyId = useCookie<number | null>("auth_current_company_id", {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7,
  });

  const emailState = useCookie<string>("auth_email", {
    default: () => "",
    maxAge: 60 * 60 * 24 * 365,
  });

  const passwordState = ref("");
  const loading = ref(false);

  onMounted(() => {
    if (import.meta.client && !passwordState.value) {
      const savedPass = sessionStorage.getItem("active_session_p_secret");
      if (savedPass) {
        passwordState.value = savedPass;
      }
    }
  });

  const isAuthenticated = computed(() => !!user.value && !!emailState.value);

  const currentCompany = computed(() => {
    if (!user.value || !currentCompanyId.value) return null;
    return (
      user.value.allowedCompanies.find(
        (c) => c.id === currentCompanyId.value,
      ) || null
    );
  });

  async function login(creds: {
    username: string;
    password: string;
    companySlug?: string;
  }) {
    loading.value = true;
    try {
      const data = await $fetch<any>("/api/auth/login", {
        method: "POST",
        body: {
          username: creds.username.trim(),
          password: creds.password,
          companySlug: creds.companySlug?.trim(),
        },
      });

      if (!data.success || !data.user) {
        throw new Error(
          data.error || "فشل تسجيل الدخول. يرجى التحقق من البيانات.",
        );
      }

      user.value = {
        id: data.user.id,
        name: data.user.name,
        allowedCompanies: data.user.allowedCompanies,
      };

      currentCompanyId.value = data.user.primaryCompanyId;
      emailState.value = creds.username.trim();

      passwordState.value = creds.password;
      if (import.meta.client) {
        sessionStorage.setItem("active_session_p_secret", creds.password);
      }

      return { success: true };
    } catch (error: any) {
      logout();
      throw new Error(
        error.data?.statusMessage || error.message || "Authentication failed",
      );
    } finally {
      loading.value = false;
    }
  }

  function switchCompany(companyId: number) {
    const exists = user.value?.allowedCompanies.some((c) => c.id === companyId);
    if (exists) {
      currentCompanyId.value = companyId;
    }
  }

  function logout() {
    user.value = null;
    currentCompanyId.value = null;
    passwordState.value = "";
    if (import.meta.client) {
      sessionStorage.removeItem("active_session_p_secret");
    }
  }

  return {
    user,
    currentCompanyId,
    currentCompany,
    email: emailState,
    password: passwordState,
    loading,
    isAuthenticated,
    login,
    switchCompany,
    logout,
  };
});
