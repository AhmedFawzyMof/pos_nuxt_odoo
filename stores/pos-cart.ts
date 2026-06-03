import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { CartItem, POSProduct, PaymentLine } from "~/types/pos";

export const usePosCartStore = defineStore("pos-cart", () => {
  const items = ref<CartItem[]>([]);
  const note = ref("");
  const customerId = ref<number | null>(null);
  const selectedLocationId = ref<number | null>(null);
  const selectedLocationName = ref("");

  const orderDiscount = ref(0);
  const orderDiscountType = ref<"fixed" | "percent">("fixed");
  const serviceFee = ref(0);
  const serviceFeeType = ref<"fixed" | "percent">("fixed");
  const paymentLines = ref<PaymentLine[]>([]);

  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  );

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => {
      const lineTotal = item.price * item.quantity;
      const discount = item.discount || 0;
      return sum + lineTotal - discount;
    }, 0),
  );

  const discountAmount = computed(() => {
    if (orderDiscountType.value === "percent") {
      return (subtotal.value * orderDiscount.value) / 100;
    }
    return orderDiscount.value;
  });

  const serviceFeeAmount = computed(() => {
    if (serviceFeeType.value === "percent") {
      return (subtotal.value * serviceFee.value) / 100;
    }
    return serviceFee.value;
  });

  const grandTotal = computed(() =>
    Math.max(0, subtotal.value + serviceFeeAmount.value - discountAmount.value),
  );

  const allocatedTotal = computed(() =>
    paymentLines.value.reduce((sum, p) => sum + p.amount, 0),
  );

  const remaining = computed(() =>
    Math.max(0, grandTotal.value - allocatedTotal.value),
  );

  function findItem(productId: number) {
    return items.value.find((i) => i.product.id === productId);
  }

  function addItem(product: POSProduct, quantity = 1) {
    const existing = findItem(product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.value.push({
        product,
        quantity,
        price: product.list_price,
        discount: 0,
      });
    }
  }

  function removeItem(productId: number) {
    const idx = items.value.findIndex((i) => i.product.id === productId);
    if (idx !== -1) items.value.splice(idx, 1);
  }

  function updateQuantity(productId: number, quantity: number) {
    const item = findItem(productId);
    if (item) {
      if (quantity <= 0) {
        removeItem(productId);
      } else {
        item.quantity = quantity;
      }
    }
  }

  function updatePrice(productId: number, price: number) {
    const item = findItem(productId);
    if (item) item.price = price;
  }

  function updateDiscount(productId: number, discount: number) {
    const item = findItem(productId);
    if (item) item.discount = discount;
  }

  function setLocation(id: number | null, name: string) {
    selectedLocationId.value = id;
    selectedLocationName.value = name;
  }

  function setOrderDiscount(value: number, type: "fixed" | "percent") {
    orderDiscount.value = value;
    orderDiscountType.value = type;
  }

  function setServiceFee(value: number, type: "fixed" | "percent") {
    serviceFee.value = value;
    serviceFeeType.value = type;
  }

  function addPayment(methodId: number, methodName: string, amount: number) {
    const existing = paymentLines.value.find((p) => p.method_id === methodId);
    if (existing) {
      existing.amount = amount;
    } else {
      paymentLines.value.push({ method_id: methodId, method_name: methodName, amount });
    }
  }

  function removePayment(methodId: number) {
    const idx = paymentLines.value.findIndex((p) => p.method_id === methodId);
    if (idx !== -1) paymentLines.value.splice(idx, 1);
  }

  function clearPayments() {
    paymentLines.value = [];
  }

  function resetOrderAdjustments() {
    orderDiscount.value = 0;
    orderDiscountType.value = "fixed";
    serviceFee.value = 0;
    serviceFeeType.value = "fixed";
    paymentLines.value = [];
  }

  function clearCart() {
    items.value = [];
    note.value = "";
    customerId.value = null;
    resetOrderAdjustments();
  }

  return {
    items,
    note,
    customerId,
    selectedLocationId,
    selectedLocationName,
    itemCount,
    subtotal,
    discountAmount,
    serviceFeeAmount,
    grandTotal,
    allocatedTotal,
    remaining,
    orderDiscount,
    orderDiscountType,
    serviceFee,
    serviceFeeType,
    paymentLines,
    addItem,
    removeItem,
    updateQuantity,
    updatePrice,
    updateDiscount,
    setLocation,
    setOrderDiscount,
    setServiceFee,
    addPayment,
    removePayment,
    clearPayments,
    resetOrderAdjustments,
    clearCart,
    findItem,
  };
});
