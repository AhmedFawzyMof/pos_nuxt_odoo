<script setup lang="ts">
import { CheckCircle, Receipt } from "@lucide/vue";

defineProps<{
  orderName: string;
  successMessage: string;
}>();

const emit = defineEmits<{
  print: [];
}>();
</script>

<template>
  <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
    <div class="flex items-center gap-2 text-emerald-700 mb-1">
      <CheckCircle class="w-5 h-5" />
      <span class="text-sm font-bold">تم إنشاء الطلب بنجاح</span>
    </div>
    <div class="text-emerald-800 space-y-1">
      <p class="text-xs">
        رقم الفاتورة: <span class="font-bold">{{ orderName }}</span>
      </p>
      <p class="text-xs">{{ successMessage }}</p>
    </div>
    <button
      type="button"
      @click="emit('print')"
      class="mt-3 w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      <Receipt class="w-4 h-4" />
      طباعة الفاتورة
    </button>
  </div>
</template>
