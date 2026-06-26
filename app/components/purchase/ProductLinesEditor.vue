<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Package, Trash2, LoaderCircle, Plus, Warehouse, MapPin, X } from "@lucide/vue";
import type { ProductResult, POLineInput } from "~/types/purchase";

const lines = defineModel<POLineInput[]>("lines", { required: true });

const search = ref("");
const results = ref<ProductResult[]>([]);
const isSearching = ref(false);
const showDropdown = ref(false);
const showCreateForm = ref(false);
const newProductName = ref("");
const newProductPrice = ref(0);
const newProductSellingPrice = ref(0);
const newProductBarcode = ref("");
const isCreating = ref(false);
const createError = ref("");

const expandedAllocation = ref<number | null>(null);
const allocationSearch = ref("");
const locations = ref<{ id: number; name: string }[]>([]);
const isLocationsLoading = ref(false);

const filteredLocations = computed(() => {
  const q = allocationSearch.value.trim().toLowerCase();
  if (!q) return locations.value;
  return locations.value.filter((l) => l.name.toLowerCase().includes(q));
});

const allocTotal = (line: POLineInput) => {
  if (!line.location_allocations) return 0;
  return line.location_allocations.reduce((s, a) => s + (a.quantity || 0), 0);
};

const allocValid = (line: POLineInput) => allocTotal(line) <= line.quantity;

const toggleAllocation = (idx: number) => {
  expandedAllocation.value = expandedAllocation.value === idx ? null : idx;
  allocationSearch.value = "";
};

const addAllocation = (line: POLineInput, loc: { id: number; name: string }) => {
  if (!line.location_allocations) {
    line.location_allocations = [];
  }
  if (line.location_allocations.some((a) => a.location_id === loc.id)) return;
  line.location_allocations.push({
    location_id: loc.id,
    location_name: loc.name,
    quantity: 0,
  });
};

const removeAllocation = (line: POLineInput, idx: number) => {
  if (!line.location_allocations) return;
  line.location_allocations.splice(idx, 1);
};

const fetchLocations = async () => {
  isLocationsLoading.value = true;
  try {
    const res = await $fetch<{ success: boolean; data: { id: number; name: string }[] }>(
      "/api/warehouse/locations",
    );
    locations.value = res.data || [];
  } catch {
    locations.value = [];
  } finally {
    isLocationsLoading.value = false;
  }
};

onMounted(fetchLocations);

let debounce: NodeJS.Timeout;

watch(search, (q) => {
  const clean = q.trim();
  if (!clean) {
    results.value = [];
    showDropdown.value = false;
    showCreateForm.value = false;
    return;
  }
  clearTimeout(debounce);
  debounce = setTimeout(async () => {
    isSearching.value = true;
    try {
      const res = await $fetch<{ success: boolean; data: ProductResult[] }>(
        "/api/products/search",
        { params: { query: clean } },
      );
      results.value = res.data || [];
      showDropdown.value = true;
      showCreateForm.value = false;
    } catch {
      results.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 400);
});

const openCreateForm = () => {
  newProductName.value = search.value.trim();
  newProductPrice.value = 0;
  newProductSellingPrice.value = 0;
  newProductBarcode.value = "";
  createError.value = "";
  showCreateForm.value = true;
  showDropdown.value = false;
};

const cancelCreate = () => {
  showCreateForm.value = false;
};

const createAndAdd = async () => {
  const name = newProductName.value.trim();
  if (!name) {
    createError.value = "يرجى إدخال اسم المنتج";
    return;
  }
  isCreating.value = true;
  createError.value = "";
  try {
    const res = await $fetch<{ success: boolean; id: number; message: string }>(
      "/api/products/save",
      {
        method: "POST",
        body: {
          name,
          standard_price: newProductPrice.value || 0,
          list_price: newProductSellingPrice.value || 0,
          barcode: newProductBarcode.value || undefined,
          type: "consu",
          sale_ok: false,
          purchase_ok: true,
          available_in_pos: false,
          active: true,
        },
      },
    );
    if (res.success) {
      lines.value.push({
        product_id: res.id,
        product_name: name,
        quantity: 1,
        price_unit: newProductPrice.value || 0,
        list_price: newProductSellingPrice.value || 0,
        location_allocations: [],
        tax_ids: [],
      });
      search.value = "";
      results.value = [];
      showCreateForm.value = false;
    } else {
      createError.value = res.message || "فشل في إنشاء المنتج";
    }
  } catch (err: any) {
    createError.value = err?.data?.statusMessage || err?.message || "حدث خطأ";
  } finally {
    isCreating.value = false;
  }
};

const addLine = (p: ProductResult) => {
  lines.value.push({
    product_id: p.id,
    product_name: p.name,
    quantity: 1,
    price_unit: p.standard_price || 0,
    list_price: p.list_price || 0,
    location_allocations: [],
    tax_ids: p.taxes_id || [],
  });
  search.value = "";
  results.value = [];
  showDropdown.value = false;
};

const removeLine = (idx: number) => {
  lines.value.splice(idx, 1);
};

const lineTotal = (line: POLineInput) => line.quantity * line.price_unit;

const grandTotal = computed(() =>
  lines.value.reduce((s, l) => s + lineTotal(l), 0),
);
</script>

<template>
  <div class="space-y-1.5">
    <label class="text-label-md font-bold text-on-white-variant"
      >المنتجات *</label
    >

    <div class="relative">
      <input
        v-model="search"
        class="w-full h-11 px-4 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
        placeholder="ابحث عن منتج وأضفه..."
        type="text"
      />
      <div v-if="isSearching" class="absolute left-3 top-1/2 -translate-y-1/2">
        <LoaderCircle class="w-4 h-4 animate-spin text-on-white-variant" />
      </div>
      <div
        v-if="showDropdown && results.length > 0"
        class="absolute z-10 mt-1 w-full bg-white border border-outline-variant rounded-xl shadow-lg max-h-48 overflow-y-auto"
      >
        <button
          v-for="p in results"
          :key="p.id"
          @click="addLine(p)"
          class="w-full text-right px-4 py-3 hover:bg-primary/5 cursor-pointer border-b border-outline-variant/30 last:border-0 flex items-center gap-3"
        >
          <Package class="w-4 h-4 text-on-white-variant shrink-0" />
          <div>
            <div class="font-bold text-body-md">{{ p.name }}</div>
            <div class="text-label-md text-on-white-variant">
              {{ p.barcode || "—" }}
              <span v-if="p.standard_price" class="text-error/70 ms-2">
                شراء: {{ p.standard_price.toLocaleString("ar-EG") }} ج.م
              </span>
              <span v-if="p.list_price" class="text-emerald-600 ms-2">
                بيع: {{ p.list_price.toLocaleString("ar-EG") }} ج.م
              </span>
            </div>
          </div>
        </button>
        <button
          @click="openCreateForm"
          class="w-full text-right px-4 py-3 hover:bg-primary/5 cursor-pointer border-t border-outline-variant/30 flex items-center gap-3 text-primary font-bold"
        >
          <Plus class="w-4 h-4" />
          <span>إنشاء منتج جديد "{{ search.trim() }}"</span>
        </button>
      </div>
      <div
        v-if="
          showDropdown && results.length === 0 && search.trim() && !isSearching
        "
        class="absolute z-10 mt-1 w-full bg-white border border-outline-variant rounded-xl shadow-lg p-4"
      >
        <p class="text-label-md text-on-white-variant mb-3">
          لا توجد نتائج لـ "{{ search.trim() }}"
        </p>
        <button
          @click="openCreateForm"
          class="w-full px-4 py-3 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 cursor-pointer flex items-center gap-2 justify-center"
        >
          <Plus class="w-4 h-4" />
          إنشاء منتج جديد
        </button>
      </div>
      <div
        v-if="showCreateForm"
        class="absolute z-10 mt-1 w-full bg-white border border-primary rounded-xl shadow-lg p-4 space-y-3"
      >
        <p class="text-label-md font-bold text-primary">منتج جديد</p>
        <input
          v-model="newProductName"
          class="w-full h-10 px-3 border border-outline-variant rounded-lg text-body-md outline-none focus:ring-2 focus:ring-primary"
          placeholder="اسم المنتج *"
          @keyup.enter="createAndAdd"
        />
        <div class="flex gap-3">
          <input
            v-model.number="newProductPrice"
            type="number"
            min="0"
            step="0.01"
            class="flex-1 h-10 px-3 border border-outline-variant rounded-lg text-body-md outline-none focus:ring-2 focus:ring-primary"
            placeholder="سعر الشراء"
          />
          <input
            v-model.number="newProductSellingPrice"
            type="number"
            min="0"
            step="0.01"
            class="flex-1 h-10 px-3 border border-outline-variant rounded-lg text-body-md outline-none focus:ring-2 focus:ring-primary"
            placeholder="سعر البيع"
          />
          <input
            v-model="newProductBarcode"
            class="flex-1 h-10 px-3 border border-outline-variant rounded-lg text-body-md outline-none focus:ring-2 focus:ring-primary"
            placeholder="الباركود (اختياري)"
          />
        </div>
        <p v-if="createError" class="text-error text-label-md font-bold">
          {{ createError }}
        </p>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelCreate"
            class="px-4 py-2 border border-outline-variant rounded-lg font-bold text-label-md hover:bg-white-low cursor-pointer"
          >
            إلغاء
          </button>
          <button
            @click="createAndAdd"
            :disabled="isCreating"
            class="px-4 py-2 bg-primary text-white rounded-lg font-bold text-label-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            <LoaderCircle v-if="isCreating" class="w-4 h-4 animate-spin" />
            <template v-else>إنشاء وإضافة</template>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="lines.length > 0"
      class="border border-outline-variant rounded-xl overflow-hidden mt-3"
    >
      <table class="w-full text-right border-collapse">
        <thead class="bg-white-low text-on-white-variant">
          <tr>
            <th class="p-3 text-label-md font-bold">المنتج</th>
            <th class="p-3 text-label-md font-bold">الكمية</th>
            <th class="p-3 text-label-md font-bold">سعر الشراء</th>
            <th class="p-3 text-label-md font-bold">سعر البيع</th>
            <th class="p-3 text-label-md font-bold">التوزيع</th>
            <th class="p-3 text-label-md font-bold">الإجمالي</th>
            <th class="p-3 w-10"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/45">
          <template v-for="(line, idx) in lines" :key="idx">
            <tr class="hover:bg-primary/5">
              <td class="p-3 font-bold text-body-md">
                {{ line.product_name }}
              </td>
              <td class="p-3">
                <input
                  v-model.number="line.quantity"
                  type="number"
                  min="0"
                  step="1"
                  class="w-20 h-9 px-2 border border-outline-variant rounded-lg text-center text-body-md outline-none focus:ring-2 focus:ring-primary"
                />
              </td>
              <td class="p-3">
                <input
                  v-model.number="line.price_unit"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-24 h-9 px-2 border border-outline-variant rounded-lg text-center text-body-md outline-none focus:ring-2 focus:ring-primary"
                />
              </td>
              <td class="p-3">
                <input
                  v-model.number="line.list_price"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-24 h-9 px-2 border border-outline-variant rounded-lg text-center text-body-md outline-none focus:ring-2 focus:ring-primary"
                />
              </td>
              <td class="p-3">
                <button
                  @click="toggleAllocation(idx)"
                  class="h-8 px-2 rounded-lg border border-outline-variant hover:bg-primary/10 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  :class="expandedAllocation === idx ? 'bg-primary/10 border-primary text-primary' : ''"
                >
                  <Warehouse class="w-3.5 h-3.5" />
                  <span>{{ (line.location_allocations?.length || 0) > 0 ? line.location_allocations!.length : 'توزيع' }}</span>
                </button>
              </td>
              <td class="p-3 font-bold">
                {{ lineTotal(line).toLocaleString("ar-EG") }} ج.م
              </td>
              <td class="p-3">
                <button
                  @click="removeLine(idx)"
                  class="w-8 h-8 rounded-lg hover:bg-error/10 flex items-center justify-center text-error cursor-pointer"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <!-- Expandable Location Allocation Panel -->
            <tr v-if="expandedAllocation === idx">
              <td colspan="7" class="p-0">
                <div class="bg-slate-50 border-t border-outline-variant/30 px-4 py-3">
                  <div class="flex items-center gap-2 mb-2">
                    <MapPin class="w-4 h-4 text-on-white-variant" />
                    <span class="text-label-md font-bold text-on-white-variant">توزيع المخزون على المواقع</span>
                    <span
                      class="text-xs ms-auto"
                      :class="allocValid(line) ? 'text-emerald-600' : 'text-error font-bold'"
                    >
                      المجموع: {{ allocTotal(line) }} / {{ line.quantity }}
                    </span>
                  </div>
                  <div class="relative mb-2">
                    <input
                      v-model="allocationSearch"
                      class="w-full h-9 px-3 pr-8 border border-outline-variant rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
                      placeholder="ابحث عن موقع تخزين..."
                    />
                    <Package class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-white-variant" />
                    <div
                      v-if="allocationSearch && filteredLocations.length > 0"
                      class="absolute z-20 mt-1 w-full bg-white border border-outline-variant rounded-xl shadow-lg max-h-36 overflow-y-auto"
                    >
                      <button
                        v-for="loc in filteredLocations"
                        :key="loc.id"
                        @click="addAllocation(line, loc); allocationSearch = ''"
                        class="w-full text-right px-3 py-2 hover:bg-primary/5 cursor-pointer text-sm border-b border-outline-variant/30 last:border-0 flex items-center gap-2"
                      >
                        <Warehouse class="w-3.5 h-3.5 text-on-white-variant shrink-0" />
                        {{ loc.name }}
                      </button>
                    </div>
                  </div>
                  <div v-if="!line.location_allocations || line.location_allocations.length === 0" class="text-xs text-on-white-variant">
                    لم يتم تحديد مواقع بعد. ابحث عن موقع وأضفه أعلاه.
                  </div>
                  <div v-else class="space-y-1.5">
                    <div
                      v-for="(alloc, aidx) in line.location_allocations"
                      :key="aidx"
                      class="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-outline-variant/30"
                    >
                      <Warehouse class="w-4 h-4 text-primary shrink-0" />
                      <span class="text-sm flex-1">{{ alloc.location_name || 'مخزن #' + alloc.location_id }}</span>
                      <input
                        v-model.number="alloc.quantity"
                        type="number"
                        min="0"
                        :max="line.quantity"
                        step="1"
                        class="w-20 h-8 px-2 border border-outline-variant rounded-lg text-center text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        @click="removeAllocation(line, aidx)"
                        class="w-7 h-7 rounded-lg hover:bg-error/10 flex items-center justify-center text-error cursor-pointer shrink-0"
                      >
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
        <tfoot class="bg-white-low">
          <tr>
            <td colspan="4" class="p-3 text-label-md text-on-white-variant">
              {{ lines.length }} صنف
            </td>
            <td class="p-3 text-label-md font-bold text-on-white-variant">
              الإجمالي
            </td>
            <td class="p-3 font-bold text-primary">
              {{ grandTotal.toLocaleString("ar-EG") }} ج.م
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <p v-else class="text-label-md text-on-white-variant py-2">
      لم يتم إضافة أي منتجات بعد
    </p>
  </div>
</template>
