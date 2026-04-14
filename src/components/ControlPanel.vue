<script setup lang="ts">
import type { FoldDirection } from '../lib/oceanScene';

const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] as const;

defineProps<{
  activeFoldDirection: FoldDirection | null;
  foldStrength: number;
  currentMonth: number | null;
}>();

const emit = defineEmits<{
  'update:foldDirection': [value: FoldDirection];
  'update:foldStrength': [value: number];
  'update:currentMonth': [value: number];
}>();

function selectDirection(nextDirection: FoldDirection): void {
  emit('update:foldDirection', nextDirection);
}

function selectMonth(nextMonth: number): void {
  emit('update:currentMonth', nextMonth);
}

function updateStrength(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('update:foldStrength', Number(target.value));
}
</script>

<template>
  <aside class="control-panel">
    <div class="panel-title">三维温度场可视分析</div>

    <div class="month-panel">
      <span class="section-label">月份</span>
      <div class="month-grid">
        <button
          v-for="(label, index) in monthLabels"
          :key="label"
          type="button"
          :class="{ 'is-active': currentMonth === index + 1 }"
          @click="selectMonth(index + 1)"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <div class="panel-divider"></div>

    <div class="direction-panel">
      <span class="section-label">体块伸展</span>
      <div class="direction-switch">
        <button type="button" :class="{ 'is-active': activeFoldDirection === 'rtl' }" @click="selectDirection('rtl')">右向左</button>
        <button type="button" :class="{ 'is-active': activeFoldDirection === 'ltr' }" @click="selectDirection('ltr')">左向右</button>
        <button type="button" :class="{ 'is-active': activeFoldDirection === 'ttb' }" @click="selectDirection('ttb')">上到下</button>
      </div>
    </div>

    <label class="slider-group" for="slice-range">
      <span>海面温度层抽拉</span>
      <input id="slice-range" type="range" min="0" max="100" :value="foldStrength" @input="updateStrength" @change="updateStrength" />
    </label>

    <div class="readout">
      <span>抽拉强度</span>
      <strong>{{ Math.round(foldStrength) }}%</strong>
    </div>
  </aside>
</template>

<style scoped>
.control-panel {
  position: fixed;
  left: 20px;
  top: 20px;
  z-index: 5;
  width: min(320px, calc(100vw - 40px));
  padding: 16px 18px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 18px;
  background: rgba(245, 248, 250, 0.76);
  backdrop-filter: blur(16px);
  box-shadow: 0 18px 40px rgba(44, 69, 88, 0.18);
}

.panel-title {
  margin-bottom: 14px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.slider-group {
  display: block;
}

.slider-group span,
.readout span {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: rgba(31, 45, 61, 0.72);
}

.slider-group input {
  width: 100%;
}

.readout {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 12px;
}

.readout strong {
  font-size: 22px;
  font-weight: 700;
  color: #244890;
}

.section-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: rgba(31, 45, 61, 0.72);
}

.month-panel,
.direction-panel {
  margin-bottom: 14px;
}

.month-grid,
.direction-switch {
  display: grid;
  gap: 6px;
}

.month-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.direction-switch {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.month-grid button,
.direction-switch button {
  border: 1px solid rgba(80, 105, 129, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  color: #35506f;
  padding: 7px 0;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.month-grid button.is-active,
.direction-switch button.is-active {
  background: #2a5ea8;
  color: #f2f7fb;
  border-color: #2a5ea8;
}

.panel-divider {
  height: 1px;
  margin: 12px 0 14px;
  background: linear-gradient(90deg, rgba(53, 80, 111, 0), rgba(53, 80, 111, 0.24), rgba(53, 80, 111, 0));
}
</style>