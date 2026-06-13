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
  Shield,
} from "@lucide/vue";

export interface NavItem {
  name: string;
  path: string;
  icon: ReturnType<typeof h>;
  requiredPermission?: string;
}

export interface NavGroup {
  name: string;
  icon: ReturnType<typeof h>;
  children: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export const navLinks: NavItem[] = [
  { name: "لوحة التحكم", path: "/", icon: h(LayoutDashboard) },
  { name: "المبيعات (POS)", path: "/pos", icon: h(Receipt), requiredPermission: "Point of Sale / User" },
  { name: "المحاسبة", path: "/accounting", icon: h(Landmark), requiredPermission: "Accounting / Invoicing" },
  { name: "المخزون", path: "/warehouse", icon: h(Warehouse), requiredPermission: "Inventory / User" },
  { name: "حركات المخزون", path: "/stock-movements", icon: h(History), requiredPermission: "Inventory / User" },
  { name: "المنتجات", path: "/products", icon: h(ShoppingBag), requiredPermission: "Point of Sale / User" },
  { name: "الأقسام", path: "/categories", icon: h(LayoutGrid), requiredPermission: "Point of Sale / User" },
  { name: "العملاء", path: "/customers", icon: h(Users), requiredPermission: "Point of Sale / User" },
  { name: "الموردين", path: "/suppliers", icon: h(Truck), requiredPermission: "Purchase / User" },
  { name: "أوامر الشراء", path: "/purchase-orders", icon: h(ClipboardList), requiredPermission: "Purchase / User" },
  { name: "فواتير الموردين", path: "/vendor-bills", icon: h(ReceiptText), requiredPermission: "Accounting / Invoicing" },
  { name: "سجل الطلبات", path: "/orders", icon: h(Timer), requiredPermission: "Point of Sale / User" },
  { name: "التقارير", path: "/reports", icon: h(FileText), requiredPermission: "Point of Sale / User" },
  { name: "الملف الشخصي", path: "/user-profile", icon: h(User) },
  { name: "بيانات الشركة", path: "/company-profile", icon: h(Building2), requiredPermission: "Point of Sale / Administrator" },
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
      { name: "المبيعات (POS)", path: "/pos", icon: h(Receipt), requiredPermission: "Point of Sale / User" },
      { name: "سجل الطلبات", path: "/orders", icon: h(Timer), requiredPermission: "Point of Sale / User" },
    ],
  },
  {
    name: "المنتجات",
    icon: h(ShoppingBag),
    children: [
      { name: "المنتجات", path: "/products", icon: h(ShoppingBag), requiredPermission: "Point of Sale / User" },
      { name: "الأقسام", path: "/categories", icon: h(LayoutGrid), requiredPermission: "Point of Sale / User" },
    ],
  },
  {
    name: "المخزون",
    icon: h(Warehouse),
    children: [
      { name: "المخزون", path: "/warehouse", icon: h(Warehouse), requiredPermission: "Inventory / User" },
      { name: "حركات المخزون", path: "/stock-movements", icon: h(History), requiredPermission: "Inventory / User" },
    ],
  },
  {
    name: "المشتريات",
    icon: h(Truck),
    children: [
      { name: "الموردين", path: "/suppliers", icon: h(Truck), requiredPermission: "Purchase / User" },
      { name: "أوامر الشراء", path: "/purchase-orders", icon: h(ClipboardList), requiredPermission: "Purchase / User" },
      { name: "فواتير الموردين", path: "/vendor-bills", icon: h(ReceiptText), requiredPermission: "Accounting / Invoicing" },
    ],
  },
  { name: "العملاء", path: "/customers", icon: h(Users), requiredPermission: "Point of Sale / User" },
  { name: "التقارير", path: "/reports", icon: h(FileText), requiredPermission: "Point of Sale / User" },
  { name: "المحاسبة", path: "/accounting", icon: h(Landmark), requiredPermission: "Accounting / Invoicing" },
  {
    name: "الإعدادات",
    icon: h(User),
    children: [
      { name: "الملف الشخصي", path: "/user-profile", icon: h(User) },
      { name: "بيانات الشركة", path: "/company-profile", icon: h(Building2), requiredPermission: "Point of Sale / Administrator" },
      { name: "المستخدمين", path: "/users", icon: h(Shield), requiredPermission: "Administration / Access Rights" },
    ],
  },
];
