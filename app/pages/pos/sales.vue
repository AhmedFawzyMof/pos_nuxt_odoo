<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import PosSalesWorkspace from "~/components/pos/PosSalesWorkspace.vue";

const router = useRouter();
const configId = ref("");

onMounted(() => {
  const id = router.currentRoute.value.query.config_id as string;
  if (id) {
    configId.value = id;
  } else {
    router.replace("/pos");
  }
});
</script>

<template>
  <div v-if="configId" class="-m-6 h-[calc(100vh-4rem)]">
    <PosSalesWorkspace :config-id="configId" />
  </div>
</template>
