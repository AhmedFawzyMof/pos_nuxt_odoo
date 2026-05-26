<script setup lang="ts">
import { ref, computed, watch } from "vue";

interface OdooLocation {
  id: number;
  name: string;
  type: string;
  barcode: string;
}

const props = defineProps<{
  open: boolean;
  existingLocations: OdooLocation[];
}>();

const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
  (e: "created", val: any): void;
}>();

const selectedParentLocation = ref<OdooLocation | null>(null);
const newLocationName = ref("");
const newLocationType = ref("internal");
const newLocationBarcode = ref("");

const isSearchDropdownOpen = ref(false);
const parentSearchQuery = ref("");

const isSaving = ref(false);
const saveSuccess = ref(false);
const validationError = ref("");

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.existingLocations.length > 0) {
      if (
        !selectedParentLocation.value ||
        !props.existingLocations.some(
          (l) => l.id === selectedParentLocation.value?.id,
        )
      ) {
        selectedParentLocation.value = props.existingLocations[0] ?? null;
      }
    }
  },
  { immediate: true },
);

const autoGenerateBarcode = () => {
  if (
    validationError.value.includes("barcode") ||
    validationError.value.includes("اسم")
  ) {
    validationError.value = "";
  }

  const parentPath = selectedParentLocation.value
    ? selectedParentLocation.value.name
    : "WH";
  const namePart = newLocationName.value.trim()
    ? newLocationName.value.trim()
    : "SLOT";

  const cleanPath = `${parentPath}/${namePart}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-"); // compress redundant dashes

  newLocationBarcode.value = `LOC-${cleanPath}`;
};

const breadcrumbPreview = computed(() => {
  const parentPath = selectedParentLocation.value
    ? selectedParentLocation.value.name
    : "WH/Stock";
  const namePart = newLocationName.value.trim()
    ? newLocationName.value.trim()
    : "___";
  return `${parentPath}/${namePart}`;
});

const filteredParentLocations = computed(() => {
  if (!parentSearchQuery.value) return props.existingLocations;
  return props.existingLocations.filter((loc) =>
    loc.name.toLowerCase().includes(parentSearchQuery.value.toLowerCase()),
  );
});

const selectParent = (loc: OdooLocation) => {
  selectedParentLocation.value = loc;
  isSearchDropdownOpen.value = false;
  parentSearchQuery.value = "";
};

const close = () => {
  emit("update:open", false);
};

const handleSaveLocation = async () => {
  validationError.value = "";

  if (!newLocationName.value.trim()) {
    validationError.value = "اسم الموقع مطلوب (Location Name is required)";
    return;
  }

  isSaving.value = true;

  try {
    const response = await $fetch<{ success: boolean; id: number }>(
      "/api/warehouse/create",
      {
        method: "POST",
        body: {
          name: newLocationName.value.trim(),
          type: newLocationType.value,
          parentId: selectedParentLocation.value
            ? selectedParentLocation.value.id
            : null,
          barcode: newLocationBarcode.value || null,
        },
      },
    );

    if (response.success) {
      const parentPath = selectedParentLocation.value
        ? selectedParentLocation.value.name
        : "WH/Stock";
      const finalPath = `${parentPath}/${newLocationName.value.trim()}`;

      emit("created", {
        id: response.id,
        name: finalPath,
        address:
          newLocationType.value === "internal"
            ? "رف تخزين داخلي (Internal Shelf)"
            : newLocationType.value === "scrap"
              ? "مخزن تالف / حجر صحي (Scrap / Quarantine)"
              : "مجلد هيكلي عرض (Abstract View Folder)",
        status: "نشط",
        statusColor:
          "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        qty: "0",
        capacity: "0%",
        capacityWidth: "w-[0%]",
        progressBarColor:
          "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
        type: newLocationType.value,
        barcode: newLocationBarcode.value || `LOC-${response.id}`,
      });

      saveSuccess.value = true;

      // Reset fields and close modal
      setTimeout(() => {
        newLocationName.value = "";
        newLocationBarcode.value = "";
        saveSuccess.value = false;
        close();
      }, 1200);
    }
  } catch (error: any) {
    console.error(error);
    validationError.value =
      error.statusMessage ||
      "حدث خطأ أثناء المزامنة مع أودو (Error syncing with Odoo)";
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      dir="rtl"
    >
      <!-- Form Dialog Container Card: Simple standard modal matching the app's clean primary layout -->
      <div
        class="relative bg-white w-full max-w-lg bg-surface border border-outline-variant rounded-2xl shadow-xl overflow-hidden flex flex-col font-sans text-on-surface"
      >
        <!-- Form Header Section -->
        <div
          class="p-6 pb-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <span
              class="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg"
              >folder_shared</span
            >
            <div>
              <h3 class="text-headline-sm font-bold text-primary">
                إنشاء موقع تخزين جديد
              </h3>
              <p class="text-label-md text-on-surface-variant">
                موقع تخزين جديد في الهيكل التنظيمي
              </p>
            </div>
          </div>

          <!-- Close Button -->
          <button
            @click="emit('update:open', false)"
            class="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center text-on-surface-variant hover:text-foreground"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Form Content Block -->
        <div
          class="p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar text-right"
        >
          <!-- Monospace Dynamic Real-Time Breadcrumb Path Preview -->
          <div
            class="p-3.5 bg-surface-container rounded-xl border border-outline-variant"
          >
            <p
              class="text-[11px] font-bold text-on-surface-variant mb-1 text-right"
            >
              مسار موقع التخزين المحدث:
            </p>
            <div
              class="font-mono text-primary text-sm tracking-wide flex items-center gap-2 overflow-x-auto justify-start py-0.5"
              dir="ltr"
            >
              <span class="material-symbols-outlined text-[18px] text-primary"
                >link</span
              >
              {{ breadcrumbPreview }}
            </div>
          </div>

          <!-- Field 1: Parent Location Selector (Searchable Dropdown) -->
          <div class="space-y-2">
            <label class="block text-label-md font-bold text-on-surface-variant"
              >الموقع الأب / Parent Location</label
            >

            <div class="relative">
              <!-- Searchable Select Trigger Button -->
              <button
                type="button"
                @click="isSearchDropdownOpen = !isSearchDropdownOpen"
                class="h-11 w-full bg-background border border-outline rounded-lg px-4 flex items-center justify-between text-on-surface hover:bg-muted/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary text-right font-mono"
                dir="ltr"
              >
                <span class="material-symbols-outlined text-on-surface-variant">
                  keyboard_arrow_down
                </span>
                <span class="flex items-center gap-2">
                  {{
                    selectedParentLocation
                      ? selectedParentLocation.name
                      : "Select Parent Location"
                  }}
                  <span
                    class="material-symbols-outlined text-primary text-[18px]"
                    >folder</span
                  >
                </span>
              </button>

              <div
                v-if="isSearchDropdownOpen"
                class="absolute bg-white left-0 right-0 mt-2 z-50 bg-surface border border-outline-variant rounded-xl shadow-xl overflow-hidden flex flex-col"
              >
                <div
                  class="p-3 border-b border-outline-variant bg-surface-container flex items-center gap-2"
                >
                  <span
                    class="material-symbols-outlined text-on-surface-variant text-[20px]"
                    >search</span
                  >
                  <input
                    v-model="parentSearchQuery"
                    type="text"
                    placeholder="بحث عن موقع..."
                    class="w-full bg-transparent border-0 text-on-surface text-sm font-sans focus:outline-none focus:ring-0 placeholder-on-surface-variant/50 py-1 text-right"
                    @click.stop
                  />
                  <button
                    v-if="parentSearchQuery"
                    @click.stop="parentSearchQuery = ''"
                    class="text-xs text-primary hover:underline"
                  >
                    مسح
                  </button>
                </div>

                <!-- Dropdown Options List -->
                <div
                  class="max-h-48 overflow-y-auto divide-y divide-outline-variant"
                >
                  <button
                    v-for="loc in filteredParentLocations"
                    :key="loc.id"
                    type="button"
                    @click="selectParent(loc)"
                    class="w-full h-11 px-4 hover:bg-surface-container-low flex items-center justify-between text-right text-xs font-mono text-on-surface transition-colors"
                    dir="ltr"
                  >
                    <span
                      v-if="
                        selectedParentLocation &&
                        selectedParentLocation.id === loc.id
                      "
                      class="material-symbols-outlined text-primary text-[18px]"
                    >
                      check
                    </span>
                    <span v-else></span>

                    <span class="flex items-center gap-2">
                      {{ loc.name }}
                      <span
                        class="material-symbols-outlined text-on-surface-variant text-[16px]"
                        >folder_open</span
                      >
                    </span>
                  </button>
                  <div
                    v-if="filteredParentLocations.length === 0"
                    class="p-4 text-center text-on-surface-variant font-sans text-xs"
                  >
                    لا توجد نتائج مطابقة
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Field 2: Location Name Input -->
          <div class="space-y-2">
            <label class="block text-label-md font-bold text-on-surface-variant"
              >اسم الموقع المحدد / Location Name</label
            >
            <input
              v-model="newLocationName"
              type="text"
              placeholder="مثال: Shelf-B4 أو Cold-Room"
              class="h-11 w-full bg-background border rounded-lg px-4 text-on-surface font-mono text-sm tracking-wide placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary text-right"
              :class="
                validationError
                  ? 'border-error focus:ring-error bg-error/5'
                  : 'border-outline focus:border-primary'
              "
            />
            <span
              v-if="validationError"
              class="text-xs text-error font-semibold flex items-center gap-1 mt-0.5 justify-start text-right"
            >
              <span class="material-symbols-outlined text-[14px]">warning</span>
              {{ validationError }}
            </span>
          </div>

          <!-- Field 3: Location Type Selection (Simplified segment chips matching primary colors) -->
          <div class="space-y-2">
            <label class="block text-label-md font-bold text-on-surface-variant"
              >نوع التخزين / Location Type</label
            >

            <div class="grid grid-cols-3 gap-2">
              <!-- Option 1: Internal Location -->
              <button
                type="button"
                @click="newLocationType = 'internal'"
                class="h-14 flex flex-col items-center justify-center gap-1 rounded-lg border text-center transition-all duration-200 active:scale-95 cursor-pointer"
                :class="
                  newLocationType === 'internal'
                    ? 'border-primary bg-primary text-white font-bold shadow-sm shadow-primary/20'
                    : 'border-outline bg-background hover:bg-muted text-on-surface-variant'
                "
              >
                <span class="material-symbols-outlined text-[18px]"
                  >warehouse</span
                >
                <span class="text-xs">داخلي للتخزين</span>
              </button>

              <!-- Option 2: Scrap Location -->
              <button
                type="button"
                @click="newLocationType = 'scrap'"
                class="h-14 flex flex-col items-center justify-center gap-1 rounded-lg border text-center transition-all duration-200 active:scale-95 cursor-pointer"
                :class="
                  newLocationType === 'scrap'
                    ? 'border-primary bg-primary text-white font-bold shadow-sm shadow-primary/20'
                    : 'border-outline bg-background hover:bg-muted text-on-surface-variant'
                "
              >
                <span class="material-symbols-outlined text-[18px]"
                  >delete_sweep</span
                >
                <span class="text-xs">تالف / تصفية</span>
              </button>

              <!-- Option 3: View Folder -->
              <button
                type="button"
                @click="newLocationType = 'view'"
                class="h-14 flex flex-col items-center justify-center gap-1 rounded-lg border text-center transition-all duration-200 active:scale-95 cursor-pointer"
                :class="
                  newLocationType === 'view'
                    ? 'border-primary bg-primary text-white font-bold shadow-sm shadow-primary/20'
                    : 'border-outline bg-background hover:bg-muted text-on-surface-variant'
                "
              >
                <span class="material-symbols-outlined text-[18px]"
                  >folder_shared</span
                >
                <span class="text-xs">مجلد عرض هيكلي</span>
              </button>
            </div>
          </div>

          <!-- Field 4: Barcode Configurations -->
          <div class="space-y-3">
            <label class="block text-label-md font-bold text-on-surface-variant"
              >الباركود المخصص / Barcode</label
            >
            <div class="flex gap-2">
              <!-- Auto-Generate Trigger Action Button -->
              <button
                type="button"
                @click="autoGenerateBarcode"
                class="h-11 px-4 bg-muted hover:bg-muted/80 border border-outline rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-on-surface shrink-0"
              >
                <span class="material-symbols-outlined text-primary text-[18px]"
                  >quick_reference</span
                >
                توليد تلقائي
              </button>

              <!-- Barcode Input Field -->
              <input
                v-model="newLocationBarcode"
                type="text"
                placeholder="الرمز الشريطي للرف..."
                class="h-11 w-full bg-background border border-outline rounded-lg px-4 text-on-surface font-mono text-sm tracking-wider placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary text-right"
              />
            </div>
          </div>
        </div>

        <!-- Dialog Footer Actions Row -->
        <div
          class="p-6 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-3"
        >
          <!-- Muted Cancel Action Button -->
          <button
            type="button"
            @click="emit('update:open', false)"
            class="h-11 px-5 border border-outline hover:bg-muted text-on-surface font-bold rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer text-sm"
          >
            إلغاء
          </button>

          <!-- Primary Save Action Button -->
          <button
            type="button"
            @click="handleSaveLocation"
            :disabled="isSaving || saveSuccess"
            class="h-11 px-6 bg-primary text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            <span
              v-if="saveSuccess"
              class="material-symbols-outlined text-[18px] text-white animate-bounce"
            >
              check_circle
            </span>
            <span
              v-else-if="isSaving"
              class="material-symbols-outlined text-[18px] text-white animate-spin"
            >
              sync
            </span>
            <span
              v-else
              class="material-symbols-outlined text-[18px] text-white"
            >
              done_all
            </span>

            <span>
              {{
                saveSuccess
                  ? "تم إنشاء الموقع بنجاح!"
                  : isSaving
                    ? "جاري المزامنة..."
                    : "حفظ ومزامنة"
              }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
