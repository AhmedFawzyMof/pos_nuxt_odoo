<script setup lang="ts">
import { ref, watch } from "vue";
import { Search, X } from "@lucide/vue";
import BarcodeScanner from "./BarcodeScanner.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    scannerActive?: boolean;
  }>(),
  { scannerActive: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:scannerActive": [value: boolean];
  scan: [barcode: string];
  error: [message: string];
}>();

const localValue = ref(props.modelValue);

watch(() => props.modelValue, (v) => { localValue.value = v; });

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  localValue.value = val;
  emit("update:modelValue", val);
}

function clear() {
  localValue.value = "";
  emit("update:modelValue", "");
}

function handleScan(barcode: string) {
  emit("scan", barcode);
}

function toggleScanner() {
  emit("update:scannerActive", !props.scannerActive);
}
</script>

<template>
  <div class="flex items-center gap-2 w-full">
    <div class="relative flex-1">
      <Search class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <input
        :value="localValue"
        @input="onInput"
        :placeholder="scannerActive ? 'ماسح الباركود نشط...' : 'بحث بالاسم أو الباركود...'"
        class="w-full h-10 pr-9 pl-9 bg-muted/50 border border-outline-variant/60 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
      <button
        v-if="localValue"
        @click="clear"
        class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
    <button
      @click="toggleScanner"
      class="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg border border-outline-variant/60 hover:bg-muted/80 transition-all cursor-pointer"
      :class="{ 'bg-primary/10 border-primary/30 text-primary': scannerActive }"
      title="ماسح الباركود"
    >
      <span class="material-symbols-outlined text-lg">qr_code_scanner</span>
    </button>
    <div v-if="scannerActive" class="absolute top-14 left-0 right-0 z-50 max-w-md mx-auto">
      <BarcodeScanner
        :active="scannerActive"
        @scan="handleScan"
        @update:active="(v) => emit('update:scannerActive', v)"
        @error="(msg) => emit('error', msg)"
      />
    </div>
  </div>
</template>
