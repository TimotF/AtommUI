<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { VMenu } from 'vuetify/components/VMenu';
import { VColorPicker } from 'vuetify/components/VColorPicker';
import AuButton from './AuButton.vue';
import AuHelp from './AuHelp.vue';
import { compactProfileKey } from '../profile.js';
import { safeHexColor } from '../contracts.js';
defineOptions({ inheritAttrs: false });
const props = defineProps<{ id: string; label: string; modelValue: string; hexLabel: string; invalidMessage: string; disabled?: boolean; help?: string; helpLabel?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const compact = inject(compactProfileKey, () => false);
const open = ref(false), draft = ref(safeHexColor(props.modelValue));
const color = computed(() => safeHexColor(props.modelValue));
const invalid = computed(() => !/^#[0-9a-f]{6}$/i.test(draft.value));
const contentClass = computed(() => `au-overlay au-color-menu${compact() ? ' au-profile-compact' : ''}`);
function update(value: unknown) {
  if (props.disabled || typeof value !== 'string' || !/^#[0-9a-f]{6}(?:ff)?$/i.test(value)) return;
  const next = value.slice(0,7).toLowerCase(); draft.value = next; emit('update:modelValue',next);
}
function edit(event: Event) { draft.value = (event.target as HTMLInputElement).value; if (!invalid.value) update(draft.value); }
watch(open, () => { draft.value = color.value; });
watch(color, value => { if (!open.value || !invalid.value) draft.value = value; });
watch(() => props.disabled, value => { if (value) open.value = false; });
</script>
<template>
  <div class="au-field-row au-color-field field-row">
    <AuHelp v-if="help" :label="helpLabel ?? label" :text="help" :help-key="id"><span :id="`${id}-label`">{{ label }}</span></AuHelp>
    <span v-else :id="`${id}-label`" class="au-color-label">{{ label }}</span>
    <VMenu v-model="open" :disabled="disabled" :close-on-content-click="false" location="top end" :offset="8" :z-index="3" :content-class="contentClass" :max-width="'calc(100vw - 24px)'" :transition="false" :activator-props="{ 'aria-haspopup': 'dialog' }">
      <template #activator="{ props: activator }"><AuButton v-bind="{...activator,...$attrs}" :id="id" class="au-color-button" variant="text" :disabled="disabled" :aria-label="label" :aria-expanded="String(open)" :aria-controls="open ? `${id}-dialog` : undefined"><span class="au-color-swatch" :style="{backgroundColor:color}" aria-hidden="true"/></AuButton></template>
      <div :id="`${id}-dialog`" role="dialog" :aria-label="label" class="au-color-dialog">
        <VColorPicker :model-value="color" mode="hex" :modes="['hex']" :width="256" :elevation="0" hide-inputs hide-mode-switch @update:model-value="update" />
        <div class="au-color-hex"><label :for="`${id}-hex`">HEX</label><input :id="`${id}-hex`" :value="draft" type="text" :aria-label="hexLabel" :aria-invalid="invalid" :aria-describedby="invalid ? `${id}-error` : undefined" :disabled="disabled" maxlength="7" autocomplete="off" :spellcheck="false" @input="edit"/><p v-if="invalid" :id="`${id}-error`" class="au-field-error" role="status">{{ invalidMessage }}</p></div>
      </div>
    </VMenu>
  </div>
</template>
