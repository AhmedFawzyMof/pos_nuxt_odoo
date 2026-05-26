<script setup lang="ts">
interface MovementItem {
  title: string;
  meta: string;
  qty: string;
  action: string;
  icon: string;
  color: string;
}

defineProps<{
  movements: MovementItem[];
}>();
</script>

<template>
  <div
    class="bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col h-full"
  >
    <div
      class="p-6 border-b border-outline-variant bg-white/50 backdrop-blur-sm"
    >
      <h2 class="text-headline-sm font-bold flex items-center gap-2">
        <span class="material-symbols-outlined text-primary">history</span>
        حركات المخزون الأخيرة
      </h2>
    </div>
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Movement Row -->
      <div
        v-for="(mv, idx) in movements"
        :key="idx"
        class="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
      >
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          :class="mv.color"
        >
          <span class="material-symbols-outlined">{{ mv.icon }}</span>
        </div>
        <div class="flex-1">
          <p class="text-label-md font-bold text-on-surface">
            {{ mv.title }}
          </p>
          <p class="text-xs text-on-surface-variant">{{ mv.meta }}</p>
        </div>
        <div class="text-left">
          <p
            class="font-bold"
            :class="mv.qty.startsWith('+') ? 'text-primary' : 'text-error'"
          >
            {{ mv.qty }}
          </p>
          <p class="text-[10px] text-on-surface-variant">{{ mv.action }}</p>
        </div>
      </div>
    </div>
    <div class="p-4 border-t border-outline-variant bg-surface-container-low">
      <NuxtLink
        to="/stock-movements"
        class="block w-full text-center text-label-md text-primary font-bold hover:underline"
      >
        عرض جميع التحركات
      </NuxtLink>
    </div>
  </div>
</template>
