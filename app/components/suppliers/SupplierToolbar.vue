<script setup lang="ts">
import { RefreshCw } from "@lucide/vue";
import { usePermissions } from '~/composables/usePermissions'
const { can } = usePermissions()

defineProps<{
  status: string;
}>();

const emit = defineEmits<{
  (e: "add"): void;
  (e: "refresh"): void;
}>();
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-headline-lg font-bold text-on-white">الموردين</h1>
      <p class="text-on-white-variant text-label-md">
        إدارة الموردين وفواتير الشراء
      </p>
    </div>
    <div class="flex gap-2">
      <button
        @click="emit('refresh')"
        class="px-4 py-2 border border-outline-variant rounded-lg text-on-white font-bold hover:bg-white-low transition-all cursor-pointer"
      >
        <RefreshCw
          :class="{ 'animate-spin': status === 'pending' }"
          class="w-5 h-5 inline-block ml-1"
        />
        تحديث
      </button>
      <button
        v-if="can('supplier.create')"
        @click="emit('add')"
        class="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all cursor-pointer"
      >
        + مورد جديد
      </button>
    </div>
  </div>
</template>
