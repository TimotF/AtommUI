<script setup lang="ts">
import {computed,inject,useId,watch,nextTick} from 'vue';
import {VDialog} from 'vuetify/components/VDialog';
import {compactProfileKey} from '../profile.js';
import AuButton from './AuButton.vue';
import AuIcon from './AuIcon.vue';
const props=withDefaults(defineProps<{modelValue:boolean;title:string;text?:string;persistent?:boolean;maxWidth?:number;framed?:boolean;closeLabel?:string}>(),{persistent:false,maxWidth:420,framed:false});
const emit=defineEmits<{'update:modelValue':[value:boolean]}>();
const compact=inject(compactProfileKey,()=>false),id=useId();
const classes=computed(()=>['au-overlay','au-dialog-overlay',compact()?'au-profile-compact':''].filter(Boolean).join(' '));
// Also support dialogs opened without Vuetify's activator slot (for example on arrival).
let previousFocus:HTMLElement|null=null;
watch(()=>props.modelValue,(open,wasOpen)=>{
 if(open&&typeof document!=='undefined')previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
 else if(wasOpen)nextTick(()=>{if(!props.modelValue&&previousFocus?.isConnected)previousFocus.focus();});
},{flush:'sync',immediate:true});
</script>
<template>
 <VDialog :model-value="modelValue" :persistent="persistent" :max-width="maxWidth" :opacity="framed ? .7 : undefined" :transition="framed ? false : undefined" :content-class="classes" :aria-labelledby="`au-dialog-title-${id}`" :aria-describedby="text ? `au-dialog-text-${id}` : undefined" @update:model-value="emit('update:modelValue',$event)">
  <section v-if="framed" class="au-dialog-card au-dialog-card-framed">
   <header class="au-dialog-header"><h2 :id="`au-dialog-title-${id}`">{{title}}</h2><AuIcon class="au-dialog-info" :size="20" path="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 6v5m0-8v.2" /><AuButton v-if="closeLabel" class="au-dialog-close" icon :aria-label="closeLabel" @click="emit('update:modelValue',false)"><AuIcon path="m4 4 8 8M12 4l-8 8" /></AuButton></header>
   <div class="au-dialog-body"><p v-if="text" :id="`au-dialog-text-${id}`">{{text}}</p><slot /></div>
   <footer v-if="$slots.actions" class="au-dialog-actions"><slot name="actions" /></footer>
  </section>
  <section v-else class="au-dialog-card">
   <h2 :id="`au-dialog-title-${id}`">{{title}}</h2>
   <p v-if="text" :id="`au-dialog-text-${id}`">{{text}}</p>
   <slot />
   <footer v-if="$slots.actions" class="au-dialog-actions"><slot name="actions" /></footer>
  </section>
 </VDialog>
</template>

<style>
.au-overlay.au-dialog-overlay .au-dialog-card.au-dialog-card-framed { display:flex; flex-direction:column; padding:0; max-height:calc(100dvh - 48px); overflow:hidden; }
.au-dialog-header { display:flex; flex:none; align-items:center; gap:8px; padding:16px 24px; border-bottom:1px solid var(--color-stroke-divider); }
.au-dialog-header h2 { min-width:0; margin:0; font:600 16px/24px var(--au-font); overflow-wrap:anywhere; }
.au-dialog-info { flex:none; color:var(--color-text-tertiary); }
.au-dialog-header .au-dialog-close { flex:none; margin-inline-start:auto; width:24px; min-width:24px; height:24px; }
.au-dialog-body { flex:1 1 auto; min-height:0; overflow:auto; padding:16px 24px; scrollbar-width:thin; }
.au-dialog-body > p { margin:0; color:var(--color-text-secondary); }
.au-dialog-card-framed > .au-dialog-actions { flex:none; margin:0; padding:16px 24px; border-top:1px solid var(--color-stroke-divider); }
@media (pointer:coarse) { .au-dialog-header .au-dialog-close { width:44px; min-width:44px; height:44px; } }
</style>
