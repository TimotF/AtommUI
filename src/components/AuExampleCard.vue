<script setup lang="ts">
import { VBtn } from 'vuetify/components/VBtn';
withDefaults(defineProps<{ title: string; loading?: boolean; disabled?: boolean; active?: boolean }>(), { active: undefined });
</script>
<template><VBtn class="au-example-card" variant="text" :ripple="false" :aria-label="title" :aria-pressed="active === undefined ? undefined : String(active)" :loading="loading" :disabled="disabled"><span class="au-example-preview" aria-hidden="true"><slot /></span><span class="au-example-title">{{ title }}</span></VBtn></template>
