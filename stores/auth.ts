import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface UserSession {
  id: number;
  name: string;
  allowedCompanies: { id: number; name: string }[];
  primaryCompanyId: number;
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

  const permissions = useCookie<string[]>("auth_permissions", {
    default: () => [],
    maxAge: 60 * 60 * 24 * 7,
  });

  const emailState = useCookie<string>("auth_email", {
    default: () => "",
    maxAge: 60 * 60 * 24 * 365,
  });

  const loading = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  const currentCompany = computed(() => {
    if (!user.value || !currentCompanyId.value) return null;

    // Always return the actual company object from the allowed list
    return (
      user.value.primaryCompanyId ||
      user.value.allowedCompanies.find(
        (c) => c.id === user.value?.primaryCompanyId,
      ) ||
      null
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
        primaryCompanyId: data.user.primaryCompanyId,
      };

      permissions.value = data.user.userPermissions || [];

      currentCompanyId.value = data.user.primaryCompanyId;
      emailState.value = creds.username.trim();

      return { success: true };
    } catch (error: any) {
      console.error(error);
      logout();
      throw new Error(
        error.data?.message || error.data?.statusMessage || error.message || "Authentication failed",
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
    if (import.meta.client) {
      sessionStorage.removeItem("active_session_p_secret");
    }
  }

  return {
    user,
    currentCompanyId,
    currentCompany,
    email: emailState,
    loading,
    isAuthenticated,
    login,
    switchCompany,
    logout,
  };
});
