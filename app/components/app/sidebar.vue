<script setup lang="ts">
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu } from "@lucide/vue";
import { navLinks } from "~/lib/navlinks";
const route = useRoute();

const pageTitle = computed(() => {
  const currentLink = navLinks.find((link) => {
    if (link.path === "/") return route.path === "/";
    return route.path.startsWith(link.path);
  });
  if (currentLink) return currentLink.name;
  if (route.path.startsWith("/customer-details")) return "تفاصيل العميل";
  return "Odoo Retail Lite";
});
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="ghost" size="icon" class="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
        <Menu class="w-5 h-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="right" class="w-80 p-0 flex flex-col h-full bg-background border-l border-border">
      <!-- Header / Brand -->
      <div class="p-6 border-b border-border flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/25">
          O
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-lg text-foreground tracking-wide leading-none">Odoo Lite</span>
          <span class="text-xs text-muted-foreground mt-1">نظام إدارة نقاط البيع بالتجزئة</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 overflow-y-auto px-4 py-6">
        <nav class="space-y-1">
          <SheetClose as-child v-for="link in navLinks" :key="link.path">
            <NuxtLink
              :to="link.path"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group"
              :class="[
                (link.path === '/' ? route.path === '/' : route.path.startsWith(link.path))
                  ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              ]"
            >
              <span class="w-5 h-5 flex items-center justify-center shrink-0">
                <component :is="link.icon" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              </span>
              <span>{{ link.name }}</span>
            </NuxtLink>
          </SheetClose>
        </nav>
      </div>

      <!-- Sidebar Footer / User Profile Summary -->
      <div class="p-4 border-t border-border bg-muted/40">
        <div class="flex items-center gap-3 p-2 rounded-lg">
          <img
            alt="صورة المدير"
            class="w-10 h-10 rounded-full border border-border object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-B7Do99NBN3tEwZzZmUk5car_UwvosU6pRN_zxkNCtHFIcf6L8wFLjIdeJ4HAzEJw3O6BD-ZvwUms_vYJTMH2RbEpGGSsWE4Wlvq_MdF90khy2e8QP80Gb5r2gnLXTwG13iiFnfhw98HRrRAXd37lrkpZnmIxxW3cE3270ZCA-B6OEA6G8Z0lHluoaQsOGqnIXkK2ji069JisCBsU5uifz4Mbg4mM-F4NjciNOIhkCTF9RBkTyKH3PuzF8kO3mLOAsiYHm_O_vSrc"
          />
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-semibold text-foreground truncate">المدير العام</span>
            <span class="text-[10px] text-muted-foreground truncate">admin@odoo-lite.com</span>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
