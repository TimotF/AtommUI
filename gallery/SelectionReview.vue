<script setup lang="ts">
import {ref} from 'vue';
import {AuRoot,AuExampleCard} from '@timotf/atomm-ui';
const query=new URLSearchParams(location.search),legacy=query.has('legacy');
const selected=ref<Record<string,boolean>>({transparent:true,opaque:true,png:true,row:true,disabled:true,plain:false});
// Opaque 1×1 RGB PNG: an image fixture with no alpha or external asset request.
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC';
const cards=[{id:'transparent',title:'SVG transparent'},{id:'opaque',title:'SVG opaque'},{id:'png',title:'PNG opaque'},{id:'row',title:'Row card'},{id:'disabled',title:'Disabled selection'},{id:'plain',title:'Unselected'}];
</script>
<template><AuRoot :profile="legacy?'default':'compact'" :direction="query.has('rtl')?'rtl':'ltr'" class="selection-review"><main><h1>Selection content review</h1><div class="selection-review-grid"><AuExampleCard v-for="card in cards" :key="card.id" :data-testid="`selection-${card.id}`" :title="card.title" :active="selected[card.id]" :layout="card.id==='row'?'row':'tile'" :disabled="card.id==='disabled'" @click="selected[card.id]=!selected[card.id]"><img v-if="card.id==='png'" :src="png" alt=""/><svg v-else viewBox="0 0 100 60" :style="card.id==='opaque'?{background:'white'}:undefined"><rect x="18" y="14" width="64" height="28" rx="4" fill="#e6cc9f" stroke="#7e5633"/></svg></AuExampleCard></div></main></AuRoot></template>
<style>
.selection-review { min-height:100vh; }
.selection-review main { padding:24px; }
.selection-review h1 { margin:0 0 20px; font-size:18px; }
.selection-review-grid { display:grid; grid-template-columns:repeat(3,180px); gap:24px; align-items:start; }
@media(max-width:650px) { .selection-review-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
</style>
