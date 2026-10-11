<script setup lang="ts">
import { ref } from 'vue';
import { VCard } from 'vuetify/components/VCard';
import AuButton from './AuButton.vue';
import AuIcon from './AuIcon.vue';
const props = withDefaults(defineProps<{ title: string; id: string; collapsible?: boolean; initialOpen?: boolean }>(), { collapsible: true, initialOpen: true });
const open = ref(props.initialOpen);
</script>
<template>
  <VCard tag="section" class="au-card prop-card" variant="flat" :aria-labelledby="`${id}-title`">
    <AuButton v-if="collapsible" :id="`${id}-title`" class="au-card-header prop-card-header" variant="text" :aria-expanded="String(open)" :aria-controls="id" @click="open = !open"><slot name="title"><span>{{ title }}</span></slot><AuIcon path="m4 6 4 4 4-4" :class="{ 'au-chevron-open': open }" /></AuButton>
    <h3 v-else :id="`${id}-title`" class="au-card-heading">{{ title }}</h3>
    <div :id="id" class="au-card-body prop-card-body" :hidden="!open"><slot /></div>
  </VCard>
</template>
