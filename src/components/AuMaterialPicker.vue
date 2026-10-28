<script setup lang="ts">
import AuButton from './AuButton.vue';
import AuTooltip from './AuTooltip.vue';
import AuExampleCard from './AuExampleCard.vue';
import AuMaterialThumbnail from './AuMaterialThumbnail.vue';
import { isOptionValue, type UiMaterialOption } from '../contracts.js';
const props = withDefaults(defineProps<{ label: string; modelValue: string; items: readonly UiMaterialOption[]; color?: string; disabled?: boolean; appearance?: 'default' | 'surface' }>(), { disabled: false, appearance:'default' });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
function select(value: string) { if (!props.disabled && isOptionValue(value, props.items)) emit('update:modelValue', value); }
</script>
<template>
  <div class="au-material-picker" :class="{'au-material-picker-surface':appearance==='surface'}" role="group" :aria-label="label" :aria-disabled="disabled || undefined">
    <template v-if="appearance==='surface'"><AuTooltip v-for="item in items" :key="item.value" :text="item.title"><template #activator="{props:helpProps}"><AuButton v-bind="helpProps" class="au-material-surface-tile" :aria-label="item.title" :aria-pressed="modelValue===item.value" :disabled="disabled||item.disabled" @click="select(item.value)"><AuMaterialThumbnail :material="item.material" :color="item.color??color"/></AuButton></template></AuTooltip></template>
    <template v-else><AuExampleCard v-for="item in items" :key="item.value" :title="item.title" :active="modelValue === item.value" :disabled="disabled || item.disabled" @click="select(item.value)"><AuMaterialThumbnail :material="item.material" :color="item.color ?? color"/></AuExampleCard></template>
  </div>
</template>
