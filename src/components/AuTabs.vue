<script setup lang="ts">
import { VTabs, VTab } from 'vuetify/components/VTabs';
import { isOptionValue, type UiTab } from '../contracts.js';
const props = defineProps<{ modelValue: string; items: readonly UiTab[]; label: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
function update(value: unknown) { if (isOptionValue(value,props.items)) emit('update:modelValue',value); }
</script>
<template><VTabs class="au-tabs segmented segmented-tabs" :model-value="modelValue" :aria-label="label" height="32" hide-slider @update:model-value="update"><VTab v-for="item in items" :key="item.value" :value="item.value" :disabled="item.disabled" :data-view="item.value" :data-testid="item.testId" :ripple="false">{{ item.title }}</VTab></VTabs></template>
