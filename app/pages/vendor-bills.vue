<script setup lang="ts">
import { ref, computed } from "vue";
import {
  TrendingUp,
  Banknote,
  Wallet,
  Receipt,
  Filter,
  LoaderCircle,
  CloudOff,
  Eye,
  ArrowUpLeft,
} from "@lucide/vue";
import type { VendorBill, VendorBillApiResponse } from "~/types/vendorBill";

const now = new Date();
const defaultDateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
const defaultDateTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const dateFrom = ref(defaultDateFrom);
const dateTo = ref(defaultDateTo);
const currentPage = ref(1);
const searchQuery = ref("");
const filterState = ref("");

const { data: apiResponse, status, error, refresh, pending } =
  useFetch<VendorBillApiResponse>("/api/vendor-bills", {
    lazy: true,
    query: {
      page: currentPage,
      search: searchQuery,
      payment_state: filterState,
      date_from: dateFrom,
      date_to: dateTo,
    },
    watch: [currentPage, searchQuery, filterState, dateFrom, dateTo],
    transform: (response: any) => {
      if (!response.data) response.data = [];
      return response;
    },
  });

const { data: kpiData } = useFetch("/api/kpi/dashboard", {
  query: { date_from: dateFrom, date_to: dateTo },
});

const billList = computed<VendorBill[]>(() => apiResponse.value?.data || []);
const totalPages = computed(() => apiResponse.value?.totalPages || 1);
const totalItems = computed(() => apiResponse.value?.totalItems || 0);

const totalVendorBills = computed(() =>
  billList.value.reduce((s, b) => s + b.amount_total, 0),
);

const totalPayable = computed(() =>
  billList.value
    .filter((b) => b.payment_state !== "paid")
    .reduce((s, b) => s + b.amount_residual, 0),
);

const overdueCount = computed(() =>
  billList.value.filter((b) => b.payment_state === "overdue").length,
);

const unpaidCount = computed(() =>
  billList.value.filter((b) => b.payment_state !== "paid").length,
);

const stateText = (state: string) => {
  const map: Record<string, string> = { draft: "مسودة", posted: "مرسل", paid: "مدفوع", cancel: "ملغي" };
  return map[state] || state;
};

const stateClass = (state: string) => {
  if (state === "paid") return "bg-emerald-100 text-emerald-800";
  if (state === "posted") return "bg-primary/10 text-primary";
  if (state === "draft") return "bg-slate-100 text-slate-600";
  if (state === "cancel") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-600";
};

const paymentStateText = (state: string) => {
  const map: Record<string, string> = {
    paid: "مدفوع",
    not_paid: "غير مدفوع",
    overdue: "متأخر",
    in_payment: "قيد الدفع",
    partial: "مدفوع جزئياً",
  };
  return map[state] || state;
};

const paymentStateClass = (state: string) => {
  if (state === "paid") return "bg-emerald-100 text-emerald-800";
  if (state === "overdue") return "bg-red-100 text-red-800";
  if (state === "partial" || state === "in_payment") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
};

const loadingAll = computed(() => pending.value);
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <div v-if="loadingAll && billList.length === 0" class="h-[calc(100vh-200px)] flex items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-on-white-variant">
        <LoaderCircle class="w-8 h-8 animate-spin text-primary" />
        <span class="text-[13px]">جاري تحميل فواتير الموردين...</span>
      </div>
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-headline-lg font-bold text-on-white">فواتير الموردين</h1>
          <p class="text-on-white-variant text-label-md">إدارة فواتير الشراء والمستحقات للموردين</p>
        </div>
        <div class="flex gap-2">
          <button @click="refresh" class="px-4 py-2 border border-outline-variant rounded-lg font-bold hover:bg-white-low cursor-pointer">تحديث</button>
        </div>
      </div>

      <!-- Date Filter -->
      <div class="flex items-center gap-4 bg-white-lowest border border-outline-variant rounded-xl p-4">
        <Filter class="w-5 h-5 text-on-white-variant" />
        <div class="flex items-center gap-2">
          <label class="text-label-md text-on-white-variant">من</label>
          <input v-model="dateFrom" type="date" class="h-10 px-3 border border-outline-variant rounded-lg text-sm" />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-label-md text-on-white-variant">إلى</label>
          <input v-model="dateTo" type="date" class="h-10 px-3 border border-outline-variant rounded-lg text-sm" />
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white-lowest border border-outline-variant rounded-xl p-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
              <Receipt class="w-6 h-6" />
            </div>
          </div>
          <p class="text-on-white-variant text-label-md">فواتير الموردين (إجمالي)</p>
          <h3 class="text-price-display font-bold text-primary">{{ totalVendorBills.toLocaleString("ar-EG") }} ج.م</h3>
        </div>

        <div class="bg-white-lowest border border-outline-variant rounded-xl p-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600">
              <Wallet class="w-6 h-6" />
            </div>
          </div>
          <p class="text-on-white-variant text-label-md">المستحق للموردين</p>
          <h3 class="text-price-display font-bold text-amber-600">{{ totalPayable.toLocaleString("ar-EG") }} ج.م</h3>
        </div>

        <div class="bg-white-lowest border border-outline-variant rounded-xl p-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center text-error">
              <Banknote class="w-6 h-6" />
            </div>
          </div>
          <p class="text-on-white-variant text-label-md">الفواتير المتأخرة</p>
          <h3 class="text-price-display font-bold text-error">{{ overdueCount }}</h3>
        </div>

        <div class="bg-white-lowest border border-outline-variant rounded-xl p-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-on-white-variant">
              <TrendingUp class="w-6 h-6" />
            </div>
          </div>
          <p class="text-on-white-variant text-label-md">غير المسددة</p>
          <h3 class="text-price-display font-bold text-on-white">{{ unpaidCount }}</h3>
        </div>
      </div>

      <div v-if="status === 'error'" class="bg-error/10 border border-error text-error p-6 rounded-2xl text-center">
        <CloudOff class="w-10 h-10 mb-2 inline-block" />
        <p class="font-bold">فشل الاتصال بالخادم</p>
        <button @click="refresh" class="mt-4 px-6 py-2 bg-error text-on-error rounded-full font-bold cursor-pointer">إعادة المحاولة</button>
      </div>

      <!-- Search & Filter -->
      <div class="flex gap-4">
        <input v-model="searchQuery" class="flex-1 h-11 px-4 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white-lowest" placeholder="بحث برقم الفاتورة أو اسم المورد..." type="text" />
        <select v-model="filterState" class="h-11 px-3 bg-white border border-outline-variant rounded-lg text-sm cursor-pointer min-w-[140px]">
          <option value="">جميع حالات الدفع</option>
          <option value="not_paid">غير مدفوع</option>
          <option value="paid">مدفوع</option>
          <option value="overdue">متأخر</option>
          <option value="partial">مدفوع جزئياً</option>
        </select>
      </div>

      <!-- Bills Table -->
      <div class="bg-white-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div v-if="billList.length === 0" class="p-12 text-center text-on-white-variant">
          <p class="font-bold">لا توجد فواتير موردين في هذه الفترة</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-right border-collapse">
            <thead class="bg-white-low text-on-white-variant">
              <tr>
                <th class="p-4 text-label-md font-bold">رقم الفاتورة</th>
                <th class="p-4 text-label-md font-bold">المورد</th>
                <th class="p-4 text-label-md font-bold">تاريخ الفاتورة</th>
                <th class="p-4 text-label-md font-bold">تاريخ الاستحقاق</th>
                <th class="p-4 text-label-md font-bold">الإجمالي</th>
                <th class="p-4 text-label-md font-bold">المتبقي</th>
                <th class="p-4 text-label-md font-bold">حالة الدفع</th>
                <th class="p-4 text-label-md font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/45 text-body-md text-on-white">
              <tr v-for="bill in billList" :key="bill.id" class="hover:bg-primary/5 transition-colors">
                <td class="p-4 font-bold">{{ bill.name }}</td>
                <td class="p-4">{{ bill.partner_id?.[1] || '-' }}</td>
                <td class="p-4 text-on-white-variant">{{ bill.invoice_date || '-' }}</td>
                <td class="p-4 text-on-white-variant">{{ bill.invoice_date_due || '-' }}</td>
                <td class="p-4 font-bold">{{ bill.amount_total.toLocaleString("ar-EG") }} ج.م</td>
                <td class="p-4 font-bold" :class="bill.amount_residual > 0 ? 'text-error' : 'text-emerald-600'">
                  {{ bill.amount_residual.toLocaleString("ar-EG") }} ج.م
                </td>
                <td class="p-4">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold" :class="paymentStateClass(bill.payment_state)">
                    {{ paymentStateText(bill.payment_state) }}
                  </span>
                </td>
                <td class="p-4">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold" :class="stateClass(bill.state)">
                    {{ stateText(bill.state) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center gap-4">
        <button @click="currentPage--" :disabled="currentPage <= 1" class="px-4 py-2 border border-outline-variant rounded-lg disabled:opacity-40 cursor-pointer">السابق</button>
        <span class="flex items-center text-on-white-variant">الصفحة {{ currentPage }} من {{ totalPages }}</span>
        <button @click="currentPage++" :disabled="currentPage >= totalPages" class="px-4 py-2 border border-outline-variant rounded-lg disabled:opacity-40 cursor-pointer">التالي</button>
      </div>

      <!-- Unpaid Bills Summary -->
      <div v-if="billList.filter(b => b.payment_state !== 'paid').length > 0" class="bg-white-lowest border border-outline-variant rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-headline-sm font-bold">فواتير الموردين غير المسددة</h4>
          <NuxtLink to="/suppliers" class="text-primary text-label-md font-bold flex items-center gap-1 hover:underline cursor-pointer">
            عرض الموردين <ArrowUpLeft class="w-[14px] h-[14px]" />
          </NuxtLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-right border-collapse">
            <thead class="bg-white-low text-on-white-variant">
              <tr>
                <th class="p-3 text-label-md font-bold">رقم الفاتورة</th>
                <th class="p-3 text-label-md font-bold">المورد</th>
                <th class="p-3 text-label-md font-bold">تاريخ الاستحقاق</th>
                <th class="p-3 text-label-md font-bold">الإجمالي</th>
                <th class="p-3 text-label-md font-bold">المتبقي</th>
                <th class="p-3 text-label-md font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/45">
              <tr v-for="b in billList.filter(b => b.payment_state !== 'paid').slice(0, 10)" :key="b.id" class="hover:bg-primary/5 transition-colors">
                <td class="p-3 font-bold">{{ b.name }}</td>
                <td class="p-3">{{ b.partner_id?.[1] || '-' }}</td>
                <td class="p-3 text-on-white-variant">{{ b.invoice_date_due || '-' }}</td>
                <td class="p-3">{{ b.amount_total.toLocaleString("ar-EG") }} ج.م</td>
                <td class="p-3 font-bold text-error">{{ b.amount_residual.toLocaleString("ar-EG") }} ج.م</td>
                <td class="p-3">
                  <span class="text-[12px] font-bold px-2 py-0.5 rounded-full"
                    :class="b.payment_state === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'">
                    {{ b.payment_state === 'overdue' ? 'متأخر' : 'مستحق' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
