<script setup lang="ts">
import { inject, ref } from 'vue';
import { VCard } from 'vuetify/components/VCard';
import {compactProfileKey} from '../profile.js';
import AuButton from './AuButton.vue';
import AuIcon from './AuIcon.vue';
const props = withDefaults(defineProps<{ title: string; id: string; collapsible?: boolean; initialOpen?: boolean }>(), { collapsible: true, initialOpen: true });
const compact=inject(compactProfileKey,()=>false);
const open = ref(props.initialOpen);
</script>
<template>
  <VCard tag="section" class="au-card prop-card" variant="flat" :aria-labelledby="`${id}-title`">
    <component :is="compact()?'h2':'div'" v-if="collapsible" class="au-card-title" :class="{'au-card-title-with-leading':!!$slots['header-leading'],'au-card-title-expanded':!!$slots['header-leading']&&open}"><span v-if="$slots['header-leading']" class="au-card-leading"><slot name="header-leading" /></span><AuButton :id="`${id}-title`" class="au-card-header prop-card-header" variant="text" :aria-expanded="String(open)" :aria-controls="id" @click="open = !open"><slot name="title"><span>{{ title }}</span></slot><AuIcon path="m4 6 4 4 4-4" :class="{ 'au-chevron-open': open }" /></AuButton></component>
    <component :is="compact()?'h2':'h3'" v-else :id="`${id}-title`" class="au-card-heading">{{ title }}</component>
    <div :id="id" class="au-card-body prop-card-body" :hidden="!open"><slot /></div>
  </VCard>
</template>
