<script setup lang="ts">
import { ref, watch } from "vue";
import { X, RefreshCw } from "@lucide/vue";
import type { Supplier } from "~/types/supplier";
import { usePermissions } from '~/composables/usePermissions'
const { can } = usePermissions()

const props = defineProps<{
  isOpen: boolean;
  mode: "add" | "edit";
  supplier: Supplier | null;
  isSaving: boolean;
  actionError: string;
}>();

const emit = defineEmits<{
  (e: "update:isOpen", value: boolean): void;
  (e: "update:actionError", value: string): void;
  (e: "save", payload: Record<string, any>): void;
}>();

const formData = ref<Record<string, any>>({});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.mode === "add") {
        formData.value = {
          name: "",
          email: "",
          phone: "",
          street: "",
          city: "",
          vat: "",
        };
      } else if (props.mode === "edit" && props.supplier) {
        formData.value = {
          id: props.supplier.id,
          name: props.supplier.name,
          email: props.supplier.email,
          phone: props.supplier.phone,
          street: props.supplier.street,
          city: props.supplier.city,
          vat: props.supplier.vat,
        };
      }
    }
  },
);

const closeDrawer = () => {
  emit("update:isOpen", false);
  emit("update:actionError", "");
};

const saveSupplier = () => {
  emit("save", formData.value);
};
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/30 z-50 flex justify-center"
      @click.self="closeDrawer"
    >
      <div
        class="w-full bg-white h-full overflow-y-auto shadow-xl max-w-7xl mx-auto"
      >
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-headline-md font-bold text-on-white">
            {{ mode === "add" ? "إضافة مورد جديد" : "تعديل بيانات المورد" }}
          </h2>
          <button
            @click="closeDrawer"
            class="text-on-white-variant hover:text-on-white cursor-pointer text-xl"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div
          v-if="actionError"
          class="mb-4 p-3 bg-error/10 border border-error/30 text-error font-bold rounded-lg text-sm"
        >
          {{ actionError }}
        </div>

        <form @submit.prevent="saveSupplier" class="space-y-6">
          <div class="space-y-2">
            <label class="block text-label-md text-on-white-variant font-bold"
              >اسم المورد *</label
            >
            <input
              v-model="formData.name"
              class="w-full h-11 px-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none"
              type="text"
              required
            />
          </div>
          <div class="space-y-2">
            <label class="block text-label-md text-on-white-variant font-bold"
              >البريد الإلكتروني</label
            >
            <input
              v-model="formData.email"
              class="w-full h-11 px-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none"
              type="email"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-label-md text-on-white-variant font-bold"
              >رقم الهاتف</label
            >
            <input
              v-model="formData.phone"
              class="w-full h-11 px-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none"
              type="text"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-label-md text-on-white-variant font-bold"
              >العنوان</label
            >
            <input
              v-model="formData.street"
              class="w-full h-11 px-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none"
              type="text"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-label-md text-on-white-variant font-bold"
              >المدينة</label
            >
            <input
              v-model="formData.city"
              class="w-full h-11 px-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none"
              type="text"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-label-md text-on-white-variant font-bold"
              >الرقم الضريبي</label
            >
            <input
              v-model="formData.vat"
              class="w-full h-11 px-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary outline-none"
              type="text"
            />
          </div>
          <div class="pt-4 flex gap-4">
            <button
              type="submit"
              :disabled="isSaving"
              class="flex-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                v-if="isSaving"
                class="w-5 h-5 inline-block animate-spin ml-1"
              />
              {{ isSaving ? "جاري الحفظ..." : "حفظ" }}
            </button>
            <button
              type="button"
              @click="closeDrawer"
              class="flex-1 py-3 border border-outline-variant text-on-white font-bold rounded-lg hover:bg-white-low transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>
