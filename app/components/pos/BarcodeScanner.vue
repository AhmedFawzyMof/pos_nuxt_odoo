<script setup lang="ts">
import { ref, watch, nextTick } from "vue";

const props = withDefaults(
  defineProps<{
    active?: boolean;
    pauseDuration?: number;
  }>(),
  { active: false, pauseDuration: 1800 },
);

const emit = defineEmits<{
  scan: [barcode: string];
  "update:active": [value: boolean];
}>();

let uid = 0;
const previewId = `barcode-scanner-preview-${uid++}`;

const {
  isPaused,
  errorMessage,
  zoomSupported,
  currentZoom,
  zoomMin,
  zoomMax,
  start,
  stop,
  applyZoom,
} = useBarcodeScanner({
  elementId: previewId,
  pauseDuration: props.pauseDuration,
  onScan: (barcode, done) => {
    emit("scan", barcode);
    setTimeout(done, props.pauseDuration);
  },
  onError: () => {
    emit("update:active", false);
  },
});

const error = ref("");

watch(errorMessage, (msg) => {
  error.value = msg;
});

watch(
  () => props.active,
  (active) => {
    error.value = "";
    if (active) {
      nextTick(() => start());
    } else {
      stop();
    }
  },
);
</script>

<template>
  <div>
    <div
      v-show="active"
      class="border border-outline-variant rounded-lg overflow-hidden bg-slate-950 relative shadow-inner"
    >
      <div
        :id="previewId"
        class="w-full mx-auto max-w-[400px]"
      />
      <div
        class="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        <div class="relative w-[280px] h-[140px]">
          <div class="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-sky-400 rounded-tl" />
          <div class="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-sky-400 rounded-tr" />
          <div class="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-sky-400 rounded-bl" />
          <div class="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-sky-400 rounded-br" />
        </div>
      </div>
      <div
        v-if="zoomSupported"
        class="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10"
      >
        <span class="text-white text-[10px] font-bold tabular-nums drop-shadow-sm">
          {{ currentZoom.toFixed(1) }}x
        </span>
        <input
          type="range"
          :min="zoomMin"
          :max="zoomMax"
          step="0.1"
          :value="currentZoom"
          @input="applyZoom(Number(($event.target as HTMLInputElement).value))"
          class="zoom-slider"
        />
      </div>
      <div
        v-if="isPaused"
        class="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs"
      >
        <span
          class="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full font-bold animate-pulse"
          >تم التقاط الكود بنجاح...</span
        >
      </div>
    </div>
    <div
      v-if="error"
      class="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[10px] font-semibold"
    >
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.zoom-slider {
  appearance: none;
  cursor: pointer;
  height: 96px;
  width: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  writing-mode: vertical-lr;
  direction: rtl;
}

.zoom-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.zoom-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 9999px;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}
</style>
