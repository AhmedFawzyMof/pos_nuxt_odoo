<script setup lang="ts">
import type { POSCategory } from "~/types/pos";

const props = defineProps<{
  categories: POSCategory[];
  activeCategoryId: number | null;
  horizontal?: boolean;
}>();

const emit = defineEmits<{
  select: [categoryId: number | null];
}>();
</script>

<template>
  <div
    v-if="horizontal"
    class="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden"
  >
    <button
      @click="emit('select', null)"
      class="shrink-0 px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer whitespace-nowrap border"
      :class="
        activeCategoryId === null
          ? 'bg-primary text-white border-primary font-bold shadow-sm'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground border-outline-variant/20'
      "
    >
      {{ categories.reduce((s, c) => s + c.productsCount, 0) }}
    </button>
    <button
      v-for="cat in categories"
      :key="cat.id"
      @click="emit('select', cat.id)"
      class="shrink-0 px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer whitespace-nowrap border"
      :class="
        activeCategoryId === cat.id
          ? 'bg-primary text-white border-primary font-bold shadow-sm'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground border-outline-variant/20'
      "
    >
      {{ cat.name }} | {{ cat.productsCount }}
    </button>
  </div>
  <div v-else class="space-y-1">
    <button
      @click="emit('select', null)"
      class="w-full text-right px-3 py-2 rounded-lg text-sm transition-all cursor-pointer"
      :class="
        activeCategoryId === null
          ? 'bg-primary text-white font-bold shadow-sm'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
      "
    >
      <div class="flex items-center justify-between">
        <span>كل المنتجات</span>
        <span
          class="text-[11px] tabular-nums"
          :class="
            activeCategoryId === null
              ? 'text-white/70'
              : 'text-muted-foreground'
          "
        >
          {{ categories.reduce((s, c) => s + c.productsCount, 0) }}
        </span>
      </div>
    </button>
    <button
      v-for="cat in categories"
      :key="cat.id"
      @click="emit('select', cat.id)"
      class="w-full text-right px-3 py-2 rounded-lg text-sm transition-all cursor-pointer"
      :class="
        activeCategoryId === cat.id
          ? 'bg-primary/10 text-primary font-bold'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
      "
    >
      <div class="flex items-center justify-between">
        <span>{{ cat.name }}</span>
        <span
          class="text-[11px] tabular-nums"
          :class="
            activeCategoryId === cat.id
              ? 'text-primary/60'
              : 'text-muted-foreground'
          "
        >
          {{ cat.productsCount }}
        </span>
      </div>
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}
</style>
