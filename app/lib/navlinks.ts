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
  Truck,
  ClipboardList,
  ReceiptText,
  User,
  Building2,
  FileText,
} from "@lucide/vue";

export interface NavItem {
  name: string;
  path: string;
  icon: ReturnType<typeof h>;
}

export interface NavGroup {
  name: string;
  icon: ReturnType<typeof h>;
  children: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export const navLinks: NavItem[] = [
  { name: "لوحة التحكم", path: "/", icon: h(LayoutDashboard) },
  { name: "المبيعات (POS)", path: "/pos", icon: h(Receipt) },
  { name: "المحاسبة", path: "/accounting", icon: h(Landmark) },
  { name: "المخزون", path: "/warehouse", icon: h(Warehouse) },
  { name: "حركات المخزون", path: "/stock-movements", icon: h(History) },
  { name: "المنتجات", path: "/products", icon: h(ShoppingBag) },
  { name: "الأقسام", path: "/categories", icon: h(LayoutGrid) },
  { name: "العملاء", path: "/customers", icon: h(Users) },
  { name: "الموردين", path: "/suppliers", icon: h(Truck) },
  { name: "أوامر الشراء", path: "/purchase-orders", icon: h(ClipboardList) },
  { name: "فواتير الموردين", path: "/vendor-bills", icon: h(ReceiptText) },
  { name: "سجل الطلبات", path: "/orders", icon: h(Timer) },
  { name: "التقارير", path: "/reports", icon: h(FileText) },
  { name: "الملف الشخصي", path: "/user-profile", icon: h(User) },
  { name: "بيانات الشركة", path: "/company-profile", icon: h(Building2) },
];

const isActive = (routePath: string, linkPath: string) =>
  linkPath === "/" ? routePath === "/" : routePath.startsWith(linkPath);

const isGroupActive = (routePath: string, group: NavGroup) =>
  group.children.some((child) => isActive(routePath, child.path));

export const groupedNav: NavEntry[] = [
  { name: "لوحة التحكم", path: "/", icon: h(LayoutDashboard) },
  {
    name: "المبيعات",
    icon: h(Receipt),
    children: [
      { name: "المبيعات (POS)", path: "/pos", icon: h(Receipt) },
      { name: "سجل الطلبات", path: "/orders", icon: h(Timer) },
    ],
  },
  {
    name: "المنتجات",
    icon: h(ShoppingBag),
    children: [
      { name: "المنتجات", path: "/products", icon: h(ShoppingBag) },
      { name: "الأقسام", path: "/categories", icon: h(LayoutGrid) },
    ],
  },
  {
    name: "المخزون",
    icon: h(Warehouse),
    children: [
      { name: "المخزون", path: "/warehouse", icon: h(Warehouse) },
      { name: "حركات المخزون", path: "/stock-movements", icon: h(History) },
    ],
  },
  {
    name: "المشتريات",
    icon: h(Truck),
    children: [
      { name: "الموردين", path: "/suppliers", icon: h(Truck) },
      { name: "أوامر الشراء", path: "/purchase-orders", icon: h(ClipboardList) },
      { name: "فواتير الموردين", path: "/vendor-bills", icon: h(ReceiptText) },
    ],
  },
  { name: "العملاء", path: "/customers", icon: h(Users) },
  { name: "التقارير", path: "/reports", icon: h(FileText) },
  { name: "المحاسبة", path: "/accounting", icon: h(Landmark) },
  {
    name: "الإعدادات",
    icon: h(User),
    children: [
      { name: "الملف الشخصي", path: "/user-profile", icon: h(User) },
      { name: "بيانات الشركة", path: "/company-profile", icon: h(Building2) },
    ],
  },
];
