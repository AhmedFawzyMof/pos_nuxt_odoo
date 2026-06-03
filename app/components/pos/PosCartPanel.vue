<script setup lang="ts">
import { computed } from "vue";
import { ShoppingCart, Trash2, Receipt } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import PosCartItem from "./PosCartItem.vue";
import { usePosCartStore } from "~~/stores/pos-cart";

const props = withDefaults(defineProps<{
  bordered?: boolean;
}>(), {
  bordered: true,
});

const emit = defineEmits<{
  checkout: [];
}>();

const cart = usePosCartStore();

const isEmpty = computed(() => cart.items.length === 0);
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0 bg-card" :class="bordered ? 'border-r border-outline-variant/40' : ''">
    <div class="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
      <div class="flex items-center gap-2">
        <ShoppingCart class="w-5 h-5 text-primary" />
        <h3 class="font-bold text-sm">الفواتير</h3>
        <span
          v-if="cart.itemCount > 0"
          class="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none"
        >
          {{ cart.itemCount }}
        </span>
      </div>
      <button
        v-if="!isEmpty"
        @click="cart.clearCart()"
        class="text-muted-foreground hover:text-destructive transition-colors text-xs flex items-center gap-1 cursor-pointer"
      >
        <Trash2 class="w-3.5 h-3.5" />
        تفريغ
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-2 space-y-0">
      <div
        v-if="isEmpty"
        class="flex flex-col items-center justify-center h-full text-muted-foreground"
      >
        <span class="material-symbols-outlined text-5xl text-muted-foreground/30">shopping_cart</span>
        <p class="text-sm mt-2">الفواتير فارغة</p>
        <p class="text-xs mt-1">اختر المنتجات من الكتالوج</p>
      </div>
      <PosCartItem
        v-for="item in cart.items"
        :key="item.product.id"
        :item="item"
        @update-quantity="(q) => cart.updateQuantity(item.product.id, q)"
        @remove="cart.removeItem(item.product.id)"
      />
    </div>

    <div class="border-t border-outline-variant/20 px-4 py-4 space-y-3">
      <div class="space-y-1.5 text-sm">
        <div class="flex justify-between text-muted-foreground">
          <span>الإجمالي قبل الضريبة</span>
          <span class="tabular-nums font-medium">
            {{ cart.subtotal.toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }} ج.م
          </span>
        </div>
        <div class="flex justify-between text-base font-bold pt-1 border-t border-outline-variant/20">
          <span>الإجمالي</span>
          <span class="tabular-nums text-primary">
            {{ cart.grandTotal.toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }} ج.م
          </span>
        </div>
      </div>

      <Button
        class="w-full gap-2 cursor-pointer"
        :disabled="isEmpty"
        size="lg"
        @click="emit('checkout')"
      >
        <Receipt class="w-4 h-4" />
        إتمام الطلب
      </Button>
    </div>
  </div>
</template>
