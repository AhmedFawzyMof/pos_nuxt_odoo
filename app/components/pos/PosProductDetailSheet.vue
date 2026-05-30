<script setup lang="ts">
import { computed } from "vue";
import { X } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import type { POSProduct } from "~/types/pos";

const props = defineProps<{
  product: POSProduct | null;
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  addToCart: [product: POSProduct];
}>();

const displayPrice = computed(() => {
  if (!props.product) return "0.00";
  return (Number(props.product.list_price) || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

const productImage = computed(() => {
  if (props.product?.image_1920) {
    return `data:image/png;base64,${props.product.image_1920}`;
  }
  return null;
});

function handleClose() {
  emit("update:open", false);
}

function handleAddToCart() {
  if (props.product) {
    emit("addToCart", props.product);
    handleClose();
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="handleClose">
    <SheetContent side="left" class="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader class="mb-4">
        <SheetTitle class="text-lg">{{ product?.display_name || product?.name }}</SheetTitle>
        <SheetClose as-child>
          <button class="absolute left-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </SheetClose>
      </SheetHeader>

      <template v-if="product">
        <div class="aspect-square bg-muted/30 rounded-xl flex items-center justify-center overflow-hidden mb-4">
          <img
            v-if="productImage"
            :src="productImage"
            :alt="product.name"
            class="w-full h-full object-contain"
          />
          <span v-else class="material-symbols-outlined text-6xl text-muted-foreground/30">inventory_2</span>
        </div>

        <div class="space-y-4">
          <div>
            <h3 class="text-2xl font-bold text-primary">{{ displayPrice }} ج.م</h3>
            <p v-if="product.barcode" class="text-xs text-muted-foreground font-mono mt-1">
              الباركود: {{ product.barcode }}
            </p>
          </div>

          <div v-if="product.pos_categories?.length" class="flex flex-wrap gap-1.5">
            <Badge
              v-for="cat in product.pos_categories"
              :key="cat.id"
              variant="secondary"
              class="text-xs"
            >
              {{ cat.name }}
            </Badge>
          </div>

          <div v-if="product.stock_by_location?.length">
            <h4 class="text-sm font-semibold mb-2">المخزون حسب المستودع</h4>
            <div class="space-y-1.5">
              <div
                v-for="loc in product.stock_by_location"
                :key="loc.location_id"
                class="flex justify-between text-sm px-3 py-1.5 bg-muted/30 rounded-lg"
              >
                <span class="text-muted-foreground">{{ loc.location_name }}</span>
                <span class="font-bold tabular-nums">{{ loc.quantity }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-muted/30 rounded-lg p-3">
              <span class="text-muted-foreground text-xs">سعر الشراء</span>
              <p class="font-bold">
                {{ (Number(product.standard_price) || 0).toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }}
              </p>
            </div>
            <div class="bg-muted/30 rounded-lg p-3">
              <span class="text-muted-foreground text-xs">الوزن</span>
              <p class="font-bold">{{ product.weight || 0 }}</p>
            </div>
            <div class="bg-muted/30 rounded-lg p-3">
              <span class="text-muted-foreground text-xs">الوارد</span>
              <p class="font-bold">{{ product.incoming_qty }}</p>
            </div>
            <div class="bg-muted/30 rounded-lg p-3">
              <span class="text-muted-foreground text-xs">الصادر</span>
              <p class="font-bold">{{ product.outgoing_qty }}</p>
            </div>
          </div>

          <Button
            @click="handleAddToCart"
            class="w-full gap-2 cursor-pointer"
            size="lg"
          >
            <span class="material-symbols-outlined text-lg">add_shopping_cart</span>
            إضافة إلى الفاتورة
          </Button>
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
