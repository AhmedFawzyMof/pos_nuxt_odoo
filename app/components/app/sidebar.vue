<script setup lang="ts">
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu, LogOut } from "@lucide/vue";
import { navLinks } from "~/lib/navlinks";
const route = useRoute();
const { logout, user, username } = useAuth();

const pageTitle = computed(() => {
  const currentLink = navLinks.find((link) => {
    if (link.path === "/") return route.path === "/";
    return route.path.startsWith(link.path);
  });
  if (currentLink) return currentLink.name;
  if (route.path.startsWith("/customer-details")) return "تفاصيل العميل";
  if (route.path.startsWith("/supplier-details")) return "تفاصيل المورد";
  return "Odoo Retail Lite";
});
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
      >
        <Menu class="w-5 h-5" />
      </Button>
    </SheetTrigger>
    <SheetContent
      side="right"
      class="w-80 p-0 flex flex-col h-full bg-background border-l border-border"
    >
      <!-- Header / Brand -->
      <div class="p-6 border-b border-border flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/25"
        >
          O
        </div>
        <div class="flex flex-col">
          <span
            class="font-bold text-lg text-foreground tracking-wide leading-none"
            >Odoo Lite</span
          >
          <span class="text-xs text-muted-foreground mt-1"
            >نظام إدارة نقاط البيع بالتجزئة</span
          >
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
                (
                  link.path === '/'
                    ? route.path === '/'
                    : route.path.startsWith(link.path)
                )
                  ? 'bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80',
              ]"
            >
              <span class="w-5 h-5 flex items-center justify-center shrink-0">
                <component
                  :is="link.icon"
                  class="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                />
              </span>
              <span>{{ link.name }}</span>
            </NuxtLink>
          </SheetClose>
        </nav>
      </div>

      <div class="p-4 border-t border-border bg-muted/40 space-y-2">
        <div class="flex items-center gap-3 p-2 rounded-lg">
          <div
            class="w-10 h-10 bg-primary rounded-full text-white flex items-center justify-center"
          >
            <span class="font-bold">
              {{ user?.name[0] }}
            </span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-semibold text-foreground truncate">{{
              user?.name
            }}</span>
            <span class="text-[10px] text-muted-foreground truncate">{{
              username
            }}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          class="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200"
          @click="logout"
        >
          <LogOut class="w-4 h-4 shrink-0" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
