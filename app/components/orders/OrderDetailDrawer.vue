<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  X,
  LoaderCircle,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckCheck,
  Edit3,
  Save,
  Plus,
  Banknote,
  Wallet,
} from "@lucide/vue";
import type { POSOrder, OrderLine, OrderPayment, PaymentMethod } from "~/types/pos";

const props = defineProps<{
  isOpen: boolean;
  orderId: number | null;
}>();

const emit = defineEmits<{
  (e: "update:isOpen", value: boolean): void;
  (e: "refresh"): void;
}>();

const loading = ref(false);
const saving = ref(false);
const error = ref("");
const toast = ref<{ show: boolean; message: string; type: "success" | "error" }>({
  show: false,
  message: "",
  type: "success",
});

const order = ref<POSOrder | null>(null);
const lines = ref<OrderLine[]>([]);
const payments = ref<OrderPayment[]>([]);
const editingPayments = ref<Record<number, number>>({});
const selectedStatus = ref("");
const showAddPayment = ref(false);
const newPaymentName = ref("");
const newPaymentAmount = ref(0);
const addPaymentError = ref("");
const availablePaymentMethods = ref<PaymentMethod[]>([]);

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  paid: "مدفوع",
  done: "منتهي",
  cancelled: "ملغي",
  invoiced: "مفوتر",
  refund: "مرتجع",
};

const statusColors: Record<string, string> = {
  draft: "bg-secondary-container text-secondary",
  paid: "bg-primary/10 text-primary",
  done: "bg-tertiary-container/30 text-tertiary",
  cancelled: "bg-error-container text-error",
  invoiced: "bg-secondary-fixed text-on-secondary-fixed",
  refund: "bg-amber-100 text-amber-700",
};

const totalFromLines = computed(() =>
  lines.value.reduce((sum, l) => sum + l.price_subtotal, 0),
);

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.orderId) {
      fetchDetail(props.orderId);
    }
  },
);

async function fetchDetail(orderId: number) {
  loading.value = true;
  error.value = "";
  try {
    const data = await $fetch<any>("/api/orders/detail", {
      query: { id: orderId },
    });
    if (data.success) {
      order.value = data.order;
      lines.value = data.lines || [];
      payments.value = data.payments || [];
      const methods = data.payment_methods || [];
      const seen = new Set<string>();
      availablePaymentMethods.value = methods.filter((m: PaymentMethod) => {
        if (seen.has(m.name)) return false;
        seen.add(m.name);
        return true;
      });
      selectedStatus.value = data.order.state;
      editingPayments.value = {};
      for (const p of data.payments || []) {
        editingPayments.value[p.id] = p.amount;
      }
    } else {
      error.value = data.message || "فشل تحميل تفاصيل الطلب";
    }
  } catch (err: any) {
    error.value = err.statusMessage || "خطأ في الاتصال بالخادم";
  } finally {
    loading.value = false;
  }
}

function closeDrawer() {
  emit("update:isOpen", false);
  order.value = null;
  lines.value = [];
  payments.value = [];
  error.value = "";
  showAddPayment.value = false;
  newPaymentName.value = "";
  newPaymentAmount.value = 0;
  addPaymentError.value = "";
  availablePaymentMethods.value = [];
}

function showToast(message: string, type: "success" | "error") {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 3000);
}

async function changeStatus() {
  if (!order.value || !selectedStatus.value || selectedStatus.value === order.value.state) return;
  saving.value = true;
  try {
    const res = await $fetch<any>("/api/orders/status", {
      method: "POST",
      body: { order_id: order.value.id, state: selectedStatus.value },
    });
    if (res.success) {
      showToast("تم تحديث حالة الطلب بنجاح", "success");
      order.value.state = selectedStatus.value as any;
      emit("refresh");
      if (order.value) fetchDetail(order.value.id);
    } else {
      showToast(res.message || "فشل تحديث الحالة", "error");
    }
  } catch (err: any) {
    showToast(err.statusMessage || "خطأ في الاتصال", "error");
  } finally {
    saving.value = false;
  }
}

function addPaymentLine() {
  addPaymentError.value = "";
  if (!newPaymentName.value.trim()) {
    addPaymentError.value = "يرجى إدخال اسم طريقة الدفع";
    return;
  }
  if (newPaymentAmount.value <= 0) {
    addPaymentError.value = "يرجى إدخال مبلغ صحيح";
    return;
  }

  const tempId = -Date.now();
  const method = availablePaymentMethods.value.find(
    (m) => m.name === newPaymentName.value.trim(),
  );
  if (!method) {
    addPaymentError.value = "طريقة الدفع المحددة غير موجودة";
    return;
  }
  payments.value.push({
    id: tempId,
    payment_method_id: [method.id, newPaymentName.value.trim()],
    amount: newPaymentAmount.value,
    payment_date: "",
    payment_status: "paid",
  });
  editingPayments.value[tempId] = newPaymentAmount.value;
  newPaymentName.value = "";
  newPaymentAmount.value = 0;
}

async function savePayments() {
  if (!order.value) {
    showToast("بيانات الطلب غير متاحة، حاول إعادة فتح النافذة", "error");
    return;
  }
  const hasTemp = payments.value.some(p => p.id < 0);
  if (hasTemp) {
    const invalidPayment = payments.value.find(p => p.id < 0 && (!p.payment_method_id || !p.payment_method_id[0]));
    if (invalidPayment) {
      showToast("طريقة الدفع غير صالحة، حاول إزالة الدفعة وإضافتها مجدداً", "error");
      return;
    }
  }
  saving.value = true;
  try {
    const paymentsPayload = payments.value.map((p) => ({
      id: p.id < 0 ? null : p.id,
      method_id: p.payment_method_id[0],
      amount: editingPayments.value[p.id] ?? p.amount,
    }));
    const res = await $fetch<any>("/api/orders/payments", {
      method: "POST",
      body: { order_id: order.value.id, payments: paymentsPayload },
    });
    if (res.success) {
      showToast("تم تحديث المدفوعات بنجاح", "success");
      for (const p of payments.value) {
        p.amount = editingPayments.value[p.id] ?? p.amount;
      }
      emit("refresh");
      if (order.value) await fetchDetail(order.value.id);
    } else {
      showToast(res.message || "فشل تحديث المدفوعات", "error");
    }
  } catch (err: any) {
    showToast(err.statusMessage || "خطأ في الاتصال", "error");
  } finally {
    saving.value = false;
  }
}

async function removeLine(lineId: number) {
  if (!order.value) return;
  if (!confirm("هل أنت متأكد من حذف هذا الصنف من الطلب؟")) return;
  saving.value = true;
  try {
    const res = await $fetch<any>("/api/orders/remove-item", {
      method: "POST",
      body: { order_id: order.value.id, line_id: lineId },
    });
    if (res.success) {
      showToast("تم حذف الصنف بنجاح", "success");
      lines.value = lines.value.filter((l) => l.id !== lineId);
      emit("refresh");
      if (order.value) fetchDetail(order.value.id);
    } else {
      showToast(res.message || "فشل حذف الصنف", "error");
    }
  } catch (err: any) {
    showToast(err.statusMessage || "خطأ في الاتصال", "error");
  } finally {
    saving.value = false;
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity flex justify-center"
    @click="closeDrawer"
  >
    <div
      class="h-full bg-white w-full max-w-2xl bg-white shadow-2xl flex flex-col relative transition-transform duration-300"
      @click.stop
    >
      <!-- Header -->
      <div
        class="p-6 border-b border-outline-variant flex items-center justify-between bg-white shrink-0"
      >
        <div>
          <h4 class="text-headline-sm font-bold text-on-white">
            تفاصيل الطلب
          </h4>
          <p v-if="order" class="text-label-md text-on-white-variant mt-0.5">
            {{ order.name }}
          </p>
        </div>
        <button
          @click="closeDrawer"
          class="p-2 rounded-full hover:bg-white-highest transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex-1 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-3 text-on-white-variant">
          <LoaderCircle class="w-8 h-8 animate-spin text-primary" />
          <span class="text-[13px]">جاري تحميل تفاصيل الطلب...</span>
        </div>
      </div>

      <!-- Error -->
      <div
        v-else-if="error && !order"
        class="flex-1 flex flex-col items-center justify-center p-8 gap-4"
      >
        <AlertCircle class="w-12 h-12 text-error" />
        <p class="text-error font-bold text-center">{{ error }}</p>
        <button
          @click="orderId && fetchDetail(orderId)"
          class="px-6 py-2 bg-error text-on-error rounded-full font-bold active:scale-95 transition-all cursor-pointer"
        >
          إعادة المحاولة
        </button>
      </div>

      <!-- Content -->
      <div v-else-if="order" class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <!-- Status Change -->
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex-1 min-w-0">
            <label class="block text-xs font-bold text-on-white-variant mb-1.5">
              حالة الطلب
            </label>
            <div class="flex gap-2">
              <select
                v-model="selectedStatus"
                class="flex-1 h-11 px-3 bg-white border border-outline-variant rounded-lg text-body-md outline-none cursor-pointer"
              >
                <option
                  v-for="(label, key) in statusLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
              <button
                v-if="selectedStatus !== order.state"
                @click="changeStatus"
                :disabled="saving"
                class="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/95 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Save class="w-4 h-4" />
                حفظ
              </button>
            </div>
          </div>
          <div
            class="px-4 py-2 rounded-full text-label-md font-bold self-end"
            :class="statusColors[order.state] || 'bg-white-low text-on-white-variant'"
          >
            {{ statusLabels[order.state] || order.state }}
          </div>
        </div>

        <!-- Order Info -->
        <div class="bg-white-low p-4 rounded-xl grid grid-cols-2 gap-4">
          <div>
            <p class="text-[10px] text-on-white-variant font-bold mb-0.5">رقم الطلب</p>
            <p class="text-body-md font-bold font-mono">{{ order.name }}</p>
          </div>
          <div>
            <p class="text-[10px] text-on-white-variant font-bold mb-0.5">التاريخ</p>
            <p class="text-body-md">{{ formatDate(order.date_order) }}</p>
          </div>
          <div>
            <p class="text-[10px] text-on-white-variant font-bold mb-0.5">العميل</p>
            <p class="text-body-md font-bold">
              {{ order.partner_id ? order.partner_id[1] : 'عميل نقدي' }}
            </p>
          </div>
          <div>
            <p class="text-[10px] text-on-white-variant font-bold mb-0.5">الكاشير</p>
            <p class="text-body-md">{{ order.user_id ? order.user_id[1] : '—' }}</p>
          </div>
        </div>

        <!-- Order Lines / Items -->
        <div>
          <h5 class="text-label-md font-bold text-primary border-r-4 border-primary pr-3 mb-3">
            أصناف الفاتورة
          </h5>
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse">
              <thead>
                <tr class="bg-white-low text-on-white-variant border-b border-outline-variant">
                  <th class="px-3 py-2 text-[11px] font-bold">المنتج</th>
                  <th class="px-3 py-2 text-[11px] font-bold">الكمية</th>
                  <th class="px-3 py-2 text-[11px] font-bold">السعر</th>
                  <th class="px-3 py-2 text-[11px] font-bold">الخصم</th>
                  <th class="px-3 py-2 text-[11px] font-bold">الإجمالي</th>
                  <th class="px-3 py-2 text-[11px] font-bold"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/40">
                <tr v-for="line in lines" :key="line.id" class="hover:bg-white-low/50">
                  <td class="px-3 py-3 text-body-md font-bold text-on-white">
                    {{ line.product_id ? line.product_id[1] : `#${line.product_id?.[0] || ''}` }}
                  </td>
                  <td class="px-3 py-3 text-body-md">{{ line.qty }}</td>
                  <td class="px-3 py-3 text-body-md">{{ Number(line.price_unit).toFixed(2) }}</td>
                  <td class="px-3 py-3 text-body-md">{{ line.discount ? `${line.discount}%` : '—' }}</td>
                  <td class="px-3 py-3 text-body-md font-bold text-primary">
                    {{ Number(line.price_subtotal).toFixed(2) }}
                  </td>
                  <td class="px-3 py-3">
                    <button
                      @click="removeLine(line.id)"
                      :disabled="saving"
                      class="p-1.5 rounded-lg hover:bg-error/10 text-error/70 hover:text-error transition-colors cursor-pointer disabled:opacity-30"
                      title="حذف الصنف"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                <tr v-if="lines.length === 0">
                  <td colspan="6" class="p-6 text-center text-on-white-variant text-sm">
                    لا توجد أصناف في هذه الفاتورة
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Payments -->
        <div>
          <h5 class="text-label-md font-bold text-primary border-r-4 border-primary pr-3 mb-3">
            المدفوعات
          </h5>
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse">
              <thead>
                <tr class="bg-white-low text-on-white-variant border-b border-outline-variant">
                  <th class="px-3 py-2 text-[11px] font-bold">طريقة الدفع</th>
                  <th class="px-3 py-2 text-[11px] font-bold">المبلغ</th>
                  <th class="px-3 py-2 text-[11px] font-bold">الحالة</th>
                  <th class="px-3 py-2 text-[11px] font-bold"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/40">
                <tr v-for="pay in payments" :key="pay.id" class="hover:bg-white-low/50">
                  <td class="px-3 py-3 text-body-md text-on-white">
                    {{ pay.payment_method_id ? pay.payment_method_id[1] : `#${pay.payment_method_id?.[0] || ''}` }}
                  </td>
                  <td class="px-3 py-3">
                    <div class="relative inline-block">
                      <input
                        v-model.number="editingPayments[pay.id]"
                        type="number"
                        step="0.01"
                        class="w-28 h-9 px-2 bg-white border border-outline-variant rounded-lg text-body-md font-bold text-primary outline-none focus:border-primary"
                      />
                      <span class="mr-1 text-on-white-variant text-xs">ج.م</span>
                    </div>
                  </td>
                  <td class="px-3 py-3">
                    <span
                      class="px-2 py-0.5 rounded-full text-[11px] font-bold"
                      :class="pay.payment_status === 'paid' ? 'bg-primary/10 text-primary' : pay.payment_status === 'reversed' ? 'bg-error-container text-error' : 'bg-secondary-container text-secondary'"
                    >
                      {{ pay.payment_status === 'paid' ? 'مدفوع' : pay.payment_status === 'reversed' ? 'مرتجع' : 'معلق' }}
                    </span>
                  </td>
                  <td class="px-3 py-3">
                    <button
                      @click="payments = payments.filter(p => p.id !== pay.id)"
                      class="p-1.5 rounded-lg hover:bg-error/10 text-error/70 hover:text-error transition-colors cursor-pointer disabled:opacity-30"
                      title="حذف الدفعة"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                <tr v-if="payments.length === 0">
                  <td colspan="4" class="p-6 text-center text-on-white-variant text-sm">
                    لا توجد مدفوعات مسجلة
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Add Payment Method Form -->
          <div class="mt-3 space-y-3">
            <button
              @click="showAddPayment = !showAddPayment; if (!showAddPayment && availablePaymentMethods.length) { newPaymentName = availablePaymentMethods[0].name }"
              class="w-full flex items-center justify-between px-4 py-3 bg-white border border-dashed border-outline-variant rounded-xl text-sm font-bold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div class="flex items-center gap-2">
                <Plus class="w-4 h-4" />
                <span>إضافة طريقة دفع</span>
              </div>
              <span class="text-xs text-on-white-variant">{{ showAddPayment ? 'إخفاء' : 'إضافة' }}</span>
            </button>

            <div v-if="showAddPayment" class="bg-white-low border border-outline-variant rounded-xl p-4 space-y-3">
              <div>
                <label class="block text-xs font-bold text-on-white-variant mb-1">طريقة الدفع</label>
                <div class="relative">
                  <Wallet class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-white-variant" />
                  <select
                    v-model="newPaymentName"
                    class="w-full h-10 pr-10 bg-white border border-outline-variant rounded-lg px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>اختر طريقة الدفع</option>
                    <option
                      v-for="method in availablePaymentMethods"
                      :key="method.id"
                      :value="method.name"
                    >
                      {{ method.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-on-white-variant mb-1">المبلغ</label>
                <div class="relative">
                  <input
                    v-model.number="newPaymentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    class="w-full h-10 bg-white border border-outline-variant rounded-lg px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none tabular-nums"
                  />
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-white-variant">ج.م</span>
                </div>
              </div>
              <p v-if="addPaymentError" class="text-xs text-error font-medium">{{ addPaymentError }}</p>
              <button
                @click="addPaymentLine"
                class="w-full h-10 bg-primary text-white rounded-lg font-bold hover:bg-primary/95 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 text-sm"
              >
                <Plus class="w-4 h-4" />
                إضافة
              </button>
            </div>

            <button
              v-if="payments.length > 0"
              @click="savePayments"
              :disabled="saving"
              class="w-full px-5 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/95 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm"
            >
              <Save class="w-4 h-4" />
              حفظ المدفوعات
            </button>
          </div>
        </div>

        <!-- Totals Summary -->
        <div class="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <div class="flex justify-between text-body-md">
            <span class="text-on-white-variant">المجموع الفرعي</span>
            <span class="font-bold">{{ totalFromLines.toFixed(2) }} ج.م</span>
          </div>
          <div class="flex justify-between text-body-md">
            <span class="text-on-white-variant">الضريبة</span>
            <span class="font-bold">{{ Number(order.amount_tax).toFixed(2) }} ج.م</span>
          </div>
          <div class="flex justify-between text-headline-sm font-bold text-primary border-t border-primary/20 pt-2">
            <span>الإجمالي</span>
            <span>{{ Number(order.amount_total).toFixed(2) }} ج.م</span>
          </div>
          <div class="flex justify-between text-body-md">
            <span class="text-on-white-variant">المدفوع</span>
            <span class="font-bold text-success">{{ Number(order.amount_paid).toFixed(2) }} ج.م</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 bg-white-high border-t border-outline-variant shrink-0">
        <button
          @click="closeDrawer"
          class="w-full py-3 rounded-xl border border-outline font-bold text-on-white hover:bg-white transition-all cursor-pointer active:scale-95 text-center"
        >
          إغلاق
        </button>
      </div>
    </div>

    <!-- Toast -->
    <div
      class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500"
      :class="toast.show ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'"
    >
      <div
        class="px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
        :class="toast.type === 'success' ? 'bg-on-white text-white' : 'bg-error text-on-error'"
      >
        <component
          :is="toast.type === 'success' ? CheckCheck : AlertCircle"
          class="w-5 h-5 shrink-0"
        />
        <p class="font-bold text-sm">{{ toast.message }}</p>
      </div>
    </div>
  </div>
</template>
