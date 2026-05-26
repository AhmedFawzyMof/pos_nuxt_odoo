<script setup lang="ts">
interface KpiItem {
  title: string;
  value: string;
  unit: string;
  change: string;
  changeType: string;
  icon: string;
  color: string;
}

defineProps<{
  kpis: KpiItem[];
}>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div
      v-for="(kpi, idx) in kpis"
      :key="idx"
      class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow"
    >
      <div class="flex justify-between items-start mb-4">
        <div class="p-3 rounded-lg" :class="kpi.color">
          <span class="material-symbols-outlined text-primary">{{
            kpi.icon
          }}</span>
        </div>
        <span
          v-if="kpi.change"
          class="text-label-md font-bold"
          :class="kpi.changeType === 'positive' ? 'text-primary' : 'text-error'"
        >
          {{ kpi.change }}
        </span>
      </div>
      <p class="text-on-surface-variant text-label-md font-label-md">
        {{ kpi.title }}
      </p>
      <h3 class="text-display-lg font-bold mt-1 text-on-surface">
        {{ kpi.value }}
        <span class="text-body-md font-normal text-on-surface-variant">{{
          kpi.unit
        }}</span>
      </h3>
    </div>
  </div>
</template>
