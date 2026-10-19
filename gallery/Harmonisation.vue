<script setup lang="ts">
import { computed, ref } from 'vue';
import { AuRoot, AuLayout, AuCard, AuFieldGroups, AuFieldGroup, AuButton, AuNumericField, AuExampleCard, AuColorField, AuSceneControls, AuTabs, AuSwitch, AuSvgViewport, AuOnboarding, useOnboarding } from '@timotf/atomm-ui';
const direction = typeof location!=='undefined'&&new URLSearchParams(location.search).has('rtl')?'rtl':'ltr';
const root = ref<HTMLElement | null>(null), view = ref('3d'), material = ref('pine'), color = ref('#427a88'), width = ref('120'), height = ref('80'), explode = ref(0), threeZoom = ref(100), svgZoom = ref(100), grid = ref(true), drawing = ref<InstanceType<typeof AuSvgViewport>>();
const zoom = computed(() => view.value === 'svg' ? svgZoom.value : threeZoom.value);
const size = computed(() => ({width:Math.max(10,Math.min(300,Number(width.value)||120)),height:Math.max(10,Math.min(300,Number(height.value)||80))}));
const paint = computed(() => material.value === 'pine' ? '#dec395' : material.value === 'walnut' ? '#795331' : color.value);
const guide = useOnboarding([
  { id: 'groups', target: '#demo-settings', title: 'Des réglages bien regroupés', text: 'Les sous-titres et séparateurs organisent les champs sans ajouter de cartes imbriquées.' },
  { id: 'appearance', target: '#demo-appearance', title: 'Choisir une apparence', text: 'Sélectionnez une vignette. La couleur unie ouvre la palette commune ; les dimensions restent identiques.' },
  { id: 'scene', target: '#demo-scene-controls', title: 'Inspecter votre création', text: 'Le zoom, son menu de pourcentages et l’éclatement sont regroupés. Passez en SVG pour retrouver le même zoom.' },
]);
function zoomBy(factor: number) { if (view.value === 'svg') drawing.value?.zoom(factor); else threeZoom.value = Math.max(20, Math.min(400, threeZoom.value / factor)); }
function setZoom(value: number) { if (view.value === 'svg') drawing.value?.setZoom(value); else threeZoom.value = value; }
function fit() { if (view.value === 'svg') drawing.value?.fit(); else threeZoom.value = 100; }
</script>
<template>
  <div ref="root" class="composition-demo"><AuRoot profile="compact" :direction="direction"><AuLayout :stage-label="'Aperçu'" :parameters-label="'Réglages'">
    <template #stage><header class="demo-header"><div><span>AtommUI 0.8.0</span><h1>Une interface commune</h1></div><AuTabs v-model="view" :label="'Vue'" :items="[{value:'3d',title:'3D'},{value:'svg',title:'SVG'}]"/><AuButton id="demo-guide" data-onboarding-trigger @click="guide.restart">Me guider</AuButton></header>
      <div class="demo-canvas">
        <svg v-if="view === '3d'" class="demo-object" viewBox="0 0 420 340" role="img" aria-label="Aperçu éclaté de démonstration">
          <g :transform="`translate(210 170) scale(${threeZoom/100*size.width/120} ${threeZoom/100*size.height/80}) translate(-210 -170)`" :fill="paint" stroke="#9c7546" stroke-width="1.4" stroke-linejoin="round">
            <path :transform="`translate(0 ${-explode*.45})`" d="M210 70 310 125 210 180 110 125Z" />
            <path :transform="`translate(${-explode*.35} ${explode*.2})`" d="M110 125 210 180 210 280 110 225Z" />
            <path :transform="`translate(${explode*.35} ${explode*.2})`" d="M210 180 310 125 310 225 210 280Z" />
          </g>
        </svg>
        <AuSvgViewport v-else ref="drawing" :bounds="{x:0,y:0,width:size.width,height:size.height}" :grid="grid" label="Aperçu SVG. Glissez, molette pour zoomer et 0 pour recentrer." @zoomchange="svgZoom = $event"><path :d="`M0 0H${size.width}V${size.height}H0Z M${size.width/2-4} ${size.height/2}a4 4 0 1 0 8 0a4 4 0 1 0-8 0Z`"/></AuSvgViewport>
      </div>
      <footer class="demo-footer"><AuSceneControls id="demo-scene-controls" :percent="zoom" label="Zoom" zoom-in-label="Zoom avant" zoom-out-label="Zoom arrière" recenter-label="Recentrer" :min="view==='3d'?20:10" :max="view==='3d'?400:4000" :explode="view==='3d'?explode:undefined" explode-label="Éclatement" explode-help="Déplace les faces de cette démonstration, sans modifier la vue SVG." @zoom="zoomBy" @set-zoom="setZoom" @recenter="fit" @update:explode="explode=$event"/></footer>
    </template>
    <template #parameters><div class="demo-parameters">
      <AuCard id="demo-settings" title="Réglages" :collapsible="false"><AuFieldGroups><AuFieldGroup title="Dimensions"><AuNumericField id="demo-width" v-model="width" label="Largeur" suffix="mm"/><AuNumericField id="demo-height" v-model="height" label="Hauteur" suffix="mm"/></AuFieldGroup><AuFieldGroup title="Options de présentation" collapsible :initial-open="false" caption="Chaque application conserve ses paramètres et ses calculs."><AuSwitch id="demo-grid" v-model="grid" label="Afficher la grille SVG"/></AuFieldGroup></AuFieldGroups></AuCard>
      <AuCard id="demo-appearance" title="Aperçu" :collapsible="false"><AuFieldGroups><AuFieldGroup title="Matériau"><div class="demo-materials"><AuExampleCard v-for="item in [{id:'pine',title:'Pin'},{id:'walnut',title:'Noyer noir'},{id:'solid',title:'Couleur unie'}]" :key="item.id" :title="item.title" :active="material===item.id" @click="material=item.id"><svg viewBox="0 0 80 80"><rect width="80" height="80" :fill="item.id==='pine'?'#dec395':item.id==='walnut'?'#795331':color"/><path v-if="item.id!=='solid'" d="M12 0Q20 20 12 40T12 80M32 0Q23 25 32 50T32 80M54 0Q60 20 54 40T54 80M70 0V80" fill="none" stroke="#634521" opacity=".3"/></svg></AuExampleCard></div><AuColorField v-if="material==='solid'" id="demo-color" v-model="color" label="Couleur" hex-label="Couleur hexadécimale" invalid-message="Saisissez # suivi de six caractères hexadécimaux."/></AuFieldGroup></AuFieldGroups></AuCard>
      <a href="/">Voir la galerie complète</a>
    </div></template>
  </AuLayout><AuOnboarding :root="root" :step="guide.current.value" :open="guide.open.value" :hidden="guide.hidden.value" label="Conseil" close-label="Fermer le conseil" next-label="Compris" hide-label="Masquer les conseils" hidden-message="Conseils masqués" reactivate-label="Réactiver" @update:open="guide.open.value=$event" @next="guide.next" @hide="guide.hide" @reactivate="guide.resume"/></AuRoot></div>
</template>
<style>
.composition-demo{height:100%}.composition-demo .au-layout{--au-parameters-width:340px}.composition-demo .au-rail-lead{display:none}.composition-demo .au-stage{display:flex;flex-direction:column}.demo-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;border-bottom:1px solid var(--color-stroke-divider)}.demo-header span{font-size:11px;color:var(--color-text-secondary)}.demo-header h1{font-size:17px;margin:2px 0 0}.demo-canvas{flex:1;min-height:200px;margin:16px;border-radius:8px;background:#f4f1e9;position:relative;overflow:hidden}.demo-object,.demo-canvas>.au-svg-viewport{position:absolute;inset:0;width:100%;height:100%}.demo-footer{padding:0 16px 16px}.demo-parameters{display:flex;flex-direction:column;gap:12px;padding:16px;overflow:auto}.demo-parameters>a{font-size:12px;color:var(--color-text-secondary)}.demo-materials{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;--au-example-aspect-ratio:1}.demo-materials .au-example-title{white-space:normal}
@container atomm-app (max-width:760px){.composition-demo .au-layout{display:flex;flex-direction:column;overflow:auto}.composition-demo .au-stage{flex:none;height:60vh;min-height:380px}.composition-demo .au-rail-parameters{flex:none;width:100%}.demo-parameters{overflow:visible}.demo-header{flex-wrap:wrap}.demo-header h1{font-size:15px}}
</style>
