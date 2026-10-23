<script setup lang="ts">
import { VSwitch } from 'vuetify/components/VSwitch';
import AuHelp from './AuHelp.vue';
defineOptions({ inheritAttrs: false });
const props = defineProps<{ id: string; label: string; modelValue: boolean; disabled?: boolean; loading?: boolean; help?: string; helpLabel?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
function update(value: unknown) { if (!props.disabled && !props.loading) emit('update:modelValue', value === true); }
</script>
<template>
  <div class="au-field-row au-switch-field field-row" :aria-busy="loading ? 'true' : undefined">
    <AuHelp v-if="help || $slots.help" :label="helpLabel ?? label" :text="help ?? ''" :help-key="id"><label :for="id">{{ label }}</label><template v-if="$slots.help" #content><slot name="help" /></template></AuHelp>
    <label v-else :for="id">{{ label }}</label>
    <VSwitch v-bind="$attrs" :id="id" class="au-switch" role="switch" :aria-label="label" :model-value="modelValue" :disabled="disabled || loading" :loading="loading" color="primary" inset hide-details @update:model-value="update" />
  </div>
</template>
