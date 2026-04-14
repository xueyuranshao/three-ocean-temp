<script setup lang="ts">
import { ref } from 'vue';
import ControlPanel from './components/ControlPanel.vue';
import OceanScene from './components/OceanScene.vue';
import type { FoldDirection } from './lib/oceanScene';

const defaultFoldDirection: FoldDirection = 'rtl';

const foldDirection = ref<FoldDirection>(defaultFoldDirection);
const activeFoldDirection = ref<FoldDirection | null>(defaultFoldDirection);
const foldStrength = ref(0);
const currentMonth = ref<number | null>(null);

function handleDirectionChange(nextDirection: FoldDirection): void {
  foldDirection.value = nextDirection;
  activeFoldDirection.value = nextDirection;
  foldStrength.value = 0;
  currentMonth.value = null;
}

function handleMonthChange(nextMonth: number): void {
  currentMonth.value = nextMonth;
  activeFoldDirection.value = null;
  foldDirection.value = defaultFoldDirection;
  foldStrength.value = 0;
}
</script>

<template>
  <div class="app-shell">
    <OceanScene
      :fold-direction="foldDirection"
      :fold-strength="foldStrength"
      :current-month="currentMonth"
    />
    <ControlPanel
      :active-fold-direction="activeFoldDirection"
      :fold-strength="foldStrength"
      :current-month="currentMonth"
      @update:fold-direction="handleDirectionChange"
      @update:fold-strength="foldStrength = $event"
      @update:current-month="handleMonthChange"
    />
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>