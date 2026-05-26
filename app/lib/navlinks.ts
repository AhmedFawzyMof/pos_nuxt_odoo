import { h } from "vue";
import {
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Receipt,
  ShoppingBag,
  Users,
  Warehouse,
  Timer,
  History,
} from "@lucide/vue";

export const navLinks = [
  { name: "لوحة التحكم", path: "/", icon: h(LayoutDashboard) },
  { name: "المبيعات (POS)", path: "/pos", icon: h(Receipt) },
  { name: "المحاسبة", path: "/accounting", icon: h(Landmark) },
  { name: "المخزون", path: "/warehouse", icon: h(Warehouse) },
  { name: "حركات المخزون", path: "/stock-movements", icon: h(History) },
  { name: "المنتجات", path: "/products", icon: h(ShoppingBag) },
  { name: "الأقسام", path: "/categories", icon: h(LayoutGrid) },
  { name: "العملاء", path: "/customers", icon: h(Users) },
  { name: "سجل الطلبات", path: "/orders", icon: h(Timer) },
];

