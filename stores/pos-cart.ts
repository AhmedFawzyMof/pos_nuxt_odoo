import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { CartItem, POSProduct } from "~/types/pos";

export const usePosCartStore = defineStore("pos-cart", () => {
  const items = ref<CartItem[]>([]);
  const note = ref("");
  const customerId = ref<number | null>(null);
  const selectedLocationId = ref<number | null>(null);
  const selectedLocationName = ref("");

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

  const taxTotal = computed(() =>
    items.value.reduce((sum, item) => {
      const lineTotal = item.price * item.quantity;
      const discount = item.discount || 0;
      const afterDiscount = lineTotal - discount;
      const taxPct = item.tax_percentage || 0;
      return sum + afterDiscount * (taxPct / 100);
    }, 0),
  );

  const grandTotal = computed(() => subtotal.value + taxTotal.value);

  function findItem(productId: number) {
    return items.value.find((i) => i.product.id === productId);
  }

  function addItem(
    product: POSProduct,
    quantity = 1,
    taxPercentage?: number,
  ) {
    const existing = findItem(product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.value.push({
        product,
        quantity,
        price: product.list_price,
        discount: 0,
        tax_percentage: taxPercentage,
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

  function clearCart() {
    items.value = [];
    note.value = "";
    customerId.value = null;
  }

  return {
    items,
    note,
    customerId,
    selectedLocationId,
    selectedLocationName,
    itemCount,
    subtotal,
    taxTotal,
    grandTotal,
    addItem,
    removeItem,
    updateQuantity,
    updatePrice,
    updateDiscount,
    setLocation,
    clearCart,
    findItem,
  };
});
