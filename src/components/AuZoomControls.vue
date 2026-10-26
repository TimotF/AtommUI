<script setup lang="ts">
import {computed,inject,ref} from 'vue';
import {VMenu} from 'vuetify/components/VMenu';
import AuButton from './AuButton.vue';
import {compactProfileKey} from '../profile.js';
const props=withDefaults(defineProps<{percent:number;label:string;zoomInLabel:string;zoomOutLabel:string;recenterLabel:string;min?:number;max?:number;presets?:readonly number[];disabled?:boolean}>(),{min:10,max:4000,presets:()=>[25,50,100,150,200]});
const emit=defineEmits<{zoom:[factor:number];setZoom:[percent:number];recenter:[]}>();
const open=ref(false),compact=inject(compactProfileKey,()=>false);
const menuClass=computed(()=>`au-overlay au-zoom-menu${compact()?' au-profile-compact':''}`);
const valid=computed(()=>Number.isFinite(props.percent)&&Number.isFinite(props.min)&&Number.isFinite(props.max)&&props.min>0&&props.max>=props.min);
const unavailable=computed(()=>props.disabled||!valid.value);
const choices=computed(()=>[...new Set(props.presets)].filter(value=>Number.isFinite(value)&&value>=props.min&&value<=props.max));
function choose(value:number){if(unavailable.value||!choices.value.includes(value))return;emit('setZoom',value);open.value=false;}
</script>
<template>
 <div class="au-zoom-controls" role="group" :aria-label="label">
  <AuButton variant="text" icon :aria-label="zoomOutLabel" :disabled="unavailable||percent<=min" @click="emit('zoom',1.12)">−</AuButton>
  <VMenu v-model="open" location="top" :offset="8" :content-class="menuClass" :z-index="3" :disabled="unavailable||!choices.length" :transition="false">
   <template #activator="{props:activator}"><AuButton v-bind="activator" class="au-zoom-value" variant="text" :aria-label="label" :disabled="unavailable||!choices.length" :aria-expanded="String(open)" :aria-controls="open?activator['aria-controls']:undefined">{{valid?Math.round(percent):'—'}} %</AuButton></template>
   <div role="group" :aria-label="label"><AuButton v-for="value in choices" :key="value" variant="text" :active="percent===value" @click="choose(value)">{{value}} %</AuButton></div>
  </VMenu>
  <AuButton variant="text" icon :aria-label="zoomInLabel" :disabled="unavailable||percent>=max" @click="emit('zoom',.88)">+</AuButton>
  <AuButton variant="text" :disabled="unavailable" @click="emit('recenter')">{{recenterLabel}}</AuButton>
 </div>
</template>
