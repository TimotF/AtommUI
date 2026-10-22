<script setup lang="ts">
import {computed,inject,useId,watch,nextTick} from 'vue';
import {VDialog} from 'vuetify/components/VDialog';
import {compactProfileKey} from '../profile.js';
const props=withDefaults(defineProps<{modelValue:boolean;title:string;text?:string;persistent?:boolean;maxWidth?:number}>(),{persistent:false,maxWidth:420});
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
 <VDialog :model-value="modelValue" :persistent="persistent" :max-width="maxWidth" :content-class="classes" :aria-labelledby="`au-dialog-title-${id}`" :aria-describedby="text ? `au-dialog-text-${id}` : undefined" @update:model-value="emit('update:modelValue',$event)">
  <section class="au-dialog-card">
   <h2 :id="`au-dialog-title-${id}`">{{title}}</h2>
   <p v-if="text" :id="`au-dialog-text-${id}`">{{text}}</p>
   <slot />
   <footer v-if="$slots.actions" class="au-dialog-actions"><slot name="actions" /></footer>
  </section>
 </VDialog>
</template>
