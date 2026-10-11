<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref } from 'vue';
import { VSelect } from 'vuetify/components/VSelect';
import { VListItem } from 'vuetify/components/VList';
import AuHelp from './AuHelp.vue';
import { compactProfileKey } from '../profile.js';
import { isOptionValue, type UiOption } from '../contracts.js';
defineOptions({ inheritAttrs: false });
const props = defineProps<{ id: string; label: string; modelValue: string; items: readonly UiOption[]; help?: string; helpLabel?: string; disabled?: boolean; stacked?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const compactProfile = inject(compactProfileKey, () => false);
const select = ref<InstanceType<typeof VSelect> | null>(null);
let keyboardSelection: { document: Document; option: HTMLElement } | null = null;
function clearKeyboardSelection() {
  keyboardSelection?.document.removeEventListener('pointerdown', clearKeyboardSelection, true);
  keyboardSelection = null;
}
function onOptionKeydown(event: KeyboardEvent, disabled: unknown) {
  if (event.repeat || props.disabled || disabled || !['Enter', ' '].includes(event.key)) return;
  const option = event.currentTarget;
  if (!(option instanceof HTMLElement)) return;
  clearKeyboardSelection();
  keyboardSelection = { document: option.ownerDocument, option };
  option.ownerDocument.addEventListener('pointerdown', clearKeyboardSelection, true);
}
function onAfterLeave() {
  const selection = keyboardSelection;
  clearKeyboardSelection();
  if (!selection || props.disabled) return;
  const active = selection.document.activeElement;
  // A removed keyboard option can orphan focus before Vuetify's leave hook.
  if (active === selection.document.body || (active && selection.option.contains(active))) select.value?.focus();
}
onBeforeUnmount(clearKeyboardSelection);
const menuProps = computed(() => ({ contentClass: `au-overlay au-select-menu${compactProfile() ? ' au-profile-compact' : ''}`, maxWidth: 360, transition: false as const, zIndex: 3, onAfterLeave }));
function update(value: unknown) { if (isOptionValue(value,props.items)) emit('update:modelValue',value); }
function optionColor(color: unknown): string | undefined {
  return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : undefined;
}
</script>
<template>
  <div class="au-select-field" :class="{ 'au-field-row field-row': !stacked }">
    <AuHelp v-if="help" :label="helpLabel ?? label" :text="help" :help-key="id"><label :for="id">{{ label }}</label></AuHelp>
    <label v-else :for="id">{{ label }}</label>
    <VSelect ref="select" v-bind="$attrs" :id="id" class="au-select-control" :model-value="modelValue" :items="items" item-value="value" item-title="title" :item-props="item => ({ disabled: !!item.disabled })" :aria-label="label" :disabled="disabled" :menu-props="menuProps" @update:model-value="update">
      <template #selection="{ item }"><span class="au-select-selection"><slot name="selection-prepend" :item="item"><span v-if="optionColor(item.color)" class="au-option-paint" aria-hidden="true" :style="{ backgroundColor: optionColor(item.color) }" /></slot><span class="au-option-title">{{ item.title }}</span></span></template>
      <template #item="{ item, props: itemProps }"><VListItem v-bind="itemProps" role="option" :aria-disabled="item.disabled ? 'true' : undefined" @keydown.capture="onOptionKeydown($event, itemProps.disabled)"><template v-if="optionColor(item.color) || $slots['item-prepend']" #prepend><slot name="item-prepend" :item="item"><span class="au-option-paint" aria-hidden="true" :style="{ backgroundColor: optionColor(item.color) }" /></slot></template></VListItem></template>
    </VSelect>
  </div>
</template>
