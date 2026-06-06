<script setup lang="ts">
import { ref, computed } from "vue";
import { CloudOff, LoaderCircle, Plus } from "@lucide/vue";
import type {
  PurchaseOrder,
  PurchaseOrderApiResponse,
} from "~/types/purchaseOrder";
import CreatePurchaseOrderModal from "~/components/purchase/CreatePurchaseOrderModal.vue";

const showCreateModal = ref(false);

const currentPage = ref(1);
const searchQuery = ref("");
const filterState = ref("");

const {
  data: apiResponse,
  status,
  error,
  refresh,
  pending,
} = useFetch<PurchaseOrderApiResponse>("/api/purchase-orders", {
  lazy: true,
  query: { page: currentPage, search: searchQuery, state: filterState },
  watch: [currentPage, searchQuery, filterState],
  transform: (response: any) => {
    if (!response.data) response.data = [];
    return response;
  },
});

const poList = computed<PurchaseOrder[]>(() => apiResponse.value?.data || []);
const totalPages = computed(() => apiResponse.value?.totalPages || 1);
const totalItems = computed(() => apiResponse.value?.totalItems || 0);

const confirmPO = async (poId: number) => {
  try {
    const res = await $fetch("/api/purchase-orders/confirm", {
      method: "POST",
      body: { po_id: poId },
    });
    if ((res as any).success) refresh();
  } catch (e) {
    console.error(e);
  }
};

const createBill = async (poId: number) => {
  try {
    const res = await $fetch("/api/purchase-orders/create-bill", {
      method: "POST",
      body: { po_id: poId },
    });
    if ((res as any).success) refresh();
  } catch (e) {
    console.error(e);
  }
};

const receiptStatusText = (status: string) => {
  if (status === "done") return "مكتمل";
  if (status === "partial") return "جزئي";
  return "معلق";
};

const receiptStatusClass = (status: string) => {
  if (status === "done") return "bg-emerald-100 text-emerald-800";
  if (status === "partial") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
};

const stateText = (state: string) => {
  const map: Record<string, string> = {
    draft: "مسودة",
    sent: "مرسل",
    purchase: "مؤكد",
    done: "مكتمل",
    cancel: "ملغي",
  };
  return map[state] || state;
};

const stateClass = (state: string) => {
  if (state === "purchase" || state === "done")
    return "bg-primary/10 text-primary";
  if (state === "draft") return "bg-slate-100 text-slate-600";
  if (state === "sent") return "bg-blue-100 text-blue-800";
  if (state === "cancel") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-600";
};
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <div
      v-if="pending && poList.length === 0"
      class="h-[calc(100vh-200px)] flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3 text-on-white-variant">
        <LoaderCircle class="w-8 h-8 animate-spin text-primary" />
        <span class="text-[13px]">جاري تحميل أوامر الشراء...</span>
      </div>
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-headline-lg font-bold text-on-white">أوامر الشراء</h1>
          <p class="text-on-white-variant text-label-md">
            إدارة أوامر الشراء واستلام المخزون من الموردين
          </p>
        </div>
        <div class="flex gap-2">
          <button
            @click="showCreateModal = true"
            class="h-11 px-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 flex items-center gap-2 cursor-pointer"
          >
            <Plus class="w-4 h-4" /> إنشاء أمر شراء
          </button>
          <select
            v-model="filterState"
            class="h-11 px-3 bg-white border border-outline-variant rounded-lg text-sm cursor-pointer"
          >
            <option value="">جميع الحالات</option>
            <option value="draft">مسودة</option>
            <option value="sent">مرسل</option>
            <option value="purchase">مؤكد</option>
            <option value="done">مكتمل</option>
          </select>
          <button
            @click="refresh()"
            class="px-4 py-2 border border-outline-variant rounded-lg font-bold hover:bg-white-low cursor-pointer"
          >
            تحديث
          </button>
        </div>
      </div>

      <div
        v-if="status === 'error'"
        class="bg-error/10 border border-error text-error p-6 rounded-2xl text-center"
      >
        <CloudOff class="w-10 h-10 mb-2 inline-block" />
        <p class="font-bold">فشل الاتصال بالخادم</p>
        <button
          @click="refresh()"
          class="mt-4 px-6 py-2 bg-error text-on-error rounded-full font-bold cursor-pointer"
        >
          إعادة المحاولة
        </button>
      </div>

      <input
        v-model="searchQuery"
        class="w-full h-11 px-4 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
        placeholder="بحث برقم الأمر أو اسم المورد..."
        type="text"
      />

      <div
        class="bg-white border border-outline-variant rounded-xl overflow-hidden"
      >
        <div
          v-if="poList.length === 0"
          class="p-12 text-center text-on-white-variant"
        >
          <p class="font-bold">لا توجد أوامر شراء</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-right border-collapse">
            <thead class="bg-white-low text-on-white-variant">
              <tr>
                <th class="p-4 text-label-md font-bold">رقم الأمر</th>
                <th class="p-4 text-label-md font-bold">المورد</th>
                <th class="p-4 text-label-md font-bold">التاريخ</th>
                <th class="p-4 text-label-md font-bold">الحالة</th>
                <th class="p-4 text-label-md font-bold">حالة الاستلام</th>
                <th class="p-4 text-label-md font-bold">الإجمالي</th>
                <th class="p-4 text-label-md font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody
              class="divide-y divide-outline-variant/45 text-body-md text-on-white"
            >
              <tr
                v-for="po in poList"
                :key="po.id"
                class="hover:bg-primary/5 transition-colors"
              >
                <td class="p-4 font-bold">{{ po.name }}</td>
                <td class="p-4">
                  {{ po.partner_id ? po.partner_id[1] : "-" }}
                </td>
                <td class="p-4 text-on-white-variant">{{ po.date_order }}</td>
                <td class="p-4">
                  <span
                    class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    :class="stateClass(po.state)"
                  >
                    {{ stateText(po.state) }}
                  </span>
                </td>
                <td class="p-4">
                  <span
                    class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    :class="receiptStatusClass(po.receipt_status)"
                  >
                    {{ receiptStatusText(po.receipt_status) }}
                  </span>
                </td>
                <td class="p-4 font-bold text-primary">
                  {{ po.amount_total.toLocaleString("ar-EG") }} ج.م
                </td>
                <td class="p-4">
                  <div class="flex gap-2">
                    <button
                      v-if="po.state === 'draft'"
                      @click="confirmPO(po.id)"
                      class="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 cursor-pointer"
                    >
                      تأكيد
                    </button>
                    <button
                      v-if="
                        po.state === 'purchase' && po.receipt_status !== 'done'
                      "
                      class="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 cursor-pointer"
                    >
                      استلام
                    </button>
                    <button
                      v-if="po.state === 'purchase'"
                      @click="createBill(po.id)"
                      class="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 cursor-pointer"
                    >
                      إنشاء فاتورة
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="totalPages > 1" class="flex justify-center gap-4">
        <button
          @click="currentPage--"
          :disabled="currentPage <= 1"
          class="px-4 py-2 border border-outline-variant rounded-lg disabled:opacity-40 cursor-pointer"
        >
          السابق
        </button>
        <span class="flex items-center text-on-white-variant"
          >الصفحة {{ currentPage }} من {{ totalPages }}</span
        >
        <button
          @click="currentPage++"
          :disabled="currentPage >= totalPages"
          class="px-4 py-2 border border-outline-variant rounded-lg disabled:opacity-40 cursor-pointer"
        >
          التالي
        </button>
      </div>
    </template>
  </div>
  <CreatePurchaseOrderModal
    :open="showCreateModal"
    @update:open="showCreateModal = $event"
    @created="refresh"
  />
</template>
