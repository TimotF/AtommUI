<script setup lang="ts">
import { VSelect } from 'vuetify/components/VSelect';
import { VListItem } from 'vuetify/components/VList';
import AuHelp from './AuHelp.vue';
import { isOptionValue, type UiOption } from '../contracts.js';
defineOptions({ inheritAttrs: false });
const props = defineProps<{ id: string; label: string; modelValue: string; items: readonly UiOption[]; help?: string; helpLabel?: string; disabled?: boolean; stacked?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
function update(value: unknown) { if (isOptionValue(value,props.items)) emit('update:modelValue',value); }
function optionColor(color: unknown): string | undefined {
  return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : undefined;
}
</script>
<template>
  <div class="au-select-field" :class="{ 'au-field-row field-row': !stacked }">
    <AuHelp v-if="help" :label="helpLabel ?? label" :text="help" :help-key="id"><label :for="id">{{ label }}</label></AuHelp>
    <label v-else :for="id">{{ label }}</label>
    <VSelect v-bind="$attrs" :id="id" class="au-select-control" :model-value="modelValue" :items="items" item-value="value" item-title="title" :item-props="item => ({ disabled: !!item.disabled })" :aria-label="label" :disabled="disabled" :menu-props="{ contentClass: 'au-overlay au-select-menu', maxWidth: 360, transition: false, zIndex: 3 }" @update:model-value="update">
      <template #selection="{ item }"><span class="au-select-selection"><span v-if="optionColor(item.color)" class="au-option-paint" aria-hidden="true" :style="{ backgroundColor: optionColor(item.color) }" /><span class="au-option-title">{{ item.title }}</span></span></template>
      <template #item="{ item, props: itemProps }"><VListItem v-bind="itemProps" role="option" :aria-disabled="item.disabled ? 'true' : undefined"><template v-if="optionColor(item.color)" #prepend><span class="au-option-paint" aria-hidden="true" :style="{ backgroundColor: optionColor(item.color) }" /></template></VListItem></template>
    </VSelect>
  </div>
</template>
