<script setup lang="ts">
withDefaults(defineProps<{ standard?: boolean; leadCollapsed?: boolean; leadLabel?: string; stageLabel?: string; parametersLabel?: string; leadId?: string }>(), { standard: false, leadCollapsed: false, leadId: 'rail-import' });
</script>
<template>
  <div class="au-layout gen-body" :class="{'au-layout-standard': standard}">
    <aside :id="leadId" class="au-rail au-rail-lead gen-rail gen-rail-lead" :aria-label="leadLabel" :hidden="leadCollapsed"><slot name="lead" /></aside>
    <main class="au-stage gen-canvas" data-testid="preview" :aria-label="stageLabel"><slot name="stage" /></main>
    <aside class="au-rail au-rail-parameters gen-rail gen-rail-params" :aria-label="parametersLabel"><slot name="parameters" /></aside>
  </div>
</template>
