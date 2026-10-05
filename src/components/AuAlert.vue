<script setup lang="ts">
import { VAlert } from 'vuetify/components/VAlert';
withDefaults(defineProps<{ tone?: 'error' | 'info' | 'warning' | 'success'; compact?: boolean }>(), { tone: 'info', compact: true });
</script>
<template><VAlert class="au-alert" :type="tone" :density="compact ? 'compact' : 'default'" variant="tonal" :border="false" :icon="false"><slot /></VAlert></template>
