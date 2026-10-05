<script setup lang="ts">
import { VCheckbox } from 'vuetify/components/VCheckbox';
import AuHelp from './AuHelp.vue';
defineOptions({ inheritAttrs: false });
defineProps<{ id: string; label: string; modelValue: boolean; disabled?: boolean; help?: string; helpLabel?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>
<template>
  <div class="au-field-row au-checkbox-field field-row">
    <AuHelp v-if="help" :label="helpLabel ?? label" :text="help" :help-key="id"><label :for="id">{{ label }}</label></AuHelp>
    <label v-else :for="id">{{ label }}</label>
    <VCheckbox v-bind="$attrs" :id="id" class="au-checkbox" :aria-label="label" :model-value="modelValue" :disabled="disabled" @update:model-value="value => emit('update:modelValue',value === true)" />
  </div>
</template>
