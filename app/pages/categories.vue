<script setup lang="ts">
import { ref, computed } from 'vue'

interface Category {
  name: string
  productsCount: number
  status: 'نشط' | 'مسودة'
  icon: string
  image: string
}

const searchQuery = ref('')
const categoriesList = ref<Category[]>([
  {
    name: 'الخضروات والفاكهة',
    productsCount: 142,
    status: 'نشط',
    icon: 'eco',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmEIrXilARQjqVz5J6lsUt13RRScgUJQMqHXfKI_dXEuN2pEnQwQjj5ts2URjv8B8OhPliOtvSjHspybuGNCFdZo7bijgib1P4fnVG75WMgJwK1JbVyz-qEF2pT3v7itod4Iy5qxUXAk9UnMj4UxebEePXZaQhS3mZlmB4qnKsNmz6t_HGseNnwk-Xb43HWSKwAfEG-HKtSztTHoBokxCPiE2Y-tWTub46cE7AmYtnC2UpyXXKSWy1ugkewRB3I-kHc4EQHERcm5GU'
  },
  {
    name: 'الألبان والأجبان',
    productsCount: 86,
    status: 'نشط',
    icon: 'cheese',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZgpYhnC-zxSAO3PUpb5ROk4fIWUPbHG7FXpQBUXWrH1ullxvkMYjF1VOuXbyr29tHSdYVxWqX4aMLJOEXcqOD3WfvIiz_0YiExAe70kyWa-neHrAfrLUFr0NHw8nX9nUJM4nNKKwBabJuUZxIH0ryJZYAqx-s8gEKZ15Rnm1nHlzj4hMd91ksgPCGg0jT-YpIyO4RFBTcxD_aPF576k7pyEdryVb3vC1dyoHQZ3m2hvZb3ZnNnCKObHRqx0q9-N7S6keVQVZwEioa'
  },
  {
    name: 'المخبوزات',
    productsCount: 54,
    status: 'نشط',
    icon: 'bakery_dining',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaM4uVA7VnxjE7E_IKltxlQYkljh8irvVMjfk3g_lRVBqtsRlWSteSWyMTJYolAsqLZdD6Idr9z5eOsFEoHgks38Aobwq-TWoo0V9UCHadZE-i0EPltT84uevpqbY8pMo0XgcvGYdGSgp5rvy_OoxIR9rApkEk9Kg487-x280hVhccP6ZXzWh6Rq6u0ZdnOvCxe3leVZeW1jK1y45KFUV-x1kI3yVqhqNIxaL48G2FIP9I_Us9fhjkdE7zAMBhpui-293-0i4Zbr_o'
  },
  {
    name: 'اللحوم والدواجن',
    productsCount: 38,
    status: 'نشط',
    icon: 'room_service',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTff5JX-1FMN2Gp39ldMkQp3HpBy1CacHBwNExtBV571g-oy7M2tw94oI3zwv9OT_gUDIrLwh2wD_EDzgGLgkxUSgJr9Ngq0EcHcZAvuds9lg2CagE-zCrCcFUWdU7IrDrns1vnhrhV74n6BrLJxisv3xTE_2bbBeCvqgcf7cCFaqEuEGHz_2dzzRak9UMeSXsM6O9m4mB_L6N4AXhDwPoPG2opd2WkkZWiZAT08-8os0NzpDnz-FUnI0tms4quaRglJggxHZQqJOx'
  }
])

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categoriesList.value
  const query = searchQuery.value.toLowerCase()
  return categoriesList.value.filter(c => c.name.includes(query))
})

const totalProducts = computed(() => {
  return categoriesList.value.reduce((sum, c) => sum + c.productsCount, 0)
})

const editCategory = (c: Category) => {
  const newName = prompt('تعديل اسم القسم:', c.name)
  if (newName) {
    c.name = newName
  }
}

const deleteCategory = (index: number) => {
  if (confirm('هل أنت متأكد من رغبتك في حذف هذا القسم؟')) {
    categoriesList.value.splice(index, 1)
  }
}

const addCategory = () => {
  const name = prompt('أدخل اسم القسم الجديد:')
  if (name) {
    categoriesList.value.push({
      name,
      productsCount: 0,
      status: 'نشط',
      icon: 'category',
      image: ''
    })
  }
}
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <!-- Header & Search Controls -->
    <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm">
      <div class="relative flex-1 max-w-md">
        <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          v-model="searchQuery"
          class="w-full h-11 pr-10 pl-4 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-label-md outline-none"
          placeholder="بحث عن قسم..."
          type="text"
        />
      </div>
      <button
        @click="addCategory"
        class="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold hover:bg-primary/95 transition-all active:scale-95 cursor-pointer shadow-sm"
      >
        <span class="material-symbols-outlined">add_circle</span>
        إضافة قسم جديد
      </button>
    </div>

    <!-- Category Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <!-- Category Card -->
      <div
        v-for="(cat, index) in filteredCategories"
        :key="cat.name"
        class="group relative bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
      >
        <div class="h-40 overflow-hidden relative bg-surface-variant flex items-center justify-center">
          <img
            v-if="cat.image"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            :src="cat.image"
            :alt="cat.name"
          />
          <span v-else class="material-symbols-outlined text-outline text-5xl">image</span>

          <!-- Overlay Actions -->
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              @click="editCategory(cat)"
              class="p-2 bg-white rounded-full text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button
              @click="deleteCategory(index)"
              class="p-2 bg-white rounded-full text-error hover:bg-error hover:text-white transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-headline-sm font-bold text-on-surface">{{ cat.name }}</h3>
            <span class="material-symbols-outlined text-primary">{{ cat.icon }}</span>
          </div>
          <div class="flex items-center justify-between text-label-md text-on-surface-variant mt-auto">
            <span>{{ cat.productsCount }} منتجاً</span>
            <span class="px-2.5 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-bold">{{ cat.status }}</span>
          </div>
        </div>
      </div>

      <!-- Add Category Quick Action -->
      <button
        @click="addCategory"
        class="group h-full min-h-[250px] border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 rounded-xl flex flex-col items-center justify-center gap-4 transition-all active:scale-95 cursor-pointer"
      >
        <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <span class="material-symbols-outlined text-4xl text-outline group-hover:text-primary transition-colors">add</span>
        </div>
        <span class="text-headline-sm font-bold text-on-surface-variant group-hover:text-primary transition-colors">
          إضافة قسم سريع
        </span>
      </button>
    </div>

    <!-- Analytics Section -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-outline-variant">
      <!-- Total Categories Card -->
      <div class="bg-surface-container-low p-6 rounded-2xl border border-outline-variant flex items-center gap-6 shadow-sm">
        <div class="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
          <span class="material-symbols-outlined text-3xl">category</span>
        </div>
        <div>
          <p class="text-label-md text-on-surface-variant">إجمالي الأقسام</p>
          <h4 class="text-display-lg font-bold text-on-surface">{{ categoriesList.length }}</h4>
        </div>
      </div>
      <!-- Total Products Card -->
      <div class="bg-surface-container-low p-6 rounded-2xl border border-outline-variant flex items-center gap-6 shadow-sm">
        <div class="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
          <span class="material-symbols-outlined text-3xl">inventory_2</span>
        </div>
        <div>
          <p class="text-label-md text-on-surface-variant">إجمالي المنتجات المدرجة</p>
          <h4 class="text-display-lg font-bold text-on-surface">{{ totalProducts }}</h4>
        </div>
      </div>
      <!-- Shelf Efficiency Card -->
      <div class="bg-surface-container-low p-6 rounded-2xl border border-outline-variant flex items-center gap-6 shadow-sm">
        <div class="w-14 h-14 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
          <span class="material-symbols-outlined text-3xl">speed</span>
        </div>
        <div>
          <p class="text-label-md text-on-surface-variant">كفاءة مساحات العرض</p>
          <h4 class="text-display-lg font-bold text-on-surface">94%</h4>
        </div>
      </div>
    </div>
  </div>
</template>
