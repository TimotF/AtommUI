<script setup lang="ts">
import { VApp } from 'vuetify/components/VApp';
import { VLocaleProvider } from 'vuetify/components/VLocaleProvider';
import { computed, onMounted, onBeforeUnmount, provide, ref } from 'vue';
import { compactProfileKey } from '../profile.js';
const props = withDefaults(defineProps<{ direction?: 'ltr' | 'rtl'; profile?: 'default' | 'compact' }>(), { profile: 'default' });
const inherited = ref(typeof document !== 'undefined' && document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr');
const direction = computed(() => props.direction ?? inherited.value);
let observer: MutationObserver | undefined;
onMounted(() => { observer = new MutationObserver(() => { inherited.value = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'; }); observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] }); });
onBeforeUnmount(() => observer?.disconnect());
provide(compactProfileKey, () => props.profile === 'compact');
</script>
<template><VLocaleProvider class="au-scope" :rtl="direction === 'rtl'"><VApp class="au-root" :class="{ 'au-profile-compact': profile === 'compact' }" :dir="direction"><slot /></VApp></VLocaleProvider></template>
