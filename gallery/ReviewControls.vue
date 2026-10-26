<script setup lang="ts">
import { ref } from 'vue';
import { AuRoot, AuLayout, AuTipsButton, AuDialog, AuButton, AuCard, AuNumericField, AuSceneControls, AuOnboardingCard } from '@timotf/atomm-ui';
const open=ref(false), collapsed=ref(false), dock=ref<HTMLElement|null>(null), detached=ref(true), zoom=ref(100), count=ref('6'), canvasActive=ref(false);
</script>
<template>
  <AuRoot profile="compact" class="review-controls-demo"><AuLayout standard lead-collapsible v-model:lead-collapsed="collapsed" lead-label="Examples" collapse-label="Hide examples" expand-label="Show examples" collapse-id="review-collapse" expand-id="review-expand">
    <template #lead-actions><AuButton id="review-header-action" ghost>Help</AuButton></template>
    <template #lead><p class="review-caption">Shared control review</p></template>
    <template #stage>
      <AuTipsButton id="review-tips" label="Tips" :active="open" @click="open=true" />
      <div ref="dock" id="review-zoom-dock" class="review-zoom-dock" />
      <div class="review-tools"><AuSceneControls id="review-scene-controls" :zoom-target="detached ? dock : null" :percent="zoom" label="Zoom" zoom-in-label="Zoom in" zoom-out-label="Zoom out" recenter-label="Fit" :explode="20" explode-label="Explode" @zoom="factor=>zoom=Math.round(zoom/factor)" @set-zoom="zoom=$event" @recenter="zoom=100"><template #extra><AuButton id="review-canvas-label" canvas>Orient</AuButton><AuButton id="review-canvas-action" canvas icon :active="canvasActive" aria-label="Inspect part" @click="canvasActive=!canvasActive">⌕</AuButton></template></AuSceneControls></div>
    </template>
    <template #parameters><div class="au-parameters-content"><AuCard id="review-settings" title="Settings"><AuNumericField id="review-count" v-model="count" label="Count" /></AuCard><AuButton id="review-move-zoom" @click="detached=!detached">Move zoom</AuButton><div class="au-overlay au-profile-compact"><AuOnboardingCard title="Choose a material" label="Tip" close-label="Close tip" next-label="Got it" hide-label="Hide tips" text="Measure its actual thickness." /></div></div></template>
  </AuLayout>
  <AuDialog v-model="open" framed title="Fabrication Tips" close-label="Close tips" :max-width="480">
    <p v-for="n in 16" :key="n" class="review-paragraph">{{ n }}. Check the material thickness and test the fit before cutting the model.</p>
    <template #actions><AuButton id="review-tips-done" @click="open=false">Close</AuButton></template>
  </AuDialog></AuRoot>
</template>
<style>
.review-controls-demo { height:100%; }
.review-controls-demo #review-tips { position:absolute; top:16px; inset-inline-end:16px; }
.review-controls-demo .review-zoom-dock { position:absolute; bottom:16px; inset-inline-start:16px; }
.review-controls-demo .review-tools { position:absolute; bottom:64px; inset-inline:16px; }
.review-caption { padding:16px; }
.review-paragraph { margin:0 0 16px; }
</style>
