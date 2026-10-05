<script setup lang="ts">
import { VApp } from 'vuetify/components/VApp';
import { VLocaleProvider } from 'vuetify/components/VLocaleProvider';
withDefaults(defineProps<{ direction?: 'ltr' | 'rtl' }>(), { direction: 'ltr' });
</script>
<template><VLocaleProvider class="au-scope" :rtl="direction === 'rtl'"><VApp class="au-root" :dir="direction"><slot /></VApp></VLocaleProvider></template>
