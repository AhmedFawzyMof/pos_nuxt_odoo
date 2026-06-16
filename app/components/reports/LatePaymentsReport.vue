<script setup lang="ts">
import BaseReport from "./BaseReport.vue";
defineProps<{ dateFrom: string; dateTo: string; refreshKey?: number }>();
const emit = defineEmits<{ loading: [v: boolean] }>();
</script>
<template>
  <BaseReport report-type="late_payments" :date-from :date-to :refresh-key @loading="emit('loading', $event)" />
</template>
