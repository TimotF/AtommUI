<script setup lang="ts">
import { computed } from 'vue';
import { VSlider } from 'vuetify/components/VSlider';
import AuHelp from './AuHelp.vue';
import { finiteSliderValue } from '../contracts.js';
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ id: string; label: string; modelValue: number; min?: number; max?: number; step?: number; suffix?: string; help?: string; helpLabel?: string; disabled?: boolean }>(), { min: 0, max: 100, step: 1, suffix: '%', disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const validRange = computed(() => Number.isFinite(props.min) && Number.isFinite(props.max) && props.min < props.max && Number.isFinite(props.step) && props.step >= 0);
const bounds = computed(() => validRange.value ? {min:props.min,max:props.max,step:props.step} : {min:0,max:100,step:1});
const displayValue = computed(() => finiteSliderValue(props.modelValue,bounds.value.min,bounds.value.max) ?? bounds.value.min);
function update(value: unknown) { if (!validRange.value || props.disabled) return; const finite = finiteSliderValue(value,props.min,props.max); if (finite !== null) emit('update:modelValue',finite); }
</script>
<template>
  <div class="au-slider-field explode-row">
    <AuHelp v-if="help" :label="helpLabel ?? label" :text="help" :help-key="id"><label :for="id">{{ label }}</label></AuHelp>
    <label v-else :for="id">{{ label }}</label>
    <VSlider v-bind="$attrs" :id="id" class="au-slider" :name="label" :aria-label="label" :aria-valuetext="`${displayValue}${suffix}`" :aria-disabled="disabled || !validRange ? 'true' : undefined" :model-value="displayValue" :min="bounds.min" :max="bounds.max" :step="bounds.step" :disabled="disabled || !validRange" @update:model-value="update" />
    <output :id="`${id}-value`" :for="id" class="au-slider-value">{{ displayValue }}{{ suffix }}</output>
  </div>
</template>
