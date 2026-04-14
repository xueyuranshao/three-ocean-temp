<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createOceanScene, type FoldDirection, type OceanSceneController } from '../lib/oceanScene';

const props = defineProps<{
  foldDirection: FoldDirection;
  foldStrength: number;
  currentMonth: number | null;
}>();

const rootElement = ref<HTMLDivElement | null>(null);
let controller: OceanSceneController | null = null;

onMounted(() => {
  if (!rootElement.value) {
    return;
  }

  controller = createOceanScene(rootElement.value, {
    foldDirection: props.foldDirection,
    foldStrength: props.foldStrength / 100,
    currentMonth: props.currentMonth,
  });
});

watch(() => props.foldDirection, (value) => controller?.setFoldDirection(value));
watch(() => props.foldStrength, (value) => controller?.setFoldStrength(value / 100));
watch(() => props.currentMonth, (value) => controller?.setCurrentMonth(value));

onBeforeUnmount(() => {
  controller?.dispose();
  controller = null;
});
</script>

<template>
  <div ref="rootElement" class="scene-root"></div>
</template>

<style scoped>
.scene-root {
  width: 100%;
  height: 100%;
}

:deep(canvas) {
  display: block;
}
</style>
