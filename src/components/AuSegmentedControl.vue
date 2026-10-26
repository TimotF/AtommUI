<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
import {compactProfileKey} from '../profile.js';
import { isOptionValue, type UiTab } from '../contracts.js';
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ modelValue: string; items: readonly UiTab[]; label: string; disabled?: boolean }>(), { disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const compact=inject(compactProfileKey,()=>false);
const group = ref<HTMLElement | null>(null);
const selected = computed(() => props.items.find(item => item.value === props.modelValue && !item.disabled)?.value ?? props.items.find(item => !item.disabled)?.value);
function choose(value: string) { if (!props.disabled && isOptionValue(value, props.items)) emit('update:modelValue', value); }
function key(event: KeyboardEvent) {
  if (props.disabled || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  const available = props.items.filter(item => !item.disabled); if (!available.length) return;
  const current = (event.target as Element).closest('[data-value]')?.getAttribute('data-value') ?? selected.value;
  let index = Math.max(0, available.findIndex(item => item.value === current));
  const direction = group.value && getComputedStyle(group.value).direction === 'rtl' ? -1 : 1;
  if (event.key === 'Home') index = 0;
  else if (event.key === 'End') index = available.length - 1;
  else { const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : (event.key === 'ArrowRight' ? 1 : -1) * direction; index = (index + delta + available.length) % available.length; }
  event.preventDefault();
  const option = available[index]!; choose(option.value);
  const buttons = group.value?.querySelectorAll<HTMLButtonElement>('button[data-value]');
  [...buttons ?? []].find(button => button.getAttribute('data-value') === option.value)?.focus();
}
</script>
<template>
  <div ref="group" v-bind="$attrs" class="au-segmented-control" :role="compact()?'group':'radiogroup'" :aria-label="label" :aria-disabled="disabled ? 'true' : undefined" @keydown="key">
    <VBtn v-for="item in items" :key="item.value" class="au-segmented-option" :class="{ 'au-segmented-selected': modelValue === item.value, 'au-tab-compact':!!item.compactTitle }" variant="text" :ripple="false" :role="compact()?undefined:'radio'" :aria-checked="compact()?undefined:String(modelValue === item.value)" :aria-pressed="compact()?String(modelValue === item.value):undefined" :aria-label="item.title" :data-value="item.value" :data-testid="item.testId" :disabled="disabled || item.disabled" :tabindex="!disabled && !item.disabled && selected === item.value ? 0 : -1" @click="choose(item.value)"><span class="au-tab-title-full">{{item.title}}</span><span v-if="item.compactTitle" class="au-tab-title-short" aria-hidden="true">{{item.compactTitle}}</span></VBtn>
  </div>
</template>
