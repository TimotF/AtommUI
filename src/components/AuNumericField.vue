<script setup lang="ts">
import { VTextField } from 'vuetify/components/VTextField';
import AuHelp from './AuHelp.vue';
import type { DecimalAdjustment } from '../contracts.js';
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ id: string; label: string; modelValue: string; suffix?: string; error?: string; disabled?: boolean; help?: string; helpLabel?: string; step?: number; adjust?: DecimalAdjustment; inputMode?: 'decimal' | 'numeric' }>(), { disabled: false, step: 1, inputMode: 'decimal' });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
let drag: { x: number; value: string; active: boolean; input: HTMLInputElement; pointer: number } | null = null;
function update(value: unknown) { emit('update:modelValue',typeof value === 'string' ? value : ''); }
function key(event: KeyboardEvent) {
  if (!event.shiftKey || !['ArrowUp','ArrowDown'].includes(event.key) || !props.adjust || props.disabled) return;
  const delta = (event.key === 'ArrowUp' ? 1 : -1) * props.step * (event.altKey ? .1 : 10);
  const value = props.adjust(props.modelValue,delta); if (value === null) return;
  event.preventDefault(); emit('update:modelValue',value);
}
function down(event: PointerEvent) {
  if (event.button !== 0 || !props.adjust || props.disabled || props.adjust(props.modelValue,0) === null || !(event.target instanceof HTMLInputElement)) return;
  drag = { x: event.clientX, value: props.modelValue, active: false, input: event.target, pointer: event.pointerId };
}
function move(event: PointerEvent) {
  if (!drag || !props.adjust || props.disabled) return;
  const dx = event.clientX - drag.x; if (Math.abs(dx) < 3 && !drag.active) return;
  if (!drag.active) { drag.active = true; drag.input.setPointerCapture(drag.pointer); }
  event.preventDefault(); const direction = getComputedStyle(drag.input).direction === 'rtl' ? -1 : 1;
  const value = props.adjust(drag.value,dx * props.step * (event.shiftKey ? 10 : event.altKey ? .1 : 1) * direction);
  if (value !== null) emit('update:modelValue',value);
}
function end() { drag = null; }
</script>
<template>
  <div class="au-field au-numeric">
    <div class="au-field-row field-row">
      <AuHelp v-if="help" :label="helpLabel ?? label" :text="help" :help-key="id"><label :for="id">{{ label }}</label></AuHelp>
      <label v-else :for="id">{{ label }}</label>
      <VTextField v-bind="$attrs" :id="id" class="au-numeric-control input-number" :model-value="modelValue" type="text" :inputmode="inputMode" autocomplete="off" :spellcheck="false" :aria-label="label" :aria-invalid="String(!!error)" :aria-describedby="`${id}-error`" :error="!!error" :disabled="disabled" :suffix="suffix" @update:model-value="update" @keydown="key" @pointerdown="down" @pointermove="move" @pointerup="end" @pointercancel="end" />
    </div>
    <p :id="`${id}-error`" class="au-field-error field-error" :hidden="!error" role="status">{{ error }}</p>
  </div>
</template>
