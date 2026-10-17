<script setup lang="ts">
import { VTextField } from 'vuetify/components/VTextField';
import AuHelp from './AuHelp.vue';
defineOptions({ inheritAttrs: false });
const props = defineProps<{ id: string; label: string; modelValue: string; error?: string; disabled?: boolean; readOnly?: boolean; help?: string; helpLabel?: string; placeholder?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
function update(value: unknown) {
  if (!props.disabled && !props.readOnly) emit('update:modelValue', typeof value === 'string' ? value : '');
}
</script>
<template>
  <div class="au-field au-text-field">
    <AuHelp v-if="help" :label="helpLabel ?? label" :text="help" :help-key="id"><label :for="id">{{ label }}</label></AuHelp><label v-else :for="id">{{ label }}</label>
    <VTextField v-bind="$attrs" :id="id" class="au-text-control" :model-value="modelValue" :placeholder="placeholder" type="text" autocomplete="off" :aria-label="label" :aria-invalid="String(!!error)" :aria-describedby="error ? `${id}-error` : undefined" :error="!!error" :disabled="disabled" :readonly="readOnly" @update:model-value="update" />
    <p :id="`${id}-error`" class="au-field-error" :hidden="!error" role="status">{{ error }}</p>
  </div>
</template>
