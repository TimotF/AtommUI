<script setup lang="ts">
import AuExampleCard from './AuExampleCard.vue';
import AuMaterialThumbnail from './AuMaterialThumbnail.vue';
import { isOptionValue, type UiMaterialOption } from '../contracts.js';
const props = withDefaults(defineProps<{ label: string; modelValue: string; items: readonly UiMaterialOption[]; color?: string; disabled?: boolean }>(), { disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
function select(value: string) { if (!props.disabled && isOptionValue(value, props.items)) emit('update:modelValue', value); }
</script>
<template>
  <div class="au-material-picker" role="group" :aria-label="label" :aria-disabled="disabled || undefined">
    <AuExampleCard v-for="item in items" :key="item.value" :title="item.title" :active="modelValue === item.value" :disabled="disabled || item.disabled" @click="select(item.value)"><AuMaterialThumbnail :material="item.material" :color="item.color ?? color"/></AuExampleCard>
  </div>
</template>
