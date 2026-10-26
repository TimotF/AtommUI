<script setup lang="ts">
import { VBtn } from 'vuetify/components/VBtn';
withDefaults(defineProps<{ title: string; loading?: boolean; disabled?: boolean; active?: boolean; layout?: 'tile' | 'row'; appearance?:'default'|'reference'; previewKind?:'svg'|'image' }>(), { active: undefined, layout: 'tile', appearance:'default', previewKind:'svg' });
</script>
<template><VBtn class="au-example-card" :class="{ 'au-example-row': layout === 'row', 'au-example-reference':appearance==='reference', 'au-example-reference-image':previewKind==='image' }" variant="text" :ripple="false" :aria-label="title" :aria-pressed="active === undefined ? undefined : String(active)" :loading="loading" :disabled="disabled"><span class="au-example-preview" aria-hidden="true"><slot /></span><span class="au-example-title">{{ title }}</span></VBtn></template>
