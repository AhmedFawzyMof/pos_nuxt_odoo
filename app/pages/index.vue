<script setup lang="ts">
import { ref } from 'vue'

const kpis = ref([
  {
    title: 'إيرادات اليوم',
    value: '12,450.00 ج.م',
    change: '+12.5%',
    changeType: 'positive',
    icon: 'trending_up',
    color: 'primary'
  },
  {
    title: 'المصاريف التشغيلية',
    value: '3,120.50 ج.م',
    change: '-3.2%',
    changeType: 'negative',
    icon: 'payments',
    color: 'error'
  },
  {
    title: 'منتجات منخفضة المخزون',
    value: '12 منتج',
    change: 'عاجل',
    changeType: 'warning',
    icon: 'warning',
    color: 'secondary'
  },
  {
    title: 'إجمالي العملاء',
    value: '1,420 عميل',
    change: '+5%',
    changeType: 'positive',
    icon: 'group',
    color: 'tertiary'
  }
])

const modules = [
  {
    name: 'نقطة البيع (POS)',
    description: 'واجهة سريعة وبسيطة لعمليات البيع اليومية وقبول المدفوعات.',
    path: '/pos',
    icon: 'point_of_sale',
    bg: 'bg-primary-container/10',
    color: 'text-primary'
  },
  {
    name: 'الحسابات والمحاسبة',
    description: 'تسجيل المعاملات المالية، الفواتير، التقارير والضرائب.',
    path: '/accounting',
    icon: 'account_balance',
    bg: 'bg-indigo-500/10',
    color: 'text-indigo-600'
  },
  {
    name: 'المستودعات والمخزون',
    description: 'متابعة مستويات المخزون، الشحنات الواردة وحركات النقل.',
    path: '/warehouse',
    icon: 'inventory_2',
    bg: 'bg-amber-500/10',
    color: 'text-amber-600'
  },
  {
    name: 'إدارة المنتجات',
    description: 'إضافة المنتجات الجديدة، تحديث الأسعار والـ SKU.',
    path: '/products',
    icon: 'shopping_bag',
    bg: 'bg-emerald-500/10',
    color: 'text-emerald-600'
  },
  {
    name: 'أقسام المنتجات',
    description: 'تنظيم شجرة الأقسام والفئات لتسهيل البحث والبيع.',
    path: '/categories',
    icon: 'grid_view',
    bg: 'bg-sky-500/10',
    color: 'text-sky-600'
  },
  {
    name: 'العملاء والشركاء',
    description: 'إدارة بيانات العملاء، الحسابات الآجلة وبرامج الولاء.',
    path: '/customers',
    icon: 'group',
    bg: 'bg-rose-500/10',
    color: 'text-rose-600'
  },
  {
    name: 'سجل الطلبات',
    description: 'تاريخ الفواتير الصادرة، عمليات الإرجاع والطلب المعلق.',
    path: '/orders',
    icon: 'history',
    bg: 'bg-teal-500/10',
    color: 'text-teal-600'
  }
]
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome Header Banner -->
    <div class="bg-gradient-to-l from-primary to-primary-container text-white p-8 rounded-2xl relative overflow-hidden shadow-md">
      <div class="relative z-10 max-w-xl">
        <h3 class="text-display-lg font-bold mb-2">مرحباً بك في لوحة تحكم Odoo</h3>
        <p class="text-body-lg opacity-90">
          من هنا يمكنك الوصول إلى جميع الأدوات الذكية لإدارة البيع بالتجزئة، المحاسبة، وتحديث المستودعات بكفاءة وسرعة.
        </p>
      </div>
      <div class="absolute -bottom-6 left-6 opacity-10 text-[160px] select-none font-black hidden md:block">
        Odoo
      </div>
    </div>

    <!-- KPI Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="kpi in kpis"
        :key="kpi.title"
        class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-all group"
      >
        <div class="flex justify-between items-start">
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
            :class="[
              kpi.color === 'primary' ? 'bg-primary-container/20 text-primary' : '',
              kpi.color === 'error' ? 'bg-error-container/20 text-error' : '',
              kpi.color === 'secondary' ? 'bg-secondary-container/20 text-secondary' : '',
              kpi.color === 'tertiary' ? 'bg-tertiary-container/20 text-tertiary' : ''
            ]"
          >
            <span class="material-symbols-outlined text-3xl">{{ kpi.icon }}</span>
          </div>
          <span
            class="text-label-md font-bold px-2 py-1 rounded"
            :class="[
              kpi.changeType === 'positive' ? 'bg-primary-container/10 text-primary' : '',
              kpi.changeType === 'negative' ? 'bg-error-container/10 text-error' : '',
              kpi.changeType === 'warning' ? 'bg-amber-500/10 text-amber-600' : ''
            ]"
          >
            {{ kpi.change }}
          </span>
        </div>
        <div class="mt-4">
          <p class="text-on-surface-variant font-label-md text-label-md">{{ kpi.title }}</p>
          <h3 class="text-price-display font-bold mt-1" :class="kpi.color === 'primary' ? 'text-primary' : 'text-on-surface'">
            {{ kpi.value }}
          </h3>
        </div>
      </div>
    </div>

    <!-- Navigation Hub Grid -->
    <div>
      <h3 class="text-headline-md font-bold mb-6 flex items-center gap-2">
        <span class="material-symbols-outlined text-primary">apps</span>
        الوصول السريع للأقسام
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="mod in modules"
          :key="mod.name"
          :to="mod.path"
          class="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-98 flex gap-4 group"
        >
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            :class="mod.bg"
          >
            <span class="material-symbols-outlined text-3xl" :class="mod.color">{{ mod.icon }}</span>
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-body-lg text-on-surface group-hover:text-primary transition-colors">
              {{ mod.name }}
            </h4>
            <p class="text-label-md text-on-surface-variant leading-relaxed">
              {{ mod.description }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>