<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { LoaderCircle } from "@lucide/vue";
import PosProductCard from "./PosProductCard.vue";
import type { POSProduct } from "~/types/pos";

const props = defineProps<{
  products: POSProduct[];
  loading: boolean;
  hasMore: boolean;
  error?: string;
  selectedLocationId?: number | null;
}>();

const emit = defineEmits<{
  loadMore: [];
  productClick: [product: POSProduct];
  addToCart: [product: POSProduct];
}>();

const gridRef = ref<HTMLElement | null>(null);

const observer = ref<IntersectionObserver | null>(null);
const sentinelRef = ref<HTMLElement | null>(null);

onMounted(() => {
  if (typeof IntersectionObserver === "undefined") return;

  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && props.hasMore && !props.loading) {
        emit("loadMore");
      }
    },
    { rootMargin: "200px" },
  );

  if (sentinelRef.value) {
    observer.value.observe(sentinelRef.value);
  }
});

watch(
  () => props.products.length,
  () => {
    if (observer.value && sentinelRef.value) {
      observer.value.unobserve(sentinelRef.value);
      observer.value.observe(sentinelRef.value);
    }
  },
);
</script>

<template>
  <div ref="gridRef" class="space-y-4">
    <div
      v-if="loading && products.length === 0"
      class="flex items-center justify-center py-20"
    >
      <div class="flex flex-col items-center gap-3 text-muted-foreground">
        <LoaderCircle class="w-8 h-8 animate-spin text-primary" />
        <span class="text-sm">جاري تحميل المنتجات...</span>
      </div>
    </div>

    <div
      v-else-if="!loading && products.length === 0"
      class="flex items-center justify-center py-20 text-muted-foreground"
    >
      <div class="text-center space-y-2">
        <span class="material-symbols-outlined text-5xl text-muted-foreground/30">search_off</span>
        <p class="text-sm">لا توجد منتجات تطابق هذا البحث</p>
      </div>
    </div>

    <template v-else>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
      >
        <PosProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          :selected-location-id="selectedLocationId"
          @click="emit('productClick', product)"
          @add-to-cart="emit('addToCart', product)"
        />
      </div>

      <div ref="sentinelRef" class="h-4" />

      <div
        v-if="loading"
        class="flex items-center justify-center py-6"
      >
        <LoaderCircle class="w-6 h-6 animate-spin text-primary" />
      </div>

      <div
        v-if="!hasMore && products.length > 0"
        class="text-center py-4 text-xs text-muted-foreground"
      >
        تم عرض جميع المنتجات
      </div>
    </template>
  </div>
</template>
