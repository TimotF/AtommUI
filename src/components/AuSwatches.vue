<script setup lang="ts">
import { VBtn } from 'vuetify/components/VBtn';
import AuIcon from './AuIcon.vue';
import { safeHexColor, type UiSwatch } from '../contracts.js';
const props = defineProps<{ label: string; modelValue: string; items: readonly UiSwatch[]; named?: boolean; dataKey?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
function select(value: string) { if (props.items.some(item => item.value === value)) emit('update:modelValue',value); }
</script>
<template>
  <div class="au-swatches" :class="{ 'au-swatches-named': named }" role="group" :aria-label="label">
    <VBtn v-for="item in items" :key="item.value" :aria-label="item.title" :aria-pressed="String(modelValue === item.value)" class="au-swatch" :class="{ 'au-swatch-dark': item.dark, 'au-swatch-selected': modelValue === item.value }" :style="named ? undefined : { backgroundColor: safeHexColor(item.color) }" v-bind="dataKey ? { [dataKey]: item.value } : {}" variant="text" :ripple="false" @click="select(item.value)">
      <span v-if="named" class="au-swatch-paint" :style="{ backgroundColor: safeHexColor(item.color) }" aria-hidden="true" /><span v-if="named">{{ item.title }}</span><AuIcon v-else path="m3.5 8.5 3 3 6-7" />
    </VBtn>
  </div>
</template>
