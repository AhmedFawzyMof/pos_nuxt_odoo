<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import type { Product } from "~/types/product";
import { parseWeightBarcode } from "~/utils/weightBarcode";
import { usePermissions } from "~/composables/usePermissions";
const { can } = usePermissions();
import {
  Package,
  X,
  Trash2,
  RotateCcw,
  RefreshCw,
  VideoOff,
  ScanBarcode,
  ChevronDown,
  Layers,
  Plus,
  Image,
  Upload,
  Check,
} from "@lucide/vue";

// واجهة تعريف هيكل المتغير المحلي
interface ProductVariantLocal {
  id?: number;
  name_suffix: string; // مثل: "أحمر", "كبير", "X Large"
  barcode: string;
  standard_price: number;
  price_extra: number; // السعر الإضافي الفارق عن السعر الأساسي
  stock_locations: { locationId: number; locationName: string; quantity: number }[];
}

const { data: locationsResponse } = await useFetch<{
  success: boolean;
  data?: any[];
  error?: string;
}>("/api/warehouse/locations");
const locations = computed(() => locationsResponse.value?.data || []);

const { data: categoriesResponse } = await useFetch<{
  success: boolean;
  data?: any[];
  error?: string;
}>("/api/pos/categories");
const posCategories = computed(() => categoriesResponse.value?.data || []);

const props = defineProps<{
  isOpen: boolean;
  mode: "add" | "edit";
  product: Product | null;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  (e: "update:isOpen", value: boolean): void;
  (
    e: "save",
    payload: Partial<Product> & {
      variants?: ProductVariantLocal[];
      pos_categ_ids?: number[];
      location_qty?: { location_id: number; qty: number }[];
    },
  ): void;
  (e: "delete"): void;
}>();

const formName = ref("");
const formBarcode = ref("");
const formType = ref<"consu" | "service" | "product">("product");
const formListPrice = ref<number>(0);
const formStandardPrice = ref<number>(0);
const formWeight = ref<number>(0);
const formVolume = ref<number>(0);
const formSaleOk = ref(true);
const formPurchaseOk = ref(true);
const formActive = ref(true);
const formAvailableInPos = ref(true);
const formPosCategoryIds = ref<number[]>([]);
const formIsWeight = ref(false);
const formLocationQty = ref<{ locationId: number; locationName: string; quantity: number }[]>([]);
const showLocationDropdown = ref(false);
const showCategoryDropdown = ref(false);
const formImage1920 = ref<string | null>(null);
const formTaxesId = ref<number[]>([]);

const { data: defaultTaxData } = await useFetch<{
  success: boolean;
  tax: { id: number; name: string; amount: number } | null;
}>("/api/taxes/default");

const defaultTaxId = computed(() => defaultTaxData.value?.tax?.id ?? null);

const formTaxable = computed({
  get: () => formTaxesId.value.length > 0,
  set: (val: boolean) => {
    formTaxesId.value = val && defaultTaxId.value ? [defaultTaxId.value] : [];
  },
});

// مصفوفة إدارة المتغيرات الديناميكية
const formVariants = ref<ProductVariantLocal[]>([]);

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    formImage1920.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const triggerFileInput = () => {
  const fileInput = document.getElementById("product-image-input");
  fileInput?.click();
};

const removeImage = () => {
  formImage1920.value = null;
};

// إضافة متغير فارغ جديد للمصفوفة
const addVariantField = () => {
  formVariants.value.push({
    name_suffix: "",
    barcode: "",
    standard_price: 0,
    price_extra: 0,
    stock_locations: formLocationQty.value.map((lq) => ({
      locationId: lq.locationId,
      locationName: lq.locationName,
      quantity: 0,
    })),
  });
};

// إزالة متغير من المصفوفة قبل الحفظ
const removeVariantField = (index: number) => {
  formVariants.value.splice(index, 1);
};

const activeBarcodeTarget = ref<{ type: "main" | "variant"; index?: number }>({
  type: "main",
});

const {
  isActive: isScannerActive,
  isPaused: isScanningPaused,
  errorMessage: scannerErrorMessage,
  start,
  stop,
} = useBarcodeScanner({
  elementId: "barcode-camera-preview",
  pauseDuration: 1800,
  onScan: (barcode, done) => {
    if (activeBarcodeTarget.value.type === "main") {
      const trimmed = barcode.trim();
      const parsed = parseWeightBarcode(trimmed);
      formBarcode.value = parsed && formIsWeight.value ? parsed.productCode : trimmed;
    } else if (
      activeBarcodeTarget.value.type === "variant" &&
      activeBarcodeTarget.value.index !== undefined
    ) {
      const idx = activeBarcodeTarget.value.index;
      formVariants.value[idx]!.barcode = barcode.trim();
    }
    stop();
    setTimeout(done, 1800);
  },
});

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      if (props.mode === "add") {
        formName.value = "";
        formBarcode.value = "";
        formType.value = "product";
        formListPrice.value = 0;
        formStandardPrice.value = 0;
        formWeight.value = 0;
        formVolume.value = 0;
        formSaleOk.value = true;
        formPurchaseOk.value = true;
        formActive.value = true;
        formAvailableInPos.value = true;
        formIsWeight.value = false;
        formPosCategoryIds.value = [];
        formTaxesId.value = [];
        formLocationQty.value = [];
        formVariants.value = [];
        formImage1920.value = null;
      } else if (props.mode === "edit" && props.product) {
        formName.value = props.product.name;
        formBarcode.value = props.product.barcode || "";
        formType.value = props.product.type || "product";
        formListPrice.value = props.product.list_price || 0;
        formStandardPrice.value = props.product.standard_price || 0;
        formWeight.value = props.product.weight || 0;
        formVolume.value = props.product.volume || 0;
        formSaleOk.value = props.product.sale_ok ?? true;
        formPurchaseOk.value = props.product.purchase_ok ?? true;
        formActive.value = props.product.active ?? true;
        formAvailableInPos.value = props.product.available_in_pos ?? true;
        formPosCategoryIds.value =
          (props.product as any).pos_categ_ids ||
          props.product.pos_categories?.map((c) => c.id) ||
          [];
        formIsWeight.value = (props.product as any).to_weight || false;
        formTaxesId.value = ((props.product as any).taxes_id || []).map(Number);
        formLocationQty.value = ((props.product as any).stock_locations || []).map(
          (sl: any) => ({
            locationId: sl.location_id,
            locationName: sl.location_name,
            quantity: sl.qty || 0,
          }),
        );

        // Handling image data URLs or raw base64. Odoo returns base64, so prepend standard PNG header if needed or keep raw.
        // Usually if it's already a full data url from Odoo, we use it directly, or prepend helper.
        // Let's check if the product has image_1920.
        const rawImg = props.product.image_1920;
        if (rawImg) {
          // If it doesn't already have the data URL header, prepending it allows standard <img src="..."> to display it.
          formImage1920.value = rawImg.startsWith("data:")
            ? rawImg
            : `data:image/png;base64,${rawImg}`;
        } else {
          formImage1920.value = null;
        }

        // تعبئة المتغيرات القادمة من السيرفر إذا كان للمنتج variants مخزنة مسبقاً
        if ((props.product as any).product_variant_ids) {
          formVariants.value = (
            (props.product as any).product_variant_ids || []
          ).map((v: any) => ({
            id: v.id,
            name_suffix:
              (v.display_name || "")
                .replace(/^\[.*?\]\s*/, "")
                .replace(props.product?.name || "", "")
                .replace(/[\(\)]/g, "")
                .trim() || v.display_name || "",
            barcode: v.barcode || "",
            standard_price: v.standard_price ?? 0,
            price_extra: v.price_extra ?? (v.lst_price
              ? v.lst_price - (props.product?.list_price || 0)
              : 0),
            stock_locations: (v.stock_locations || []).map((sl: any) => ({
              locationId: sl.location_id,
              locationName: sl.location_name,
              quantity: sl.qty || 0,
            })),
          }));
        } else {
          formVariants.value = [];
        }
      }
    }
  },
);

const toggleCameraScanner = async (
  target: "main" | "variant",
  index?: number,
) => {
  activeBarcodeTarget.value = { type: target, index };
  if (isScannerActive.value) {
    await stop();
  } else {
    await nextTick();
    start();
  }
};

const closeDrawer = async () => {
  await stop();
  emit("update:isOpen", false);
};

const hideCategoryDropdown = () => {
  setTimeout(() => {
    showCategoryDropdown.value = false;
  }, 200);
};

const selectedCategoryNames = computed(() => {
  return posCategories.value
    .filter((c) => formPosCategoryIds.value.includes(c.id))
    .map((c) => c.name);
});

const toggleCategory = (catId: number) => {
  const idx = formPosCategoryIds.value.indexOf(catId);
  if (idx === -1) {
    formPosCategoryIds.value.push(catId);
  } else {
    formPosCategoryIds.value.splice(idx, 1);
  }
};

const selectedLocationNames = computed(() => {
  return formLocationQty.value.map((lq) => lq.locationName);
});

const syncLocationToVariants = () => {
  const activeIds = formLocationQty.value.map((lq) => lq.locationId);
  for (const v of formVariants.value) {
    for (const lq of formLocationQty.value) {
      if (!v.stock_locations.find((sl) => sl.locationId === lq.locationId)) {
        v.stock_locations.push({
          locationId: lq.locationId,
          locationName: lq.locationName,
          quantity: 0,
        });
      }
    }
    v.stock_locations = v.stock_locations.filter((sl) =>
      activeIds.includes(sl.locationId)
    );
  }
};

const addLocation = (loc: any) => {
  if (!formLocationQty.value.find((lq) => lq.locationId === loc.id)) {
    formLocationQty.value.push({
      locationId: loc.id,
      locationName: loc.display_name || loc.name,
      quantity: 0,
    });
  }
  syncLocationToVariants();
};

const removeLocation = (index: number) => {
  formLocationQty.value.splice(index, 1);
  syncLocationToVariants();
};

const saveProduct = () => {
  emit("save", {
    id: props.product?.id,
    name: formName.value,
    barcode: formBarcode.value,
    type: formType.value,
    list_price: Number(formListPrice.value),
    standard_price: Number(formStandardPrice.value),
    weight: Number(formWeight.value),
    volume: Number(formVolume.value),
    sale_ok: formSaleOk.value,
    purchase_ok: formPurchaseOk.value,
    active: formActive.value,
    available_in_pos: formAvailableInPos.value,
    to_weight: formIsWeight.value,
    location_qty: formLocationQty.value.map((lq) => ({
      location_id: lq.locationId,
      qty: Number(lq.quantity),
    })),
    image_1920: formImage1920.value,
    variants: formVariants.value.map((v) => ({
      ...v,
      location_qty: v.stock_locations.map((sl) => ({
        location_id: sl.locationId,
        qty: Number(sl.quantity),
      })),
    })),
    pos_categ_ids: formPosCategoryIds.value,
    taxes_id: formTaxesId.value,
  });
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/40 z-60 backdrop-blur-sm transition-opacity flex justify-center"
    @click="closeDrawer"
  >
    <div
      class="h-full w-full bg-white shadow-2xl flex flex-col relative transition-transform duration-300"
      @click.stop
    >
      <div
        class="p-6 border-b border-outline-variant flex justify-between items-center bg-white-low"
      >
        <div class="flex items-center gap-3">
          <Package
            class="text-primary bg-primary/10 p-2 rounded-lg w-10 h-10"
          />
          <div>
            <h2 class="text-headline-sm font-bold text-primary">
              {{ mode === "add" ? "إضافة منتج جديد" : "تعديل بيانات المنتج" }}
            </h2>
            <p class="text-label-md text-on-white-variant">
              تخصيص الخواص والمقاييس والبدائل
            </p>
          </div>
        </div>
        <button
          @click="closeDrawer"
          class="p-2 hover:bg-white rounded-full transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <!-- قسم رفع صورة المنتج -->
        <div
          class="flex flex-col items-center justify-center pb-4 border-b border-outline-variant"
        >
          <div
            @click="triggerFileInput"
            class="relative group w-32 h-32 rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary bg-white-low hover:bg-white transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-sm"
          >
            <input
              id="product-image-input"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleImageUpload"
            />
            <div v-if="formImage1920" class="w-full h-full relative">
              <img :src="formImage1920" class="w-full h-full object-cover" />
              <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Upload class="w-6 h-6 text-white" />
              </div>
            </div>
            <div
              v-else
              class="flex flex-col items-center justify-center p-4 text-center"
            >
              <Image
                class="w-8 h-8 text-on-white-variant mb-1 group-hover:text-primary transition-colors"
              />
              <span
                class="text-[11px] text-on-white-variant group-hover:text-primary transition-colors"
                >رفع صورة المنتج</span
              >
            </div>
          </div>
          <button
            v-if="formImage1920"
            type="button"
            @click="removeImage"
            class="mt-2 text-xs text-error font-medium hover:underline flex items-center gap-1"
          >
            <Trash2 class="w-3.5 h-3.5" />
            حذف الصورة
          </button>
        </div>

        <div
          v-show="isScannerActive"
          class="mb-3 border border-outline-variant rounded-xl overflow-hidden bg-black relative shadow-inner"
        >
          <div
            id="barcode-camera-preview"
            class="w-full mx-auto max-w-[450px]"
          ></div>
          <div
            v-if="scannerErrorMessage"
            class="absolute inset-0 bg-black/80 flex items-center justify-center p-4 text-center text-error text-xs"
          >
            {{ scannerErrorMessage }}
          </div>
        </div>

        <div class="space-y-4">
          <h3
            class="text-label-md font-bold text-on-white-variant flex items-center gap-2"
          >
            <span class="w-1.5 h-4 bg-primary rounded-full"></span>
            محددات المنتج الشاملة
          </h3>

          <div class="space-y-4">
            <div class="relative">
              <input
                v-model="formName"
                class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                placeholder=" "
                type="text"
              />
              <label
                class="absolute right-4 top-1 text-[10px] text-on-white-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                >اسم المنتج الأساسي</label
              >
            </div>

            <div class="relative space-y-2">
              <div class="relative flex items-center">
                <input
                  v-model="formBarcode"
                  class="peer w-full h-12 pr-12 pl-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md font-mono outline-none transition-all"
                  placeholder=" "
                  type="text"
                />
                <label
                  class="absolute right-12 top-1 text-[10px] text-on-white-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                  >الباركود الأساسي للأب</label
                >
                <button
                  type="button"
                  @click="toggleCameraScanner('main')"
                  :class="[
                    'absolute right-1 h-8 w-9 flex items-center justify-center rounded-md transition-all border outline-none',
                    isScannerActive && activeBarcodeTarget.type === 'main'
                      ? 'bg-error-container text-on-error-container border-error/20'
                      : 'bg-white text-on-white-variant border-outline-variant hover:bg-white',
                  ]"
                >
                  <VideoOff
                    v-if="
                      isScannerActive && activeBarcodeTarget.type === 'main'
                    "
                    class="w-4 h-4"
                  />
                  <ScanBarcode v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="relative">
                <input
                  v-model="formListPrice"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="number"
                />
                <label
                  class="absolute right-4 top-1 text-[10px] text-on-white-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                  >السعر البيعي الرئيسي</label
                >
              </div>
              <div v-if="can('product.viewCost')" class="relative">
                <input
                  v-model="formStandardPrice"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="number"
                />
                <label
                  class="absolute right-4 top-1 text-[10px] text-on-white-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                  >تكلفة الشراء (Cost)</label
                >
              </div>
            </div>

            <!-- Multi-location quantity section -->
            <div class="space-y-3">
              <h3
                class="text-label-md font-bold text-on-white-variant flex items-center gap-2"
              >
                <span class="w-1.5 h-4 bg-primary rounded-full"></span>
                المواقع المخزنية والكميات
              </h3>

              <div class="relative">
                <div
                  class="relative min-h-12 border-b-2 border-outline-variant focus-within:border-primary transition-colors px-4 pt-4 pb-1 flex flex-wrap items-center gap-1 cursor-text"
                  @click="showLocationDropdown = !showLocationDropdown"
                >
                  <span
                    v-for="(lq, idx) in formLocationQty"
                    class="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"
                  >
                    {{ lq.locationName }}
                    <button
                      type="button"
                      @click.stop="removeLocation(idx)"
                      class="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X class="w-3 h-3" />
                    </button>
                  </span>
                  <span
                    v-if="formLocationQty.length === 0"
                    class="text-on-white-variant text-body-md"
                    >اختر مواقع التخزين</span
                  >
                  <ChevronDown
                    class="absolute left-4 top-3.5 w-5 h-5 text-on-white-variant pointer-events-none"
                  />
                </div>
                <div
                  v-if="showLocationDropdown && locations.length > 0"
                  class="absolute z-10 w-full mt-1 bg-white border border-outline-variant rounded-xl shadow-lg max-h-40 overflow-y-auto"
                >
                  <button
                    v-for="loc in locations"
                    :key="loc.id"
                    @mousedown.prevent="addLocation(loc)"
                    class="flex items-center gap-2 w-full text-right px-4 py-2 hover:bg-white text-body-md text-on-white"
                  >
                    <span
                      class="w-4 h-4 border rounded flex items-center justify-center shrink-0"
                      :class="
                        formLocationQty.find(
                          (lq) => lq.locationId === loc.id,
                        )
                          ? 'bg-primary border-primary'
                          : 'border-outline'
                      "
                    >
                      <Check
                        v-if="
                          formLocationQty.find(
                            (lq) => lq.locationId === loc.id,
                          )
                        "
                        class="w-3 h-3 text-white"
                      />
                    </span>
                    {{ loc.display_name || loc.name }}
                  </button>
                </div>
              </div>

              <div v-if="formVariants.length === 0">
                <div
                  v-for="(lq, idx) in formLocationQty"
                  :key="lq.locationId"
                  class="relative"
                >
                  <input
                    v-model.number="lq.quantity"
                    class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                    placeholder=" "
                    type="number"
                    min="0"
                  />
                  <label
                    class="absolute right-4 top-1 text-[10px] text-on-white-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                    >{{
                      formIsWeight
                        ? `الموقع ${idx + 1} الكمية (كجم)`
                        : `الموقع ${idx + 1} الكمية`
                    }}</label
                  >
                </div>
              </div>
            </div>

            <div
              class="pt-2 border-t border-dashed border-outline-variant space-y-3"
            >
              <div class="flex items-center justify-between">
                <h3
                  class="text-label-md font-bold text-primary flex items-center gap-2"
                >
                  <Layers class="w-4 h-4" />
                  متغيرات وبدائل المنتج الفرعية
                </h3>
                <button
                  type="button"
                  @click="addVariantField"
                  class="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md hover:bg-primary/20 transition-all font-bold cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  إضافة متغير
                </button>
              </div>

              <div
                v-if="formVariants.length === 0"
                class="text-center p-4 bg-white rounded-xl border border-dashed border-outline-variant"
              >
                <p class="text-xs text-on-white-variant">
                  لا توجد متغيرات منشأة لهذا المنتج حالياً، يباع كمنتج منفرد
                  موحد السعر.
                </p>
              </div>

              <div
                v-else
                class="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar p-1"
              >
                <div
                  v-for="(variant, idx) in formVariants"
                  :key="idx"
                  class="p-3 bg-white rounded-xl border border-outline-variant space-y-2 relative group"
                >
                  <button
                    type="button"
                    @click="removeVariantField(idx)"
                    class="absolute top-2 left-2 text-on-white-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error/10 cursor-pointer"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>

                  <div class="grid grid-cols-2 gap-2 pt-2">
                    <div class="relative">
                      <input
                        v-model="variant.name_suffix"
                        class="w-full h-9 px-2 text-xs border rounded-lg border-outline focus:border-primary outline-none"
                        placeholder="مثل: أحمر، حجم كبير، XL"
                        type="text"
                      />
                      <span
                        class="absolute -top-2 right-2 text-[9px] bg-white px-1 text-on-white-variant"
                        >اسم المتغير</span
                      >
                    </div>

                    <div class="relative">
                      <input
                        v-model.number="variant.price_extra"
                        class="w-full h-9 px-2 text-xs border rounded-lg border-outline focus:border-primary outline-none"
                        placeholder="0.00"
                        type="number"
                        step="0.1"
                      />
                      <span
                        class="absolute -top-2 right-2 text-[9px] bg-white px-1 text-primary font-bold"
                        >الفارق السعري (+ / -)</span
                      >
                    </div>
                  </div>

                  <div class="relative flex items-center">
                    <input
                      v-model="variant.barcode"
                      class="w-full h-9 pr-8 pl-2 text-xs border rounded-lg border-outline focus:border-primary font-mono outline-none"
                      placeholder="باركود خاص بالبديل"
                      type="text"
                    />
                    <span
                      class="absolute -top-2 right-2 text-[9px] bg-white px-1 text-on-white-variant"
                      >باركود المتغير</span
                    >
                    <button
                      type="button"
                      @click="toggleCameraScanner('variant', idx)"
                      :class="[
                        'absolute right-1 h-7 w-7 flex items-center justify-center rounded-md transition-all border outline-none',
                        isScannerActive &&
                        activeBarcodeTarget.type === 'variant' &&
                        activeBarcodeTarget.index === idx
                          ? 'bg-error-container text-on-error-container border-error/20'
                          : 'bg-white text-on-white-variant border-outline-variant hover:bg-white',
                      ]"
                    >
                      <ScanBarcode class="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div v-if="variant.stock_locations.length > 0" class="border-t border-dashed border-outline-variant pt-2 mt-1">
                    <span class="text-[9px] text-on-white-variant block mb-1">الكمية لكل موقع</span>
                    <div class="grid grid-cols-2 gap-1.5">
                      <div v-for="sl in variant.stock_locations" :key="sl.locationId" class="relative">
                        <input
                          v-model.number="sl.quantity"
                          class="w-full h-7 px-2 text-[10px] border rounded-lg border-outline focus:border-primary outline-none"
                          placeholder="0"
                          type="number"
                          min="0"
                        />
                        <span class="text-[8px] text-on-white-variant block truncate">{{ sl.locationName }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="bg-white-low rounded-xl p-3 border border-outline-variant space-y-2"
            >
              <label
                class="flex items-center gap-3 text-label-md text-on-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formIsWeight"
                  class="w-4 h-4 accent-primary"
                />
                <div class="flex flex-col">
                  <span>المنتج يباع بالوزن</span>
                  <span class="text-[10px] text-on-white-variant"
                    >تفعيل هذا الخيار لتظهر الكمية بالكيلوجرام بدلاً من القطع</span
                  >
                </div>
              </label>
              <div class="border-t border-outline-variant/50"></div>
              <label
                class="flex items-center gap-3 text-label-md text-on-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formTaxable"
                  class="w-4 h-4 accent-primary"
                />
                <div class="flex flex-col">
                  <span>خاضع للضريبة</span>
                  <span class="text-[10px] text-on-white-variant"
                    >{{ defaultTaxData?.tax?.name ? `سيتم تطبيق (${defaultTaxData.tax.name})` : "سيتم تطبيق الضريبة الافتراضية" }}</span
                  >
                </div>
              </label>
            </div>

            <div class="relative mt-4">
              <div
                class="relative min-h-12 border-b-2 border-outline-variant focus-within:border-primary transition-colors px-4 pt-4 pb-1 flex flex-wrap items-center gap-1 cursor-text"
                @click="showCategoryDropdown = !showCategoryDropdown"
              >
                <span
                  v-for="catName in selectedCategoryNames"
                  class="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"
                >
                  {{ catName }}
                  <button
                    type="button"
                    @click.stop="
                      const cat = posCategories.find((c) => c.name === catName);
                      if (cat) toggleCategory(cat.id);
                    "
                    class="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </span>
                <span
                  v-if="selectedCategoryNames.length === 0"
                  class="text-on-white-variant text-body-md"
                  >فئات نقاط البيع</span
                >
                <ChevronDown
                  class="absolute left-4 top-3.5 w-5 h-5 text-on-white-variant pointer-events-none"
                />
              </div>
              <div
                v-if="showCategoryDropdown && posCategories.length > 0"
                class="absolute z-10 w-full mt-1 bg-white border border-outline-variant rounded-xl shadow-lg max-h-40 overflow-y-auto"
              >
                <button
                  v-for="cat in posCategories"
                  :key="cat.id"
                  @mousedown.prevent="toggleCategory(cat.id)"
                  class="flex items-center gap-2 w-full text-right px-4 py-2 hover:bg-white text-body-md text-on-white"
                >
                  <span
                    class="w-4 h-4 border rounded flex items-center justify-center shrink-0"
                    :class="
                      formPosCategoryIds.includes(cat.id)
                        ? 'bg-primary border-primary'
                        : 'border-outline'
                    "
                  >
                    <Check
                      v-if="formPosCategoryIds.includes(cat.id)"
                      class="w-3 h-3 text-white"
                    />
                  </span>
                  {{ cat.name }}
                </button>
              </div>
            </div>

            <div
              class="bg-white-low rounded-xl p-3 border border-outline-variant space-y-2"
            >
              <label
                class="flex items-start gap-3 text-label-md text-on-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formAvailableInPos"
                  class="w-4 h-4 accent-primary mt-1"
                />
                <div class="flex flex-col">
                  <span>تفعيل الإتاحة المباشرة على شاشات كاشير الـ POS</span>
                  <span class="text-[10px] text-on-white-variant"
                    >يسمح بظهور هذا المنتج وبيعه مباشرة في واجهة نقاط البيع
                    للكاشير.</span
                  >
                </div>
              </label>
              <label
                class="flex items-start gap-3 text-label-md text-on-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formSaleOk"
                  class="w-4 h-4 accent-primary mt-1"
                />
                <div class="flex flex-col">
                  <span>يمكن بيعه (Can be Sold)</span>
                  <span class="text-[10px] text-on-white-variant"
                    >تفعيل هذا الخيار لإتاحة المنتج في أوامر البيع
                    والفواتير.</span
                  >
                </div>
              </label>
              <label
                class="flex items-start gap-3 text-label-md text-on-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formPurchaseOk"
                  class="w-4 h-4 accent-primary mt-1"
                />
                <div class="flex flex-col">
                  <span>يمكن شراؤه وتوريده (Can be Purchased)</span>
                  <span class="text-[10px] text-on-white-variant"
                    >تفعيل هذا الخيار لإتاحة المنتج في أوامر الشراء من
                    الموردين.</span
                  >
                </div>
              </label>
              <label
                class="flex items-start gap-3 text-label-md text-on-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formActive"
                  class="w-4 h-4 accent-primary mt-1"
                />
                <div class="flex flex-col">
                  <span>المنتج نشط وغير مؤرشف (Active Status)</span>
                  <span class="text-[10px] text-on-white-variant"
                    >إلغاء التفعيل سيقوم بإخفاء المنتج من القوائم وأرشفته دون
                    حذفه نهائياً.</span
                  >
                </div>
              </label>
            </div>
          </div>
        </div>

        <div
          v-if="mode === 'edit'"
          class="pt-4 border-t border-outline-variant"
        >
          <button
            v-if="can('product.delete') && product?.active !== false"
            @click="emit('delete')"
            class="w-full h-11 flex items-center justify-center gap-2 text-error hover:bg-error/10 rounded-xl transition-colors border border-dashed border-error/30 font-bold text-label-md cursor-pointer"
          >
            <Trash2 class="w-5 h-5" />
            أرشفة هذا المنتج من النظام (Archive)
          </button>
          <button
            v-if="can('product.delete') && product?.active === false"
            @click="emit('delete')"
            class="w-full h-11 flex items-center justify-center gap-2 text-success hover:bg-success/10 rounded-xl transition-colors border border-dashed border-success/30 font-bold text-label-md cursor-pointer"
          >
            <RotateCcw class="w-5 h-5" />
            استعادة هذا المنتج من الأرشيف (Restore)
          </button>
        </div>
      </div>

      <div class="p-6 bg-white-high grid grid-cols-2 gap-4">
        <button
          @click="closeDrawer"
          class="h-12 rounded-xl border border-outline font-bold text-on-white hover:bg-white transition-all active:scale-95 cursor-pointer"
        >
          إلغاء
        </button>
        <button
          @click="saveProduct"
          :disabled="isSaving"
          class="text-white h-12 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary/95 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw v-if="isSaving" class="w-5 h-5 animate-spin" />
          {{ isSaving ? "جاري المزامنة..." : "حفظ للـ ERP" }}
        </button>
      </div>
    </div>
  </div>
</template>
