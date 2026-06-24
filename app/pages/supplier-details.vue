<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, navigateTo } from "#app";
import { CloudOff, RefreshCw } from "@lucide/vue";
import { usePermissions } from "~/composables/usePermissions";

const { canViewPage } = usePermissions();

if (import.meta.client) {
  if (!canViewPage(route.path)) {
    navigateTo('/')
  }
}

const route = useRoute();
const supplierId = computed(() => route.query.id as string);

const {
  data: apiResponse,
  status,
  error,
  refresh,
} = useFetch("/api/suppliers/detail", {
  lazy: true,
  query: { id: supplierId },
  watch: [supplierId],
});

const supplier = computed(() => (apiResponse.value as any)?.data || null);

const activeTab = ref<"overview" | "orders" | "bills" | "payments">("overview");
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <div v-if="status === 'pending'" class="text-center py-20">
      <RefreshCw class="w-10 h-10 mx-auto animate-spin text-primary" />
      <p class="mt-4 text-on-white-variant">جاري تحميل بيانات المورد...</p>
    </div>

    <div
      v-else-if="status === 'error'"
      class="bg-error/10 border border-error text-error p-6 rounded-2xl text-center"
    >
      <CloudOff class="w-10 h-10 mb-2 inline-block" />
      <p class="font-bold">فشل تحميل بيانات المورد</p>
      <p class="text-sm opacity-80">{{ error?.message }}</p>
      <button
        @click="refresh()"
        class="mt-4 px-6 py-2 bg-error text-on-error rounded-full font-bold cursor-pointer"
      >
        إعادة المحاولة
      </button>
    </div>

    <template v-else-if="supplier">
      <!-- Header -->
      <div
        class="bg-white border border-outline-variant rounded-xl p-6 flex items-center gap-6"
      >
        <div
          class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
        >
          <span class="text-headline-lg font-bold text-primary">{{
            supplier.name.slice(0, 2)
          }}</span>
        </div>
        <div class="flex-1">
          <h1 class="text-display-lg font-bold text-on-white">
            {{ supplier.name }}
          </h1>
          <p class="text-on-white-variant">
            {{ supplier.street }}, {{ supplier.city }}
          </p>
          <p class="text-label-md text-on-white-variant">
            {{ supplier.phone
            }}{{ supplier.email ? ` | ${supplier.email}` : "" }}
          </p>
        </div>
        <div class="text-left">
          <p class="text-label-md text-on-white-variant">الرقم الضريبي</p>
          <p class="font-bold text-on-white">{{ supplier.vat || "-" }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-outline-variant gap-6">
        <button
          @click="activeTab = 'overview'"
          class="pb-4 px-2 text-label-md font-bold transition-all cursor-pointer"
          :class="
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-on-white-variant hover:text-primary'
          "
        >
          نظرة عامة
        </button>
        <button
          @click="activeTab = 'orders'"
          class="pb-4 px-2 text-label-md font-bold transition-all cursor-pointer"
          :class="
            activeTab === 'orders'
              ? 'border-b-2 border-primary text-primary'
              : 'text-on-white-variant hover:text-primary'
          "
        >
          قائمة مشترايات
        </button>
        <button
          @click="activeTab = 'bills'"
          class="pb-4 px-2 text-label-md font-bold transition-all cursor-pointer"
          :class="
            activeTab === 'bills'
              ? 'border-b-2 border-primary text-primary'
              : 'text-on-white-variant hover:text-primary'
          "
        >
          فواتير الموردين
        </button>
        <button
          @click="activeTab = 'payments'"
          class="pb-4 px-2 text-label-md font-bold transition-all cursor-pointer"
          :class="
            activeTab === 'payments'
              ? 'border-b-2 border-primary text-primary'
              : 'text-on-white-variant hover:text-primary'
          "
        >
          المدفوعات
        </button>
      </div>

      <!-- Overview Tab -->
      <div
        v-if="activeTab === 'overview'"
        class="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div
          class="lg:col-span-2 bg-white border border-outline-variant rounded-xl p-6"
        >
          <h3 class="text-headline-sm font-bold text-on-white mb-4">
            معلومات المورد
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-on-white-variant font-bold">الاسم</p>
              <p class="font-bold">{{ supplier.name }}</p>
            </div>
            <div>
              <p class="text-xs text-on-white-variant font-bold">البريد</p>
              <p>{{ supplier.email || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-on-white-variant font-bold">الهاتف</p>
              <p>{{ supplier.phone || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-on-white-variant font-bold">الجوال</p>
              <p>{{ supplier.mobile || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-on-white-variant font-bold">العنوان</p>
              <p>{{ supplier.street || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-on-white-variant font-bold">المدينة</p>
              <p>{{ supplier.city || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-on-white-variant font-bold">
                الرقم الضريبي
              </p>
              <p>{{ supplier.vat || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-on-white-variant font-bold">شروط الدفع</p>
              <p>
                {{ supplier.property_supplier_payment_term_id?.[1] || "-" }}
              </p>
            </div>
          </div>
        </div>
        <div class="bg-white border border-outline-variant rounded-xl p-6">
          <h3 class="text-headline-sm font-bold text-on-white mb-4">ملخص</h3>
          <div class="space-y-4">
            <div>
              <p class="text-xs text-on-white-variant">عدد قائمة مشترايات</p>
              <p class="font-bold text-on-white">
                {{ supplier.purchase_orders?.length || 0 }}
              </p>
            </div>
            <div>
              <p class="text-xs text-on-white-variant">عدد الفواتير</p>
              <p class="font-bold text-on-white">
                {{ supplier.vendor_bills?.length || 0 }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Purchase Orders Tab -->
      <div
        v-if="activeTab === 'orders'"
        class="bg-white border border-outline-variant rounded-xl overflow-hidden"
      >
        <div
          v-if="!supplier.purchase_orders?.length"
          class="p-12 text-center text-on-white-variant"
        >
          <p class="font-bold">لا توجد أوامر شراء</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-right border-collapse">
            <thead class="bg-white-low text-on-white-variant">
              <tr>
                <th class="p-4 text-label-md font-bold">الرقم</th>
                <th class="p-4 text-label-md font-bold">التاريخ</th>
                <th class="p-4 text-label-md font-bold">الحالة</th>
                <th class="p-4 text-label-md font-bold">الإجمالي</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/45">
              <tr
                v-for="po in supplier.purchase_orders"
                :key="po.id"
                class="hover:bg-primary/5 transition-colors"
              >
                <td class="p-4 font-bold">{{ po.name }}</td>
                <td class="p-4 text-on-white-variant">{{ po.date_order }}</td>
                <td class="p-4">{{ po.state }}</td>
                <td class="p-4 font-bold text-primary">
                  {{ po.amount_total.toLocaleString("ar-EG") }} ج.م
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bills Tab -->
      <div
        v-if="activeTab === 'bills'"
        class="bg-white border border-outline-variant rounded-xl overflow-hidden"
      >
        <div
          v-if="!supplier.vendor_bills?.length"
          class="p-12 text-center text-on-white-variant"
        >
          <p class="font-bold">لا توجد فواتير موردين</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-right border-collapse">
            <thead class="bg-white-low text-on-white-variant">
              <tr>
                <th class="p-4 text-label-md font-bold">الرقم</th>
                <th class="p-4 text-label-md font-bold">التاريخ</th>
                <th class="p-4 text-label-md font-bold">تاريخ الاستحقاق</th>
                <th class="p-4 text-label-md font-bold">الحالة</th>
                <th class="p-4 text-label-md font-bold">حالة الدفع</th>
                <th class="p-4 text-label-md font-bold">الإجمالي</th>
                <th class="p-4 text-label-md font-bold">المتبقي</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/45">
              <tr
                v-for="b in supplier.vendor_bills"
                :key="b.id"
                class="hover:bg-primary/5 transition-colors"
              >
                <td class="p-4 font-bold">{{ b.name }}</td>
                <td class="p-4 text-on-white-variant">{{ b.invoice_date }}</td>
                <td class="p-4 text-on-white-variant">
                  {{ b.invoice_date_due }}
                </td>
                <td class="p-4">{{ b.state }}</td>
                <td class="p-4">{{ b.payment_state }}</td>
                <td class="p-4 font-bold text-primary">
                  {{ b.amount_total.toLocaleString("ar-EG") }} ج.م
                </td>
                <td class="p-4">
                  {{ b.amount_residual.toLocaleString("ar-EG") }} ج.م
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payments Tab -->
      <div
        v-if="activeTab === 'payments'"
        class="bg-white border border-outline-variant rounded-xl overflow-hidden"
      >
        <div
          v-if="!supplier.payments?.length"
          class="p-12 text-center text-on-white-variant"
        >
          <p class="font-bold">لا توجد مدفوعات</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-right border-collapse">
            <thead class="bg-white-low text-on-white-variant">
              <tr>
                <th class="p-4 text-label-md font-bold">الرقم</th>
                <th class="p-4 text-label-md font-bold">التاريخ</th>
                <th class="p-4 text-label-md font-bold">المبلغ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/45">
              <tr
                v-for="p in supplier.payments"
                :key="p.id"
                class="hover:bg-primary/5 transition-colors"
              >
                <td class="p-4 font-bold">{{ p.name }}</td>
                <td class="p-4 text-on-white-variant">{{ p.date }}</td>
                <td class="p-4 font-bold text-primary">
                  {{ p.amount.toLocaleString("ar-EG") }} ج.م
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <button
        @click="navigateTo('/suppliers')"
        class="mt-4 px-6 py-2 border border-outline-variant text-on-white font-bold rounded-lg hover:bg-white-low transition-all cursor-pointer"
      >
        العودة إلى قائمة الموردين
      </button>
    </template>
  </div>
</template>
