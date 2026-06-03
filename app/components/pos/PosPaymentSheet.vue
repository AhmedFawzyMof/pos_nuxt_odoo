<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  X,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Percent,
  Plus,
  Trash2,
  MessageSquareText,
} from "@lucide/vue";
import { usePosCartStore } from "~~/stores/pos-cart";
import type { PaymentMethod, OrderResponse } from "~/types/pos";
import type { Customer } from "~/types/customer";

const props = defineProps<{
  open: boolean;
  paymentMethods: PaymentMethod[];
  sessionId: number;
  configId: string;
}>();

const emit = defineEmits<{
  "update:open": [val: boolean];
  "order-completed": [];
}>();

const cart = usePosCartStore();

const showDiscount = ref(false);
const showServiceFee = ref(false);
const showCustomer = ref(false);
const showNote = ref(false);

const discountType = ref<"fixed" | "percent">("fixed");
const discountValue = ref(0);
const serviceFeeType = ref<"fixed" | "percent">("fixed");
const serviceFeeValue = ref(0);
const orderNote = ref(cart.note);

const customerSearchQuery = ref("");
const customers = ref<Customer[]>([]);
const loadingCustomers = ref(false);
let searchCustomerDebounce: NodeJS.Timeout;

async function fetchCustomers(search = "") {
  loadingCustomers.value = true;
  try {
    const res = await $fetch<any>("/api/customers", {
      params: { page: "1", search, type: "الكل" },
    });
    customers.value = res?.data || [];
  } catch {
    customers.value = [];
  } finally {
    loadingCustomers.value = false;
  }
}

function onCustomerSearch(val: string) {
  clearTimeout(searchCustomerDebounce);
  searchCustomerDebounce = setTimeout(() => fetchCustomers(val), 300);
}

function selectCustomer(customer: Customer) {
  cart.customerId = customer.id;
  showCustomer.value = false;
}

function clearCustomer() {
  cart.customerId = null;
}

onMounted(() => fetchCustomers());

const isSaving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const orderName = ref("");

const lastOrderItems = ref<{ product: { name: string }; quantity: number; price: number; discount: number }[]>([]);
const lastOrderPayments = ref<{ methodName: string; amount: number }[]>([]);
const lastOrderSubtotal = ref(0);
const lastOrderDiscount = ref(0);
const lastOrderServiceFee = ref(0);
const lastOrderGrandTotal = ref(0);

const localPaymentAllocations = ref<{ methodId: number; amount: number; received?: number }[]>([]);

const paymentMethodIcons: Record<string, any> = {
  Cash: Banknote,
  Card: CreditCard,
  "Credit Card": CreditCard,
  "Debit Card": CreditCard,
  "Vodafone Cash": Smartphone,
  PayPal: Smartphone,
  Wallet: Wallet,
};

const allocatedTotal = computed(() =>
  localPaymentAllocations.value.reduce((s, p) => s + p.amount, 0),
);

const remaining = computed(() =>
  Math.max(0, cart.grandTotal - allocatedTotal.value),
);

const isFullyPaid = computed(() => remaining.value <= 0 && allocatedTotal.value > 0);

function getMethodIcon(method: PaymentMethod) {
  if (method.is_cash_count) return Banknote;
  const name = method.name.toLowerCase();
  if (name.includes("card") || name.includes("credit") || name.includes("debit")) return CreditCard;
  if (name.includes("vodafone") || name.includes("wallet") || name.includes("paypal") || name.includes("orange")) return Smartphone;
  return Wallet;
}

function selectPaymentMethod(method: PaymentMethod) {
  const existing = localPaymentAllocations.value.find((p) => p.methodId === method.id);
  if (existing) return;
  const amt = Math.max(0, cart.grandTotal - allocatedTotal.value);
  localPaymentAllocations.value.push({
    methodId: method.id,
    amount: amt,
  });
}

function removePaymentAllocation(index: number) {
  localPaymentAllocations.value.splice(index, 1);
}

function updateAllocation(index: number, amount: number) {
  if (amount < 0) amount = 0;
  if (!localPaymentAllocations.value[index]) return;
  localPaymentAllocations.value[index].amount = amount;
}

function updateReceived(index: number, received: number) {
  if (received < 0) received = 0;
  if (!localPaymentAllocations.value[index]) return;
  localPaymentAllocations.value[index].received = received;
}

function getChange(index: number) {
  const alloc = localPaymentAllocations.value[index];
  if (!alloc || !alloc.received) return 0;
  return Math.max(0, alloc.received - alloc.amount);
}

function findMethod(methodId: number) {
  return props.paymentMethods.find((m) => m.id === methodId);
}

function applyDiscount() {
  cart.setOrderDiscount(discountValue.value, discountType.value);
}

function applyServiceFee() {
  cart.setServiceFee(serviceFeeValue.value, serviceFeeType.value);
}

function resetLocalPayments() {
  localPaymentAllocations.value = [];
}

function closeModal() {
  if (isSaving.value) return;
  errorMessage.value = "";
  successMessage.value = "";
  orderName.value = "";
  emit("update:open", false);
}

async function handleSubmit() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!isFullyPaid.value) {
    errorMessage.value = "يجب تغطية كامل المبلغ قبل تأكيد الدفع";
    return;
  }

  if (!props.sessionId) {
    errorMessage.value = "رقم الجلسة غير متاح، يرجى فتح وردية أولاً";
    return;
  }

  isSaving.value = true;

  const payments = localPaymentAllocations.value.map((p) => {
    const method = findMethod(p.methodId);
    return {
      method_id: p.methodId,
      method_name: method?.name || "",
      amount: p.amount,
    };
  });

  try {
    const res = await $fetch<OrderResponse>("/api/pos/order", {
      method: "POST",
      body: {
        session_id: props.sessionId,
        items: cart.items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
        })),
        payments,
        note: orderNote.value,
        order_discount: cart.orderDiscount,
        order_discount_type: cart.orderDiscountType,
        service_fee: cart.serviceFee,
        service_fee_type: cart.serviceFeeType,
        customer_id: cart.customerId,
        location_id: cart.selectedLocationId,
      },
    });

    if (res.success) {
      successMessage.value = res.message;
      orderName.value = res.name;
      lastOrderItems.value = cart.items.map((item) => ({
        product: { name: item.product.display_name || item.product.name },
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
      }));
      lastOrderPayments.value = payments.map((p) => ({
        methodName: p.method_name,
        amount: p.amount,
      }));
      lastOrderSubtotal.value = cart.subtotal;
      lastOrderDiscount.value = cart.discountAmount;
      lastOrderServiceFee.value = cart.serviceFeeAmount;
      lastOrderGrandTotal.value = cart.grandTotal;
      cart.clearCart();
    }
  } catch (error: any) {
    errorMessage.value = error.statusMessage || "فشل إنشاء الطلب";
  } finally {
    isSaving.value = false;
  }
}

function closeCompleted() {
  successMessage.value = "";
  orderName.value = "";
  emit("order-completed");
  emit("update:open", false);
}

function printReceipt() {
  const receiptWindow = window.open("", "_blank", "width=300,height=600");
  if (!receiptWindow) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG");
  const timeStr = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  const itemsHtml = lastOrderItems.value
    .map(
      (item) => `
      <tr>
        <td style="text-align:right;padding:4px 0">${item.product.name}</td>
        <td style="text-align:center;padding:4px 0">${item.quantity}</td>
        <td style="text-align:left;padding:4px 0">${item.price.toFixed(2)}</td>
        <td style="text-align:left;padding:4px 0">${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const paymentsHtml = lastOrderPayments.value
    .map(
      (p) => `
      <tr>
        <td style="text-align:right;padding:2px 0">${p.methodName}</td>
        <td style="text-align:left;padding:2px 0">${p.amount.toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  receiptWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="utf-8" />
      <title>فاتورة - ${orderName.value}</title>
      <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          padding: 16px;
          color: #000;
          width: 280px;
        }
        .header { text-align: center; margin-bottom: 12px; }
        .header h2 { font-size: 16px; margin-bottom: 4px; }
        .header p { font-size: 11px; color: #333; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; padding: 4px 0; border-bottom: 1px solid #000; }
        td { font-size: 11px; }
        .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 4px; }
        .footer { text-align: center; margin-top: 12px; font-size: 11px; }
        .label { text-align: right; }
        .value { text-align: left; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>فاتورة بيع</h2>
        <p>${orderName.value}</p>
        <p>${dateStr} ${timeStr}</p>
      </div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th style="text-align:right">المنتج</th>
            <th style="text-align:center">الكمية</th>
            <th style="text-align:left">السعر</th>
            <th style="text-align:left">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div class="divider"></div>
      <table>
        ${lastOrderDiscount.value > 0 ? `<tr><td style="text-align:right">الخصم</td><td style="text-align:left">-${lastOrderDiscount.value.toFixed(2)}</td></tr>` : ""}
        ${lastOrderServiceFee.value > 0 ? `<tr><td style="text-align:right">رسوم إضافية</td><td style="text-align:left">+${lastOrderServiceFee.value.toFixed(2)}</td></tr>` : ""}
        <tr class="total-row">
          <td style="text-align:right">الإجمالي</td>
          <td style="text-align:left">${lastOrderGrandTotal.value.toFixed(2)} ج.م</td>
        </tr>
      </table>
      <div class="divider"></div>
      <table>
        <tr><th style="text-align:right" colspan="2">طرق الدفع</th></tr>
        ${paymentsHtml}
      </table>
      <div class="footer">
        <div class="divider"></div>
        <p>شكراً لتسوقكم معنا</p>
      </div>
      <script>
        window.onload = function() { window.print(); window.close(); };
      <\\/script>
    </body>
    </html>
  `);
  receiptWindow.document.close();
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      dir="rtl"
    >
      <div
        class="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col font-sans text-slate-800 border border-slate-200"
      >
        <!-- Header -->
        <div
          class="p-6 pb-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0"
        >
          <div class="flex items-center gap-3">
            <div class="bg-primary/10 p-2 rounded-lg">
              <Receipt class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">إتمام الطلب</h3>
              <p class="text-xs text-slate-500">
                {{ cart.itemCount }} منتج - الإجمالي {{ cart.grandTotal.toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }} ج.م
              </p>
            </div>
          </div>
          <button
            @click="closeModal"
            class="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-5 text-right">
          <!-- Error -->
          <div
            v-if="errorMessage"
            class="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2"
          >
            <AlertTriangle class="w-4 h-4 shrink-0" />
            {{ errorMessage }}
          </div>

          <!-- Success -->
          <div
            v-if="successMessage"
            class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
          >
            <div class="flex items-center gap-2 text-emerald-700 mb-1">
              <CheckCircle class="w-5 h-5" />
              <span class="text-sm font-bold">تم إنشاء الطلب بنجاح</span>
            </div>
            <div class="text-emerald-800 space-y-1">
              <p class="text-xs">رقم الفاتورة: <span class="font-bold">{{ orderName }}</span></p>
              <p class="text-xs">{{ successMessage }}</p>
            </div>
            <button
              type="button"
              @click="printReceipt"
              class="mt-3 w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt class="w-4 h-4" />
              طباعة الفاتورة
            </button>
          </div>

          <!-- Order Summary -->
          <div
            v-if="!successMessage"
            class="bg-slate-50 rounded-xl p-4 space-y-2 text-sm"
          >
            <div class="flex justify-between text-slate-600">
              <span class="tabular-nums">{{ cart.subtotal.toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }} ج.م</span>
              <span>المجموع</span>
            </div>
            <div v-if="cart.discountAmount > 0" class="flex justify-between text-red-600">
              <span class="tabular-nums">-{{ cart.discountAmount.toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }} ج.م</span>
              <span>الخصم</span>
            </div>
            <div v-if="cart.serviceFeeAmount > 0" class="flex justify-between text-amber-600">
              <span class="tabular-nums">+{{ cart.serviceFeeAmount.toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }} ج.م</span>
              <span>رسوم إضافية</span>
            </div>
            <div class="flex justify-between text-base font-bold pt-2 border-t border-slate-200 text-slate-900">
              <span class="tabular-nums">{{ cart.grandTotal.toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }} ج.م</span>
              <span>الإجمالي</span>
            </div>
          </div>

          <!-- Order Actions (only when not completed) -->
          <template v-if="!successMessage">
            <div class="space-y-3">
              <!-- Discount -->
              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  @click="showDiscount = !showDiscount"
                  class="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div class="flex items-center gap-2">
                    <Percent class="w-4 h-4 text-red-500" />
                    <span>خصم على الفاتورة</span>
                  </div>
                  <span class="text-xs text-slate-400">{{ showDiscount ? 'إخفاء' : 'إضافة' }}</span>
                </button>
                <div v-if="showDiscount" class="px-4 pb-4 space-y-3">
                  <div class="flex gap-2">
                    <button
                      @click="discountType = 'fixed'"
                      :class="[
                        'flex-1 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        discountType === 'fixed'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      ]"
                    >
                      قيمة ثابتة
                    </button>
                    <button
                      @click="discountType = 'percent'"
                      :class="[
                        'flex-1 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        discountType === 'percent'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      ]"
                    >
                      نسبة %
                    </button>
                  </div>
                  <div class="relative">
                    <input
                      v-model.number="discountValue"
                      @input="applyDiscount"
                      type="number"
                      min="0"
                      step="0.01"
                      :placeholder="discountType === 'fixed' ? '0.00' : '0'"
                      class="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none tabular-nums"
                    />
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      {{ discountType === 'fixed' ? 'ج.م' : '%' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Service Fee -->
              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  @click="showServiceFee = !showServiceFee"
                  class="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div class="flex items-center gap-2">
                    <Plus class="w-4 h-4 text-amber-500" />
                    <span>رسوم إضافية</span>
                  </div>
                  <span class="text-xs text-slate-400">{{ showServiceFee ? 'إخفاء' : 'إضافة' }}</span>
                </button>
                <div v-if="showServiceFee" class="px-4 pb-4 space-y-3">
                  <div class="flex gap-2">
                    <button
                      @click="serviceFeeType = 'fixed'"
                      :class="[
                        'flex-1 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        serviceFeeType === 'fixed'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      ]"
                    >
                      قيمة ثابتة
                    </button>
                    <button
                      @click="serviceFeeType = 'percent'"
                      :class="[
                        'flex-1 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        serviceFeeType === 'percent'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      ]"
                    >
                      نسبة %
                    </button>
                  </div>
                  <div class="relative">
                    <input
                      v-model.number="serviceFeeValue"
                      @input="applyServiceFee"
                      type="number"
                      min="0"
                      step="0.01"
                      :placeholder="serviceFeeType === 'fixed' ? '0.00' : '0'"
                      class="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none tabular-nums"
                    />
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      {{ serviceFeeType === 'fixed' ? 'ج.م' : '%' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Customer -->
              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  @click="showCustomer = !showCustomer"
                  class="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>العميل</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span v-if="cart.customerId && !showCustomer" class="text-xs text-purple-600 font-medium">
                      {{ customers.find(c => c.id === cart.customerId)?.name }}
                    </span>
                    <button
                      v-if="cart.customerId && !showCustomer"
                      @click.stop="clearCustomer"
                      class="text-red-400 hover:text-red-600 cursor-pointer"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                    <span v-else class="text-xs text-slate-400">{{ showCustomer ? 'إخفاء' : 'اختيار' }}</span>
                  </div>
                </button>
                <div v-if="showCustomer" class="px-4 pb-4 space-y-3">
                  <div class="relative">
                    <input
                      v-model="customerSearchQuery"
                      @input="onCustomerSearch(customerSearchQuery)"
                      placeholder="بحث عن عميل..."
                      class="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div v-if="loadingCustomers" class="text-center text-xs text-slate-400 py-4">
                    جاري التحميل...
                  </div>
                  <div
                    v-else-if="customers.length === 0"
                    class="text-center text-xs text-slate-400 py-4"
                  >
                    لا يوجد عملاء
                  </div>
                  <div v-else class="max-h-40 overflow-y-auto space-y-1">
                    <button
                      v-for="customer in customers"
                      :key="customer.id"
                      @click="selectCustomer(customer)"
                      :class="[
                        'w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                        cart.customerId === customer.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'hover:bg-slate-100 text-slate-700',
                      ]"
                    >
                      {{ customer.name }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  @click="showNote = !showNote"
                  class="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div class="flex items-center gap-2">
                    <MessageSquareText class="w-4 h-4 text-blue-500" />
                    <span>ملاحظات</span>
                  </div>
                  <span class="text-xs text-slate-400">{{ showNote ? 'إخفاء' : 'إضافة' }}</span>
                </button>
                <div v-if="showNote" class="px-4 pb-4">
                  <textarea
                    v-model="orderNote"
                    rows="3"
                    placeholder="ملاحظات على الطلب..."
                    class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <!-- Payment Methods -->
            <div class="space-y-3">
              <h4 class="text-sm font-bold text-slate-700">طرق الدفع</h4>

              <!-- Method selection grid -->
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="method in paymentMethods"
                  :key="method.id"
                  @click="selectPaymentMethod(method)"
                  :disabled="localPaymentAllocations.some((p) => p.methodId === method.id)"
                  class="flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="
                    localPaymentAllocations.some((p) => p.methodId === method.id)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:text-primary'
                  "
                >
                  <component :is="getMethodIcon(method)" class="w-5 h-5" />
                  {{ method.name }}
                </button>
              </div>

              <!-- Payment allocations -->
              <div v-if="localPaymentAllocations.length > 0" class="space-y-3">
                <div
                  v-for="(alloc, index) in localPaymentAllocations"
                  :key="alloc.methodId"
                  class="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div class="flex items-center justify-between">
                    <button
                      @click="removePaymentAllocation(index)"
                      class="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                    <div class="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <component :is="getMethodIcon(findMethod(alloc.methodId)!)" class="w-4 h-4" />
                      {{ findMethod(alloc.methodId)?.name }}
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label class="block text-xs text-slate-500">المبلغ</label>
                    <div class="relative">
                      <input
                        :value="alloc.amount"
                        @input="updateAllocation(index, parseFloat(($event.target as HTMLInputElement).value) || 0)"
                        type="number"
                        min="0"
                        step="0.01"
                        class="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none tabular-nums"
                      />
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">ج.م</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Remaining balance -->
              <div
                v-if="localPaymentAllocations.length > 0"
                class="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm"
              >
                <span
                  class="tabular-nums font-bold"
                  :class="remaining > 0 ? 'text-red-600' : 'text-emerald-600'"
                >
                  {{ remaining.toLocaleString("ar-EG", { minimumFractionDigits: 2 }) }} ج.م
                </span>
                <span class="text-slate-600">المتبقي</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div
          class="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0"
        >
          <div v-if="!successMessage" class="text-xs text-slate-400">
            {{ localPaymentAllocations.length }} وسيلة دفع
          </div>
          <div v-else />

          <div class="flex items-center gap-3">
            <template v-if="!successMessage">
              <button
                type="button"
                @click="closeModal"
                class="h-11 px-5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                @click="handleSubmit"
                :disabled="isSaving || !isFullyPaid"
                class="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                <RefreshCw v-if="isSaving" class="w-4 h-4 animate-spin" />
                <span>{{ isSaving ? "جاري..." : "تأكيد الدفع" }}</span>
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                @click="printReceipt"
                class="h-11 px-5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Receipt class="w-4 h-4" />
                طباعة
              </button>
              <button
                type="button"
                @click="closeCompleted"
                class="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
              >
                تم
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
