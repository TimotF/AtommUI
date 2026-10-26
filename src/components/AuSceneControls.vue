<script setup lang="ts">
import { useId } from 'vue';
import AuZoomControls from './AuZoomControls.vue';
import AuSlider from './AuSlider.vue';
const props = withDefaults(defineProps<{ percent: number; label: string; zoomInLabel: string; zoomOutLabel: string; recenterLabel: string; min?: number; max?: number; presets?: readonly number[]; disabled?: boolean; explode?: number; explodeLabel?: string; explodeHelp?: string; explodeHelpLabel?: string; explodeDisabled?: boolean; layout?: 'inline' | 'stacked'; zoomTarget?: HTMLElement | string | null }>(), { disabled: false, explodeDisabled: false, layout: 'inline' });
const emit = defineEmits<{ zoom: [factor: number]; setZoom: [percent: number]; recenter: []; 'update:explode': [percent: number] }>();
const id = useId();
</script>
<template>
  <div class="au-scene-controls" :class="{ 'au-scene-controls-stacked': layout === 'stacked' }" role="group" :aria-label="label">
    <div v-if="layout !== 'stacked' && $slots.extra" class="au-scene-extra"><slot name="extra" /></div>
    <div v-if="explode !== undefined && explodeLabel" class="au-scene-explode"><AuSlider :id="`au-explode-${id}`" :model-value="explode" :label="explodeLabel" :help="explodeHelp" :help-label="explodeHelpLabel" :disabled="disabled || explodeDisabled" :min="0" :max="100" :step="1" suffix="%" @update:model-value="emit('update:explode', $event)" /></div>
    <Teleport :to="zoomTarget ?? 'body'" :disabled="!zoomTarget"><AuZoomControls :separated="layout === 'stacked'" :recenter-icon="layout === 'stacked'" :percent="percent" :label="label" :zoom-in-label="zoomInLabel" :zoom-out-label="zoomOutLabel" :recenter-label="recenterLabel" :min="min" :max="max" :presets="presets" :disabled="disabled" @zoom="emit('zoom', $event)" @set-zoom="emit('setZoom', $event)" @recenter="emit('recenter')"><template v-if="layout === 'stacked' && $slots.extra" #actions><div class="au-scene-extra"><slot name="extra" /></div></template></AuZoomControls></Teleport>
    <div v-if="$slots.footer" class="au-scene-footer"><slot name="footer" /></div>
  </div>
</template>
