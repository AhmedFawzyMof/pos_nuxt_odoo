<script setup lang="ts">
import BaseReport from "./BaseReport.vue";
defineProps<{ dateFrom: string; dateTo: string }>();
const emit = defineEmits<{ loading: [v: boolean] }>();
</script>
<template>
  <BaseReport report-type="tax" :date-from :date-to @loading="emit('loading', $event)" />
</template>
