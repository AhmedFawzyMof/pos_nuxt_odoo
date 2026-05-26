<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Interface for rich inventory ledger movements
interface StockMovement {
  id: string
  date: string
  time: string
  productName: string
  sku: string
  type: 'incoming' | 'outgoing' | 'transfer' // 'incoming' (وارد), 'outgoing' (صادر), 'transfer' (تحويل)
  typeLabel: string
  fromLocation: string
  toLocation: string
  qty: number
  operator: string
  status: 'completed' | 'pending' | 'cancelled'
  statusLabel: string
}

// Search & Filter Reactive States
const searchQuery = ref('')
const selectedType = ref<'all' | 'incoming' | 'outgoing' | 'transfer'>('all')
const currentPage = ref(1)
const itemsPerPage = 8

// Realistic mock data representation of the complete WMS movements ledger
const movements = ref<StockMovement[]>([
  {
    id: 'SM-2026-001',
    date: '2026-05-26',
    time: '04:12',
    productName: 'آيفون 15 برو - 256 جيجا',
    sku: 'APP-IP15P-256',
    type: 'incoming',
    typeLabel: 'وارد (شراء)',
    fromLocation: 'المورد الخارجي',
    toLocation: 'مستودع العبور',
    qty: 25,
    operator: 'أحمد رأفت',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-002',
    date: '2026-05-26',
    time: '03:45',
    productName: 'شاحن سريع 20 وات',
    sku: 'APP-IPAD-AIR5',
    type: 'outgoing',
    typeLabel: 'صادر (مبيعات)',
    fromLocation: 'الفرع الرئيسي - التجمع',
    toLocation: 'العميل النهائي',
    qty: -14,
    operator: 'نور الدين ممدوح',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-003',
    date: '2026-05-26',
    time: '02:30',
    productName: 'ماك بوك إير M2',
    sku: 'APP-MBP-M3',
    type: 'transfer',
    typeLabel: 'تحويل مخزني',
    fromLocation: 'مستودع العبور',
    toLocation: 'الفرع الرئيسي - التجمع',
    qty: 5,
    operator: 'كريم عبد العزيز',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-004',
    date: '2026-05-26',
    time: '01:15',
    productName: 'سماعات إيربودز برو',
    sku: 'APP-AIR-PRO2',
    type: 'incoming',
    typeLabel: 'وارد (شراء)',
    fromLocation: 'المورد الخارجي',
    toLocation: 'الفرع الرئيسي - التجمع',
    qty: 100,
    operator: 'أحمد رأفت',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-005',
    date: '2026-05-25',
    time: '22:10',
    productName: 'حذاء رياضي نايكي',
    sku: 'SP-NKE-RUN42',
    type: 'outgoing',
    typeLabel: 'صادر (مبيعات)',
    fromLocation: 'فرع المعادي',
    toLocation: 'العميل النهائي',
    qty: -2,
    operator: 'عمر مصطفى',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-05-006',
    date: '2026-05-25',
    time: '18:30',
    productName: 'آيباد إير - الجيل الخامس',
    sku: 'APP-IPAD-AIR5',
    type: 'incoming',
    typeLabel: 'وارد (مرتجع)',
    fromLocation: 'العميل النهائي',
    toLocation: 'WH/Scrap (مستودع التالف)',
    qty: 1,
    operator: 'عمر مصطفى',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-05-007',
    date: '2026-05-25',
    time: '15:20',
    productName: 'ساعة ذكية S3',
    sku: 'APP-WATCH-S3',
    type: 'transfer',
    typeLabel: 'تحويل مخزني',
    fromLocation: 'الفرع الرئيسي - التجمع',
    toLocation: 'فرع المعادي',
    qty: 10,
    operator: 'كريم عبد العزيز',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-05-008',
    date: '2026-05-25',
    time: '11:05',
    productName: 'ماك بوك برو M3',
    sku: 'APP-MBP-M3',
    type: 'incoming',
    typeLabel: 'وارد (شراء)',
    fromLocation: 'المستودع الجمركي',
    toLocation: 'مستودع العبور',
    qty: 15,
    operator: 'أحمد رأفت',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-05-009',
    date: '2026-05-24',
    time: '16:40',
    productName: 'سماعات رأس لاسلكية',
    sku: 'EL-HP-WIRELESS',
    type: 'outgoing',
    typeLabel: 'صادر (مبيعات)',
    fromLocation: 'الفرع الرئيسي - التجمع',
    toLocation: 'العميل النهائي',
    qty: -8,
    operator: 'نور الدين ممدوح',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-05-010',
    date: '2026-05-24',
    time: '14:15',
    productName: 'تي شيرت كاجوال قطن',
    sku: 'CL-TSH-COTTON',
    type: 'incoming',
    typeLabel: 'وارد (شراء)',
    fromLocation: 'المصنع الرئيسي',
    toLocation: 'مستودع العبور',
    qty: 200,
    operator: 'عمر مصطفى',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-05-011',
    date: '2026-05-24',
    time: '09:30',
    productName: 'آيفون 15 برو - 256 جيجا',
    sku: 'APP-IP15P-256',
    type: 'transfer',
    typeLabel: 'تحويل مخزني',
    fromLocation: 'مستودع العبور',
    toLocation: 'فرع المعادي',
    qty: 4,
    operator: 'كريم عبد العزيز',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-05-012',
    date: '2026-05-23',
    time: '17:00',
    productName: 'شاحن سريع 20 وات',
    sku: 'APP-IPAD-AIR5',
    type: 'outgoing',
    typeLabel: 'صادر (تالف)',
    fromLocation: 'الفرع الرئيسي - التجمع',
    toLocation: 'WH/Scrap (مستودع التالف)',
    qty: -3,
    operator: 'نور الدين ممدوح',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-05-013',
    date: '2026-05-23',
    time: '13:50',
    productName: 'ساعة ذكية S3',
    sku: 'APP-WATCH-S3',
    type: 'incoming',
    typeLabel: 'وارد (شراء)',
    fromLocation: 'المورد الخارجي',
    toLocation: 'الفرع الرئيسي - التجمع',
    qty: 30,
    operator: 'أحمد رأفت',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-05-014',
    date: '2026-05-23',
    time: '10:10',
    productName: 'ماك بوك برو M3',
    sku: 'APP-MBP-M3',
    type: 'outgoing',
    typeLabel: 'صادر (مبيعات)',
    fromLocation: 'الفرع الرئيسي - التجمع',
    toLocation: 'العميل النهائي',
    qty: -1,
    operator: 'نور الدين ممدوح',
    status: 'completed',
    statusLabel: 'مكتمل'
  },
  {
    id: 'SM-2026-05-015',
    date: '2026-05-22',
    time: '16:00',
    productName: 'حذاء رياضي نايكي',
    sku: 'SP-NKE-RUN42',
    type: 'transfer',
    typeLabel: 'تحويل مخزني',
    fromLocation: 'مستودع العبور',
    toLocation: 'فرع المعادي',
    qty: 12,
    operator: 'كريم عبد العزيز',
    status: 'completed',
    statusLabel: 'مكتمل'
  }
])

// Filtered and searched movements computed list
const filteredMovements = computed(() => {
  return movements.value.filter(mv => {
    // 1. Search Query filter (matches name, SKU, locations or operator)
    const matchesSearch = !searchQuery.value ? true : (
      mv.productName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      mv.sku.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      mv.fromLocation.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      mv.toLocation.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      mv.operator.toLowerCase().includes(searchQuery.value.toLowerCase())
    )

    // 2. Type segment selection filter
    const matchesType = selectedType.value === 'all' ? true : mv.type === selectedType.value

    return matchesSearch && matchesType
  })
})

// Pagination logic
const totalPages = computed(() => Math.ceil(filteredMovements.value.length / itemsPerPage) || 1)

const paginatedMovements = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage
  return filteredMovements.value.slice(startIndex, startIndex + itemsPerPage)
})

// Go to specific page
const setPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Reset page on search or type change
const handleFilterChange = () => {
  currentPage.value = 1
}

// Export excel simulated print
const triggerExport = () => {
  alert('جاري إعداد وتصدير ملف التقرير Excel لحركات المخزون...')
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto" dir="rtl">
    
    <!-- Top Breadcrumbs Header Navigation -->
    <div class="flex items-center gap-2 text-label-md text-on-surface-variant mb-2">
      <NuxtLink to="/warehouse" class="hover:text-primary transition-colors flex items-center gap-1 font-bold">
        <span class="material-symbols-outlined text-[18px]">warehouse</span>
        المخازن والمواقع
      </NuxtLink>
      <span class="material-symbols-outlined text-[14px]">chevron_left</span>
      <span class="text-on-surface">حركات المخزون الأخيرة</span>
    </div>

    <!-- Main Header Action Bar -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-headline-lg font-bold text-on-surface flex items-center gap-3">
          <span class="material-symbols-outlined text-primary bg-primary/10 p-2.5 rounded-2xl">history</span>
          سجل حركات المخزون الكامل
        </h1>
        <p class="text-label-md text-on-surface-variant mt-1">
          دفتر الأستاذ وحركات جرد المستودعات الواردة، الصادرة والتحويلات الداخلية بالتفصيل
        </p>
      </div>

      <!-- Export & Print Quick actions -->
      <div class="flex gap-2">
        <button
          @click="triggerExport"
          class="h-11 px-4 border border-outline-variant bg-surface-container-lowest hover:bg-surface-container rounded-lg text-label-md font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer text-on-surface"
        >
          <span class="material-symbols-outlined text-primary text-[20px]">download</span>
          تصدير التقرير
        </button>
        <button
          @click="router.push('/warehouse')"
          class="h-11 px-4 bg-primary text-white rounded-lg text-label-md font-bold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
          الرجوع للمخزن
        </button>
      </div>
    </div>

    <!-- Filter and Search Area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
      
      <!-- Search Input -->
      <div class="relative lg:col-span-1">
        <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          v-model="searchQuery"
          @input="handleFilterChange"
          class="w-full h-11 pr-10 pl-4 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-label-md outline-none text-right"
          placeholder="بحث بالمنتج، الكود، الموقع أو المستودع..."
          type="text"
        />
      </div>

      <!-- Movement Type Segment Filter Buttons -->
      <div class="lg:col-span-2 flex flex-wrap gap-2 justify-start md:justify-end">
        <button
          @click="selectedType = 'all'; handleFilterChange()"
          class="h-10 px-4 rounded-full text-label-md font-bold transition-all duration-200 cursor-pointer"
          :class="selectedType === 'all' 
            ? 'bg-primary text-white shadow-sm' 
            : 'bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant'"
        >
          الكل
        </button>
        <button
          @click="selectedType = 'incoming'; handleFilterChange()"
          class="h-10 px-4 rounded-full text-label-md font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
          :class="selectedType === 'incoming' 
            ? 'bg-emerald-600 text-white shadow-sm' 
            : 'bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant'"
        >
          <span class="material-symbols-outlined text-[18px]">south_west</span>
          الواردات (+)
        </button>
        <button
          @click="selectedType = 'outgoing'; handleFilterChange()"
          class="h-10 px-4 rounded-full text-label-md font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
          :class="selectedType === 'outgoing' 
            ? 'bg-error text-white shadow-sm' 
            : 'bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant'"
        >
          <span class="material-symbols-outlined text-[18px]">north_east</span>
          الصادرات (-)
        </button>
        <button
          @click="selectedType = 'transfer'; handleFilterChange()"
          class="h-10 px-4 rounded-full text-label-md font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
          :class="selectedType === 'transfer' 
            ? 'bg-primary-container text-primary shadow-sm border border-primary/20' 
            : 'bg-surface hover:bg-surface-container-high text-on-surface-variant border border-outline-variant'"
        >
          <span class="material-symbols-outlined text-[18px]">sync_alt</span>
          التحويلات (⇄)
        </button>
      </div>

    </div>

    <!-- Ledger Movements Table Grid -->
    <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden flex flex-col shadow-sm">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-right border-collapse">
          <thead>
            <tr class="bg-surface-container text-on-surface-variant border-b border-outline-variant">
              <th class="px-6 py-4 font-bold text-label-md">معرف الحركة</th>
              <th class="px-6 py-4 font-bold text-label-md">التاريخ والوقت</th>
              <th class="px-6 py-4 font-bold text-label-md">المنتج</th>
              <th class="px-6 py-4 font-bold text-label-md">نوع الحركة</th>
              <th class="px-6 py-4 font-bold text-label-md">من موقع</th>
              <th class="px-6 py-4 font-bold text-label-md">إلى موقع</th>
              <th class="px-6 py-4 font-bold text-label-md">الكمية</th>
              <th class="px-6 py-4 font-bold text-label-md">المسؤول</th>
              <th class="px-6 py-4 font-bold text-label-md">الحالة</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr
              v-for="mv in paginatedMovements"
              :key="mv.id"
              class="hover:bg-surface-container-low transition-colors group"
            >
              <!-- ID -->
              <td class="px-6 py-4 font-mono text-label-md font-semibold text-primary">
                {{ mv.id }}
              </td>

              <!-- Date & Time -->
              <td class="px-6 py-4">
                <p class="font-bold text-on-surface text-body-md">{{ mv.date }}</p>
                <p class="text-[12px] text-on-surface-variant font-mono">{{ mv.time }}</p>
              </td>

              <!-- Product -->
              <td class="px-6 py-4">
                <p class="font-bold text-on-surface text-body-md">{{ mv.productName }}</p>
                <p class="text-[12px] text-on-surface-variant font-mono">SKU: {{ mv.sku }}</p>
              </td>

              <!-- Type Badge -->
              <td class="px-6 py-4">
                <span 
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-md font-bold"
                  :class="[
                    mv.type === 'incoming' ? 'bg-emerald-500/10 text-emerald-600' : '',
                    mv.type === 'outgoing' ? 'bg-error/10 text-error' : '',
                    mv.type === 'transfer' ? 'bg-primary/10 text-primary' : '',
                  ]"
                >
                  <span class="material-symbols-outlined text-[16px]">
                    {{ mv.type === 'incoming' ? 'south_west' : mv.type === 'outgoing' ? 'north_east' : 'sync_alt' }}
                  </span>
                  {{ mv.typeLabel }}
                </span>
              </td>

              <!-- From Location -->
              <td class="px-6 py-4 text-on-surface-variant text-label-md font-mono">
                {{ mv.fromLocation }}
              </td>

              <!-- To Location -->
              <td class="px-6 py-4 text-on-surface-variant text-label-md font-mono">
                {{ mv.toLocation }}
              </td>

              <!-- Quantity -->
              <td class="px-6 py-4 font-bold text-body-lg">
                <span 
                  :class="[
                    mv.qty > 0 ? 'text-emerald-600' : 'text-error'
                  ]"
                >
                  {{ mv.qty > 0 ? '+' : '' }}{{ mv.qty }}
                </span>
              </td>

              <!-- Operator -->
              <td class="px-6 py-4 text-on-surface text-label-md">
                {{ mv.operator }}
              </td>

              <!-- Status -->
              <td class="px-6 py-4">
                <span class="bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded text-xs">
                  {{ mv.statusLabel }}
                </span>
              </td>

            </tr>
            <tr v-if="paginatedMovements.length === 0">
              <td colspan="9" class="p-12 text-center text-on-surface-variant">
                <span class="material-symbols-outlined text-4xl block mb-2 text-outline">history_toggle_off</span>
                لا توجد حركات مخزون تطابق البحث المختار.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer Controls -->
      <div class="px-8 py-4 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
        <p class="text-label-md text-on-surface-variant">
          عرض حركات {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredMovements.length) }} من أصل {{ filteredMovements.length }} حركة مسجلة
        </p>
        
        <div class="flex gap-2">
          <!-- Next Page -->
          <button 
            @click="setPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white text-on-surface-variant disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>

          <!-- Pages loops -->
          <button
            v-for="p in totalPages"
            :key="p"
            @click="setPage(p)"
            class="w-10 h-10 rounded-lg border font-bold cursor-pointer"
            :class="currentPage === p 
              ? 'bg-primary text-white border-primary shadow-sm' 
              : 'border-outline-variant hover:bg-white text-on-surface'"
          >
            {{ p }}
          </button>

          <!-- Previous Page -->
          <button 
            @click="setPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white text-on-surface-variant disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
        </div>
      </div>

    </div>

  </div>
</template>
