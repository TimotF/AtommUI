<script setup lang="ts">
import { VAlert } from 'vuetify/components/VAlert';
import AuIcon from './AuIcon.vue';
withDefaults(defineProps<{ tone?: 'error' | 'info' | 'warning' | 'success'; compact?: boolean; appearance?: 'default' | 'reference' }>(), { tone: 'info', compact: true, appearance: 'default' });
const icons={info:'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 6v4m0-7v.5',error:'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 3v5m0 2v.5',warning:'M8 1 15 14H1L8 1Zm0 4v4m0 2v.5',success:'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM4.5 8l2.25 2.25L11.5 5.5'};
</script>
<template><div v-if="appearance==='reference'" class="au-alert au-alert-reference" :class="'au-alert-reference-'+tone" role="alert"><AuIcon :path="icons[tone]"/><div class="au-alert-message"><slot /></div></div><VAlert v-else class="au-alert" :type="tone" :density="compact ? 'compact' : 'default'" variant="tonal" :border="false" :icon="false"><slot /></VAlert></template>
