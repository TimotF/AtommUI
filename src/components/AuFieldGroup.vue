<script setup lang="ts">
import { computed, inject, ref, useId } from 'vue';
import {compactProfileKey} from '../profile.js';
import AuIcon from './AuIcon.vue';
import AuHelp from './AuHelp.vue';
const props = withDefaults(defineProps<{ title: string; id?: string; icon?: string; caption?: string; help?: string; helpLabel?: string; collapsible?: boolean; initialOpen?: boolean }>(), { collapsible: false, initialOpen: true });
const compact=inject(compactProfileKey,()=>false);
const generated = useId(), open = ref(props.initialOpen);
const titleId = computed(() => `${props.id ?? `au-group-${generated}`}-title`);
const contentId = computed(() => `${props.id ?? `au-group-${generated}`}-content`);
</script>
<template>
  <section class="au-field-group" role="group" :aria-labelledby="titleId">
    <div class="au-group-heading">
      <component :is="compact()?'h3':'h4'">
        <button v-if="collapsible" :id="titleId" type="button" class="au-group-heading-line" :aria-expanded="open" :aria-controls="contentId" @click="open = !open">
          <AuIcon v-if="icon" :path="icon" /><span>{{ title }}</span><span class="au-group-rule" aria-hidden="true" /><AuIcon path="m4 6 4 4 4-4" :class="{ 'au-chevron-open': open }" />
        </button>
        <span v-else :id="titleId" class="au-group-heading-line"><AuIcon v-if="icon" :path="icon" /><span>{{ title }}</span><span class="au-group-rule" aria-hidden="true" /></span>
      </component>
      <AuHelp v-if="help" :label="helpLabel ?? title" :text="help" :help-key="titleId" />
    </div>
    <div :id="contentId" class="au-group-content" :hidden="collapsible && !open" :role="collapsible ? 'region' : undefined" :aria-labelledby="collapsible ? titleId : undefined"><slot /><p v-if="caption" class="au-group-caption">{{ caption }}</p></div>
  </section>
</template>
