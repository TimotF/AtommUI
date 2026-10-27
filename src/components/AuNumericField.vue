<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useLocale } from 'vuetify';
import { VTextField } from 'vuetify/components/VTextField';
import AuHelp from './AuHelp.vue';
import AuButton from './AuButton.vue';
import type { DecimalAdjustment } from '../contracts.js';
import { adjustNumericDraft, decimalStepDelta } from '../numeric.js';
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ id: string; label: string; modelValue: string; suffix?: string; error?: string; disabled?: boolean; readOnly?: boolean; help?: string; helpLabel?: string; step?: number; min?: number; max?: number; adjust?: DecimalAdjustment; formatDisplay?: (value: string) => string; inputMode?: 'decimal' | 'numeric'; drag?: boolean; dragPixelsPerStep?: number; stepper?: boolean; incrementLabel?: string; decrementLabel?: string }>(), { disabled: false, readOnly: false, step: 1, inputMode: 'decimal', drag: true, dragPixelsPerStep: 8, stepper: false });
const emit = defineEmits<{ 'update:modelValue': [value: string]; adjust: [value: string] }>();
const locale = useLocale(), dragging = ref(false), editing = ref(false);
const editingDraft = ref(props.modelValue);
// Preserve incomplete decimals and trailing zeroes while the user types.
// Formatting on every keystroke turns e.g. "0,0" into "0" before the next digit.
const displayValue = computed(() => editing.value ? editingDraft.value : props.formatDisplay?.(props.modelValue) ?? props.modelValue);
type Gesture = { x: number; y: number; initial: string; last: string; input: HTMLInputElement; pointer: number; active: boolean; direction: number };
let gesture: Gesture | null = null, suppressClick = false, clickTimer: ReturnType<typeof setTimeout> | undefined;
const validStep = computed(() => Number.isFinite(props.step) && props.step > 0 && Number.isFinite(props.dragPixelsPerStep) && props.dragPixelsPerStep > 0);
function adjusted(text: string, delta: number): string | null {
  if (props.inputMode === 'numeric' && !/^[+-]?\d+$/.test(text)) return null;
  const decimalSeparator = /^(fr|es)(-|$)/.test(locale.current.value) ? ',' : '.';
  try {
    const result = props.adjust ? props.adjust(text, delta) : adjustNumericDraft(text, delta, { decimalSeparator });
    const value = result === null ? null : adjustNumericDraft(result, 0, { min: props.min, max: props.max, decimalSeparator });
    return value !== null && props.inputMode === 'numeric' && !/^[+-]?\d+$/.test(value) ? null : value;
  } catch { return null; }
}
/** Button adjustments share exact decimal arithmetic with scrubbing. No draft repair. */
function stepped(direction: number): string | null {
  if (props.disabled || props.readOnly || !validStep.value) return null;
  const delta = decimalStepDelta(direction, props.step);
  return delta === null ? null : adjusted(props.modelValue, delta);
}
function canStep(direction: number) {
  const value = stepped(direction);
  return value !== null && adjusted(props.modelValue, 0) !== value;
}
function stepBy(direction: number) {
  if (!canStep(direction)) return;
  finish(false);
  const value = stepped(direction);
  if (value === null) return;
  if (editing.value) editingDraft.value = value;
  emit('update:modelValue', value);
  emit('adjust', value);
}
const draggable = computed(() => !props.disabled && !props.readOnly && props.drag && validStep.value && adjusted(props.modelValue, 0) !== null);
function update(value: unknown) {
  if (props.disabled || props.readOnly) return;
  const text = typeof value === 'string' ? value : '';
  // Re-emitting a rounded presentation must not round its physical source.
  const retained = props.formatDisplay && text === displayValue.value ? props.modelValue : text;
  if (editing.value) editingDraft.value = text;
  emit('update:modelValue', retained);
}
function focus() { editingDraft.value = props.formatDisplay?.(props.modelValue) ?? props.modelValue; editing.value = true; }
function blur(event: FocusEvent) {
  editing.value = false;
  if (props.formatDisplay && event.target instanceof HTMLInputElement) event.target.value = displayValue.value;
}
function detach() {
  window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
  window.removeEventListener('pointercancel', cancel); window.removeEventListener('keydown', escape);
}
function finish(restore: boolean) {
  const previous = gesture; gesture = null; dragging.value = false; detach();
  if (!previous) return;
  try { if (previous.input.hasPointerCapture(previous.pointer)) previous.input.releasePointerCapture(previous.pointer); } catch { /* The browser may already have released it. */ }
  if (restore && previous.active && previous.last !== previous.initial) emit('update:modelValue', previous.initial);
}
function escape(event: KeyboardEvent) { if (event.key === 'Escape' && gesture) { event.preventDefault(); event.stopPropagation(); finish(true); } }
function key(event: KeyboardEvent) {
  if (event.target instanceof Element && event.target.closest('button, a, [role="button"]')) return;
  escape(event);
  if (!event.shiftKey || !['ArrowUp', 'ArrowDown'].includes(event.key) || props.disabled || props.readOnly || !validStep.value || (event.target instanceof HTMLInputElement && (event.target.disabled || event.target.readOnly))) return;
  const delta = decimalStepDelta(event.key === 'ArrowUp' ? 1 : -1, props.step, event.altKey ? .1 : 10);
  const value = delta === null ? null : adjusted(props.modelValue, delta);
  if (value !== null) { event.preventDefault(); emit('update:modelValue', value); }
}
function down(event: PointerEvent) {
  // Accessory actions must not begin a numeric drag gesture.
  if (event.target instanceof Element && event.target.closest('button, a, [role="button"]')) return;
  const input = event.target instanceof Element ? event.target.closest('.au-numeric-control')?.querySelector<HTMLInputElement>('input') : null;
  if (!event.isPrimary || event.button !== 0 || !draggable.value || !input || input.disabled || input.readOnly) return;
  finish(false);
  gesture = { x: event.clientX, y: event.clientY, initial: props.modelValue, last: props.modelValue, active: false, input, pointer: event.pointerId, direction: getComputedStyle(input).direction === 'rtl' ? -1 : 1 };
  window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel); window.addEventListener('keydown', escape);
}
function move(event: PointerEvent) {
  const current = gesture; if (!current || event.pointerId !== current.pointer) return;
  if (props.disabled || props.readOnly || !props.drag || !validStep.value || current.input.disabled || current.input.readOnly) { finish(false); return; }
  const dx = event.clientX - current.x, dy = event.clientY - current.y;
  if (!current.active) {
    if (Math.abs(dy) >= 6 && Math.abs(dy) > Math.abs(dx)) { finish(false); return; }
    if (Math.abs(dx) < 6 || Math.abs(dx) <= Math.abs(dy) * 1.25) return;
    current.active = true; dragging.value = true;
    try { current.input.setPointerCapture(current.pointer); } catch { /* Window listeners remain a capture fallback. */ }
  }
  if (event.cancelable) event.preventDefault();
  const distance = dx * current.direction;
  const units = Math.sign(distance) * Math.round(Math.abs(distance) / props.dragPixelsPerStep);
  const delta = decimalStepDelta(units, props.step, event.shiftKey ? 10 : event.altKey ? .1 : 1);
  const value = delta === null ? null : adjusted(current.initial, delta);
  if (value !== null && value !== current.last) { current.last = value; emit('update:modelValue', value); }
}
function up(event: PointerEvent) {
  if (!gesture || event.pointerId !== gesture.pointer) return;
  if (gesture.active) {
    suppressClick = true; if (clickTimer !== undefined) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { suppressClick = false; clickTimer = undefined; }, 250);
  }
  finish(false);
}
function cancel(event: PointerEvent) { if (gesture && event.pointerId === gesture.pointer) finish(true); }
function lost(event: PointerEvent) { if (gesture?.active && event.pointerId === gesture.pointer) finish(true); }
function click(event: MouseEvent) { if (suppressClick && event.detail > 0) { suppressClick = false; event.preventDefault(); event.stopPropagation(); } }
watch(() => props.modelValue, value => { if (gesture && value !== gesture.last) finish(false); if (editing.value) editingDraft.value = value; });
watch(() => [props.disabled, props.readOnly, props.drag], () => { if (props.disabled || props.readOnly || !props.drag) finish(false); });
onBeforeUnmount(() => { finish(false); if (clickTimer !== undefined) clearTimeout(clickTimer); });
</script>
<template>
  <div class="au-field au-numeric" :class="{ 'au-is-draggable': draggable, 'au-is-dragging': dragging }">
    <div class="au-field-row field-row">
      <slot name="label"><AuHelp v-if="help || $slots.help" :label="helpLabel ?? label" :text="help ?? ''" :help-key="id"><label :id="`${id}-label`" :for="id">{{ label }}</label><template v-if="$slots.help" #content><slot name="help" /></template></AuHelp><label v-else :id="`${id}-label`" :for="id">{{ label }}</label></slot>
      <div v-if="stepper" class="au-numeric-stepper">
        <AuButton class="au-numeric-step" icon type="button" :aria-label="decrementLabel ?? `${label} −`" :aria-controls="id" :disabled="!canStep(-1)" @pointerdown.prevent @click="stepBy(-1)">−</AuButton>
        <VTextField v-bind="$attrs" :id="id" class="au-numeric-control input-number" :model-value="displayValue" type="text" :inputmode="inputMode" autocomplete="off" :spellcheck="false" :aria-label="label" :aria-invalid="String(!!error)" :aria-describedby="`${id}-error`" :aria-keyshortcuts="readOnly || disabled ? undefined : 'Shift+ArrowUp Shift+ArrowDown'" :error="!!error" :disabled="disabled" :readonly="readOnly" :suffix="suffix" @update:model-value="update" @focus="focus" @blur="blur" @keydown="key" @pointerdown="down" @lostpointercapture="lost" @click.capture="click"><template v-if="$slots['prepend-inner']" #prepend-inner><slot name="prepend-inner" /></template></VTextField>
        <AuButton class="au-numeric-step" icon type="button" :aria-label="incrementLabel ?? `${label} +`" :aria-controls="id" :disabled="!canStep(1)" @pointerdown.prevent @click="stepBy(1)">+</AuButton>
      </div>
      <VTextField v-else v-bind="$attrs" :id="id" class="au-numeric-control input-number" :model-value="displayValue" type="text" :inputmode="inputMode" autocomplete="off" :spellcheck="false" :aria-label="label" :aria-invalid="String(!!error)" :aria-describedby="`${id}-error`" :aria-keyshortcuts="readOnly || disabled ? undefined : 'Shift+ArrowUp Shift+ArrowDown'" :error="!!error" :disabled="disabled" :readonly="readOnly" :suffix="suffix" @update:model-value="update" @focus="focus" @blur="blur" @keydown="key" @pointerdown="down" @lostpointercapture="lost" @click.capture="click"><template v-if="$slots['prepend-inner']" #prepend-inner><slot name="prepend-inner" /></template></VTextField>
    </div>
    <p :id="`${id}-error`" class="au-field-error field-error" :hidden="!error" role="status">{{ error }}</p>
  </div>
</template>
