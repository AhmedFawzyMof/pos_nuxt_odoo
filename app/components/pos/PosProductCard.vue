<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import type { POSProduct } from "~/types/pos";
import { Plus } from "@lucide/vue";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  product: POSProduct;
  selectedLocationId?: number | null;
}>();

const emit = defineEmits<{
  click: [];
  addToCart: [];
}>();

const displayPrice = computed(() => {
  return (Number(props.product.list_price) || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

const totalStock = computed(() => {
  if (!props.product.stock_by_location?.length) {
    return props.product.qty_available || 0;
  }
  if (props.selectedLocationId) {
    const loc = props.product.stock_by_location.find(
      (l) => l.location_id === props.selectedLocationId,
    );
    return loc?.quantity || 0;
  }
  return props.product.stock_by_location.reduce((s, l) => s + l.quantity, 0);
});

const stockLow = computed(() => totalStock.value > 0 && totalStock.value <= 5);
const stockOut = computed(() => totalStock.value <= 0);

const productImage = computed(() => {
  if (props.product.image_1920) {
    return `data:image/png;base64,${props.product.image_1920}`;
  }
  return null;
});
</script>

<template>
  <div
    @click="emit('click')"
    class="group relative bg-card border border-outline-variant/40 rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all cursor-pointer active:scale-[0.98] flex flex-col"
  >
    <div
      class="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden p-3"
    >
      <img
        v-if="productImage"
        :src="productImage"
        :alt="product.name"
        class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
      />
      <span
        v-else
        class="material-symbols-outlined text-4xl text-muted-foreground/40"
        >inventory_2</span
      >
    </div>
    <div class="p-2.5 space-y-1.5 flex-1 flex flex-col">
      <h4 class="text-xs font-semibold leading-tight line-clamp-2">
        {{ product.display_name || product.name }}
      </h4>
      <div class="flex items-center gap-1 flex-wrap">
        <Badge
          v-if="stockOut"
          variant="destructive"
          class="text-[10px] px-1.5 py-0"
        >
          نفذ
        </Badge>
        <Badge
          v-else-if="stockLow"
          variant="secondary"
          class="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 hover:bg-amber-100"
        >
          {{ totalStock }} فقط
        </Badge>
        <Badge
          v-else-if="totalStock > 0"
          variant="outline"
          class="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-200"
        >
          {{ totalStock }}
        </Badge>
      </div>
      <div class="mt-auto pt-1 flex items-center justify-between">
        <span class="text-sm font-bold text-primary">
          {{ displayPrice }} ج.م
        </span>
        <Button @click.stop="emit('addToCart')" :disabled="stockOut">
          <Plus />
        </Button>
      </div>
    </div>
  </div>
</template>
