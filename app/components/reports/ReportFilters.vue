<script setup lang="ts">
import { Filter, RefreshCw, Download } from "@lucide/vue";

const props = defineProps<{
  dateFrom: string;
  dateTo: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:dateFrom": [value: string];
  "update:dateTo": [value: string];
  refresh: [];
  export: [];
}>();
</script>

<template>
  <div class="flex items-center gap-4 bg-white border border-outline-variant rounded-xl p-4 flex-wrap">
    <Filter class="w-5 h-5 text-on-white-variant shrink-0" />
    <div class="flex items-center gap-2">
      <label class="text-label-md text-on-white-variant">من</label>
      <input
        :value="dateFrom"
        @input="emit('update:dateFrom', ($event.target as HTMLInputElement).value)"
        type="date"
        class="h-10 px-3 border border-outline-variant rounded-lg text-sm"
      />
    </div>
    <div class="flex items-center gap-2">
      <label class="text-label-md text-on-white-variant">إلى</label>
      <input
        :value="dateTo"
        @input="emit('update:dateTo', ($event.target as HTMLInputElement).value)"
        type="date"
        class="h-10 px-3 border border-outline-variant rounded-lg text-sm"
      />
    </div>
    <div class="flex gap-2 mr-auto">
      <button
        @click="emit('refresh')"
        class="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-white-variant hover:bg-white-low transition-colors text-sm font-bold cursor-pointer"
        :disabled="loading"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        تحديث
      </button>
      <button
        @click="emit('export')"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-bold cursor-pointer"
      >
        <Download class="w-4 h-4" />
        تصدير Excel
      </button>
    </div>
  </div>
</template>
