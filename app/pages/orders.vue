<script setup lang="ts">
import { ref, computed } from 'vue'

interface Order {
  id: string
  time: string
  customer: string
  customerInitials: string
  total: number
  syncStatus: 'تمت' | 'جاري المزامنة' | 'ملغاة'
}

const searchQuery = ref('')
const showToast = ref(false)
const shiftOpen = ref(true)

const ordersList = ref<Order[]>([
  {
    id: 'ORD-2023-8942',
    time: '14:32:10',
    customer: 'ياسين محمود',
    customerInitials: 'YM',
    total: 450.00,
    syncStatus: 'تمت'
  },
  {
    id: 'ORD-2023-8941',
    time: '14:28:45',
    customer: 'عميل مجهول',
    customerInitials: 'نقدي',
    total: 89.25,
    syncStatus: 'تمت'
  },
  {
    id: 'ORD-2023-8940',
    time: '14:25:01',
    customer: 'أميرة مصطفى',
    customerInitials: 'AM',
    total: 1240.00,
    syncStatus: 'جاري المزامنة'
  },
  {
    id: 'ORD-2023-8939',
    time: '14:15:22',
    customer: 'عميل مجهول',
    customerInitials: 'نقدي',
    total: 30.00,
    syncStatus: 'تمت'
  }
])

const filteredOrders = computed(() => {
  if (!searchQuery.value) return ordersList.value
  const query = searchQuery.value.toLowerCase()
  return ordersList.value.filter(o =>
    o.id.toLowerCase().includes(query) ||
    o.customer.toLowerCase().includes(query)
  )
})

const totalSales = computed(() => {
  return ordersList.value
    .filter(o => o.syncStatus !== 'ملغاة')
    .reduce((sum, o) => sum + o.total, 0)
})

const completedCount = computed(() => {
  return ordersList.value.filter(o => o.syncStatus !== 'ملغاة').length
})

const voidOrder = (id: string) => {
  if (confirm(`هل أنت متأكد من رغبتك في إلغاء الطلب رقم #${id}؟`)) {
    const order = ordersList.value.find(o => o.id === id)
    if (order) {
      order.syncStatus = 'ملغاة'
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }
  }
}

const toggleShift = () => {
  if (shiftOpen.value) {
    if (confirm('هل أنت متأكد من رغبتك في إغلاق الوردية الحالية وطباعة ملخص المبيعات؟')) {
      shiftOpen.value = false
    }
  } else {
    shiftOpen.value = true
  }
}
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto relative">
    <!-- Top KPI Dashboard -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Total Sales -->
      <div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex items-center justify-between shadow-sm">
        <div class="space-y-1">
          <p class="text-label-md text-on-surface-variant">إجمالي مبيعات اليوم</p>
          <h2 class="text-display-sm font-bold text-primary">{{ totalSales.toLocaleString('ae-EG') }} ج.م</h2>
          <p class="text-xs text-primary font-bold">↑ ١٢٪ عن الأمس</p>
        </div>
        <div class="w-14 h-14 bg-primary-container/10 rounded-full flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-3xl">payments</span>
        </div>
      </div>

      <!-- Completed count -->
      <div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex items-center justify-between shadow-sm">
        <div class="space-y-1">
          <p class="text-label-md text-on-surface-variant">الطلبات المكتملة</p>
          <h2 class="text-display-sm font-bold text-on-surface">{{ completedCount }} طلب</h2>
          <p class="text-xs text-on-surface-variant">متوسط سلة المشتريات: {{ (totalSales / (completedCount || 1)).toFixed(2) }} ج.م</p>
        </div>
        <div class="w-14 h-14 bg-secondary-container/20 rounded-full flex items-center justify-center text-secondary">
          <span class="material-symbols-outlined text-3xl">receipt_long</span>
        </div>
      </div>

      <!-- Cloud status -->
      <div class="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex items-center justify-between shadow-sm">
        <div class="space-y-1">
          <p class="text-label-md text-on-surface-variant">حالة السحابة والمزامنة</p>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <h2 class="text-headline-sm font-bold text-on-surface">جميع البيانات متزامنة</h2>
          </div>
          <p class="text-xs text-on-surface-variant">تحديث تلقائي للمبيعات مفعل</p>
        </div>
        <div class="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-3xl">cloud_sync</span>
        </div>
      </div>
    </div>

    <!-- Orders Table Section -->
    <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
      <div class="p-6 border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 class="text-headline-sm font-bold text-on-surface">
          معاملات اليوم
          <span class="text-label-md text-on-surface-variant font-normal">(١٥ أكتوبر ٢٠٢٣)</span>
        </h3>
        <div class="flex gap-2">
          <div class="relative">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
            <input
              v-model="searchQuery"
              class="bg-surface-container text-on-surface border-none rounded-xl pr-10 pl-4 py-2 w-full md:w-64 focus:ring-2 focus:ring-primary outline-none"
              placeholder="البحث برقم الطلب أو العميل..."
              type="text"
            />
          </div>
          <button class="bg-surface-container-high text-on-surface-variant p-2.5 rounded-xl hover:bg-outline-variant transition-colors cursor-pointer">
            <span class="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-right border-collapse">
          <thead>
            <tr class="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
              <th class="px-6 py-4 font-bold text-label-md">رقم الطلب (Order ID)</th>
              <th class="px-6 py-4 font-bold text-label-md">الوقت (Time)</th>
              <th class="px-6 py-4 font-bold text-label-md">العميل (Customer)</th>
              <th class="px-6 py-4 font-bold text-label-md">الإجمالي (Total)</th>
              <th class="px-6 py-4 font-bold text-label-md">المزامنة (Sync)</th>
              <th class="px-6 py-4 font-bold text-label-md">إجراءات (Actions)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/40">
            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="hover:bg-surface-container-low transition-colors group"
            >
              <td class="px-6 py-5">
                <span class="font-bold text-on-surface">{{ order.id }}</span>
              </td>
              <td class="px-6 py-5 text-on-surface-variant">{{ order.time }}</td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-2">
                  <span class="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed text-xs font-bold">
                    {{ order.customerInitials }}
                  </span>
                  <span class="text-on-surface">{{ order.customer }}</span>
                </div>
              </td>
              <td class="px-6 py-5 font-bold text-primary">{{ order.total.toLocaleString('ae-EG') }} ج.م</td>
              <td class="px-6 py-5">
                <div
                  class="flex items-center gap-1.5 px-3 py-1 rounded-full w-fit text-[12px] font-bold"
                  :class="order.syncStatus === 'تمت' ? 'bg-primary/10 text-primary' : order.syncStatus === 'ملغاة' ? 'bg-error-container text-error' : 'bg-secondary-container text-secondary'"
                >
                  <span
                    class="material-symbols-outlined text-[14px]"
                    :class="{ 'animate-spin': order.syncStatus === 'جاري المزامنة' }"
                  >
                    {{ order.syncStatus === 'تمت' ? 'check_circle' : order.syncStatus === 'ملغاة' ? 'cancel' : 'sync' }}
                  </span>
                  <span>{{ order.syncStatus }}</span>
                </div>
              </td>
              <td class="px-6 py-5">
                <button
                  v-if="order.syncStatus !== 'ملغاة'"
                  @click="voidOrder(order.id)"
                  class="text-error border border-error/20 px-3 py-1.5 rounded-lg hover:bg-error/10 transition-colors flex items-center gap-2 text-label-md font-bold cursor-pointer"
                >
                  <span class="material-symbols-outlined text-sm">delete_sweep</span>
                  إلغاء الطلب
                </button>
                <span v-else class="text-on-surface-variant text-label-md">-</span>
              </td>
            </tr>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="6" class="p-12 text-center text-on-surface-variant">
                لم يتم العثور على أي طلبات مطابقة للبحث.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low">
        <p class="text-label-md text-on-surface-variant">
          عرض 1 - {{ filteredOrders.length }} من أصل {{ ordersList.length }} طلب
        </p>
        <div class="flex gap-2">
          <button class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface transition-all text-on-surface-variant cursor-pointer">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
          <button class="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold shadow-md">1</button>
          <button class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface transition-all text-on-surface cursor-pointer">2</button>
          <button class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface transition-all text-on-surface-variant cursor-pointer">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Asymmetric Detail Section (Bento Grid) -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3 bg-surface-container-highest/30 rounded-3xl p-8 border border-outline-variant backdrop-blur-sm shadow-sm flex flex-col justify-between">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h4 class="text-headline-md font-bold text-on-surface mb-2">تحليل المبيعات الفوري لحركة المشتريات</h4>
            <p class="text-body-md text-on-surface-variant">مراقبة الأداء لكل ساعة لفرع القاهرة بالتفصيل</p>
          </div>
          <button class="bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-sm">
            <span class="material-symbols-outlined">download</span>
            تصدير كشف اليوم
          </button>
        </div>

        <!-- Hourly Chart Visual -->
        <div class="h-64 flex items-end gap-4 px-4 pt-6">
          <div class="flex-1 bg-primary/20 rounded-t-xl h-[30%] relative group">
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">١,٢٠٠ ج.م</div>
          </div>
          <div class="flex-1 bg-primary/40 rounded-t-xl h-[50%] relative group">
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">٢,٥٠٠ ج.م</div>
          </div>
          <div class="flex-1 bg-primary/60 rounded-t-xl h-[85%] relative group">
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">٤,٨٠٠ ج.م</div>
          </div>
          <div class="flex-1 bg-primary-container rounded-t-xl h-[65%] relative group">
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">٣,٩٠٠ ج.م</div>
          </div>
          <div class="flex-1 bg-primary/30 rounded-t-xl h-[40%] relative group border-2 border-dashed border-primary">
            <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">توقعات</div>
          </div>
        </div>
        <div class="flex justify-between mt-4 px-4 text-label-md text-on-surface-variant font-bold">
          <span>٠٩:٠٠ ص</span>
          <span>١١:٠٠ ص</span>
          <span>٠١:٠٠ م</span>
          <span>٠٣:٠٠ م</span>
          <span>٠٥:٠٠ م</span>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div
          class="p-6 rounded-3xl shadow-xl flex flex-col justify-between aspect-square transition-all"
          :class="shiftOpen ? 'bg-primary text-on-primary shadow-primary/20' : 'bg-surface-variant text-on-surface-variant border border-outline-variant shadow-sm'"
        >
          <div>
            <span class="material-symbols-outlined text-4xl mb-4">storefront</span>
            <h5 class="text-headline-sm font-bold">
              {{ shiftOpen ? 'الوردية مفتوحة حالياً' : 'الوردية مغلقة' }}
            </h5>
            <p class="text-body-md opacity-80 mt-1">
              {{ shiftOpen ? 'بدأت منذ ٥ ساعات بمبيعات مستقرة' : 'يرجى فتح وردية جديدة لبدء البيع' }}
            </p>
          </div>
          <button
            @click="toggleShift"
            class="w-full py-3 rounded-2xl font-bold border transition-colors cursor-pointer active:scale-95 text-center"
            :class="shiftOpen ? 'bg-white/20 hover:bg-white/30 border-white/30 text-white' : 'bg-primary text-on-primary hover:bg-primary/95 border-none'"
          >
            {{ shiftOpen ? 'إغلاق الوردية الحالية' : 'فتح وردية جديدة' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success Feedback Toast -->
    <div
      class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 transition-transform duration-500 z-[100]"
      :class="showToast ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'"
    >
      <div class="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center">
        <span class="material-symbols-outlined">done_all</span>
      </div>
      <div>
        <p class="font-bold">تم إلغاء الطلب بنجاح</p>
        <p class="text-xs opacity-75 font-normal">سيتم تحديث رصيد المخزن ومزامنة التغييرات تلقائياً</p>
      </div>
    </div>
  </div>
</template>
