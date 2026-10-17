<script setup lang="ts">
import {computed,inject,onBeforeUnmount,onMounted,ref,useId} from 'vue';
import {VTooltip} from 'vuetify/components/VTooltip';
import {compactProfileKey} from '../profile.js';
const props=defineProps<{text?:string;contentClass?:string;disabled?:boolean}>();
const compact=inject(compactProfileKey,()=>false);
const open=ref(false),id=`au-tooltip-${useId()}`;
const classes=computed(()=>['au-overlay','au-help-popover',compact()?'au-profile-compact':'',props.contentClass].filter(Boolean).join(' '));
let timer:ReturnType<typeof setTimeout>|undefined,suppressClick=false;
function clear(){if(timer!==undefined)clearTimeout(timer);timer=undefined;}
function down(event:PointerEvent){clear();suppressClick=false;if(event.pointerType==='touch'&&!props.disabled){timer=setTimeout(()=>{open.value=true;suppressClick=true;},450);}}
function click(event:MouseEvent){if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}}
function context(event:MouseEvent){if(suppressClick)event.preventDefault();}
function key(event:KeyboardEvent){if(event.key==='Escape'){open.value=false;clear();}else if(event.key==='F1'&&!props.disabled){event.preventDefault();open.value=true;}}
function escape(event:KeyboardEvent){if(event.key==='Escape'){open.value=false;clear();}}
onMounted(()=>document.addEventListener('keydown',escape));
onBeforeUnmount(()=>{clear();document.removeEventListener('keydown',escape);});
</script>
<template>
 <VTooltip v-model="open" role="presentation" :disabled="disabled" location="top center" :max-width="300" :offset="10" :open-delay="200" :z-index="3" :transition="false" :content-class="classes" :content-props="{id,role:'tooltip'}" :interactive="true">
  <template #activator="{props:activator}"><slot name="activator" :props="{...activator,'aria-describedby':id,onPointerdown:down,onPointerup:clear,onPointercancel:clear,onPointermove:clear,onClickCapture:click,onContextmenuCapture:context,onKeydown:key}"/></template>
  <slot>{{text}}</slot>
 </VTooltip>
</template>
