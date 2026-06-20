<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  Search,
  RefreshCw,
  Plus,
  CloudOff,
  AlertCircle,
  X,
  LoaderCircle,
} from "@lucide/vue";
import ProductsTable from "~/components/products/ProductsTable.vue";
import ProductDrawer from "~/components/products/ProductDrawer.vue";
import type { Product } from "~/types/product";
import { usePermissions } from "~/composables/usePermissions";

const route = useRoute();
const { can, canViewPage } = usePermissions();

if (import.meta.client) {
  if (!canViewPage(route.path)) {
    navigateTo('/')
  }
}

const currentPage = ref(1);

const searchQuery = ref("");
const archiveFilter = ref<"all" | "active" | "archived">("all");

const {
  data: apiResponse,
  status,
  error,
  refresh,
  pending,
} = useFetch<{
  success: boolean;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  data: Product[];
}>("/api/products/all", {
  lazy: true,
  query: { page: currentPage, archiveFilter },
  watch: [currentPage, archiveFilter],
  transform: (response) => {
    if (!response.data) response.data = [];
    return response;
  },
});

watch(archiveFilter, () => {
  currentPage.value = 1;
});

const products = computed<Product[]>(() => apiResponse.value?.data || []);
const totalPages = computed(() => apiResponse.value?.totalPages || 1);
const totalItems = computed(() => apiResponse.value?.totalItems || 0);

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  const query = searchQuery.value.toLowerCase();
  return products.value.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      (p.display_name && p.display_name.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.includes(query)) ||
      p.pos_categories?.some((c) => c.name.toLowerCase().includes(query)),
  );
});

// Drawer System Management
const drawerOpen = ref(false);
const drawerMode = ref<"add" | "edit">("add");
const selectedProduct = ref<Product | null>(null);
const isSaving = ref(false);
const actionError = ref("");
const liveStockLoading = ref(false);

const checkLiveStock = async () => {
  if (liveStockLoading.value) return;
  const ids = products.value.map((p) => p.id).filter(Boolean) as number[];
  if (!ids.length) return;
  liveStockLoading.value = true;
  try {
    const res = await $fetch<{
      success: boolean;
      stockMap: Record<
        number,
        { qty_available: number; stock_locations: any[] }
      >;
    }>("/api/products/stock", {
      method: "POST",
      body: { ids },
    });
    if (res.success && res.stockMap) {
      for (const prod of products.value) {
        if (prod.id && res.stockMap[prod.id]) {
          const s = res.stockMap[prod.id];
          prod.qty_available = s.qty_available;
          prod.stock_locations = s.stock_locations;
        }
      }
    }
  } catch (err: any) {
    console.error("Failed to fetch live stock:", err);
  } finally {
    liveStockLoading.value = false;
  }
};

const openAddDrawer = () => {
  drawerMode.value = "add";
  selectedProduct.value = null;
  drawerOpen.value = true;
};

const handleEdit = (product: Product) => {
  drawerMode.value = "edit";
  selectedProduct.value = product;
  drawerOpen.value = true;
};

const handleDelete = async (product: Product) => {
  const targetProduct = product;
  if (!targetProduct || !targetProduct.id) {
    alert("لم يتم العثور على معرّف هذا المنتج بالنظام");
    return;
  }

  if (
    confirm(
      `⚠️ تحذير: هل أنت متأكد من رغبتك في حذف منتج "${targetProduct.name}" نهائياً من النظام؟ لا يمكن التراجع عن هذه الخطوة.`,
    )
  ) {
    try {
      isSaving.value = true;

      const response = await $fetch<{ success: boolean; message: string }>(
        "/api/products/delete",
        {
          method: "DELETE",
          body: { id: targetProduct.id },
        },
      );

      if (response.success) {
        await refresh();
        drawerOpen.value = false;
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || err.statusMessage || "خطأ في الاتصال بالنظام، لم يتم حذف المنتج.");
    } finally {
      isSaving.value = false;
    }
  }
};

const handleSave = async (
  payload: Partial<Product> & { variants?: any[]; image_1920?: string | null },
) => {
  isSaving.value = true;
  actionError.value = "";

  try {
    const response = await $fetch<{
      success: boolean;
      message: string;
      id: number;
    }>("/api/products/save", {
      method: "POST",
      body: payload,
    });

    if (response.success) {
      await refresh();
      drawerOpen.value = false;
    }
  } catch (err: any) {
    console.error("Failed to preserve modifications:", err);
    actionError.value =
      err.message ||
      err.statusMessage ||
      "فشل في حفظ المنتج. يرجى المحاولة مجدداً.";
  } finally {
    isSaving.value = false;
  }
};

const handleRestore = async (product: Product) => {
  if (!product || !product.id) return;
  if (!confirm(`هل أنت متأكد من استعادة المنتج "${product.name}"؟`)) return;

  try {
    isSaving.value = true;
    const response = await $fetch<{ success: boolean; message: string }>(
      "/api/products/unarchive",
      { method: "POST", body: { id: product.id } },
    );
    if (response.success) {
      await refresh();
    }
  } catch (err: any) {
    console.error("Failed to restore product:", err);
    actionError.value =
      err.message || err.statusMessage || "فشل في استعادة المنتج.";
  } finally {
    isSaving.value = false;
  }
};

const handleDeleteFromDrawer = async () => {
  if (selectedProduct.value) {
    isSaving.value = true;
    actionError.value = "";

    const isArchived = selectedProduct.value.active === false;
    const endpoint = isArchived ? "/api/products/unarchive" : "/api/products/archive";

    try {
      const response = await $fetch<{
        success: boolean;
        message: string;
        id: number;
      }>(endpoint, {
        method: "POST",
        body: { id: selectedProduct.value?.id },
      });

      if (response.success) {
        await refresh();
        drawerOpen.value = false;
      }
    } catch (err: any) {
      console.error("Failed to update product archive status:", err);
      actionError.value =
        err.message ||
        err.statusMessage ||
        "فشل في تغيير حالة المنتج. يرجى المحاولة مجدداً.";
    } finally {
      isSaving.value = false;
    }
  }
};
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <div
      class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-outline-variant shadow-sm"
    >
      <div class="relative flex-1 max-w-md">
        <Search
          class="absolute right-3 top-1/2 -translate-y-1/2 text-on-white-variant w-5 h-5"
        />
        <input
          v-model="searchQuery"
          class="w-full h-11 pr-10 pl-4 bg-white rounded-full border-none focus:ring-2 focus:ring-primary text-label-md outline-none"
          placeholder="بحث بالاسم، الباركود، أو التصنيف..."
          type="text"
        />
      </div>
      <div class="flex items-center gap-1 bg-white-low rounded-full p-1 border border-outline-variant">
        <button
          @click="archiveFilter = 'all'"
          class="px-3.5 py-1.5 rounded-full text-label-md font-bold transition-all cursor-pointer"
          :class="archiveFilter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-on-white-variant hover:text-on-white'"
        >
          الكل
        </button>
        <button
          @click="archiveFilter = 'active'"
          class="px-3.5 py-1.5 rounded-full text-label-md font-bold transition-all cursor-pointer"
          :class="archiveFilter === 'active' ? 'bg-white text-primary shadow-sm' : 'text-on-white-variant hover:text-on-white'"
        >
          النشط
        </button>
        <button
          @click="archiveFilter = 'archived'"
          class="px-3.5 py-1.5 rounded-full text-label-md font-bold transition-all cursor-pointer"
          :class="archiveFilter === 'archived' ? 'bg-white text-primary shadow-sm' : 'text-on-white-variant hover:text-on-white'"
        >
          المؤرشف
        </button>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="refresh()"
          class="p-2.5 rounded-full border border-outline-variant hover:bg-white transition-all active:scale-95 text-on-white-variant cursor-pointer flex items-center justify-center"
          title="تحديث البيانات"
        >
          <RefreshCw
            :class="{ 'animate-spin': status === 'pending' }"
            class="w-5 h-5"
          />
        </button>
        <button
          @click="checkLiveStock"
          :disabled="liveStockLoading"
          class="flex items-center gap-1.5 px-3 py-2 rounded-full border border-success/40 text-success bg-success/5 hover:bg-success/10 transition-all active:scale-95 cursor-pointer disabled:opacity-50 text-label-md font-bold"
          title="تحديث المخزون المباشر"
        >
          <RefreshCw
            :class="{ 'animate-spin': liveStockLoading }"
            class="w-4 h-4"
          />
          <span>المخزون المباشر</span>
        </button>
        <button
          v-if="can('product.create')"
          @click="openAddDrawer"
          class="text-white flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full font-bold hover:bg-primary/95 transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <Plus class="w-5 h-5" />
          إضافة منتج جديد
        </button>
      </div>
    </div>

    <!-- Loading spinner -->
    <div
      v-if="pending && products.length === 0"
      class="h-[calc(100vh-200px)] flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3 text-on-white-variant">
        <LoaderCircle class="w-8 h-8 animate-spin text-primary" />
        <span class="text-[13px]">جاري تحميل المنتجات...</span>
      </div>
    </div>

    <template v-else>
      <!-- Fetch error banner -->
      <div
        v-if="status === 'error'"
        class="bg-error/10 border border-error text-error p-6 rounded-2xl text-center"
      >
        <CloudOff class="w-10 h-10 mb-2 inline-block" />
        <p class="font-bold">فشل الاتصال بالخادم</p>
        <p class="text-sm opacity-80">{{ error?.message }}</p>
      </div>

      <!-- Action error toast (save / archive) -->
      <Transition name="fade">
        <div
          v-if="actionError"
          class="flex items-start gap-3 bg-error-container/20 border border-error/30 text-on-error-container px-4 py-3 rounded-xl"
        >
          <AlertCircle class="w-5 h-5 text-error mt-0.5 shrink-0" />
          <p class="text-sm flex-1">{{ actionError }}</p>
          <button
            @click="actionError = ''"
            class="text-error hover:text-error/70 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </Transition>

      <ProductsTable
        :products="filteredProducts"
        :status="status"
        :all-products-count="totalItems"
        :current-page="currentPage"
        :total-pages="totalPages"
        :archive-filter="archiveFilter"
        @edit="handleEdit"
        @delete="handleDelete"
        @restore="handleRestore"
        @next-page="nextPage"
        @prev-page="prevPage"
      />

      <ProductDrawer
        v-model:isOpen="drawerOpen"
        :mode="drawerMode"
        :product="selectedProduct"
        :is-saving="isSaving"
        @save="handleSave"
        @delete="handleDeleteFromDrawer"
      />
    </template>
  </div>
</template>
