<script setup lang="ts">
interface LocationItem {
  name: string;
  address: string;
  status: string;
  statusColor: string;
  qty: string;
  capacity: string;
  capacityWidth: string;
  progressBarColor: string;
}

import { Warehouse, Plus, ArrowRightLeft, Store, Building2, MapPin } from '@lucide/vue';

defineProps<{
  locations: LocationItem[];
}>();

defineEmits<{
  (e: "create-location"): void;
  (e: "stock-transfer"): void;
}>();
</script>

<template>
  <div
    class="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden"
  >
    <div
      class="p-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-center md:items-start bg-white/50 backdrop-blur-sm sticky top-0"
    >
      <h2 class="text-headline-sm font-bold flex items-center gap-2">
        <Warehouse class="text-primary w-6 h-6" />
        المواقع والمخازن
      </h2>
      <div class="flex gap-2 flex-col md:flex-row">
        <button
          @click="$emit('create-location')"
          class="px-4 py-2 bg-primary text-white rounded-lg text-label-md font-bold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
        >
          <Plus class="w-5 h-5" />
          إنشاء موقع جديد
        </button>
        <button
          @click="$emit('stock-transfer')"
          class="px-4 py-2 bg-primary text-white rounded-lg text-label-md font-bold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowRightLeft class="w-5 h-5" />
          نقل مخزني
        </button>
      </div>
    </div>
    <div class="divide-y divide-outline-variant">
      <!-- Location Item -->
      <div
        v-for="(loc, idx) in locations"
        :key="idx"
        class="p-6 hover:bg-surface-container-low transition-colors group cursor-pointer"
      >
        <div class="flex justify-between items-start">
          <div class="flex gap-4">
            <div
              class="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary-container/30 transition-colors"
            >
              <component :is="idx === 0 ? Store : idx === 1 ? Building2 : MapPin" class="w-6 h-6" />
            </div>
            <div>
              <h4 class="font-bold text-body-lg text-on-surface">
                {{ loc.name }}
              </h4>
              <p class="text-on-surface-variant text-label-md">
                {{ loc.address }}
              </p>
            </div>
          </div>
          <div class="text-left">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
              :class="loc.statusColor"
            >
              {{ loc.status }}
            </span>
            <p class="text-price-display font-bold text-primary">
              {{ loc.qty }}
              <span class="text-body-md font-normal text-on-surface-variant"
                >قطعة</span
              >
            </p>
          </div>
        </div>
        <div
          class="mt-4 w-full bg-surface-container-high h-2 rounded-full overflow-hidden"
        >
          <div
            class="h-full rounded-full"
            :class="[loc.progressBarColor, loc.capacityWidth]"
          ></div>
        </div>
        <div
          class="flex justify-between mt-2 text-label-md text-on-surface-variant"
        >
          <span>سعة التخزين المستهلكة</span>
          <span>{{ loc.capacity }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
