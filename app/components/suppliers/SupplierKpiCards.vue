<script setup lang="ts">
defineProps<{
  totalItems: number;
  totalPurchased: number;
  outstanding: number;
  overdue: number;
}>();
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div
      class="bg-white-lowest border border-outline-variant p-4 rounded-xl"
    >
      <p class="text-label-md text-on-white-variant">إجمالي الموردين</p>
      <h4 class="text-headline-md font-bold text-on-white">
        {{ totalItems }}
      </h4>
    </div>
    <div
      class="bg-white-lowest border border-outline-variant p-4 rounded-xl"
    >
      <p class="text-label-md text-on-white-variant">إجمالي المشتريات</p>
      <h4 class="text-headline-md font-bold text-primary">
        {{ totalPurchased.toLocaleString("ar-EG") }}
        ج.م
      </h4>
    </div>
    <div
      class="bg-white-lowest border border-outline-variant p-4 rounded-xl"
    >
      <p class="text-label-md text-on-white-variant">المبالغ المستحقة</p>
      <h4 class="text-headline-md font-bold text-amber-600">
        {{ outstanding.toLocaleString("ar-EG") }}
        ج.م
      </h4>
    </div>
    <div
      class="bg-white-lowest border border-outline-variant p-4 rounded-xl"
    >
      <p class="text-label-md text-on-white-variant">المتأخرات</p>
      <h4 class="text-headline-md font-bold text-error">
        {{ overdue.toLocaleString("ar-EG") }}
        ج.م
      </h4>
    </div>
  </div>
</template>
