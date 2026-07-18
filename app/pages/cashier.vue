<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import {
  parseWeightBarcode,
  tryWeightBarcodeSearch,
  type ParsedWeightBarcode,
} from "~/utils/weightBarcode";
import {
  AlertCircle,
  ShoppingCart,
  Plus,
  MapPin,
  Wallet,
  LogOut,
} from "@lucide/vue";
import PosSearchBar from "~/components/pos/PosSearchBar.vue";
import PosCategoryFilter from "~/components/pos/PosCategoryFilter.vue";
import PosProductGrid from "~/components/pos/PosProductGrid.vue";
import PosCartPanel from "~/components/pos/PosCartPanel.vue";
import PosProductDetailSheet from "~/components/pos/PosProductDetailSheet.vue";
import PosVaultModal from "~/components/pos/PosVaultModal.vue";
import PosPaymentSheet from "~/components/pos/PosPaymentSheet.vue";
import PosCloseSessionModal from "~/components/pos/PosCloseSessionModal.vue";
import PosHotkeyHelp from "~/components/pos/PosHotkeyHelp.vue";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { usePosCartStore } from "~~/stores/pos-cart";
import { usePosHotkeys } from "~/composables/usePosHotkeys";
import type {
  POSProduct,
  POSProductVariant,
  POSCategory,
  PaymentMethod,
} from "~/types/pos";
import { usePermissions } from "~/composables/usePermissions";

const { canViewPage, can, isManager } = usePermissions();

const route = useRoute();
const router = useRouter();

if (import.meta.client) {
  if (!canViewPage(route.path)) {
    navigateTo("/");
  }
}

const configId = computed(() => {
  const raw = route.query.config_id;
  return Array.isArray(raw) ? raw[0] : (raw ?? "");
});

const sessionId = ref<number | null>(null);

async function fetchSessionFromApi(configIdVal: string) {
  console.log("[POS] fetchSessionFromApi called with config_id:", configIdVal);
  try {
    const res = await $fetch<{ success: boolean; session: any }>(
      "/api/pos/status",
      {
        params: { config_id: configIdVal },
      },
    );
    if (res.success && res.session?.session_id) {
      console.log(
        "[POS] fetchSessionFromApi success, session_id:",
        res.session.session_id,
      );
      sessionId.value = res.session.session_id;
    } else {
      console.warn("[POS] fetchSessionFromApi no active session found");
    }
  } catch (err) {
    console.error("[POS] fetchSessionFromApi error:", err);
    sessionId.value = null;
  }
}

const cart = usePosCartStore();

const selectedLocationId = ref<number | null>(cart.selectedLocationId);

const searchQuery = ref("");
const scannerActive = ref(false);
const activeCategoryId = ref<number | null>(null);
const currentPage = ref(1);
const selectedProduct = ref<POSProduct | null>(null);
const showProductDetail = ref(false);
const showProductsDrawer = ref(false);
const showVaultModal = ref(false);
const showCloseSessionModal = ref(false);
const showPaymentSheet = ref(false);
const hotkeyPreselectMethodId = ref<number | null>(null);
const hotkeyAutoExpandSection = ref<"discount" | "customer" | null>(null);

const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");

function showFeedbackToast(
  message: string,
  type: "success" | "error" = "success",
) {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

watch(showPaymentSheet, (open) => {
  if (!open) {
    hotkeyPreselectMethodId.value = null;
    hotkeyAutoExpandSection.value = null;
  }
});

const allProducts = ref<POSProduct[]>([]);
const categories = ref<POSCategory[]>([]);
const paymentMethods = ref<PaymentMethod[]>([]);
const locations = ref<any[]>([]);
const loading = ref(false);
const error = ref("");
const totalPages = ref(1);
const searchSuggestions = ref<POSProduct[]>([]);
const searchLoading = ref(false);
const allowOutOfStockSale = ref(false);

const { selectedCartIndex } = usePosHotkeys({
  paymentMethods,
  sessionId,
  showPaymentSheet,
  showCloseSessionModal,
  preselectMethodId: hotkeyPreselectMethodId,
  autoExpandSection: hotkeyAutoExpandSection,
  onCheckout: handleCheckout,
});

const hasMore = computed(() => currentPage.value < totalPages.value);

async function loadMasterData(page = 1) {
  console.log(
    "[POS] loadMasterData page:",
    page,
    "config_id:",
    configId.value,
    "category:",
    activeCategoryId.value,
    "search:",
    searchQuery.value,
  );
  loading.value = true;
  error.value = "";
  try {
    const query: Record<string, any> = {
      config_id: configId.value,
      page,
      limit: 28,
    };
    if (activeCategoryId.value) query.category_id = activeCategoryId.value;
    if (searchQuery.value) query.search = searchQuery.value;
    if (selectedLocationId.value) query.location_id = selectedLocationId.value;

    const res = await $fetch<any>("/api/pos/master-data", { query });

    if (res.success) {
      console.log(
        "[POS] loadMasterData success, products:",
        res.products.data.length,
        "totalPages:",
        res.products.totalPages,
      );
      if (page === 1) {
        allProducts.value = res.products.data;
      } else {
        allProducts.value.push(...res.products.data);
      }
      totalPages.value = res.products.totalPages;
      currentPage.value = page;

      if (page === 1 && res.categories) {
        categories.value = res.categories;
      }
      if (res.paymentMethods) paymentMethods.value = res.paymentMethods;
      if (res.locations) locations.value = res.locations;
      if (res.allowOutOfStockSale !== undefined) {
        allowOutOfStockSale.value = res.allowOutOfStockSale;
      }
    } else {
      console.warn("[POS] loadMasterData response not successful", res);
    }
  } catch (err: any) {
    console.error("[POS] loadMasterData error:", err);
    error.value = err.message || err.statusMessage || "فشل تحميل البيانات";
  } finally {
    loading.value = false;
  }
}

function handleLoadMore() {
  if (hasMore.value && !loading.value) {
    loadMasterData(currentPage.value + 1);
  }
}

function handleCategorySelect(categoryId: number | null) {
  activeCategoryId.value = categoryId;
  currentPage.value = 1;
  allProducts.value = [];
  loadMasterData(1);
}

let searchDebounce: NodeJS.Timeout;
let searchRequestId = 0;

async function fetchSearchSuggestions(val: string) {
  const requestId = ++searchRequestId;
  if (!val.trim()) {
    searchSuggestions.value = [];
    return;
  }
  try {
    const query: Record<string, any> = {
      config_id: configId.value,
      page: 1,
      limit: 10,
      search: val,
    };
    if (selectedLocationId.value) query.location_id = selectedLocationId.value;
    if (activeCategoryId.value) query.category_id = activeCategoryId.value;

    const res = await $fetch<any>("/api/pos/master-data", { query });
    if (res.success && requestId === searchRequestId) {
      searchSuggestions.value = res.products.data || [];
    }
  } catch {
    if (requestId === searchRequestId) {
      searchSuggestions.value = [];
    }
  } finally {
    if (requestId === searchRequestId) {
      searchLoading.value = false;
    }
  }
}

function handleSearch(val: string) {
  clearTimeout(searchDebounce);
  if (!val.trim()) {
    searchSuggestions.value = [];
    searchLoading.value = false;
    return;
  }

  const parsed = parseWeightBarcode(val);
  if (parsed) {
    console.info(
      '[WEIGHT-BARCODE] typed weight barcode, resolving exact:',
      parsed.rawBarcode,
      'weightKg:', parsed.weightKg,
    );
    resolveWeightBarcode(parsed);
    return;
  }

  searchLoading.value = true;
  searchDebounce = setTimeout(() => {
    const { searchQuery: parsedQuery } = tryWeightBarcodeSearch(val);
    fetchSearchSuggestions(parsedQuery);
  }, 300);
}

async function resolveWeightBarcode(parsed: ParsedWeightBarcode) {
  console.info('[WEIGHT-BARCODE] resolving product for code:', parsed.productCode);
  try {
    const query: Record<string, any> = {
      config_id: configId.value,
      page: 1,
      limit: 10,
      search: parsed.productCode,
    };
    if (selectedLocationId.value) query.location_id = selectedLocationId.value;
    if (activeCategoryId.value) query.category_id = activeCategoryId.value;

    const res = await $fetch<any>("/api/pos/master-data", { query });

    if (!res.success) {
      console.warn('[WEIGHT-BARCODE] API search failed for productCode:', parsed.productCode);
      showFeedbackToast("المنتج غير موجود", "error");
      return;
    }

    const candidates: POSProduct[] = res.products.data || [];
    console.info('[WEIGHT-BARCODE] candidates found:', candidates.length);

    const product = candidates.find(
      (p: POSProduct) =>
        p.to_weight &&
        (p.barcode?.startsWith(parsed.productCode) || p.default_code === parsed.productCode),
    );

    if (!product) {
      console.warn('[WEIGHT-BARCODE] no weight product matched code:', parsed.productCode);
      showFeedbackToast("المنتج غير موجود", "error");
      return;
    }

    console.info(
      '[WEIGHT-BARCODE] Product resolved:',
      product.display_name || product.name,
      'id:', product.id,
      'to_weight:', product.to_weight,
    );

    const existingQty = cart.findItem(product.id)?.quantity || 0;
    console.info('[WEIGHT-BARCODE] Existing cart quantity:', existingQty);
    console.info('[WEIGHT-BARCODE] Quantity to add:', parsed.weightKg);
    console.info('[WEIGHT-BARCODE] Final cart quantity:', existingQty + parsed.weightKg);

    handleAddToCart(product, undefined, parsed.weightKg);

    searchSuggestions.value = [];
    searchLoading.value = false;
  } catch (err: any) {
    console.error('[WEIGHT-BARCODE] error resolving product:', err);
    showFeedbackToast("فشل البحث عن المنتج", "error");
  }
}

function handleSelectSuggestion(product: POSProduct, weightKg?: number) {
  searchSuggestions.value = [];
  handleAddToCart(product, undefined, weightKg ?? 1);
}

async function handleScannerError(message: string) {
  showFeedbackToast(message, "error");
}

async function handleScan(barcode: string) {
  scannerActive.value = false;
  clearTimeout(searchDebounce);
  searchSuggestions.value = [];
  searchLoading.value = false;

  const parsed = parseWeightBarcode(barcode);
  const searchBarcode = parsed ? parsed.productCode : barcode;
  const weightKg = parsed ? parsed.weightKg : null;

  console.info('[WEIGHT-BARCODE] Raw barcode:', barcode);
  if (parsed) {
    console.info('[WEIGHT-BARCODE] Parsed productCode:', parsed.productCode);
    console.info('[WEIGHT-BARCODE] Parsed weightKg:', parsed.weightKg);
  }

  searchQuery.value = searchBarcode;
  currentPage.value = 1;
  allProducts.value = [];
  await loadMasterData(1);

  // Pick the product whose barcode actually matches the scanned value.
  // Candidates come back as a page of loose substring matches, so we must
  // filter for the exact scanned barcode, then fall back to the product
  // code prefix rather than blindly taking allProducts.value[0].
  const candidates = allProducts.value;
  const exact = candidates.find((p: POSProduct) => p.barcode === barcode);
  const byCode = candidates.find(
    (p: POSProduct) =>
      p.barcode.startsWith(searchBarcode) || p.default_code === searchBarcode,
  );
  const product = exact || byCode || null;

  if (product) {
    console.info('[WEIGHT-BARCODE] Product resolved:', product.display_name || product.name, 'id:', product.id);
    console.info('[WEIGHT-BARCODE] Is weight product:', product.to_weight);

    if (parsed && weightKg != null) {
      if (!product.to_weight) {
        console.warn('[WEIGHT-BARCODE] barcode is weight-format but product is NOT to_weight — ignoring parsed weight');
        handleAddToCart(product, undefined, undefined);
        return;
      }

      const existingQty = cart.findItem(product.id)?.quantity || 0;
      console.info('[WEIGHT-BARCODE] Existing cart quantity:', existingQty);
      console.info('[WEIGHT-BARCODE] Quantity to add:', weightKg);
      console.info('[WEIGHT-BARCODE] Final cart quantity:', existingQty + weightKg);
    } else {
      console.info('[WEIGHT-BARCODE] Non-weight scan, default quantity');
    }

    handleAddToCart(product, undefined, weightKg ?? undefined);
  } else {
    console.warn(
      "[POS] scan no exact match for barcode:",
      barcode,
      "candidates:",
      candidates.length,
    );
    showFeedbackToast("المنتج غير موجود", "error");
  }
  searchQuery.value = "";
}

function handleLocationChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const val = target.value;
  const id = val ? Number(val) : null;
  const name = id
    ? locations.value.find((l: any) => l.id === id)?.name || ""
    : "";
  selectedLocationId.value = id;
  cart.setLocation(id, name);
  currentPage.value = 1;
  allProducts.value = [];
  loadMasterData(1);
}

function handleProductClick(product: POSProduct) {
  selectedProduct.value = product;
  showProductDetail.value = true;
}

function handleAddToCart(
  product: POSProduct,
  variant?: POSProductVariant,
  qty?: number,
) {
  const quantity =
    qty ??
    (variant ? (variant.to_weight ? 0.01 : 1) : product.to_weight ? 0.01 : 1);
  console.info('[WEIGHT-BARCODE] handleAddToCart — product:', product.display_name || product.name, 'qty passed:', qty, 'final quantity:', quantity);
  cart.addItem(product, variant, quantity);
}

function handleAddToCartFromDetail(
  product: POSProduct,
  variant?: POSProductVariant,
) {
  handleAddToCart(product, variant);
  showProductDetail.value = false;
}

function handleCheckout() {
  if (cart.items.length === 0) return;
  showPaymentSheet.value = true;
}

function handleOrderCompleted() {
  showPaymentSheet.value = false;
}

function handleSessionClosed() {
  console.log(
    "[POS] handleSessionClosed - session closed, redirecting to config:",
    configId.value,
  );
  sessionId.value = null;
  showCloseSessionModal.value = false;
  cart.clearCart();
  router.push(configId.value ? `/pos?config_id=${configId.value}` : "/pos");
}

watch(
  configId,
  async (id) => {
    if (id) {
      const raw = route.query.session_id;
      if (raw) {
        const parsed = Number(Array.isArray(raw) ? raw[0] : raw);
        sessionId.value = Number.isFinite(parsed) ? parsed : null;
      } else {
        await fetchSessionFromApi(id);
      }
      currentPage.value = 1;
      allProducts.value = [];
      await loadMasterData(1);

      if (!selectedLocationId.value && locations.value.length > 0) {
        const first = locations.value[0];
        selectedLocationId.value = first.id;
        cart.setLocation(first.id, first.name);
        currentPage.value = 1;
        allProducts.value = [];
        await loadMasterData(1);
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="configId"
    class="flex gap-0 overflow-hidden -m-6 h-[calc(100vh-4rem)] relative"
  >
    <PosHotkeyHelp />
    <!-- Desktop left panel: search + categories + products (hidden on mobile) -->
    <div class="hidden lg:flex flex-1 flex-col min-w-0">
      <div
        class="px-4 py-3 border-b border-outline-variant/20 bg-card/50 sticky top-0 z-10"
      >
        <div class="flex items-center gap-2">
          <PosSearchBar
            v-model="searchQuery"
            v-model:scanner-active="scannerActive"
            :suggestions="searchSuggestions"
            :loading="searchLoading"
            class="flex-1"
            @scan="handleScan"
            @update:model-value="handleSearch"
            @add-to-cart="handleSelectSuggestion"
            @error="handleScannerError"
          />
        </div>
      </div>

      <div class="px-4 py-2 border-b border-outline-variant/20 bg-card/40">
        <div class="flex items-center gap-3">
          <div
            class="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
          >
            <MapPin class="w-3.5 h-3.5" />
            <select
              :value="selectedLocationId ?? ''"
              @change="handleLocationChange"
              class="bg-transparent border-none text-xs font-medium text-foreground cursor-pointer focus:outline-none"
            >
              <option value="">جميع المواقع</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                {{ loc.name }}
              </option>
            </select>
          </div>
          <PosCategoryFilter
            :categories="categories"
            :active-category-id="activeCategoryId"
            :horizontal="true"
            @select="handleCategorySelect"
          />
          <div
            class="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
          >
            <Wallet class="w-3.5 h-3.5" />
            <button
              @click="showVaultModal = true"
              :disabled="!sessionId"
              class="bg-transparent border-none text-xs font-medium text-foreground cursor-pointer focus:outline-none hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              :title="!sessionId ? 'يجب فتح وردية أولاً' : 'حركات الخزنة'"
            >
              الخزنة
            </button>
          </div>
          <div
            v-if="can('cashier.forceClose')"
            class="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
          >
            <LogOut class="w-3.5 h-3.5" />
            <button
              @click="showCloseSessionModal = true"
              :disabled="!sessionId"
              class="bg-transparent border-none text-xs font-medium text-red-500 cursor-pointer focus:outline-none hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              :title="!sessionId ? 'يجب فتح وردية أولاً' : 'إغلاق الوردية'"
            >
              إغلاق الوردية
            </button>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-3">
        <div
          v-if="error"
          class="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 mb-4"
        >
          <AlertCircle class="h-5 w-5 shrink-0" />
          <p class="flex-1">{{ error }}</p>
        </div>

        <PosProductGrid
          :products="allProducts"
          :loading="loading"
          :has-more="hasMore"
          :selected-location-id="selectedLocationId"
          :allow-out-of-stock-sale="allowOutOfStockSale"
          @load-more="handleLoadMore"
          @product-click="handleProductClick"
          @add-to-cart="handleAddToCart"
        />
      </div>
    </div>

    <!-- Cart: always visible, full width on mobile, 2/3 on desktop -->
    <aside
      class="flex flex-col w-full lg:w-2/3 shrink-0 lg:border-l border-outline-variant/20"
    >
      <!-- Mobile: search + warehouse + categories at top of cart -->
      <div class="lg:hidden">
        <div class="px-4 py-3 border-b border-outline-variant/20 bg-card/50">
          <div class="flex items-center gap-2">
            <PosSearchBar
              v-model="searchQuery"
              v-model:scanner-active="scannerActive"
              :suggestions="searchSuggestions"
              :loading="searchLoading"
              class="flex-1"
              @scan="handleScan"
              @update:model-value="handleSearch"
              @add-to-cart="handleSelectSuggestion"
              @error="handleScannerError"
            />
          </div>
        </div>
        <div class="px-4 py-2 border-b border-outline-variant/20 bg-card/40">
          <div class="flex items-center gap-3">
            <div
              class="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
            >
              <MapPin class="w-3.5 h-3.5" />
              <select
                :value="selectedLocationId ?? ''"
                @change="handleLocationChange"
                class="bg-transparent border-none text-xs font-medium text-foreground cursor-pointer focus:outline-none"
              >
                <option value="">جميع المواقع</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                  {{ loc.name }}
                </option>
              </select>
            </div>
            <PosCategoryFilter
              :categories="categories"
              :active-category-id="activeCategoryId"
              :horizontal="true"
              @select="handleCategorySelect"
            />
            <div
              class="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
            >
              <Wallet class="w-3.5 h-3.5" />
              <button
                @click="showVaultModal = true"
                :disabled="!sessionId"
                class="bg-transparent border-none text-xs font-medium text-foreground cursor-pointer focus:outline-none hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                :title="!sessionId ? 'يجب فتح وردية أولاً' : 'حركات الخزنة'"
              >
                الخزنة
              </button>
            </div>
            <div
              v-if="can('cashier.forceClose')"
              class="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
            >
              <LogOut class="w-3.5 h-3.5" />
              <button
                @click="showCloseSessionModal = true"
                :disabled="!sessionId"
                class="bg-transparent border-none text-xs font-medium text-red-500 cursor-pointer focus:outline-none hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                :title="!sessionId ? 'يجب فتح وردية أولاً' : 'إغلاق الوردية'"
              >
                إغلاق الوردية
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart panel fills remaining space -->
      <PosCartPanel
        :bordered="false"
        :selected-index="selectedCartIndex"
        @checkout="handleCheckout"
        @select-item="(i) => (selectedCartIndex = i)"
      />

      <!-- Mobile: add products button -->
      <div class="lg:hidden border-t border-outline-variant/20 bg-card">
        <div class="px-4 py-3">
          <Button
            class="w-full gap-2 cursor-pointer"
            size="lg"
            @click="showProductsDrawer = true"
          >
            <Plus class="w-5 h-5" />
            إضافة منتجات
          </Button>
        </div>
      </div>
    </aside>

    <!-- Mobile: products bottom sheet -->
    <Sheet v-model:open="showProductsDrawer">
      <SheetContent
        side="bottom"
        class="h-[85vh] p-0 flex flex-col rounded-t-2xl"
      >
        <div
          class="px-4 py-3 border-b border-outline-variant/20 bg-card/50 shrink-0"
        >
          <div class="flex items-center gap-2">
            <PosSearchBar
              v-model="searchQuery"
              v-model:scanner-active="scannerActive"
              :suggestions="searchSuggestions"
              :loading="searchLoading"
              class="flex-1"
              @scan="handleScan"
              @update:model-value="handleSearch"
              @add-to-cart="handleSelectSuggestion"
              @error="handleScannerError"
            />
          </div>
        </div>
        <div
          class="px-4 py-2 border-b border-outline-variant/20 bg-card/40 shrink-0"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
            >
              <MapPin class="w-3.5 h-3.5" />
              <select
                :value="selectedLocationId ?? ''"
                @change="handleLocationChange"
                class="bg-transparent border-none text-xs font-medium text-foreground cursor-pointer focus:outline-none"
              >
                <option value="">جميع المواقع</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                  {{ loc.name }}
                </option>
              </select>
            </div>
            <PosCategoryFilter
              :categories="categories"
              :active-category-id="activeCategoryId"
              :horizontal="true"
              @select="handleCategorySelect"
            />
            <div
              class="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
            >
              <Wallet class="w-3.5 h-3.5" />
              <button
                @click="showVaultModal = true"
                :disabled="!sessionId"
                class="bg-transparent border-none text-xs font-medium text-foreground cursor-pointer focus:outline-none hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                :title="!sessionId ? 'يجب فتح وردية أولاً' : 'حركات الخزنة'"
              >
                الخزنة
              </button>
            </div>
            <div
              v-if="can('cashier.forceClose')"
              class="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0"
            >
              <LogOut class="w-3.5 h-3.5" />
              <button
                @click="showCloseSessionModal = true"
                :disabled="!sessionId"
                class="bg-transparent border-none text-xs font-medium text-red-500 cursor-pointer focus:outline-none hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                :title="!sessionId ? 'يجب فتح وردية أولاً' : 'إغلاق الوردية'"
              >
                إغلاق الوردية
              </button>
            </div>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-3">
          <div
            v-if="error"
            class="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 mb-4"
          >
            <AlertCircle class="h-5 w-5 shrink-0" />
            <p class="flex-1">{{ error }}</p>
          </div>

          <PosProductGrid
            :products="allProducts"
            :loading="loading"
            :has-more="hasMore"
            :selected-location-id="selectedLocationId"
            :allow-out-of-stock-sale="allowOutOfStockSale"
            @load-more="handleLoadMore"
            @product-click="handleProductClick"
            @add-to-cart="handleAddToCart"
          />
        </div>
      </SheetContent>
    </Sheet>

    <PosProductDetailSheet
      :product="selectedProduct"
      :open="showProductDetail"
      @update:open="showProductDetail = $event"
      @add-to-cart="handleAddToCartFromDetail"
      @add-variant-to-cart="
        (variant) => handleAddToCartFromDetail(selectedProduct!, variant)
      "
    />

    <PosPaymentSheet
      v-if="sessionId"
      v-model:open="showPaymentSheet"
      :payment-methods="paymentMethods"
      :session-id="sessionId"
      :config-id="configId"
      :preselect-method-id="hotkeyPreselectMethodId"
      :auto-expand-section="hotkeyAutoExpandSection"
      @order-completed="handleOrderCompleted"
    />

    <PosVaultModal
      v-if="sessionId"
      v-model:open="showVaultModal"
      :session-id="sessionId"
    />

    <PosCloseSessionModal
      v-if="sessionId"
      v-model:open="showCloseSessionModal"
      :session-id="sessionId"
      :config-id="configId"
      @session-closed="handleSessionClosed"
    />
  </div>
  <div v-else class="flex items-center justify-center h-[calc(100vh-8rem)]">
    <div class="text-center space-y-3">
      <ShoppingCart class="h-12 w-12 mx-auto text-muted-foreground/40" />
      <p class="text-muted-foreground">لم يتم تحديد جهاز كاشير</p>
    </div>
  </div>

  <!-- Feedback Toast -->
  <div
    class="fixed bottom-10 left-1/2 -translate-x-1/2 z-100 transition-all duration-500"
    :class="
      showToast
        ? 'translate-y-0 opacity-100'
        : 'translate-y-32 opacity-0 pointer-events-none'
    "
  >
    <div
      class="px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
      :class="
        toastType === 'success'
          ? 'bg-primary text-white'
          : 'bg-red-600 text-white'
      "
    >
      <AlertCircle class="w-5 h-5 shrink-0" />
      <div>
        <p class="font-bold text-sm">{{ toastMessage }}</p>
      </div>
    </div>
  </div>
</template>
