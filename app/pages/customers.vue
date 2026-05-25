<script setup lang="ts">
import { ref, computed } from 'vue'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  type: 'فرد' | 'B2B'
  tier: 'بلاتيني' | 'ذهبي' | 'فضي'
  points: number
  address: string
  taxId: string
  birthDate: string
  lastTxTime: string
  lastTxAmount: number
}

const searchQuery = ref('')
const filterType = ref('الكل')
const filterTier = ref('الكل')

const customersList = ref<Customer[]>([
  {
    id: 1,
    name: 'أحمد خالد',
    email: 'ahmed.k@example.com',
    phone: '01012345678',
    type: 'فرد',
    tier: 'ذهبي',
    points: 4250,
    address: '12 شارع التسعين، التجمع الخامس، القاهرة',
    taxId: '234-567-891',
    birthDate: '12 مايو 1988',
    lastTxTime: 'منذ ساعتين',
    lastTxAmount: 450.00
  },
  {
    id: 2,
    name: 'شركة الفنار المحدودة',
    email: 'info@alfanar.com',
    phone: '01298765432',
    type: 'B2B',
    tier: 'بلاتيني',
    points: 15200,
    address: 'المبنى الإداري 5، القرية الذكية، الجيزة',
    taxId: '987-654-321',
    birthDate: 'تأسست 2010',
    lastTxTime: 'أمس، 10:30 ص',
    lastTxAmount: 12400.00
  },
  {
    id: 3,
    name: 'سارة محمود',
    email: 'sara.m@gmail.com',
    phone: '01122334455',
    type: 'فرد',
    tier: 'فضي',
    points: 1850,
    address: '5 شارع مصطفى النحاس، مدينة نصر، القاهرة',
    taxId: 'N/A',
    birthDate: '24 سبتمبر 1995',
    lastTxTime: '15 أكتوبر',
    lastTxAmount: 1200.00
  }
])

const filteredCustomers = computed(() => {
  return customersList.value.filter(c => {
    const matchesSearch = !searchQuery.value ||
      c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.phone.includes(searchQuery.value)
    
    const matchesType = filterType.value === 'الكل' || c.type === filterType.value
    const matchesTier = filterTier.value === 'الكل' || c.tier === filterTier.value

    return matchesSearch && matchesType && matchesTier
  })
})

// Drawer State
const selectedCustomer = ref<Customer | null>(null)
const drawerOpen = ref(false)
const drawerMode = ref<'view' | 'add'>('view')

// Form inputs for new customer
const newName = ref('')
const newEmail = ref('')
const newPhone = ref('')
const newType = ref<'فرد' | 'B2B'>('فرد')
const newTier = ref<'بلاتيني' | 'ذهبي' | 'فضي'>('فضي')
const newAddress = ref('')
const newTaxId = ref('')

const openAddCustomer = () => {
  drawerMode.value = 'add'
  selectedCustomer.value = null
  newName.value = ''
  newEmail.value = ''
  newPhone.value = ''
  newType.value = 'فرد'
  newTier.value = 'فضي'
  newAddress.value = ''
  newTaxId.value = ''
  drawerOpen.value = true
}

const openCustomerDetails = (cust: Customer) => {
  drawerMode.value = 'view'
  selectedCustomer.value = cust
  drawerOpen.value = true
}

const closeDrawer = () => {
  drawerOpen.value = false
}

const saveCustomer = () => {
  if (!newName.value || !newPhone.value) {
    alert('يرجى ملء الاسم ورقم الهاتف')
    return
  }

  const newCust: Customer = {
    id: Date.now(),
    name: newName.value,
    email: newEmail.value || 'N/A',
    phone: newPhone.value,
    type: newType.value,
    tier: newTier.value,
    points: 100, // starting welcome points
    address: newAddress.value || 'N/A',
    taxId: newTaxId.value || 'N/A',
    birthDate: 'N/A',
    lastTxTime: 'الآن',
    lastTxAmount: 0
  }

  customersList.value.unshift(newCust)
  drawerOpen.value = false
}
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <!-- Top toolbar & Add button -->
    <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm">
      <h3 class="text-headline-md font-bold text-primary">إدارة العملاء والشركاء</h3>
      <button
        @click="openAddCustomer"
        class="bg-primary hover:bg-primary/95 text-on-primary px-6 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer font-bold"
      >
        <span class="material-symbols-outlined">person_add</span>
        إضافة عميل جديد
      </button>
    </div>

    <!-- Bento metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <span class="p-3 rounded-xl bg-primary/10 text-primary">
            <span class="material-symbols-outlined">group</span>
          </span>
          <span class="text-label-md text-primary font-bold">+12%</span>
        </div>
        <p class="text-on-surface-variant text-label-md">إجمالي العملاء</p>
        <p class="text-headline-md font-bold mt-1">{{ customersList.length }}</p>
      </div>

      <div class="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <span class="p-3 rounded-xl bg-secondary-container text-on-secondary-container">
            <span class="material-symbols-outlined">verified</span>
          </span>
        </div>
        <p class="text-on-surface-variant text-label-md">نشطون مؤخراً</p>
        <p class="text-headline-md font-bold mt-1">
          {{ customersList.filter(c => c.points > 1000).length }}
        </p>
      </div>

      <div class="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <span class="p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed">
            <span class="material-symbols-outlined">corporate_fare</span>
          </span>
        </div>
        <p class="text-on-surface-variant text-label-md">شركات (B2B)</p>
        <p class="text-headline-md font-bold mt-1">
          {{ customersList.filter(c => c.type === 'B2B').length }}
        </p>
      </div>

      <div class="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <span class="p-3 rounded-xl bg-primary-container/20 text-primary">
            <span class="material-symbols-outlined">stars</span>
          </span>
        </div>
        <p class="text-on-surface-variant text-label-md font-label-md">برنامج الولاء</p>
        <p class="text-headline-md font-bold mt-1">
          {{ customersList.filter(c => c.tier !== 'فضي').length }} عملاء
        </p>
      </div>
    </div>

    <!-- Main customers list table -->
    <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
      <!-- Filters and Search -->
      <div class="p-6 border-b border-outline-variant flex flex-col lg:flex-row gap-4 items-center">
        <div class="relative w-full lg:w-96">
          <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            v-model="searchQuery"
            class="w-full pr-12 pl-4 py-2.5 bg-surface-container rounded-xl border-none focus:ring-2 focus:ring-primary text-body-md"
            placeholder="البحث عن عميل بالاسم أو الهاتف..."
            type="text"
          />
        </div>

        <div class="flex flex-wrap gap-3 w-full lg:w-auto">
          <div class="flex items-center gap-2 bg-surface-container rounded-xl px-4 py-1.5 border border-outline-variant/30">
            <span class="text-label-md text-on-surface-variant">النوع:</span>
            <select v-model="filterType" class="bg-transparent border-none focus:ring-0 text-label-md font-bold text-on-surface p-0 cursor-pointer">
              <option value="الكل">الكل</option>
              <option value="فرد">فرد</option>
              <option value="B2B">شركة (B2B)</option>
            </select>
          </div>

          <div class="flex items-center gap-2 bg-surface-container rounded-xl px-4 py-1.5 border border-outline-variant/30">
            <span class="text-label-md text-on-surface-variant">فئة الولاء:</span>
            <select v-model="filterTier" class="bg-transparent border-none focus:ring-0 text-label-md font-bold text-on-surface p-0 cursor-pointer">
              <option value="الكل">الكل</option>
              <option value="بلاتيني">بلاتيني</option>
              <option value="ذهبي">ذهبي</option>
              <option value="فضي">فضي</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-right border-collapse">
          <thead>
            <tr class="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
              <th class="px-6 py-4 font-bold text-label-md">العميل</th>
              <th class="px-6 py-4 font-bold text-label-md">رقم الهاتف</th>
              <th class="px-6 py-4 font-bold text-label-md">النوع</th>
              <th class="px-6 py-4 font-bold text-label-md">الفئة</th>
              <th class="px-6 py-4 font-bold text-label-md">آخر معاملة</th>
              <th class="px-6 py-4 font-bold text-label-md text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr
              v-for="c in filteredCustomers"
              :key="c.id"
              @click="openCustomerDetails(c)"
              class="hover:bg-primary/5 transition-colors group cursor-pointer"
            >
              <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    :class="c.type === 'B2B' ? 'bg-tertiary-container/30 text-tertiary' : 'bg-primary/10 text-primary'"
                  >
                    {{ c.name.slice(0, 2) }}
                  </div>
                  <div>
                    <p class="text-body-md font-bold text-on-surface">{{ c.name }}</p>
                    <p class="text-[12px] text-on-surface-variant">{{ c.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5 font-mono text-body-md text-on-surface">{{ c.phone }}</td>
              <td class="px-6 py-5">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="c.type === 'B2B' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-secondary-container text-on-secondary-container'"
                >
                  {{ c.type }}
                </span>
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-1">
                  <span
                    class="material-symbols-outlined text-[18px]"
                    :style="c.tier === 'بلاتيني' ? 'color:#94a3b8;' : c.tier === 'ذهبي' ? 'color:#f59e0b;' : 'color:#94a3b8;'"
                    style="font-variation-settings: 'FILL' 1;"
                  >
                    stars
                  </span>
                  <span class="text-label-md">{{ c.tier }}</span>
                </div>
              </td>
              <td class="px-6 py-5 text-label-md">
                <p class="font-bold text-on-surface">{{ c.lastTxAmount }} ج.م</p>
                <p class="text-[10px] text-on-surface-variant">{{ c.lastTxTime }}</p>
              </td>
              <td class="px-6 py-5 text-center" @click.stop>
                <div class="flex justify-center gap-2">
                  <button @click="navigateTo('/customer-details')" class="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant" title="سجل المشتريات والتفاصيل">
                    <span class="material-symbols-outlined text-[20px]">history</span>
                  </button>
                  <button @click="openCustomerDetails(c)" class="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant" title="تعديل">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="6" class="p-12 text-center text-on-surface-variant">
                لا يوجد عملاء يطابقون خيارات البحث والتصفية.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
        <p class="text-label-md text-on-surface-variant">عرض 1-{{ filteredCustomers.length }} من أصل {{ customersList.length }} عميل</p>
        <div class="flex gap-2">
          <button class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white text-on-surface-variant">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
          <button class="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold">1</button>
          <button class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white text-on-surface">2</button>
          <button class="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white text-on-surface-variant">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Side-out Customer Detail/Creation Drawer -->
    <div
      v-if="drawerOpen"
      class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity flex justify-end"
      @click="closeDrawer"
    >
      <div
        class="h-full w-full max-w-xl bg-surface shadow-2xl flex flex-col relative transition-transform duration-300"
        @click.stop
      >
        <div class="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container">
          <h4 class="text-headline-sm font-bold text-on-surface">
            {{ drawerMode === 'view' ? 'تفاصيل العميل' : 'إضافة عميل جديد' }}
          </h4>
          <button @click="closeDrawer" class="p-2 rounded-full hover:bg-surface-container-highest transition-colors cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <!-- View Customer Details Mode -->
          <div v-if="drawerMode === 'view' && selectedCustomer" class="space-y-6">
            <div class="flex flex-col items-center">
              <div class="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-headline-md font-bold mb-3 shadow-inner">
                {{ selectedCustomer.name.slice(0, 2) }}
              </div>
              <h5 class="text-headline-md font-bold">{{ selectedCustomer.name }}</h5>
              <p class="text-body-md text-on-surface-variant">عميل {{ selectedCustomer.tier }} • منذ 2022</p>
            </div>

            <!-- Info blocks -->
            <div class="space-y-4">
              <h6 class="text-label-md font-bold text-primary border-r-4 border-primary pr-3">المعلومات الشخصية</h6>
              <div class="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-xl">
                <div>
                  <p class="text-[10px] text-on-surface-variant uppercase font-bold mb-0.5">الهاتف</p>
                  <p class="text-body-md font-bold">{{ selectedCustomer.phone }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-on-surface-variant uppercase font-bold mb-0.5">البريد الإلكتروني</p>
                  <p class="text-body-md">{{ selectedCustomer.email }}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-[10px] text-on-surface-variant uppercase font-bold mb-0.5">العنوان</p>
                  <p class="text-body-md">{{ selectedCustomer.address }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-on-surface-variant uppercase font-bold mb-0.5">الرقم الضريبي</p>
                  <p class="text-body-md font-mono">{{ selectedCustomer.taxId }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-on-surface-variant uppercase font-bold mb-0.5">فئة الحساب</p>
                  <p class="text-body-md font-bold text-primary">{{ selectedCustomer.type }}</p>
                </div>
              </div>
            </div>

            <!-- Loyalty Program -->
            <div class="space-y-4">
              <h6 class="text-label-md font-bold text-primary border-r-4 border-primary pr-3">برنامج الولاء النقاط</h6>
              <div class="bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center">
                <div>
                  <p class="text-headline-md font-bold text-primary">{{ selectedCustomer.points.toLocaleString('ae-EG') }} نقطة</p>
                  <p class="text-xs text-on-surface-variant">الرصيد القابل للاستبدال</p>
                </div>
                <span class="material-symbols-outlined text-[42px] text-primary" style="font-variation-settings: 'FILL' 1;">stars</span>
              </div>
            </div>
          </div>

          <!-- Add Customer Mode -->
          <div v-else class="space-y-4">
            <h6 class="text-label-md font-bold text-primary border-r-4 border-primary pr-3">البيانات الأساسية</h6>
            <div class="space-y-4">
              <div class="relative">
                <input
                  v-model="newName"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="text"
                />
                <label class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none">
                  الاسم الكامل للعميل
                </label>
              </div>

              <div class="relative">
                <input
                  v-model="newPhone"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="text"
                />
                <label class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none">
                  رقم الهاتف الجوال
                </label>
              </div>

              <div class="relative">
                <input
                  v-model="newEmail"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="email"
                />
                <label class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none">
                  البريد الإلكتروني
                </label>
              </div>

              <div class="relative">
                <input
                  v-model="newAddress"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="text"
                />
                <label class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none">
                  العنوان بالتفصيل
                </label>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-on-surface-variant mb-1">نوع الحساب</label>
                  <select v-model="newType" class="w-full h-11 px-3 bg-surface-container border border-outline-variant rounded-lg text-body-md outline-none cursor-pointer">
                    <option value="فرد">فرد</option>
                    <option value="B2B">شركة (B2B)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-on-surface-variant mb-1">فئة الولاء</label>
                  <select v-model="newTier" class="w-full h-11 px-3 bg-surface-container border border-outline-variant rounded-lg text-body-md outline-none cursor-pointer">
                    <option value="بلاتيني">بلاتيني</option>
                    <option value="ذهبي">ذهبي</option>
                    <option value="فضي">فضي</option>
                  </select>
                </div>
              </div>

              <div v-if="newType === 'B2B'" class="relative">
                <input
                  v-model="newTaxId"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md font-mono outline-none transition-all"
                  placeholder=" "
                  type="text"
                />
                <label class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none">
                  الرقم الضريبي للمنشأة
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 bg-surface-container-high flex gap-4 shrink-0">
          <button
            @click="closeDrawer"
            class="flex-1 py-3 rounded-xl border border-outline font-bold text-on-surface hover:bg-surface transition-all cursor-pointer active:scale-95 text-center"
          >
            إغلاق
          </button>
          <button
            v-if="drawerMode === 'add'"
            @click="saveCustomer"
            class="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold shadow-lg hover:bg-primary/95 transition-all cursor-pointer active:scale-95 text-center"
          >
            حفظ العميل
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
