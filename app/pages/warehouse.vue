<script setup lang="ts">
import { ref } from 'vue'

const kpis = [
  {
    title: 'إجمالي قيمة المخزون',
    value: '1,450,200',
    unit: 'ج.م',
    change: '+12.5%',
    changeType: 'positive',
    icon: 'account_balance_wallet',
    color: 'bg-primary-container/20 text-primary'
  },
  {
    title: 'منتجات نفدت كميتها',
    value: '12',
    unit: 'منتج',
    change: 'عاجل',
    changeType: 'negative',
    icon: 'warning',
    color: 'bg-error-container/40 text-error'
  },
  {
    title: 'إجمالي القطع المتوفرة',
    value: '8,642',
    unit: 'قطعة',
    change: '',
    changeType: 'neutral',
    icon: 'inventory',
    color: 'bg-secondary-container/40 text-secondary'
  },
  {
    title: 'شحنات قيد الوصول',
    value: '5',
    unit: 'طلبيات',
    change: '',
    changeType: 'neutral',
    icon: 'local_shipping',
    color: 'bg-tertiary-container/40 text-tertiary'
  }
]

const locations = ref([
  {
    name: 'الفرع الرئيسي - التجمع',
    address: 'شارع التسعين الشمالي، القاهرة',
    status: 'نشط',
    statusColor: 'bg-primary-container/20 text-primary',
    qty: '5,420',
    capacity: '85%',
    capacityWidth: 'w-[85%]',
    progressBarColor: 'bg-primary'
  },
  {
    name: 'مستودع العبور',
    address: 'المنطقة الصناعية ب، مدينة العبور',
    status: 'نشط',
    statusColor: 'bg-primary-container/20 text-primary',
    qty: '3,122',
    capacity: '40%',
    capacityWidth: 'w-[40%]',
    progressBarColor: 'bg-primary'
  },
  {
    name: 'فرع المعادي',
    address: 'شارع 9، المعادي',
    status: 'كامل السعة',
    statusColor: 'bg-secondary-container/20 text-secondary',
    qty: '1,100',
    capacity: '98%',
    capacityWidth: 'w-[98%]',
    progressBarColor: 'bg-error'
  }
])

const movements = ref([
  {
    title: 'وارد - آيفون 15 برو',
    meta: 'مستودع العبور • منذ 15 دقيقة',
    qty: '+25',
    action: 'إضافة',
    icon: 'south_west',
    color: 'bg-primary-container/10 text-primary'
  },
  {
    title: 'صادر - شاحن سريع 20 وات',
    meta: 'الفرع الرئيسي • منذ ساعة',
    qty: '-14',
    action: 'مبيعات',
    icon: 'north_east',
    color: 'bg-error-container/10 text-error'
  },
  {
    title: 'تحويل - ماك بوك إير M2',
    meta: 'من العبور إلى التجمع • منذ ساعتين',
    qty: '5',
    action: 'نقل',
    icon: 'sync_alt',
    color: 'bg-secondary-container/10 text-secondary'
  },
  {
    title: 'وارد - سماعات إيربودز',
    meta: 'الفرع الرئيسي • منذ 3 ساعات',
    qty: '+100',
    action: 'إضافة',
    icon: 'south_west',
    color: 'bg-primary-container/10 text-primary'
  }
])

const stockLevels = ref([
  {
    name: 'آيفون 15 برو - 256 جيجا',
    sku: 'APP-IP15P-256',
    category: 'هواتف ذكية',
    location: 'الفرع الرئيسي',
    qty: '42 قطعة',
    status: 'متوفر',
    statusColor: 'bg-primary-container/10 text-primary',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCun9HnnXm6EdZHeHQzl8X36jLEDStMoD1SYaC4w-Q_QX0D6nwKbvRRkJ6g1Cel205ehlORU9uo1tzBmSXIM-HYL4eUiS4t1isLSm6Kv_TXxtOWta3i8ngIt0jOhiujZfPdf40o11Aw46ts_BzxhuRrZS1lbyW3bj63L_YAyyXpCD8UomEFnyfzOhV4YzNADslVKi5IHYgcwAE59f9R5bJjujocSuz6BJnjFnJ5LNurGaJ7tH26If2oe6pbZxAWNHYjTmnDRfTgvla'
  },
  {
    name: 'آيباد إير - الجيل الخامس',
    sku: 'APP-IPAD-AIR5',
    category: 'أجهزة لوحية',
    location: 'مستودع العبور',
    qty: '5 قطع',
    status: 'مخزون منخفض',
    statusColor: 'bg-error-container/10 text-error',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_X3p32inGOcCWxypbJI1nhZ83pIzKsyaOZHxkfW2S8a6p273hl2_0hs-PDcGliguOtrlS05eGVjEIwv0FXEkAj9WRkN3NfUQ21KWuhEZO4_KCBHkIJIL5D6jvzyHiQq1qaW8O7BaHbH087rgD2EL5zktedISXWpdTqUbBQhDtAn1jNBJamgGMugNmsNLc_5Pcsj4A8w0bIMmloOGUElpHr4MjyWm7WlUk92fGwCQUNOgqPbhN6iE7zmBz_pHfvlNeyYxJBNpbau_M'
  },
  {
    name: 'ماك بوك برو M3',
    sku: 'APP-MBP-M3',
    category: 'أجهزة كمبيوتر',
    location: 'الفرع الرئيسي',
    qty: '0 قطعة',
    status: 'نفدت الكمية',
    statusColor: 'bg-error-container/20 text-error',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoQw5LD1Q_T3IFbCmOvK3CzCNAieEO9yxTZn3B_YpKyRy0tcDT7v6B4_PGEk9CUb_WlIopM3LDpNd7Vc3NP0Jl1tF4om1x5WNqe8T20ZMd91HPEkTq2Fm9Jo-kHEqp_9iiGOw9JDrWJxAZsCr6zuZ4LWulklooTpdcVcwcU6SwVFUPcm-xffVMIJ6l7le1QVKGdbsegvm4l4-XKeHlGnLwO07mk6FipfJxK2QWp-8n4G1JaioJohpvCOQ-Fl9pWrWFpHm28aaaHDpe'
  }
])
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <!-- KPI Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="(kpi, idx) in kpis"
        :key="idx"
        class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 rounded-lg" :class="kpi.color">
            <span class="material-symbols-outlined">{{ kpi.icon }}</span>
          </div>
          <span
            v-if="kpi.change"
            class="text-label-md font-bold"
            :class="kpi.changeType === 'positive' ? 'text-primary' : 'text-error'"
          >
            {{ kpi.change }}
          </span>
        </div>
        <p class="text-on-surface-variant text-label-md font-label-md">{{ kpi.title }}</p>
        <h3 class="text-display-lg font-bold mt-1 text-on-surface">
          {{ kpi.value }}
          <span class="text-body-md font-normal text-on-surface-variant">{{ kpi.unit }}</span>
        </h3>
      </div>
    </div>

    <!-- Main Grid: Bento Style -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Warehouses List -->
      <div class="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div
          class="p-6 border-b border-outline-variant flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0"
        >
          <h2 class="text-headline-sm font-bold flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">warehouse</span>
            المواقع والمخازن
          </h2>
          <button
            class="px-4 py-2 bg-primary text-white rounded-lg text-label-md font-bold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
          >
            <span class="material-symbols-outlined text-[20px]">swap_horiz</span>
            نقل مخزني
          </button>
        </div>
        <div class="divide-y divide-outline-variant">
          <!-- Location Item -->
          <div
            v-for="(loc, idx) in locations"
            :key="idx"
            class="p-6 hover:bg-surface-container-low transition-colors group cursor-pointer"
          >
            <div class="flex justify-between items-start">
              <div class="flex gap-4">
                <div
                  class="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary-container/30 transition-colors"
                >
                  <span class="material-symbols-outlined">
                    {{ idx === 0 ? 'storefront' : idx === 1 ? 'apartment' : 'location_on' }}
                  </span>
                </div>
                <div>
                  <h4 class="font-bold text-body-lg text-on-surface">{{ loc.name }}</h4>
                  <p class="text-on-surface-variant text-label-md">{{ loc.address }}</p>
                </div>
              </div>
              <div class="text-left">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2" :class="loc.statusColor">
                  {{ loc.status }}
                </span>
                <p class="text-price-display font-bold text-primary">
                  {{ loc.qty }}
                  <span class="text-body-md font-normal text-on-surface-variant">قطعة</span>
                </p>
              </div>
            </div>
            <div class="mt-4 w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="[loc.progressBarColor, loc.capacityWidth]"></div>
            </div>
            <div class="flex justify-between mt-2 text-label-md text-on-surface-variant">
              <span>سعة التخزين المستهلكة</span>
              <span>{{ loc.capacity }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Stock Movements -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col h-full">
        <div class="p-6 border-b border-outline-variant bg-white/50 backdrop-blur-sm">
          <h2 class="text-headline-sm font-bold flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">history</span>
            حركات المخزون الأخيرة
          </h2>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- Movement Row -->
          <div
            v-for="(mv, idx) in movements"
            :key="idx"
            class="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" :class="mv.color">
              <span class="material-symbols-outlined">{{ mv.icon }}</span>
            </div>
            <div class="flex-1">
              <p class="text-label-md font-bold text-on-surface">{{ mv.title }}</p>
              <p class="text-xs text-on-surface-variant">{{ mv.meta }}</p>
            </div>
            <div class="text-left">
              <p class="font-bold" :class="mv.qty.startsWith('+') ? 'text-primary' : 'text-error'">
                {{ mv.qty }}
              </p>
              <p class="text-[10px] text-on-surface-variant">{{ mv.action }}</p>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-outline-variant bg-surface-container-low">
          <button class="w-full text-center text-label-md text-primary font-bold hover:underline">
            عرض جميع التحركات
          </button>
        </div>
      </div>
    </div>

    <!-- Detailed Stock Level Preview -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
      <div class="p-6 border-b border-outline-variant">
        <h2 class="text-headline-sm font-bold">مستويات المخزون للمنتجات الأكثر مبيعاً</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-right border-collapse">
          <thead>
            <tr class="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
              <th class="p-4 text-label-md font-bold">المنتج</th>
              <th class="p-4 text-label-md font-bold">الفئة</th>
              <th class="p-4 text-label-md font-bold">الموقع</th>
              <th class="p-4 text-label-md font-bold">الكمية الحالية</th>
              <th class="p-4 text-label-md font-bold">حالة التوفر</th>
              <th class="p-4 text-label-md font-bold">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr v-for="(item, idx) in stockLevels" :key="idx" class="hover:bg-surface-container-low transition-colors">
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <img :alt="item.name" class="w-10 h-10 rounded-md object-cover bg-surface-variant" :src="item.image" />
                  <div>
                    <p class="font-bold text-on-surface">{{ item.name }}</p>
                    <p class="text-xs text-on-surface-variant">SKU: {{ item.sku }}</p>
                  </div>
                </div>
              </td>
              <td class="p-4 text-body-md text-on-surface">{{ item.category }}</td>
              <td class="p-4 text-body-md text-on-surface-variant">{{ item.location }}</td>
              <td class="p-4 font-bold text-on-surface">{{ item.qty }}</td>
              <td class="p-4">
                <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium" :class="item.statusColor">
                  {{ item.status }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex gap-1">
                  <button class="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button class="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
                    <span class="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant">
        <p class="text-label-md text-on-surface-variant">عرض 1-10 من أصل 245 منتج</p>
        <div class="flex gap-2">
          <button
            class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white transition-all text-on-surface-variant"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
          <button
            class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant bg-primary text-white font-bold transition-all"
          >
            1
          </button>
          <button
            class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white transition-all text-on-surface"
          >
            2
          </button>
          <button
            class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white transition-all text-on-surface-variant"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
