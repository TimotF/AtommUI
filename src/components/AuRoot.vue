<script setup lang="ts">
import { VApp } from 'vuetify/components/VApp';
import { VLocaleProvider } from 'vuetify/components/VLocaleProvider';
import { provide } from 'vue';
import { compactProfileKey } from '../profile.js';
const props = withDefaults(defineProps<{ direction?: 'ltr' | 'rtl'; profile?: 'default' | 'compact' }>(), { direction: 'ltr', profile: 'default' });
provide(compactProfileKey, () => props.profile === 'compact');
</script>
<template><VLocaleProvider class="au-scope" :rtl="direction === 'rtl'"><VApp class="au-root" :class="{ 'au-profile-compact': profile === 'compact' }" :dir="direction"><slot /></VApp></VLocaleProvider></template>
