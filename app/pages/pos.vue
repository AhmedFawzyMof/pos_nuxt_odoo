<script setup lang="ts">
import { ref, computed } from 'vue'

interface Product {
  id: number
  name: string
  category: string
  price: number
  image: string
}

interface CartItem {
  product: Product
  quantity: number
}

const products = ref<Product[]>([
  {
    id: 1,
    name: 'زجاجة كولا 250 مل',
    category: 'المشروبات',
    price: 15.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCT4YApOA1hhmsfeCVibHDq_HasM8-YouVg1jlmOmdP7hoIfEc8s8wa159xqfzl-yHuaPNWjxPRsgA2c5wvcrksSno7aAvqsuVMcOpSV1YsLhUJFlclS48N85Ev7M11EFTdIOG57nivd-WpgbJFuk02n-AqfMR2GI0Fk6FnQhMcaM2el55niME5ZbYI74LNZ_5r_lADsNh7z1YdXBdM25kcHOuYr-blCYkdtjzog407JmJLf_SkktiKeVJVj9mL7jyovSeOEeNK5nYc'
  },
  {
    id: 2,
    name: 'تفاح أحمر سكري (كجم)',
    category: 'الفواكه',
    price: 65.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAB2B9UbabFqbVciWKS9ugFP7LScLCcvolRutG9j7IflLv_sS3Qv5eMy_28gA56SN73JL9j6F4shdRcumwtCLaKAdLi05l2R-MhC4J7bpsuCcmgt7dhSb9cayYtdHVaYA0Z4fonA4DWdwfhjlXIiL_SEj5pQe01mhAaLalT-gAz6JxCeEMM7-IxtWtywVTkHMbccpLT3jwckUDmJt76E2GZ7ObzmgBU8UKgxswz5k9Cs-20qxOARMzdp9rqA8TsJp7KxwuiCYMLVN2X'
  },
  {
    id: 3,
    name: 'حليب كامل الدسم 1 لتر',
    category: 'الألبان',
    price: 42.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCeTUltxm3t2wDKwn5H1H-jB8Yiu7xjps_dV3sqVAx43OHvaq_8oxSrj_4D2Ieb4PIgZUWrMk1tp1UkHBx_9BjafS7afzFLqvpIsByu7iQWjQaVFxGKvrKv8-OI6BFUdQgl3Stf7P-Kn7UXN6IKikvtB5J9lUR9N6KwwTxui8ROhCmOTWi3URtzRguFn6jYVPnrjioszStay4ZB24M4cAy5KSLJR94G6qZoHyhn2Qoh2gN_ZuUyT_eIp3dk5aGvy525ZOQMhX5EA3b'
  },
  {
    id: 4,
    name: 'خبز توست أبيض فاخر',
    category: 'المخبوزات',
    price: 35.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyGhFw_3HdHZaS4F30zQLab_8SAiJff2yi1MXcLZ72rUUIecgKXv_TDkbxshEtQHuYgPPSfweK0ZsIZ25M2arcAhvXBC9SK_0l2rLRmtqHKlzHzw58ZiGztLK2wINzNBbYfxOqV7EvVRGM8dfIBVbMVsOlb-GtCKMnudKUu-O7fO2boKo1r88h9vKzmLsool_94nGc63DbhjKIbEAdSk2AfqY0pNE3G995qPphHD9ELL3grR4ZE-fX2dHfNrS2m6YAOQChjbdMX9ZH'
  },
  {
    id: 5,
    name: 'رقائق بطاطس عائلية',
    category: 'تسالي',
    price: 20.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCicJsIZjE6_YVq6V5zui_EWjrMYqG-y65g698w8fEydmMw6LHDYjA3MXyuz4tUV7hQQGwYQaQu--M3GQCtdBTIJCgBGKttfGQea8QqBPMpmVf-d3DpQTJ1wdOIoN75NTBbXkPAH7gXhhfyHJt7lXmZXdoKlS1HWr2l7vBP4wso1CHXkbJ4eK_obHtr0-_N5tG6g-aoNFS6bC08ktBKwQyzCXSE1Dk2JXlHzc-0gpviYGTQq0uGbqT6HjSSfBNIALurrr1AUtHyYY37'
  }
])

const categories = ['الكل', 'المشروبات', 'الفواكه', 'الألبان', 'المخبوزات', 'تسالي']
const selectedCategory = ref('الكل')
const searchQuery = ref('')
const selectedPriceList = ref('public')
const orderNotes = ref('')
const internalNotes = ref('')

const cart = ref<CartItem[]>([
  { product: products.value[0]!, quantity: 2 },
  { product: products.value[2]!, quantity: 1 }
])

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesCat = selectedCategory.value === 'الكل' || p.category === selectedCategory.value
    const matchesSearch = !searchQuery.value || p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCat && matchesSearch
  })
})

const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
})

const vat = computed(() => subtotal.value * 0.14)
const total = computed(() => subtotal.value + vat.value)

const addToCart = (product: Product) => {
  const existing = cart.value.find(item => item.product.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ product, quantity: 1 })
  }
}

const updateQuantity = (productId: number, amount: number) => {
  const item = cart.value.find(i => i.product.id === productId)
  if (item) {
    item.quantity += amount
    if (item.quantity <= 0) {
      cart.value = cart.value.filter(i => i.product.id !== productId)
    }
  }
}

const removeFromCart = (productId: number) => {
  cart.value = cart.value.filter(i => i.product.id !== productId)
}

const clearCart = () => {
  cart.value = []
}

// Payment Checkout Drawer State
const checkoutOpen = ref(false)
const cashPaid = ref<number | null>(null)
const selectedPaymentMethod = ref<'cash' | 'card' | 'wallet'>('cash')
const isProcessingPayment = ref(false)
const showReceipt = ref(false)

const openCheckout = () => {
  if (cart.value.length === 0) {
    alert('السلة فارغة. يرجى إضافة منتجات أولاً.')
    return
  }
  cashPaid.value = Math.ceil(total.value / 10) * 10
  showReceipt.value = false
  checkoutOpen.value = true
}

const changeDue = computed(() => {
  if (!cashPaid.value || cashPaid.value < total.value) return 0
  return cashPaid.value - total.value
})

const selectQuickCash = (amount: number) => {
  cashPaid.value = amount
}

const processPayment = () => {
  if (selectedPaymentMethod.value === 'cash' && (!cashPaid.value || cashPaid.value < total.value)) {
    alert('المبلغ المدفوع غير كافٍ!')
    return
  }
  isProcessingPayment.value = true
  setTimeout(() => {
    isProcessingPayment.value = false
    showReceipt.value = true
  }, 1000)
}

const finishSale = () => {
  clearCart()
  checkoutOpen.value = false
  showReceipt.value = false
  orderNotes.value = ''
  internalNotes.value = ''
}
</script>

<template>
  <div class="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 -m-margin-desktop overflow-hidden">
    <!-- Left/Center: Catalog Panel (60%) -->
    <section class="flex-1 flex flex-col bg-surface-container-low border-l border-outline-variant overflow-hidden">
      <!-- Search & Filters -->
      <div class="p-6 space-y-4 bg-surface shadow-sm shrink-0 border-b border-outline-variant">
        <div class="relative group">
          <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            v-model="searchQuery"
            class="w-full h-12 pr-12 pl-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
            placeholder="ابحث عن منتج بالاسم..."
            type="text"
          />
        </div>
        <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button
            v-for="cat in categories"
            :key="cat"
            @click="selectedCategory = cat"
            class="px-5 py-2 rounded-full text-label-md font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95"
            :class="[
              selectedCategory === cat
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
            ]"
          >
            {{ cat === 'الكل' ? 'الكل / All' : cat }}
          </button>
        </div>
      </div>

      <!-- Catalog Grid -->
      <div class="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 custom-scrollbar">
        <div
          v-for="prod in filteredProducts"
          :key="prod.id"
          @click="addToCart(prod)"
          class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all active:scale-95 group flex flex-col justify-between"
        >
          <div class="h-32 bg-surface-variant relative flex-shrink-0 flex items-center justify-center">
            <img v-if="prod.image" :alt="prod.name" class="w-full h-full object-cover" :src="prod.image" />
            <span v-else class="material-symbols-outlined text-outline text-4xl">image</span>
          </div>
          <div class="p-3 flex-1 flex flex-col justify-between">
            <div>
              <div class="text-[12px] text-on-surface-variant mb-1">{{ prod.category }}</div>
              <div class="text-body-md font-bold text-on-surface leading-tight h-10 overflow-hidden mb-2">
                {{ prod.name }}
              </div>
            </div>
            <div class="flex justify-between items-center mt-auto">
              <span class="text-primary font-bold text-body-md">{{ prod.price }} EGP</span>
              <span
                class="material-symbols-outlined text-primary bg-primary/10 rounded-full p-1 group-hover:bg-primary group-hover:text-on-primary transition-colors text-lg"
              >
                add
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Right: Shopping Cart Sidebar (40%) -->
    <aside class="w-full lg:w-[420px] bg-surface flex flex-col shadow-lg border-r border-outline-variant overflow-hidden shrink-0">
      <!-- Cart Header -->
      <div class="p-6 border-b border-outline-variant space-y-4 shrink-0 bg-surface-container-low">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">receipt_long</span>
            <h2 class="text-headline-sm font-bold text-on-surface">التذكرة النشطة</h2>
          </div>
          <button
            @click="clearCart"
            class="text-error flex items-center gap-1 hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-sm">delete_sweep</span>
            <span class="text-label-md font-bold">مسح السلة</span>
          </button>
        </div>

        <!-- Price List -->
        <div class="relative">
          <label class="block text-label-md text-on-surface-variant mb-1">قائمة الأسعار</label>
          <div class="relative">
            <select
              v-model="selectedPriceList"
              class="w-full h-11 pr-10 pl-4 bg-surface-container border border-outline-variant rounded-lg text-body-md appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
            >
              <option value="public">الأسعار العامة / Public Price</option>
              <option value="wholesale">جملة / Wholesale</option>
              <option value="vip">كبار العملاء / VIP Customers</option>
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </div>

      <!-- Cart Item Rows -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-low custom-scrollbar">
        <div
          v-for="item in cart"
          :key="item.product.id"
          class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex gap-4 group"
        >
          <div class="w-12 h-12 rounded-lg bg-surface-variant overflow-hidden shrink-0 flex items-center justify-center">
            <img v-if="item.product.image" alt="Item" class="w-full h-full object-cover" :src="item.product.image" />
            <span v-else class="material-symbols-outlined text-outline">image</span>
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <span class="text-body-md font-bold text-on-surface">{{ item.product.name }}</span>
              <span class="text-body-md font-bold text-primary">
                {{ (item.product.price * item.quantity).toFixed(2) }} EGP
              </span>
            </div>
            <div class="text-[12px] text-on-surface-variant">{{ item.product.price }} EGP للوحدة</div>
            <div class="flex justify-between items-center mt-3">
              <div class="flex items-center bg-surface-container border border-outline-variant rounded-lg overflow-hidden">
                <button
                  @click="updateQuantity(item.product.id, -1)"
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  <span class="material-symbols-outlined text-sm">remove</span>
                </button>
                <span class="w-10 text-center text-body-md font-bold">{{ item.quantity }}</span>
                <button
                  @click="updateQuantity(item.product.id, 1)"
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  <span class="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
              <button
                @click="removeFromCart(item.product.id)"
                class="opacity-0 group-hover:opacity-100 text-error p-1 hover:bg-error/10 rounded transition-all cursor-pointer"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="cart.length === 0" class="p-12 text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl block mb-2 text-outline">shopping_cart</span>
          سلة البيع فارغة حالياً
        </div>
      </div>

      <!-- Notes & Checkout trigger -->
      <div class="bg-surface border-t border-outline-variant p-6 space-y-4 shrink-0">
        <!-- Collapsible Notes -->
        <details class="group bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
          <summary class="flex justify-between items-center p-3 cursor-pointer hover:bg-surface-container-high transition-colors">
            <div class="flex items-center gap-2 text-on-surface font-bold text-label-md">
              <span class="material-symbols-outlined text-sm">note_alt</span>
              <span>ملاحظات الطلب</span>
            </div>
            <span class="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <div class="p-4 space-y-3 border-t border-outline-variant bg-surface-container-lowest">
            <div>
              <label class="block text-xs font-bold text-on-surface-variant mb-1">ملاحظة العميل</label>
              <textarea
                v-model="orderNotes"
                class="w-full h-16 p-2 rounded-lg border border-outline-variant text-body-md focus:ring-1 focus:ring-primary outline-none"
                placeholder="اكتب ملاحظة للفاتورة..."
              ></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-primary mb-1">ملاحظة داخلية للموظفين</label>
              <textarea
                v-model="internalNotes"
                class="w-full h-16 p-2 rounded-lg border border-primary/30 bg-primary/5 text-body-md focus:ring-1 focus:ring-primary outline-none"
                placeholder="ملاحظة غير ظاهرة للعميل..."
              ></textarea>
            </div>
          </div>
        </details>

        <!-- Calculation Summary -->
        <div class="space-y-2">
          <div class="flex justify-between text-on-surface-variant text-label-md">
            <span>المجموع الفرعي:</span>
            <span>{{ subtotal.toFixed(2) }} EGP</span>
          </div>
          <div class="flex justify-between text-on-surface-variant text-label-md">
            <span>ضريبة القيمة المضافة (14%):</span>
            <span>{{ vat.toFixed(2) }} EGP</span>
          </div>
          <div class="flex justify-between text-primary font-bold text-headline-sm pt-2 border-t border-outline-variant/30">
            <span>الإجمالي:</span>
            <span class="text-price-display font-bold">{{ total.toFixed(2) }} EGP</span>
          </div>
        </div>

        <button
          @click="openCheckout"
          class="w-full h-16 bg-primary text-on-primary rounded-2xl flex items-center justify-between px-6 shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.98] transition-all group cursor-pointer"
        >
          <div class="text-right">
            <div class="text-xs opacity-80">الذهاب للدفع</div>
            <div class="text-body-lg font-bold">تأكيد ودفع الحساب</div>
          </div>
          <span class="material-symbols-outlined text-3xl group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
        </button>
      </div>
    </aside>

    <!-- Payment & Receipt Modal Drawer -->
    <div
      v-if="checkoutOpen"
      class="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm flex items-center justify-center p-4 transition-opacity"
      @click="checkoutOpen = false"
    >
      <div
        class="bg-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]"
        @click.stop
      >
        <!-- Header -->
        <div class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <h3 class="text-headline-md font-bold text-primary">عملية الدفع والتحصيل</h3>
          <button @click="checkoutOpen = false" class="p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Receipt Mode -->
        <div v-if="showReceipt" class="p-6 flex-1 overflow-y-auto space-y-6 text-center custom-scrollbar">
          <span class="material-symbols-outlined text-6xl text-primary animate-bounce">check_circle</span>
          <div>
            <h4 class="text-headline-sm font-bold text-on-surface">تمت العملية بنجاح!</h4>
            <p class="text-label-md text-on-surface-variant">تم حفظ المبيعات وتحديث مخزون المنتجات.</p>
          </div>

          <!-- Printable Invoice Mock -->
          <div class="bg-surface-container-lowest border-2 border-dashed border-outline-variant p-6 text-right font-mono text-xs space-y-3 rounded-lg mx-auto max-w-sm shadow-sm">
            <div class="text-center font-bold border-b border-outline-variant pb-2">
              <h5 class="text-sm">Odoo Retail Terminal</h5>
              <p>فاتورة مبيعات مبسطة</p>
            </div>
            <div class="space-y-1">
              <p>رقم الفاتورة: #INV-{{ Math.floor(Math.random() * 90000) + 10000 }}</p>
              <p>التاريخ: {{ new Date().toLocaleString('ar-EG') }}</p>
              <p>الكاشير: أحمد محمد</p>
            </div>
            <div class="border-y border-outline-variant py-2 space-y-1">
              <div v-for="item in cart" :key="item.product.id" class="flex justify-between">
                <span>{{ item.product.name }} (x{{ item.quantity }})</span>
                <span>{{ (item.product.price * item.quantity).toFixed(2) }} EGP</span>
              </div>
            </div>
            <div class="space-y-1 text-label-md">
              <div class="flex justify-between">
                <span>المجموع:</span>
                <span>{{ subtotal.toFixed(2) }} EGP</span>
              </div>
              <div class="flex justify-between">
                <span>الضريبة:</span>
                <span>{{ vat.toFixed(2) }} EGP</span>
              </div>
              <div class="flex justify-between font-bold text-primary">
                <span>الإجمالي الكلي:</span>
                <span>{{ total.toFixed(2) }} EGP</span>
              </div>
              <div class="flex justify-between">
                <span>طريقة الدفع:</span>
                <span>{{ selectedPaymentMethod === 'cash' ? 'نقدي' : selectedPaymentMethod === 'card' ? 'بطاقة ائتمان' : 'محفظة إلكترونية' }}</span>
              </div>
              <div v-if="selectedPaymentMethod === 'cash'" class="flex justify-between font-bold">
                <span>المبلغ المدفوع:</span>
                <span>{{ cashPaid?.toFixed(2) }} EGP</span>
              </div>
              <div v-if="selectedPaymentMethod === 'cash'" class="flex justify-between text-secondary">
                <span>الفكة المتبقية:</span>
                <span>{{ changeDue.toFixed(2) }} EGP</span>
              </div>
            </div>
            <div class="text-center pt-4 border-t border-outline-variant text-[10px] text-on-surface-variant">
              شكراً لتسوقكم معنا!
            </div>
          </div>

          <div class="flex gap-4">
            <button
              @click="finishSale"
              class="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold hover:bg-primary/95 transition-all cursor-pointer"
            >
              عملية بيع جديدة
            </button>
            <button
              @click="finishSale"
              class="px-6 border border-outline text-on-surface py-3 rounded-xl font-bold hover:bg-surface-container transition-all cursor-pointer"
            >
              طباعة الفاتورة
            </button>
          </div>
        </div>

        <!-- Checkout Selection Mode -->
        <div v-else class="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          <!-- Total Price display -->
          <div class="bg-primary-container/10 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
            <span class="text-label-md font-bold text-on-primary-container">المطلوب سداده:</span>
            <span class="text-price-display font-bold text-primary">{{ total.toFixed(2) }} EGP</span>
          </div>

          <!-- Payment Methods -->
          <div class="space-y-2">
            <label class="block text-label-md font-bold text-on-surface-variant">اختر وسيلة الدفع</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                @click="selectedPaymentMethod = 'cash'"
                class="h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold cursor-pointer transition-all"
                :class="selectedPaymentMethod === 'cash' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'"
              >
                <span class="material-symbols-outlined">payments</span>
                <span class="text-xs">نقدي / Cash</span>
              </button>
              <button
                @click="selectedPaymentMethod = 'card'"
                class="h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold cursor-pointer transition-all"
                :class="selectedPaymentMethod === 'card' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'"
              >
                <span class="material-symbols-outlined">credit_card</span>
                <span class="text-xs">فيزا / Card</span>
              </button>
              <button
                @click="selectedPaymentMethod = 'wallet'"
                class="h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold cursor-pointer transition-all"
                :class="selectedPaymentMethod === 'wallet' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'"
              >
                <span class="material-symbols-outlined">cell_phone</span>
                <span class="text-xs">محفظة / Wallet</span>
              </button>
            </div>
          </div>

          <!-- Cash input fields -->
          <div v-if="selectedPaymentMethod === 'cash'" class="space-y-4">
            <div class="relative">
              <input
                v-model="cashPaid"
                class="w-full h-14 px-4 border-2 border-outline-variant focus:border-primary rounded-xl text-headline-sm font-bold outline-none text-left"
                type="number"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-label-md font-bold text-on-surface-variant">
                المبلغ المقبوض
              </span>
            </div>

            <!-- Quick Cash options -->
            <div class="flex gap-2 justify-end">
              <button
                v-for="amt in [total, 100, 200, 500]"
                :key="amt"
                @click="selectQuickCash(Math.ceil(amt))"
                class="px-4 py-2 bg-surface-container rounded-lg text-xs font-bold border border-outline-variant hover:bg-surface-container-high cursor-pointer"
              >
                {{ Math.ceil(amt) }} EGP
              </button>
            </div>

            <!-- Change due status -->
            <div class="flex justify-between items-center text-label-md border-t border-outline-variant/30 pt-4">
              <span class="text-on-surface-variant">مبلغ الفكة / المتبقي للعميل:</span>
              <span class="text-headline-sm font-bold text-secondary">{{ changeDue.toFixed(2) }} EGP</span>
            </div>
          </div>

          <!-- Other Payment Details -->
          <div v-else class="p-6 bg-surface-container rounded-xl text-center text-on-surface-variant text-label-md border border-outline-variant">
            <span class="material-symbols-outlined text-4xl text-primary animate-pulse mb-2">dock_to_bottom</span>
            <p>الرجاء سحب أو تمرير البطاقة على جهاز الدفع (POS Terminal) المرفق.</p>
          </div>
        </div>

        <!-- Footer actions -->
        <div v-if="!showReceipt" class="p-6 bg-surface-container-high flex gap-4 shrink-0">
          <button
            @click="checkoutOpen = false"
            class="flex-1 py-3 rounded-xl border border-outline font-bold text-on-surface hover:bg-surface transition-all cursor-pointer active:scale-95 text-center"
          >
            إلغاء
          </button>
          <button
            @click="processPayment"
            :disabled="isProcessingPayment"
            class="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold shadow-lg hover:bg-primary/95 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <span v-if="isProcessingPayment" class="material-symbols-outlined animate-spin">sync</span>
            {{ isProcessingPayment ? 'جاري الدفع...' : 'تأكيد الدفع' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
