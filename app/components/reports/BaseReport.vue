<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  TrendingUp,
  Banknote,
  Wallet,
  ShoppingCart,
  Truck,
  Receipt,
  Users,
  Package,
  ShoppingBag,
  ClipboardList,
  Timer,
  UserCheck,
  Activity,
  Circle,
} from "@lucide/vue";
import ReportChart from "./ReportChart.vue";
import ReportTable from "./ReportTable.vue";

const props = defineProps<{
  reportType: string;
  dateFrom: string;
  dateTo: string;
  refreshKey?: number;
}>();

const emit = defineEmits<{
  loading: [v: boolean];
}>();

const queryParams = computed(() => {
  const now = new Date();
  const defaultDateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultDateTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
    type: props.reportType,
    date_from: props.dateFrom || defaultDateFrom,
    date_to: props.dateTo || defaultDateTo,
  };
});

const { data, pending, error, refresh } = useFetch("/api/reports", {
  query: queryParams,
  lazy: true,
});

watch(pending, (v) => emit("loading", v));

watch(data, (v) => {
  console.log(`[BaseReport] ${props.reportType} response:`, v);
}, { deep: true });

watch(error, (v) => {
  if (v) console.error(`[BaseReport] ${props.reportType} fetch error:`, v);
});

watch(queryParams, () => {
  refresh();
}, { deep: true });

watch(() => props.refreshKey, () => {
  refresh();
});

const reportData = computed(() => data.value as any);

const iconMap: Record<string, any> = {
  trending_up: TrendingUp,
  payments: Banknote,
  account_balance_wallet: Wallet,
  shopping_cart: ShoppingCart,
  truck: Truck,
  receipt: Receipt,
  users: Users,
  package: Package,
  shopping_bag: ShoppingBag,
  clipboard_list: ClipboardList,
  timer: Timer,
  user_check: UserCheck,
  activity: Activity,
  filter: Circle,
  file_warning: Package,
};

const getIcon = (name: string) => iconMap[name] || Circle;

const tableRef = ref<InstanceType<typeof ReportTable> | null>(null);

const handleExport = () => {
  tableRef.value?.exportToExcel();
};

defineExpose({ refresh, handleExport });
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div
      v-if="pending && !reportData"
      class="flex items-center justify-center py-20"
    >
      <div class="flex flex-col items-center gap-3 text-on-white-variant">
        <div
          class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
        />
        <span class="text-[13px]">جاري تحميل التقرير...</span>
      </div>
    </div>

    <template v-else-if="reportData">
      <!-- Error -->
      <div
        v-if="reportData?.error"
        class="bg-error/10 border border-error/30 text-error px-5 py-4 rounded-xl"
      >
        <p class="font-bold">خطأ في تحميل التقرير</p>
        <p class="text-xs mt-1">{{ reportData.error }}</p>
      </div>

      <template v-else>
        <!-- KPI Summary Cards -->
        <div
          v-if="reportData.summary?.length"
          class="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div
            v-for="kpi in reportData.summary"
            :key="kpi.label"
            class="bg-white border border-outline-variant rounded-xl p-5"
          >
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                :class="{
                  'bg-primary-container/20 text-primary':
                    kpi.color === 'primary',
                  'bg-error-container/20 text-error': kpi.color === 'error',
                  'bg-secondary-container/20 text-primary':
                    kpi.color === 'primary',
                  'bg-tertiary-container/20 text-tertiary':
                    kpi.color === 'tertiary',
                }"
              >
                <component :is="getIcon(kpi.icon)" class="w-5 h-5" />
              </div>
            </div>
            <p class="text-on-white-variant text-label-md">{{ kpi.label }}</p>
            <h3
              class="text-price-display font-bold"
              :class="{
                'text-primary': kpi.color === 'primary',
                'text-error': kpi.color === 'error',
                // 'text-secondary': kpi.color === 'primary',
                'text-tertiary': kpi.color === 'tertiary',
                'text-on-white': !kpi.color,
              }"
            >
              {{ typeof kpi.value === 'object' ? JSON.stringify(kpi.value) : kpi.value }}
            </h3>
          </div>
        </div>

        <!-- Chart -->
        <ReportChart
          v-if="reportData.chart"
          :key="JSON.stringify(reportData.chart)"
          :chart="reportData.chart"
        />

        <!-- Table -->
        <ReportTable
          v-if="reportData.columns?.length"
          ref="tableRef"
          :columns="reportData.columns"
          :rows="reportData.rows"
          :title="reportData.title"
        />
      </template>
    </template>
  </div>
</template>
