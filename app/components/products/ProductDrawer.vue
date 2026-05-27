<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick, computed } from "vue";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import type { Product } from "~/types/product";
import {
  Package,
  X,
  Trash2,
  RefreshCw,
  VideoOff,
  ScanBarcode,
  ChevronDown,
  Layers,
  Plus,
  Image,
  Upload,
} from "@lucide/vue";

// واجهة تعريف هيكل المتغير المحلي
interface ProductVariantLocal {
  id?: number;
  name_suffix: string; // مثل: "أحمر", "كبير", "X Large"
  barcode: string;
  price_extra: number; // السعر الإضافي الفارق عن السعر الأساسي
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
    payload: Partial<Product> & { variants?: ProductVariantLocal[] },
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
const formPosCategoryName = ref("");
const formIsWeight = ref(false);
const formLocation = ref<number | null>(null);
const showCategoryDropdown = ref(false);
const formQtyAvailable = ref<number>(0);
const formImage1920 = ref<string | null>(null);

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
    price_extra: 0,
  });
};

// إزالة متغير من المصفوفة قبل الحفظ
const removeVariantField = (index: number) => {
  formVariants.value.splice(index, 1);
};

const isScannerActive = ref(false);
let html5QrcodeInstance: Html5Qrcode | null = null;
const isScanningPaused = ref(false);
const errorMessage = ref("");
// لتحديد مخرجات كاميرا الباركود (هل تكتب في الباركود الرئيسي أم باركود متغير معين)
const activeBarcodeTarget = ref<{ type: "main" | "variant"; index?: number }>({
  type: "main",
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
        formPosCategoryName.value = "";
        formIsWeight.value = false;
        formLocation.value = locations.value?.[0]?.id || null;
        formVariants.value = []; // تصفية المتغيرات عند الإضافة الجديدة
        formQtyAvailable.value = 0;
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
        formPosCategoryName.value =
          props.product.pos_categories?.[0]?.name || "";
        formIsWeight.value = (props.product as any).to_weight || false;
        formLocation.value = null;
        formQtyAvailable.value = props.product.qty_available || 0;
        
        // Handling image data URLs or raw base64. Odoo returns base64, so prepend standard PNG header if needed or keep raw.
        // Usually if it's already a full data url from Odoo, we use it directly, or prepend helper.
        // Let's check if the product has image_1920.
        const rawImg = props.product.image_1920;
        if (rawImg) {
          // If it doesn't already have the data URL header, prepending it allows standard <img src="..."> to display it.
          formImage1920.value = rawImg.startsWith("data:") ? rawImg : `data:image/png;base64,${rawImg}`;
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
              v.name
                .replace(props.product?.name, "")
                .replace(/[\(\)]/g, "")
                .trim() || v.name,
            barcode: v.barcode || "",
            price_extra: v.lst_price
              ? v.lst_price - (props.product?.list_price || 0)
              : 0,
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
    await stopScanner();
  } else {
    isScannerActive.value = true;
    errorMessage.value = "";
    await nextTick();
    startScanner();
  }
};

const startScanner = () => {
  try {
    html5QrcodeInstance = new Html5Qrcode("barcode-camera-preview");

    const config = {
      fps: 10,
      qrbox: { width: 280, height: 140 },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
    };

    html5QrcodeInstance
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (isScanningPaused.value) return;
          handleSuccessfulScan(decodedText);
        },
        (err) => {},
      )
      .catch((err) => {
        errorMessage.value = "تعذر تشغيل الكاميرا. يرجى التأكد من الصلاحيات.";
        isScannerActive.value = false;
      });
  } catch (err) {
    console.error("Scanner initialization failed", err);
  }
};

const handleSuccessfulScan = (barcodeValue: string) => {
  isScanningPaused.value = true;

  try {
    const audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    console.warn("Audio feedback context failed to execute:", e);
  }

  if (activeBarcodeTarget.value.type === "main") {
    formBarcode.value = barcodeValue.trim();
  } else if (
    activeBarcodeTarget.value.type === "variant" &&
    activeBarcodeTarget.value.index !== undefined
  ) {
    const idx = activeBarcodeTarget.value.index;
    formVariants.value[idx]!.barcode = barcodeValue.trim();
  }

  stopScanner();

  setTimeout(() => {
    isScanningPaused.value = false;
  }, 1800);
};

const stopScanner = async () => {
  if (html5QrcodeInstance && html5QrcodeInstance.isScanning) {
    try {
      await html5QrcodeInstance.stop();
    } catch (err) {
      console.error("Failed to safely stop stream tracks", err);
    }
  }
  html5QrcodeInstance = null;
  isScannerActive.value = false;
};

const closeDrawer = async () => {
  await stopScanner();
  emit("update:isOpen", false);
};

onBeforeUnmount(async () => {
  await stopScanner();
});

const hideCategoryDropdown = () => {
  setTimeout(() => {
    showCategoryDropdown.value = false;
  }, 200);
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
    location_id: formLocation.value,
    qty_available: Number(formQtyAvailable.value),
    image_1920: formImage1920.value,
    // إرسال مصفوفة المتغيرات الجديدة والقديمة المحدثة للـ API
    variants: formVariants.value,
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
      class="h-full w-full max-w-[480px] bg-surface shadow-2xl flex flex-col relative transition-transform duration-300 bg-white"
      @click.stop
    >
      <div
        class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low"
      >
        <div class="flex items-center gap-3">
          <Package
            class="text-primary bg-primary/10 p-2 rounded-lg w-10 h-10"
          />
          <div>
            <h2 class="text-headline-sm font-bold text-primary">
              {{ mode === "add" ? "إضافة منتج جديد" : "تعديل بيانات المنتج" }}
            </h2>
            <p class="text-label-md text-on-surface-variant">
              تخصيص الخواص والمقاييس والبدائل
            </p>
          </div>
        </div>
        <button
          @click="closeDrawer"
          class="p-2 hover:bg-surface-container rounded-full transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <!-- قسم رفع صورة المنتج -->
        <div class="flex flex-col items-center justify-center pb-4 border-b border-outline-variant">
          <div
            @click="triggerFileInput"
            class="relative group w-32 h-32 rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low hover:bg-surface-container transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-sm"
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
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload class="w-6 h-6 text-white" />
              </div>
            </div>
            <div v-else class="flex flex-col items-center justify-center p-4 text-center">
              <Image class="w-8 h-8 text-on-surface-variant mb-1 group-hover:text-primary transition-colors" />
              <span class="text-[11px] text-on-surface-variant group-hover:text-primary transition-colors">رفع صورة المنتج</span>
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
            v-if="errorMessage"
            class="absolute inset-0 bg-black/80 flex items-center justify-center p-4 text-center text-error text-xs"
          >
            {{ errorMessage }}
          </div>
        </div>

        <div class="space-y-4">
          <h3
            class="text-label-md font-bold text-on-surface-variant flex items-center gap-2"
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
                class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
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
                  class="absolute right-12 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                  >الباركود الأساسي للأب</label
                >
                <button
                  type="button"
                  @click="toggleCameraScanner('main')"
                  :class="[
                    'absolute right-1 h-8 w-9 flex items-center justify-center rounded-md transition-all border outline-none',
                    isScannerActive && activeBarcodeTarget.type === 'main'
                      ? 'bg-error-container text-on-error-container border-error/20'
                      : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container',
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
                  class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                  >السعر البيعي الرئيسي</label
                >
              </div>
              <div class="relative">
                <input
                  v-model="formStandardPrice"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="number"
                />
                <label
                  class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                  >تكلفة الشراء (Cost)</label
                >
              </div>
            </div>

            <div v-if="formVariants.length === 0" class="relative">
              <input
                v-model.number="formQtyAvailable"
                class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                placeholder=" "
                type="number"
                min="0"
              />
              <label
                class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                >الكمية المتوفرة في المستودع (الكمية الحالية)</label
              >
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
                class="text-center p-4 bg-surface-container rounded-xl border border-dashed border-outline-variant"
              >
                <p class="text-xs text-on-surface-variant">
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
                  class="p-3 bg-surface-container rounded-xl border border-outline-variant space-y-2 relative group"
                >
                  <button
                    type="button"
                    @click="removeVariantField(idx)"
                    class="absolute top-2 left-2 text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error/10 cursor-pointer"
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
                        class="absolute -top-2 right-2 text-[9px] bg-white px-1 text-on-surface-variant"
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
                      class="absolute -top-2 right-2 text-[9px] bg-white px-1 text-on-surface-variant"
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
                          : 'bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container',
                      ]"
                    >
                      <ScanBarcode class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="bg-surface-container-low rounded-xl p-3 border border-outline-variant space-y-2"
            >
              <label
                class="flex items-center gap-3 text-label-md text-on-surface cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formIsWeight"
                  class="w-4 h-4 accent-primary"
                />
                <div class="flex flex-col">
                  <span>المنتج يباع بالوزن</span>
                  <span class="text-[10px] text-on-surface-variant"
                    >تفعيل هذا الخيار لإظهار حقول الوزن والحجم الخاصة
                    بالمنتج</span
                  >
                </div>
              </label>
            </div>

            <div v-if="formIsWeight" class="grid grid-cols-2 gap-4">
              <div class="relative">
                <input
                  v-model="formWeight"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="number"
                  step="0.01"
                />
                <label
                  class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                  >الوزن الصافي (كجم)</label
                >
              </div>
              <div class="relative">
                <input
                  v-model="formVolume"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="number"
                  step="0.001"
                />
                <label
                  class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                  >الحجم الكلي (م³)</label
                >
              </div>
            </div>

            <div class="relative mt-4">
              <select
                v-model="formLocation"
                class="peer w-full h-12 px-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all appearance-none"
              >
                <option :value="null" disabled>اختر موقع التخزين</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                  {{ loc.display_name || loc.name }}
                </option>
              </select>
              <label
                class="absolute right-4 -top-3 text-[10px] text-on-surface-variant transition-all pointer-events-none bg-white px-1"
                >موقع التخزين (Storage Location)</label
              >
            </div>

            <div class="relative mt-4">
              <div class="relative">
                <input
                  v-model="formPosCategoryName"
                  @focus="showCategoryDropdown = true"
                  @blur="hideCategoryDropdown"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="text"
                />
                <label
                  class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none"
                  >فئة كاشير نقاط البيع</label
                >
                <ChevronDown
                  class="absolute left-4 top-3.5 w-5 h-5 text-on-surface-variant pointer-events-none"
                />
              </div>
              <div
                v-if="showCategoryDropdown && posCategories.length > 0"
                class="absolute z-10 w-full mt-1 bg-white border border-outline-variant rounded-xl shadow-lg max-h-40 overflow-y-auto"
              >
                <button
                  v-for="cat in posCategories"
                  :key="cat.id"
                  @click="
                    formPosCategoryName = cat.name;
                    showCategoryDropdown = false;
                  "
                  class="w-full text-right px-4 py-2 hover:bg-surface-container text-body-md text-on-surface"
                >
                  {{ cat.name }}
                </button>
              </div>
            </div>

            <div
              class="bg-surface-container-low rounded-xl p-3 border border-outline-variant space-y-2"
            >
              <label
                class="flex items-start gap-3 text-label-md text-on-surface cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formAvailableInPos"
                  class="w-4 h-4 accent-primary mt-1"
                />
                <div class="flex flex-col">
                  <span>تفعيل الإتاحة المباشرة على شاشات كاشير الـ POS</span>
                  <span class="text-[10px] text-on-surface-variant"
                    >يسمح بظهور هذا المنتج وبيعه مباشرة في واجهة نقاط البيع
                    للكاشير.</span
                  >
                </div>
              </label>
              <label
                class="flex items-start gap-3 text-label-md text-on-surface cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formSaleOk"
                  class="w-4 h-4 accent-primary mt-1"
                />
                <div class="flex flex-col">
                  <span>يمكن بيعه (Can be Sold)</span>
                  <span class="text-[10px] text-on-surface-variant"
                    >تفعيل هذا الخيار لإتاحة المنتج في أوامر البيع
                    والفواتير.</span
                  >
                </div>
              </label>
              <label
                class="flex items-start gap-3 text-label-md text-on-surface cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formPurchaseOk"
                  class="w-4 h-4 accent-primary mt-1"
                />
                <div class="flex flex-col">
                  <span>يمكن شراؤه وتوريده (Can be Purchased)</span>
                  <span class="text-[10px] text-on-surface-variant"
                    >تفعيل هذا الخيار لإتاحة المنتج في أوامر الشراء من
                    الموردين.</span
                  >
                </div>
              </label>
              <label
                class="flex items-start gap-3 text-label-md text-on-surface cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="formActive"
                  class="w-4 h-4 accent-primary mt-1"
                />
                <div class="flex flex-col">
                  <span>المنتج نشط وغير مؤرشف (Active Status)</span>
                  <span class="text-[10px] text-on-surface-variant"
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
            @click="emit('delete')"
            class="w-full h-11 flex items-center justify-center gap-2 text-error hover:bg-error/10 rounded-xl transition-colors border border-dashed border-error/30 font-bold text-label-md cursor-pointer"
          >
            <Trash2 class="w-5 h-5" />
            أرشفة هذا المنتج من النظام (Archive)
          </button>
        </div>
      </div>

      <div class="p-6 bg-surface-container-high grid grid-cols-2 gap-4">
        <button
          @click="closeDrawer"
          class="h-12 rounded-xl border border-outline font-bold text-on-surface hover:bg-surface transition-all active:scale-95 cursor-pointer"
        >
          إلغاء
        </button>
        <button
          @click="saveProduct"
          :disabled="isSaving"
          class="text-white h-12 rounded-xl bg-primary text-on-primary font-bold shadow-lg hover:bg-primary/95 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw v-if="isSaving" class="w-5 h-5 animate-spin" />
          {{ isSaving ? "جاري المزامنة..." : "حفظ للـ ERP" }}
        </button>
      </div>
    </div>
  </div>
</template>
