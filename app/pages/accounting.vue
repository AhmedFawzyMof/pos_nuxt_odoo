<script setup lang="ts">
import { ref } from 'vue'
import {
  TrendingUp,
  Banknote,
  Wallet,
  ArrowLeft,
  PieChart,
  FileWarning,
  FileText,
  Landmark,
  BarChart3,
  Receipt,
} from "@lucide/vue";

const taxPeriod = ref('هذا الشهر')

const transactions = ref([
  {
    type: 'مبيعات',
    typeColor: 'bg-primary',
    desc: 'فاتورة #1042 - عميل نقدي',
    time: 'اليوم، 10:30 ص',
    amount: '+450.00 ج.م',
    amountColor: 'text-primary',
    status: 'مكتمل',
    statusColor: 'bg-primary/10 text-primary'
  },
  {
    type: 'مصاريف',
    typeColor: 'bg-error',
    desc: 'فاتورة كهرباء - أكتوبر',
    time: 'اليوم، 09:15 ص',
    amount: '-1,200.00 ج.م',
    amountColor: 'text-error',
    status: 'مدفوع',
    statusColor: 'bg-error/10 text-error'
  },
  {
    type: 'مرتجعات',
    typeColor: 'bg-amber-500',
    desc: 'مرتجع فاتورة #1038',
    time: 'أمس، 04:45 م',
    amount: '-85.00 ج.م',
    amountColor: 'text-on-surface',
    status: 'معالجة',
    statusColor: 'bg-surface-variant text-on-surface-variant'
  },
  {
    type: 'مبيعات',
    typeColor: 'bg-primary',
    desc: 'فاتورة #1041 - شركة النور',
    time: 'أمس، 02:20 م',
    amount: '+2,800.00 ج.م',
    amountColor: 'text-primary',
    status: 'مكتمل',
    statusColor: 'bg-primary/10 text-primary'
  }
])

const reports = [
  {
    title: 'قائمة الدخل',
    desc: 'ملخص الأرباح والخسائر للربع الحالي',
    icon: FileText
  },
  {
    title: 'الميزانية العمومية',
    desc: 'الأصول والالتزامات وحقوق الملكية',
    icon: Landmark
  },
  {
    title: 'تقرير التدفق النقدي',
    desc: 'حركة السيولة النقدية الواردة والصادرة',
    icon: BarChart3
  },
  {
    title: 'الإقرار الضريبي',
    desc: 'ضريبة القيمة المضافة للفترة السابقة',
    icon: Receipt
  }
]

const expenseDistribution = [
  { label: 'الموردين', percentage: '65%', widthClass: 'w-[65%]', colorClass: 'bg-primary' },
  { label: 'رواتب الموظفين', percentage: '25%', widthClass: 'w-[25%]', colorClass: 'bg-secondary' },
  { label: 'خدمات (كهرباء، ماء)', percentage: '10%', widthClass: 'w-[10%]', colorClass: 'bg-tertiary' }
]
</script>

<template>
  <div class="space-y-8">
    <!-- Financial Overview KPI Bento Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Daily Revenue -->
      <div
        class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
      >
        <div class="flex justify-between items-start">
          <div
            class="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"
          >
            <TrendingUp class="w-7 h-7" />
          </div>
          <span class="text-label-md font-bold text-primary bg-primary-container/10 px-2 py-1 rounded">+12.5%</span>
        </div>
        <div class="mt-4">
          <p class="text-on-surface-variant font-label-md text-label-md">إيرادات اليوم</p>
          <h3 class="text-price-display font-bold text-primary">12,450.00 ج.م</h3>
        </div>
      </div>

      <!-- Total Expenses -->
      <div
        class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
      >
        <div class="flex justify-between items-start">
          <div
            class="w-12 h-12 rounded-lg bg-error-container/20 flex items-center justify-center text-error group-hover:scale-110 transition-transform"
          >
            <Banknote class="w-7 h-7" />
          </div>
          <span class="text-label-md font-bold text-error bg-error-container/10 px-2 py-1 rounded">-3.2%</span>
        </div>
        <div class="mt-4">
          <p class="text-on-surface-variant font-label-md text-label-md">إجمالي المصاريف</p>
          <h3 class="text-price-display font-bold text-on-surface">3,120.50 ج.م</h3>
        </div>
      </div>

      <!-- Net Profit -->
      <div class="bg-primary text-on-primary rounded-xl p-6 flex flex-col justify-between shadow-lg group hover:-translate-y-0.5 transition-all cursor-pointer">
        <div class="flex justify-between items-start">
          <div
            class="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform"
          >
            <Wallet class="w-7 h-7" />
          </div>
          <span class="text-label-md font-bold text-white bg-white/20 px-2 py-1 rounded">المستهدف: 85%</span>
        </div>
        <div class="mt-4">
          <p class="text-white/80 font-label-md text-label-md">صافي الربح (الشهري)</p>
          <h3 class="text-price-display font-bold text-white">48,930.00 ج.م</h3>
        </div>
      </div>
    </div>

    <!-- Main Grid: Transactions & Reports -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Recent Transactions Table -->
      <div
        class="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden"
      >
        <div
          class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright"
        >
          <h4 class="text-headline-sm font-bold">آخر المعاملات</h4>
          <button class="text-primary text-label-md font-bold flex items-center gap-1 hover:underline">
            عرض الكل
            <ArrowLeft class="w-[14px] h-[14px]" />
          </button>
        </div>
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-right border-collapse">
            <thead class="bg-surface-container">
              <tr>
                <th class="p-4 text-label-md font-bold text-on-surface-variant">النوع</th>
                <th class="p-4 text-label-md font-bold text-on-surface-variant">البيان</th>
                <th class="p-4 text-label-md font-bold text-on-surface-variant">التاريخ</th>
                <th class="p-4 text-label-md font-bold text-on-surface-variant text-left">المبلغ</th>
                <th class="p-4 text-label-md font-bold text-on-surface-variant">الحالة</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr
                v-for="(t, index) in transactions"
                :key="index"
                class="hover:bg-surface-container-low transition-colors group cursor-pointer"
              >
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :class="t.typeColor"></span>
                    <span class="text-body-md">{{ t.type }}</span>
                  </div>
                </td>
                <td class="p-4 text-body-md font-bold">{{ t.desc }}</td>
                <td class="p-4 text-label-md text-on-surface-variant">{{ t.time }}</td>
                <td class="p-4 text-body-md font-bold text-left" :class="t.amountColor">{{ t.amount }}</td>
                <td class="p-4">
                  <span class="text-[12px] font-bold px-2 py-0.5 rounded-full" :class="t.statusColor">
                    {{ t.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Financial Reports Section -->
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col">
        <div class="p-6 border-b border-outline-variant bg-surface-bright">
          <h4 class="text-headline-sm font-bold">التقارير المالية</h4>
        </div>
        <div class="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <div
            v-for="(rep, idx) in reports"
            :key="idx"
            class="p-4 border border-outline-variant rounded-lg hover:bg-surface-container transition-all cursor-pointer group"
          >
            <div class="flex items-center gap-3">
              <div
                class="p-2 bg-secondary-container text-on-secondary-container rounded group-hover:bg-primary group-hover:text-on-primary transition-colors"
              >
                <component :is="rep.icon" class="w-5 h-5" />
              </div>
              <div>
                <p class="text-body-md font-bold">{{ rep.title }}</p>
                <p class="text-label-md text-on-surface-variant">{{ rep.desc }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="p-4 mt-auto">
          <button
            class="w-full py-2.5 rounded-lg border border-primary text-primary font-bold hover:bg-primary/5 transition-colors"
          >
            إعداد تقرير مخصص
          </button>
        </div>
      </div>
    </div>

    <!-- Tax Summary & Budget Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="bg-surface-container-high/50 p-6 rounded-xl border border-outline-variant">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <PieChart class="w-5 h-5 text-primary" />
            <h4 class="text-headline-sm font-bold">توزيع المصروفات</h4>
          </div>
          <select
            v-model="taxPeriod"
            class="bg-transparent border-none text-label-md font-bold text-primary focus:ring-0 outline-none cursor-pointer"
          >
            <option value="هذا الشهر">هذا الشهر</option>
            <option value="الشهر الماضي">الشهر الماضي</option>
          </select>
        </div>
        <div class="space-y-4">
          <div v-for="(exp, idx) in expenseDistribution" :key="idx" class="space-y-1">
            <div class="flex justify-between text-label-md">
              <span>{{ exp.label }}</span>
              <span>{{ exp.percentage }}</span>
            </div>
            <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="[exp.colorClass, exp.widthClass]"></div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 relative overflow-hidden flex flex-col justify-between"
      >
        <div class="relative z-10 space-y-2">
          <h4 class="text-headline-sm font-bold mb-2">تنبيهات ضريبية</h4>
          <p class="text-body-md text-on-surface-variant">
            موعد تقديم الإقرار الضريبي القادم خلال 5 أيام عمل.
          </p>
          <div class="flex gap-4 pt-2">
            <button
              class="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-shadow active:scale-95"
            >
              تجهيز الإقرار
            </button>
            <button class="text-secondary font-bold hover:underline">مراجعة البيانات</button>
          </div>
        </div>
        <!-- Decorative Background element -->
        <div class="absolute -bottom-6 -left-6 opacity-10 scale-150 rotate-12 text-primary">
          <FileWarning class="w-[120px] h-[120px]" />
        </div>
      </div>
    </div>
  </div>
</template>
