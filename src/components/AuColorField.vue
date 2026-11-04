<script setup lang="ts">
import { computed, inject, mergeProps, ref, useId, watch } from 'vue';
import { VMenu } from 'vuetify/components/VMenu';
import { VColorPicker } from 'vuetify/components/VColorPicker';
import AuButton from './AuButton.vue';
import AuHelp from './AuHelp.vue';
import AuTooltip from './AuTooltip.vue';
import { compactProfileKey } from '../profile.js';
import { safeHexColor } from '../contracts.js';
defineOptions({ inheritAttrs: false });
const props = defineProps<{ id: string; label: string; modelValue: string; hexLabel: string; invalidMessage: string; disabled?: boolean; help?: string; helpLabel?: string; presentation?: 'field' | 'button'; swatch?: 'color' | 'spectrum' }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const compact = inject(compactProfileKey, () => false);
const open = ref(false), draft = ref(safeHexColor(props.modelValue));
const color = computed(() => safeHexColor(props.modelValue));
const invalid = computed(() => !/^#[0-9a-f]{6}$/i.test(draft.value));
const spectrumId = `au-color-spectrum-${useId()}`;
// These are the colour-picker illustration's hues, not interface chrome.
const spectrum = ['#f65353','#ffbd45','#e8ef5a','#3fd59b','#44b9ed','#7458e8','#e65eae'];
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
  <div :class="presentation === 'button' ? 'au-color-field-button' : 'au-field-row au-color-field field-row'">
    <AuHelp v-if="presentation !== 'button' && help" :label="helpLabel ?? label" :text="help" :help-key="id"><span :id="`${id}-label`">{{ label }}</span></AuHelp>
    <span v-else-if="presentation !== 'button'" :id="`${id}-label`" class="au-color-label">{{ label }}</span>
    <VMenu v-model="open" :disabled="disabled" :close-on-content-click="false" location="top end" :offset="8" :z-index="3" :content-class="contentClass" :max-width="'calc(100vw - 24px)'" :transition="false" :activator-props="{ 'aria-haspopup': 'dialog' }">
      <template #activator="{ props: activator }">
        <AuTooltip v-if="presentation === 'button'" :text="help ?? `${label} · ${color}`">
          <template #activator="{ props: tooltip }">
            <AuButton v-bind="mergeProps(activator,$attrs,tooltip)" :id="id" class="au-color-button" icon canvas :disabled="disabled" :aria-label="label" :aria-expanded="String(open)" :aria-controls="open ? `${id}-dialog` : undefined">
              <svg v-if="swatch === 'spectrum'" class="au-color-spectrum" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <defs><linearGradient :id="spectrumId" x1="0" y1="1" x2="1" y2="0"><stop v-for="(hue,index) in spectrum" :key="hue" :offset="`${index/(spectrum.length-1)*100}%`" :stop-color="hue"/></linearGradient></defs>
                <rect x=".5" y=".5" width="23" height="23" rx="4" :fill="`url(#${spectrumId})`" stroke="var(--color-stroke-default)"/>
                <circle cx="17" cy="17" r="4" :fill="color" stroke="var(--color-bg-default)" stroke-width="1.5"/>
              </svg>
              <span v-else class="au-color-swatch" :style="{backgroundColor:color}" aria-hidden="true"/>
            </AuButton>
          </template>
        </AuTooltip>
        <AuButton v-else v-bind="{...activator,...$attrs}" :id="id" class="au-color-button" variant="text" :disabled="disabled" :aria-label="label" :aria-expanded="String(open)" :aria-controls="open ? `${id}-dialog` : undefined"><span class="au-color-swatch" :style="{backgroundColor:color}" aria-hidden="true"/></AuButton>
      </template>
      <div :id="`${id}-dialog`" role="dialog" :aria-label="label" class="au-color-dialog">
        <VColorPicker :model-value="color" mode="hex" :modes="['hex']" :width="256" :elevation="0" hide-inputs hide-mode-switch @update:model-value="update" />
        <div class="au-color-hex"><label :for="`${id}-hex`">HEX</label><input :id="`${id}-hex`" :value="draft" type="text" :aria-label="hexLabel" :aria-invalid="invalid" :aria-describedby="invalid ? `${id}-error` : undefined" :disabled="disabled" maxlength="7" autocomplete="off" :spellcheck="false" @input="edit"/><p v-if="invalid" :id="`${id}-error`" class="au-field-error" role="status">{{ invalidMessage }}</p></div>
      </div>
    </VMenu>
  </div>
</template>
