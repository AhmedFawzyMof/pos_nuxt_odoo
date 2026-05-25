<script setup lang="ts">
import { ref, computed } from 'vue'

interface Product {
  name: string
  category: string
  barcode: string
  price: number
  stock: number
  image: string
}

const searchQuery = ref('')
const products = ref<Product[]>([
  {
    name: 'سماعات رأس لاسلكية',
    category: 'إلكترونيات',
    barcode: '6221234567890',
    price: 1250.00,
    stock: 45,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqOGiSRSwRp5eJUHx2k_9iHlb9JDSU0QAp4SMzZ7c1ZZDo5c3hVJG9l-Nii7hyhjchndOZBsTylL4VHWoo1yARpwrWBC_MkcXFacB-S2v368czxbbM9UftO5w89EH57zJVZtIZjuKBgruRxNdlOvhvUGbOphVYPn6RFej45oCeeCPEnW98p2UFtZwyiM1ChRJ9G2Mh_xrYM-xdOpZtew3o5fdfnubq_fR0dwxHZEJig68CfrSO0cecSJyhMR0yhZpF1m8VrrF870Lh'
  },
  {
    name: 'حذاء رياضي نايكي',
    category: 'ملابس رياضية',
    barcode: '6229876543210',
    price: 3400.00,
    stock: 3,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwa8rEauRgVsIVJSYiMG2D2BqEsO4oUM1Dn2z8_hzicDVO_ZNPDJ4oWbrM9u8BuMOFxylTb1qz0YzGz4Mx6m6rWrRwy9xS26orGUuVZ6C8W2CYwjd1y3Lzyk8-tDUxh76iOU_ZTtEjXpzvjcN0fogQT6gkv4CxBOfODO-nTzJRrYgiK8LW3x21-6F8SOsYNwFEFfBG4_we4c7f9IwtISMBjyLq8Vp1Ycl0NeLkvpg8yN2_0EwFU40phZZboNRs4zvkbFjAdCXxrl2j'
  },
  {
    name: 'ساعة ذكية S3',
    category: 'إلكترونيات',
    barcode: '6225544332211',
    price: 2100.00,
    stock: 12,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7_xxNcSKL3ilGQ-G-0ZEDRaTp0EC5amDq3vAq9NO0_Sla3Cn1pFidcIVzdUqORI-SCmn1fMmP2fO9w8wzre_oQCJ975l8cVlH2bqA9gWzm30yOFpoZGjss5coKHFD2AOsLYtGT7PS8rwtHhayMP-ovkoScvoQ0vpNuD0Om1Qd06rgmekNebKSDRk9Hr3uohFuRZxkIzHTlkHbiDeM72VE4jOeg7Vir0tOcQt1IwGXbV-liPRVywycJ_GNwzz5wBYZjFunrz7UoXtm'
  },
  {
    name: 'شاحن سريع 20 وات',
    category: 'إلكترونيات',
    barcode: '6224433221100',
    price: 350.00,
    stock: 80,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_X3p32inGOcCWxypbJI1nhZ83pIzKsyaOZHxkfW2S8a6p273hl2_0hs-PDcGliguOtrlS05eGVjEIwv0FXEkAj9WRkN3NfUQ21KWuhEZO4_KCBHkIJIL5D6jvzyHiQq1qaW8O7BaHbH087rgD2EL5zktedISXWpdTqUbBQhDtAn1jNBJamgGMugNmsNLc_5Pcsj4A8w0bIMmloOGUElpHr4MjyWm7WlUk92fGwCQUNOgqPbhN6iE7zmBz_pHfvlNeyYxJBNpbau_M'
  },
  {
    name: 'تي شيرت كاجوال قطن',
    category: 'ملابس',
    barcode: '6227766554433',
    price: 490.00,
    stock: 15,
    image: ''
  }
])

// Filtered products list
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  const query = searchQuery.value.toLowerCase()
  return products.value.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.barcode.includes(query) ||
    p.category.toLowerCase().includes(query)
  )
})

// Drawer State
const drawerOpen = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')
const selectedIndex = ref<number | null>(null)

// Form Fields
const formName = ref('')
const formCategory = ref('')
const formBarcode = ref('')
const formPrice = ref<number>(0)
const formStockCurrent = ref<number>(0)
const formStockNew = ref('0')
const isSaving = ref(false)

const openAddDrawer = () => {
  drawerMode.value = 'add'
  selectedIndex.value = null
  formName.value = ''
  formCategory.value = 'عام'
  formBarcode.value = ''
  formPrice.value = 0
  formStockCurrent.value = 0
  formStockNew.value = '0'
  drawerOpen.value = true
}

const openEditDrawer = (product: Product, index: number) => {
  drawerMode.value = 'edit'
  selectedIndex.value = index
  formName.value = product.name
  formCategory.value = product.category
  formBarcode.value = product.barcode
  formPrice.value = product.price
  formStockCurrent.value = product.stock
  formStockNew.value = '0'
  drawerOpen.value = true
}

const closeDrawer = () => {
  drawerOpen.value = false
}

// Numpad interaction
const numpadPress = (val: string | number) => {
  if (val === 'clear') {
    formStockNew.value = formStockNew.value.slice(0, -1)
    if (!formStockNew.value) formStockNew.value = '0'
  } else if (val === 'check') {
    formStockCurrent.value = parseInt(formStockNew.value)
    formStockNew.value = '0'
  } else {
    if (formStockNew.value === '0') {
      formStockNew.value = val.toString()
    } else {
      if (formStockNew.value.length < 5) {
        formStockNew.value += val.toString()
      }
    }
  }
}

const saveProduct = () => {
  isSaving.value = true
  setTimeout(() => {
    const updatedProduct: Product = {
      name: formName.value,
      category: formCategory.value || 'عام',
      barcode: formBarcode.value,
      price: Number(formPrice.value),
      stock: formStockCurrent.value,
      image: selectedIndex.value !== null ? products.value[selectedIndex.value]!.image : ''
    }

    if (drawerMode.value === 'add') {
      products.value.unshift(updatedProduct)
    } else if (selectedIndex.value !== null) {
      products.value[selectedIndex.value] = updatedProduct
    }

    isSaving.value = false
    drawerOpen.value = false
  }, 800)
}

const deleteProduct = () => {
  if (selectedIndex.value !== null) {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج؟')) {
      products.value.splice(selectedIndex.value, 1)
      drawerOpen.value = false
    }
  }
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Top toolbar controls -->
    <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
      <div class="relative flex-1 max-w-md">
        <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          v-model="searchQuery"
          class="w-full h-11 pr-10 pl-4 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-label-md outline-none"
          placeholder="بحث بالاسم أو الباركود..."
          type="text"
        />
      </div>
      <button
        @click="openAddDrawer"
        class="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold hover:bg-primary/95 transition-all active:scale-95 cursor-pointer shadow-sm"
      >
        <span class="material-symbols-outlined">add</span>
        إضافة منتج جديد
      </button>
    </div>

    <!-- Product Table Area -->
    <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden flex flex-col shadow-sm">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-right border-collapse">
          <thead>
            <tr class="bg-surface-container text-on-surface-variant border-b border-outline-variant">
              <th class="px-6 py-4 font-bold text-label-md">الصورة</th>
              <th class="px-6 py-4 font-bold text-label-md">اسم المنتج</th>
              <th class="px-6 py-4 font-bold text-label-md">الباركود</th>
              <th class="px-6 py-4 font-bold text-label-md">السعر (ج.م)</th>
              <th class="px-6 py-4 font-bold text-label-md">المخزون</th>
              <th class="px-6 py-4 font-bold text-label-md text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr
              v-for="(prod, index) in filteredProducts"
              :key="prod.barcode"
              @click="openEditDrawer(prod, index)"
              class="hover:bg-surface-container-low transition-colors group cursor-pointer"
            >
              <td class="px-6 py-4">
                <div class="w-12 h-12 bg-surface-variant rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center">
                  <img
                    v-if="prod.image"
                    alt="Product"
                    class="w-full h-full object-cover"
                    :src="prod.image"
                  />
                  <span v-else class="material-symbols-outlined text-outline text-2xl">image</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="font-bold text-on-surface text-body-md">{{ prod.name }}</p>
                <p class="text-[12px] text-on-surface-variant">{{ prod.category }}</p>
              </td>
              <td class="px-6 py-4 font-mono text-label-md text-on-surface-variant">{{ prod.barcode }}</td>
              <td class="px-6 py-4 text-primary font-bold text-label-md">
                {{ prod.price.toLocaleString('ae-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-3 py-1 rounded-full text-label-md font-bold"
                  :class="prod.stock <= 5 ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'"
                >
                  {{ prod.stock }} قطعة {{ prod.stock <= 5 ? '(منخفض)' : '' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center" @click.stop>
                <button
                  @click="openEditDrawer(prod, index)"
                  class="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-primary active:scale-95"
                >
                  <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="6" class="p-12 text-center text-on-surface-variant">
                <span class="material-symbols-outlined text-4xl block mb-2 text-outline">search_off</span>
                لا توجد منتجات تطابق البحث.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-8 py-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center shrink-0">
        <p class="text-label-md text-on-surface-variant">عرض 1-{{ filteredProducts.length }} من أصل {{ products.length }} منتج</p>
        <div class="flex gap-2">
          <button class="p-2 rounded-lg border border-outline-variant hover:bg-white text-on-surface-variant disabled:opacity-40">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
          <button class="w-10 h-10 rounded-lg border border-outline-variant bg-primary text-on-primary font-bold">1</button>
          <button class="w-10 h-10 rounded-lg border border-outline-variant hover:bg-white text-on-surface">2</button>
          <button class="p-2 rounded-lg border border-outline-variant hover:bg-white text-on-surface-variant">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Slide Drawer (Overlaid Panel) -->
    <div
      v-if="drawerOpen"
      class="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity flex justify-end"
      @click="closeDrawer"
    >
      <div
        class="h-full w-full max-w-[450px] bg-surface shadow-2xl flex flex-col relative transition-transform duration-300"
        @click.stop
      >
        <div class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">inventory_2</span>
            <div>
              <h2 class="text-headline-sm font-bold text-primary">
                {{ drawerMode === 'add' ? 'إضافة منتج جديد' : 'تحديث المنتج' }}
              </h2>
              <p class="text-label-md text-on-surface-variant">تحديث البيانات أو جرد المخزون</p>
            </div>
          </div>
          <button @click="closeDrawer" class="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <!-- Basic Info -->
          <div class="space-y-4">
            <h3 class="text-label-md font-bold text-on-surface-variant flex items-center gap-2">
              <span class="w-1.5 h-4 bg-primary rounded-full"></span>
              المعلومات الأساسية
            </h3>
            <div class="space-y-4">
              <div class="relative">
                <input
                  v-model="formName"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="text"
                />
                <label class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none">
                  اسم المنتج
                </label>
              </div>

              <div class="relative">
                <input
                  v-model="formCategory"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="text"
                />
                <label class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none">
                  القسم / الفئة
                </label>
              </div>

              <div class="relative">
                <input
                  v-model="formBarcode"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md font-mono outline-none transition-all"
                  placeholder=" "
                  type="text"
                />
                <label class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none">
                  الباركود / Barcode
                </label>
              </div>

              <div class="relative">
                <input
                  v-model="formPrice"
                  class="peer w-full h-12 px-4 pt-4 border-b-2 border-outline-variant focus:border-primary bg-transparent text-body-md outline-none transition-all"
                  placeholder=" "
                  type="number"
                />
                <label class="absolute right-4 top-1 text-[10px] text-on-surface-variant peer-placeholder-shown:text-label-md peer-placeholder-shown:top-3 transition-all pointer-events-none">
                  السعر (ج.م)
                </label>
              </div>
            </div>
          </div>

          <!-- Stock Adjustment -->
          <div class="bg-surface-container rounded-2xl p-4 border border-outline-variant space-y-4">
            <h3 class="text-label-md font-bold text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">balance</span>
              تعديل المخزون الفعلي (العد الفعلي)
            </h3>
            <div class="flex items-center justify-between gap-4">
              <div class="flex-1">
                <p class="text-[12px] text-on-surface-variant mb-0.5">المخزون الحالي</p>
                <p class="text-headline-sm font-bold text-on-surface">{{ formStockCurrent }} قطعة</p>
              </div>
              <div class="w-px h-10 bg-outline-variant"></div>
              <div class="flex-1">
                <p class="text-[12px] text-on-surface-variant mb-0.5">العد الفعلي الجديد</p>
                <p class="text-headline-sm font-bold text-primary">{{ formStockNew }}</p>
              </div>
            </div>

            <!-- Numpad Grid -->
            <div class="grid grid-cols-3 gap-2 pt-2">
              <button
                v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
                :key="num"
                @click="numpadPress(num)"
                class="h-12 bg-surface rounded-xl border border-outline-variant font-bold text-headline-sm active:scale-90 transition-transform cursor-pointer"
              >
                {{ num }}
              </button>
              <button
                @click="numpadPress('clear')"
                class="h-12 bg-error-container text-on-error-container rounded-xl font-bold active:scale-90 transition-transform flex items-center justify-center cursor-pointer"
              >
                <span class="material-symbols-outlined">backspace</span>
              </button>
              <button
                @click="numpadPress(0)"
                class="h-12 bg-surface rounded-xl border border-outline-variant font-bold text-headline-sm active:scale-90 transition-transform cursor-pointer"
              >
                0
              </button>
              <button
                @click="numpadPress('check')"
                class="h-12 bg-primary text-on-primary rounded-xl font-bold active:scale-90 transition-transform flex items-center justify-center cursor-pointer"
              >
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              </button>
            </div>
          </div>

          <!-- Delete product -->
          <div v-if="drawerMode === 'edit'" class="pt-4 border-t border-outline-variant">
            <button
              @click="deleteProduct"
              class="w-full h-11 flex items-center justify-center gap-2 text-error hover:bg-error/10 rounded-xl transition-colors border border-dashed border-error/30 font-bold text-label-md cursor-pointer"
            >
              <span class="material-symbols-outlined">delete</span>
              حذف المنتج من النظام
            </button>
          </div>
        </div>

        <div class="p-6 bg-surface-container-high grid grid-cols-2 gap-4">
          <button
            @click="closeDrawer"
            class="h-12 rounded-xl border border-outline font-bold text-on-surface hover:bg-surface transition-all active:scale-95 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            @click="saveProduct"
            :disabled="isSaving"
            class="h-12 rounded-xl bg-primary text-on-primary font-bold shadow-lg hover:bg-primary/95 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="isSaving" class="material-symbols-outlined animate-spin">sync</span>
            {{ isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
