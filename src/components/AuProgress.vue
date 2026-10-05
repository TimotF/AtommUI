<script setup lang="ts">
import { computed, useId } from 'vue';
import { VProgressLinear } from 'vuetify/components/VProgressLinear';
import AuButton from './AuButton.vue';
import { finiteSliderValue } from '../contracts.js';
const props = defineProps<{ id?: string; label: string; value?: number; cancelLabel?: string; cancelId?: string; cancelTestId?: string }>();
const generatedId = `au-progress-${useId()}`;
const resolvedId = computed(() => props.id ?? generatedId);
const displayValue = computed(() => finiteSliderValue(props.value,0,100) ?? undefined);
const emit = defineEmits<{ cancel: [] }>();
</script>
<template>
  <div :id="resolvedId" class="au-progress gen-progress" role="progressbar" :aria-label="label" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="displayValue">
    <div class="au-progress-heading"><span :id="`${resolvedId}-stage`">{{ label }}</span><span :id="`${resolvedId}-value`">{{ displayValue === undefined ? '' : `${Math.round(displayValue)}%` }}</span><AuButton v-if="cancelLabel" :id="cancelId ?? `${resolvedId}-cancel`" :data-testid="cancelTestId" @click="emit('cancel')">{{ cancelLabel }}</AuButton></div>
    <VProgressLinear :id="`${resolvedId}-bar`" color="primary" :model-value="displayValue ?? 0" :indeterminate="displayValue === undefined" height="3" aria-hidden="true" />
  </div>
</template>
