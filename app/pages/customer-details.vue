<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref<'overview' | 'orders' | 'loyalty' | 'settings'>('overview')

// Customer details
const customer = ref({
  name: 'محمد إبراهيم السيد',
  tier: 'ذهبي',
  email: 'm.ibrahim@email.com',
  phone: '+20 123 456 7890',
  address: 'التجمع الخامس، القاهرة، مصر',
  joinedDate: 'فبراير 2023',
  points: 2450,
  stats: {
    totalOrders: 42,
    totalSpent: '12,840',
    avgBasket: '305',
    lastVisit: 'منذ يومين'
  }
})

// Orders list
const orders = ref([
  { id: 'ORD-89241', date: '14 مايو 2024', status: 'مكتمل', amount: '450.00' },
  { id: 'ORD-88902', date: '10 مايو 2024', status: 'مكتمل', amount: '120.50' },
  { id: 'ORD-87123', date: '02 مايو 2024', status: 'مرتجع', amount: '85.00' }
])

// Loyalty history
const loyaltyEarned = ref([
  { desc: 'شراء مستلزمات بقالة', date: '14 مايو 2024', points: 45 },
  { desc: 'مكافأة عيد الميلاد', date: '05 مايو 2024', points: 100 }
])

const loyaltyRedeemed = ref([
  { desc: 'خصم نقدي (50 ج.م)', date: '12 أبريل 2024', points: 500 },
  { desc: 'قسيمة قهوة مجانية', date: '01 مارس 2024', points: 120 }
])

// Form for editing details
const editFirstName = ref('محمد')
const editLastName = ref('إبراهيم')
const editPhone = ref('+201234567890')
const editTier = ref('ذهبي')

const saveSettings = () => {
  customer.value.name = `${editFirstName.value} ${editLastName.value}`
  customer.value.phone = editPhone.value
  customer.value.tier = editTier.value
  alert('تم تحديث بيانات العميل بنجاح')
}

const redeemPoints = () => {
  if (customer.value.points >= 100) {
    customer.value.points -= 100
    alert('تم استبدال 100 نقطة بقسيمة شراء بنجاح!')
  } else {
    alert('رصيد النقاط غير كافٍ')
  }
}
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <!-- Profile Header Card (Asymmetric Layout) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div class="relative shrink-0">
          <div class="w-28 h-28 rounded-2xl bg-primary/10 overflow-hidden border-2 border-primary/20 flex items-center justify-center">
            <img
              alt="Customer Avatar"
              class="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpzYhp3Q2Uv8ie2H212c3WLu1Xot6JbdC8CUDSGZbRX8q-qhR7mXloRcN4dUM66Si1cse2enW2ZxB9z7K9QIQwsJPyGodYbqoOuqe2TdJ22s-80vhnwOgEVbGAhDN-25PjiL2ZrbGr7iTKEinKwefd4VRKoQ3ccecUoGehAyQXrtLJjG7Y4IqtXHvZXpZsx0TOF1nGOuzUw_QRI3vC0jv9Lgq44d8eiJ2GTzCKwEG8XV6ATbXttSp1J6E2vTtPiD6sJXi9oiYrqW0G"
            />
          </div>
          <span class="absolute -bottom-2 -right-2 bg-primary text-on-primary text-xs px-3 py-0.5 rounded-full font-bold shadow-md">
            {{ customer.tier }}
          </span>
        </div>
        <div class="flex-1 text-center md:text-right">
          <h1 class="text-display-lg font-bold text-on-surface mb-1">{{ customer.name }}</h1>
          <p class="text-body-md text-on-surface-variant mb-4">عميل منذ {{ customer.joinedDate }} • {{ customer.address }}</p>
          <div class="flex flex-wrap gap-2 justify-center md:justify-start">
            <span class="px-3.5 py-1.5 bg-surface-container rounded-lg text-label-md text-on-surface-variant flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">mail</span>
              {{ customer.email }}
            </span>
            <span class="px-3.5 py-1.5 bg-surface-container rounded-lg text-label-md text-on-surface-variant flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">call</span>
              {{ customer.phone }}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-primary text-on-primary rounded-xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden">
        <div class="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16"></div>
        <div>
          <p class="text-label-md opacity-80 mb-1">رصيد نقاط الولاء الحالي</p>
          <h2 class="text-display-lg font-bold">
            {{ customer.points.toLocaleString('ae-EG') }}
            <span class="text-body-md opacity-70">نقطة</span>
          </h2>
        </div>
        <div class="mt-4 pt-4 border-t border-white/20">
          <button
            @click="redeemPoints"
            class="w-full py-2.5 bg-white text-primary font-bold rounded-lg hover:bg-white/95 transition-transform active:scale-95 cursor-pointer shadow-sm"
          >
            استبدال النقاط بمكافآت
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics Bento Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm">
        <p class="text-label-md text-on-surface-variant mb-1">إجمالي طلبات العميل</p>
        <h4 class="text-headline-md font-bold text-on-surface">{{ customer.stats.totalOrders }} طلب</h4>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm">
        <p class="text-label-md text-on-surface-variant mb-1">إجمالي المبيعات المحققة</p>
        <h4 class="text-headline-md font-bold text-primary">{{ customer.stats.totalSpent }} ج.م</h4>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm">
        <p class="text-label-md text-on-surface-variant mb-1">متوسط سلة المشتريات</p>
        <h4 class="text-headline-md font-bold text-on-surface">{{ customer.stats.avgBasket }} ج.م</h4>
      </div>
      <div class="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm">
        <p class="text-label-md text-on-surface-variant mb-1">تاريخ آخر زيارة</p>
        <h4 class="text-headline-md font-bold text-on-surface">{{ customer.stats.lastVisit }}</h4>
      </div>
    </div>

    <!-- Tabbed Panels Navigation -->
    <div class="flex border-b border-outline-variant gap-6 overflow-x-auto no-scrollbar">
      <button
        @click="activeTab = 'overview'"
        class="pb-4 px-2 text-label-md font-bold transition-all whitespace-nowrap cursor-pointer"
        :class="activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-primary'"
      >
        نظرة عامة
      </button>
      <button
        @click="activeTab = 'orders'"
        class="pb-4 px-2 text-label-md font-bold transition-all whitespace-nowrap cursor-pointer"
        :class="activeTab === 'orders' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-primary'"
      >
        سجل فواتير العميل
      </button>
      <button
        @click="activeTab = 'loyalty'"
        class="pb-4 px-2 text-label-md font-bold transition-all whitespace-nowrap cursor-pointer"
        :class="activeTab === 'loyalty' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-primary'"
      >
        سجل برنامج الولاء
      </button>
      <button
        @click="activeTab = 'settings'"
        class="pb-4 px-2 text-label-md font-bold transition-all whitespace-nowrap cursor-pointer"
        :class="activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-primary'"
      >
        إعدادات الملف الشخصي
      </button>
    </div>

    <!-- Tab View: Overview -->
    <div v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 h-80 flex flex-col justify-between shadow-sm">
        <h3 class="text-headline-sm font-bold text-on-surface">تحليل الإنفاق الشهري (آخر 6 أشهر)</h3>
        <div class="flex items-end justify-between gap-4 px-2 flex-1 mt-4">
          <div class="flex flex-col items-center flex-1">
            <div class="w-full bg-primary/20 rounded-t-lg transition-all duration-300 hover:bg-primary/40" style="height: 60%;"></div>
            <span class="text-xs mt-2 text-on-surface-variant">يناير</span>
          </div>
          <div class="flex flex-col items-center flex-1">
            <div class="w-full bg-primary/20 rounded-t-lg transition-all duration-300 hover:bg-primary/40" style="height: 45%;"></div>
            <span class="text-xs mt-2 text-on-surface-variant">فبراير</span>
          </div>
          <div class="flex flex-col items-center flex-1">
            <div class="w-full bg-primary rounded-t-lg transition-all duration-300 hover:bg-primary-container" style="height: 85%;"></div>
            <span class="text-xs mt-2 font-bold text-primary">مارس</span>
          </div>
          <div class="flex flex-col items-center flex-1">
            <div class="w-full bg-primary/20 rounded-t-lg transition-all duration-300 hover:bg-primary/40" style="height: 70%;"></div>
            <span class="text-xs mt-2 text-on-surface-variant">أبريل</span>
          </div>
          <div class="flex flex-col items-center flex-1">
            <div class="w-full bg-primary/20 rounded-t-lg transition-all duration-300 hover:bg-primary/40" style="height: 55%;"></div>
            <span class="text-xs mt-2 text-on-surface-variant">مايو</span>
          </div>
          <div class="flex flex-col items-center flex-1">
            <div class="w-full bg-primary/20 rounded-t-lg transition-all duration-300 hover:bg-primary/40" style="height: 65%;"></div>
            <span class="text-xs mt-2 text-on-surface-variant">يونيو</span>
          </div>
        </div>
      </div>

      <!-- Preferred categories card -->
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <h3 class="text-headline-sm font-bold text-on-surface mb-6">الأصناف والتصنيفات المفضلة</h3>
        <div class="space-y-5">
          <div>
            <div class="flex justify-between text-label-md mb-1.5 font-bold">
              <span>مشروبات ساخنة وعصائر</span>
              <span class="text-primary">65%</span>
            </div>
            <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div class="bg-primary h-full w-[65%]"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-label-md mb-1.5 font-bold">
              <span>مخبوزات طازجة وحلويات</span>
              <span class="text-primary">24%</span>
            </div>
            <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div class="bg-primary h-full w-[24%]"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-label-md mb-1.5 font-bold">
              <span>ألبان وأجبان</span>
              <span class="text-primary">11%</span>
            </div>
            <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div class="bg-primary h-full w-[11%]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab View: Orders -->
    <div v-if="activeTab === 'orders'" class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-right border-collapse">
          <thead class="bg-surface-container-low text-on-surface-variant">
            <tr>
              <th class="p-4 text-label-md font-bold">رقم الفاتورة / الطلب</th>
              <th class="p-4 text-label-md font-bold">تاريخ المعاملة</th>
              <th class="p-4 text-label-md font-bold">حالة الطلب</th>
              <th class="p-4 text-label-md font-bold">المجموع الإجمالي</th>
              <th class="p-4 text-label-md font-bold">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/45 text-body-md text-on-surface">
            <tr v-for="ord in orders" :key="ord.id" class="hover:bg-primary/5 transition-colors">
              <td class="p-4 font-bold">{{ ord.id }}</td>
              <td class="p-4 text-on-surface-variant">{{ ord.date }}</td>
              <td class="p-4">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="ord.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'"
                >
                  {{ ord.status }}
                </span>
              </td>
              <td class="p-4 font-bold text-primary">{{ ord.amount }} ج.م</td>
              <td class="p-4">
                <button class="text-primary hover:underline font-bold text-label-md cursor-pointer">
                  عرض الفاتورة
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab View: Loyalty points logs -->
    <div v-if="activeTab === 'loyalty'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <h3 class="text-headline-sm font-bold text-on-surface mb-4">النقاط المكتسبة مؤخراً</h3>
        <div class="space-y-3">
          <div v-for="earn in loyaltyEarned" :key="earn.date" class="flex justify-between items-center p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
            <div>
              <p class="text-label-md font-bold">{{ earn.desc }}</p>
              <p class="text-xs text-on-surface-variant">{{ earn.date }}</p>
            </div>
            <span class="text-emerald-600 font-bold">+{{ earn.points }} نقطة</span>
          </div>
        </div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <h3 class="text-headline-sm font-bold text-on-surface mb-4">النقاط المستبدلة</h3>
        <div class="space-y-3">
          <div v-for="red in loyaltyRedeemed" :key="red.date" class="flex justify-between items-center p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
            <div>
              <p class="text-label-md font-bold">{{ red.desc }}</p>
              <p class="text-xs text-on-surface-variant">{{ red.date }}</p>
            </div>
            <span class="text-error font-bold">-{{ red.points }} نقطة</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab View: Settings -->
    <div v-if="activeTab === 'settings'" class="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 max-w-2xl mx-auto shadow-sm">
      <h3 class="text-headline-sm font-bold text-on-surface mb-6">تعديل بيانات العميل الأساسية</h3>
      <form @submit.prevent="saveSettings" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-label-md text-on-surface-variant font-bold">الاسم الأول</label>
            <input v-model="editFirstName" class="w-full h-11 px-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none" type="text" />
          </div>
          <div class="space-y-2">
            <label class="block text-label-md text-on-surface-variant font-bold">اسم العائلة</label>
            <input v-model="editLastName" class="w-full h-11 px-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none" type="text" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-label-md text-on-surface-variant font-bold">رقم الهاتف</label>
          <input v-model="editPhone" class="w-full h-11 px-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none" type="text" />
        </div>

        <div class="space-y-2">
          <label class="block text-label-md text-on-surface-variant font-bold">مستوى العميل في برنامج الولاء</label>
          <select v-model="editTier" class="w-full h-11 px-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none cursor-pointer">
            <option value="برونزي">برونزي</option>
            <option value="فضي">فضي</option>
            <option value="ذهبي">ذهبي</option>
            <option value="بلاتيني">بلاتيني</option>
          </select>
        </div>

        <div class="pt-4 flex gap-4">
          <button type="submit" class="flex-1 py-3 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/95 transition-all cursor-pointer text-center">
            حفظ التعديلات
          </button>
          <button type="button" @click="activeTab = 'overview'" class="flex-1 py-3 border border-outline-variant text-on-surface font-bold rounded-lg hover:bg-surface-container-low transition-all cursor-pointer text-center">
            إلغاء التغييرات
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
