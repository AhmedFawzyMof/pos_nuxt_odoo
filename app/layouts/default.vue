<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "#app";
import {
  LayoutDashboard,
  Receipt,
  Warehouse,
  Bell,
  Settings,
  Menu,
  Search,
} from "@lucide/vue";
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
  <div
    class="min-h-screen bg-background text-foreground font-sans flex flex-col"
    dir="rtl"
  >
    <header
      v-if="route.path !== '/login'"
      class="bg-background border-b border-border flex justify-between items-center w-full px-6 h-16 z-40 sticky top-0"
    >
      <div class="flex items-center gap-4">
        <AppSidebar />
        <h2 class="text-lg font-bold text-primary">{{ pageTitle }}</h2>
      </div>
      <div class="flex items-center gap-6">
        <div
          class="hidden md:flex bg-muted rounded-md px-3 py-1.5 items-center gap-2 border border-input focus-within:ring-1 focus-within:ring-ring"
        >
          <Search class="w-4 h-4 text-muted-foreground" />
          <input
            class="bg-transparent border-none focus:ring-0 text-sm w-48 text-right outline-hidden placeholder:text-muted-foreground"
            placeholder="بحث في النظام..."
            type="text"
          />
        </div>
        <div class="flex items-center gap-4">
          <span
            class="hidden md:block text-xs font-medium text-muted-foreground"
            >الفرع الرئيسي</span
          >
          <div class="flex gap-1">
            <Button variant="ghost" size="icon" class="relative rounded-full">
              <Bell class="w-5 h-5 text-muted-foreground" />
              <span
                class="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"
              ></span>
            </Button>
            <Button variant="ghost" size="icon" class="rounded-full">
              <Settings class="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
          <img
            alt="صورة المدير"
            class="w-8 h-8 rounded-full border border-border object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-B7Do99NBN3tEwZzZmUk5car_UwvosU6pRN_zxkNCtHFIcf6L8wFLjIdeJ4HAzEJw3O6BD-ZvwUms_vYJTMH2RbEpGGSsWE4Wlvq_MdF90khy2e8QP80Gb5r2gnLXTwG13iiFnfhw98HRrRAXd37lrkpZnmIxxW3cE3270ZCA-B6OEA6G8Z0lHluoaQsOGqnIXkK2ji069JisCBsU5uifz4Mbg4mM-F4NjciNOIhkCTF9RBkTyKH3PuzF8kO3mLOAsiYHm_O_vSrc"
          />
        </div>
      </div>
    </header>

    <main :class="route.path === '/login' ? 'w-full min-h-screen flex items-center justify-center p-0 overflow-hidden' : 'w-full p-6 pb-24 lg:pb-8'">
      <slot />
    </main>

    <!-- Mobile Footer Navigation Bar -->
    <footer
      v-if="route.path !== '/login'"
      class="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 flex justify-around z-50"
    >
      <NuxtLink
        to="/"
        class="flex flex-col items-center gap-0.5"
        :class="route.path === '/' ? 'text-primary' : 'text-muted-foreground'"
      >
        <LayoutDashboard class="w-5 h-5" />
        <span class="text-[10px]">الرئيسية</span>
      </NuxtLink>
      <NuxtLink
        to="/pos"
        class="flex flex-col items-center gap-0.5"
        :class="
          route.path.startsWith('/pos')
            ? 'text-primary'
            : 'text-muted-foreground'
        "
      >
        <Receipt class="w-5 h-5" />
        <span class="text-[10px]">المبيعات</span>
      </NuxtLink>
      <NuxtLink
        to="/warehouse"
        class="flex flex-col items-center gap-0.5"
        :class="
          route.path.startsWith('/warehouse')
            ? 'text-primary'
            : 'text-muted-foreground'
        "
      >
        <Warehouse class="w-5 h-5" />
        <span class="text-[10px]">المخازن</span>
      </NuxtLink>
    </footer>
  </div>
</template>
