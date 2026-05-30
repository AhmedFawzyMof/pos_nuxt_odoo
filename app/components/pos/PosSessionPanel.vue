<script setup lang="ts">
import { ShoppingCart, Lock, Loader2 } from "@lucide/vue";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { POSRegister } from "~/types/pos";

defineProps<{
  register: POSRegister | null;
  openingCash: number;
  loading: boolean;
}>();

const emit = defineEmits<{
  "open-session": [configId: number];
  "update:openingCash": [value: number];
}>();
</script>

<template>
  <Card
    v-if="register?.session_state !== 'opened'"
    class="border border-amber-500/30 bg-amber-500/5"
  >
    <CardHeader>
      <CardTitle class="text-base font-bold flex items-center gap-2 text-amber-800">
        <Lock class="h-5 w-5" /> بدء تشغيل اليومية وفتح الصندوق
      </CardTitle>
      <CardDescription class="text-xs text-amber-700">
        لتتمكن من إدراج المنتجات وبدء الفواتير، يجب تدشين دورة مالية أولاً
        في خادم أودو.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="max-w-xs space-y-3">
        <div class="space-y-1.5">
          <Label for="opening-cash-dashboard" class="text-xs font-semibold">
            المبلغ الافتتاحي بالخزنة كاش
          </Label>
          <Input
            id="opening-cash-dashboard"
            type="number"
            :value="openingCash"
            @input="emit('update:openingCash', Number(($event.target as HTMLInputElement).value))"
            class="bg-background"
            placeholder="0.00"
          />
        </div>
        <Button
          @click="register && emit('open-session', register.id)"
          class="bg-amber-600 hover:bg-amber-700 text-white gap-2 w-full cursor-pointer"
          :disabled="loading || !register"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <span>تأكيد رصيد البدء وفتح الوردية</span>
        </Button>
      </div>
    </CardContent>
  </Card>

  <Card v-else class="border-emerald-500/20 bg-muted/10">
    <CardContent class="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div
        class="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"
      >
        <ShoppingCart class="h-10 w-10" />
      </div>
      <div class="space-y-2">
        <p class="text-lg font-bold text-foreground/80">
          شاشة البيع السريع جاهزة لاستقبال المعاملات
        </p>
        <p class="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          الدورة الحالية المفتوحة برقم #{{ register?.session_id || "نشط" }}
          مرتبطة بقواعد البيانات. يمكنك تشغيل الكتالوج وبدء طباعة الإيصالات.
        </p>
      </div>
    </CardContent>
  </Card>
</template>
