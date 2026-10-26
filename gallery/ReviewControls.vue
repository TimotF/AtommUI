<script setup lang="ts">
import { ref } from 'vue';
import { AuRoot, AuTextField, AuLayout, AuTipsButton, AuDialog, AuButton, AuCard, AuNumericField, AuSceneControls, AuOnboardingCard, AuTabs, AuSegmentedControl, AuActionMenu } from '@timotf/atomm-ui';
const query=new URLSearchParams(location.search), tabCount=Number(query.get('tabs')??0), view=ref('sliceform'), segmented=query.has('segmented'), parameterChoice=ref('first');
const views=[{value:'source',title:'Source model',compactTitle:'Model'},{value:'sliceform',title:'Assembly preview',compactTitle:'3D'},{value:'pages',title:'SVG',compactTitle:'SVG'}];
const previewViews=segmented ? [{value:'sliceform',title:'3D'},{value:'pages',title:'SVG'}] : views.slice(tabCount===2?1:0);
const actionOpen=ref(false),lastAction=ref(''), rowText=ref('Éléonore François · atelier-orbe.example');
const stacked=new URLSearchParams(location.search).has('stacked');
const explode=ref(20), controlsDisabled=ref(false);
const open=ref(false), collapsed=ref(false), dock=ref<HTMLElement|null>(null), detached=ref(true), zoom=ref(100), count=ref('6'), canvasActive=ref(false);
</script>
<template>
  <AuRoot profile="compact" :direction="query.has('rtl')?'rtl':'ltr'" class="review-controls-demo"><AuLayout standard lead-collapsible v-model:lead-collapsed="collapsed" lead-label="Examples" collapse-label="Hide examples" expand-label="Show examples" collapse-id="review-collapse" expand-id="review-expand">
    <template #lead-actions><AuButton id="review-header-action" ghost>Help</AuButton></template>
    <template #lead><p class="review-caption">Shared control review</p></template>
    <template #stage>
      <component :is="segmented?AuSegmentedControl:AuTabs" v-if="tabCount" id="review-tabs" class="au-preview-views" v-model="view" label="Views" :items="previewViews" />
      <AuTipsButton id="review-tips" label="Tips" :active="open" @click="open=true" />
      <div ref="dock" id="review-zoom-dock" class="review-zoom-dock" />
      <div class="review-tools" :class="{'review-tools-stacked':stacked}"><AuSceneControls id="review-scene-controls" :layout="stacked ? 'stacked' : 'inline'" :zoom-target="!stacked && detached ? dock : null" :disabled="controlsDisabled" :percent="zoom" label="Zoom" zoom-in-label="Zoom in" zoom-out-label="Zoom out" recenter-label="Fit" :explode="explode" @update:explode="explode=$event" explode-label="Explode" @zoom="factor=>zoom=Math.round(zoom/factor)" @set-zoom="zoom=$event" @recenter="zoom=100"><template #extra><AuButton id="review-canvas-label" canvas :icon="stacked" aria-label="Orient"><span v-if="!stacked">Orient</span><span v-else>↶</span></AuButton><AuButton id="review-canvas-action" canvas icon :active="canvasActive" aria-label="Inspect part" @click="canvasActive=!canvasActive">⌕</AuButton></template></AuSceneControls></div>
    </template>
    <template #parameters><div class="au-parameters-content"><AuCard v-if="query.has('text-row')" id="review-text-fields" title="Text layouts"><AuTextField id="review-text-row" v-model="rowText" layout="row" label="Poste ou activité professionnelle" help="Keep the complete text." help-label="Help: activity" error="Please check this value."/><AuTextField id="review-text-stacked" v-model="rowText" label="Stacked label"/><AuTextField id="review-text-readonly" :model-value="rowText" layout="row" label="Read only" read-only/><AuTextField id="review-text-disabled" :model-value="rowText" layout="row" label="Disabled" disabled/></AuCard><AuCard id="review-settings" title="Settings"><AuNumericField id="review-count" v-model="count" label="Count" /></AuCard><AuSegmentedControl v-if="segmented" id="review-parameter-choices" v-model="parameterChoice" label="Parameter choices" :items="[{value:'first',title:'Keep this longer parameter label readable'},{value:'second',title:'Another longer parameter label'}]"/><template v-if="query.has('actions')"><AuButton id="review-actions-trigger" :aria-expanded="String(actionOpen)" @click="actionOpen=!actionOpen">Actions</AuButton><AuActionMenu id="review-actions" v-model="actionOpen" activator="#review-actions-trigger" label="Actions" :items="[{value:'reset',title:'Reset orientation'},{value:'disabled',title:'Unavailable',disabled:true},{value:'rotate',title:'X +90°',group:'Advanced'}]" @select="lastAction=$event"/><output id="review-action-result">{{lastAction}}</output></template><div v-if="query.has('actions')" class="review-narrow-help"><AuNumericField id="review-help-width" v-model="count" label="Correction d’emboîtement" help="Measure the actual thickness." help-label="Help: fit correction"/></div><AuButton id="review-move-zoom" @click="detached=!detached">Move zoom</AuButton><AuButton id="review-disable" @click="controlsDisabled=!controlsDisabled">Disable</AuButton><div class="au-overlay au-profile-compact"><AuOnboardingCard title="Choose a material" label="Tip" close-label="Close tip" next-label="Got it" hide-label="Hide tips" text="Measure its actual thickness." /></div></div></template>
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
.review-controls-demo .review-tools-stacked { bottom:16px; }
.review-controls-demo .review-tools-stacked #review-scene-controls { margin-inline:auto; }
.review-controls-demo #review-tabs { position:absolute;top:16px;inset-inline-start:50%;transform:translateX(-50%); }
.review-controls-demo:has(#review-tabs) #review-tips { top:64px; }
.review-caption { padding:16px; }
.review-paragraph { margin:0 0 16px; }
</style>

<style>.review-narrow-help {width:180px;max-width:100%;}</style>
