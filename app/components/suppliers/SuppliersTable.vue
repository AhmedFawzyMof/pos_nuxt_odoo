<script setup lang="ts">
import { SearchX } from "@lucide/vue";
import Skeleton from "@/components/ui/skeleton/Skeleton.vue";
import type { Supplier } from "~/types/supplier";
import { usePermissions } from '~/composables/usePermissions'
const { can } = usePermissions()

defineProps<{
  suppliers: Supplier[];
  status: string;
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  (e: "edit", supplier: Supplier): void;
  (e: "next-page"): void;
  (e: "prev-page"): void;
}>();
</script>

<template>
  <div
    class="bg-white border border-outline-variant rounded-xl overflow-hidden"
  >
    <div
      v-if="status === 'pending' && suppliers.length === 0"
      class="bg-white border border-outline-variant rounded-xl overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-right border-collapse">
          <thead class="bg-white-low text-on-white-variant">
            <tr>
              <th class="p-4 text-label-md font-bold">الاسم</th>
              <th class="p-4 text-label-md font-bold">رقم الهاتف</th>
              <th class="p-4 text-label-md font-bold">الرقم الضريبي</th>
              <th class="p-4 text-label-md font-bold">شروط الدفع</th>
              <th class="p-4 text-label-md font-bold">إجمالي المشتريات</th>
              <th class="p-4 text-label-md font-bold">المستحق</th>
              <th class="p-4 text-label-md font-bold">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/45">
            <tr v-for="i in 5" :key="'skeleton-' + i">
              <td class="p-4"><Skeleton class="h-4 w-32" /></td>
              <td class="p-4"><Skeleton class="h-4 w-24" /></td>
              <td class="p-4"><Skeleton class="h-4 w-20" /></td>
              <td class="p-4"><Skeleton class="h-4 w-28" /></td>
              <td class="p-4"><Skeleton class="h-4 w-20" /></td>
              <td class="p-4"><Skeleton class="h-4 w-16" /></td>
              <td class="p-4"><Skeleton class="h-8 w-14 rounded-lg" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-else-if="suppliers.length === 0"
      class="p-12 text-center text-on-white-variant"
    >
      <SearchX class="w-10 h-10 block mb-2 mx-auto text-outline" />
      <p class="font-bold">لا يوجد موردون</p>
      <p class="text-sm mt-1">حاول تغيير معايير البحث أو التصفية</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-right border-collapse">
        <thead class="bg-white-low text-on-white-variant">
          <tr>
            <th class="p-4 text-label-md font-bold">الاسم</th>
            <th class="p-4 text-label-md font-bold">رقم الهاتف</th>
            <th class="p-4 text-label-md font-bold">الرقم الضريبي</th>
            <th class="p-4 text-label-md font-bold">شروط الدفع</th>
            <th class="p-4 text-label-md font-bold">إجمالي المشتريات</th>
            <th class="p-4 text-label-md font-bold">المستحق</th>
            <th class="p-4 text-label-md font-bold">الإجراءات</th>
          </tr>
        </thead>
        <tbody
          class="divide-y divide-outline-variant/45 text-body-md text-on-white"
        >
          <tr
            v-for="supplier in suppliers"
            :key="supplier.id"
            class="hover:bg-primary/5 transition-colors"
          >
            <td class="p-4 font-bold">
              <NuxtLink
                :to="`/supplier-details?id=${supplier.id}`"
                class="text-primary hover:underline"
              >
                {{ supplier.name }}
              </NuxtLink>
            </td>
            <td class="p-4 text-on-white-variant">
              {{ supplier.phone || "-" }}
            </td>
            <td class="p-4 text-on-white-variant">
              {{ supplier.vat || "-" }}
            </td>
            <td class="p-4">
              {{
                supplier.property_supplier_payment_term_id
                  ? supplier.property_supplier_payment_term_id[1]
                  : "-"
              }}
            </td>
            <td class="p-4 font-bold text-primary">
              {{ supplier.total_purchased.toLocaleString("ar-EG") }} ج.م
            </td>
            <td class="p-4">
              <span
                v-if="supplier.outstanding > 0"
                class="text-amber-600 font-bold"
              >
                {{ supplier.outstanding.toLocaleString("ar-EG") }} ج.م
              </span>
              <span v-else class="text-on-white-variant">0</span>
            </td>
            <td class="p-4">
              <button
                v-if="can('supplier.edit')"
                @click="emit('edit', supplier)"
                class="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all cursor-pointer"
              >
                تعديل
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="totalPages > 1"
      class="p-4 bg-white-low border-t border-outline-variant flex justify-center gap-4"
    >
      <button
        @click="emit('prev-page')"
        :disabled="currentPage <= 1"
        class="px-4 py-2 border border-outline-variant rounded-lg disabled:opacity-40 cursor-pointer"
      >
        السابق
      </button>
      <span class="flex items-center text-on-white-variant">
        الصفحة {{ currentPage }} من {{ totalPages }}
      </span>
      <button
        @click="emit('next-page')"
        :disabled="currentPage >= totalPages"
        class="px-4 py-2 border border-outline-variant rounded-lg disabled:opacity-40 cursor-pointer"
      >
        التالي
      </button>
    </div>
  </div>
</template>
