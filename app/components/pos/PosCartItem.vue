<script setup lang="ts">
import { ref, computed } from "vue";
import { Minus, Plus, Trash2 } from "@lucide/vue";
import type { CartItem } from "~/types/pos";

const props = defineProps<{
  item: CartItem;
}>();

const emit = defineEmits<{
  updateQuantity: [quantity: number];
  remove: [];
}>();

const localQty = ref(props.item.quantity);

const lineTotal = computed(() => {
  const total = props.item.price * localQty.value;
  const discount = props.item.discount || 0;
  return total - discount;
});

function increment() {
  localQty.value++;
  emit("updateQuantity", localQty.value);
}

function decrement() {
  if (localQty.value > 1) {
    localQty.value--;
    emit("updateQuantity", localQty.value);
  }
}
</script>

<template>
  <div class="flex items-start gap-3 py-3 border-b border-outline-variant/20 last:border-0">
    <div class="flex-1 min-w-0 space-y-1">
      <h4 class="text-sm font-semibold leading-tight truncate">
        {{ item.product.display_name || item.product.name }}
      </h4>
      <p class="text-xs text-muted-foreground">
        {{ item.price.toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }} ج.م
      </p>
      <div class="flex items-center gap-2 mt-1.5">
        <button
          @click="decrement"
          class="h-7 w-7 rounded-full border border-outline-variant/50 flex items-center justify-center hover:bg-muted/70 transition-colors cursor-pointer"
        >
          <Minus class="w-3.5 h-3.5" />
        </button>
        <span class="text-sm font-bold tabular-nums w-6 text-center">{{ localQty }}</span>
        <button
          @click="increment"
          class="h-7 w-7 rounded-full border border-outline-variant/50 flex items-center justify-center hover:bg-muted/70 transition-colors cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    <div class="flex flex-col items-end gap-1 shrink-0">
      <span class="text-sm font-bold tabular-nums">
        {{ lineTotal.toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }}
      </span>
      <button
        @click="emit('remove')"
        class="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
