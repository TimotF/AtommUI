<script setup lang="ts">
import {computed,inject,nextTick,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import AuHelp from './AuHelp.vue';
import {compactProfileKey} from '../profile.js';
import {isOptionValue,type UiOption} from '../contracts.js';
defineOptions({inheritAttrs:false});
const props=defineProps<{id:string;label:string;modelValue:string;items:readonly UiOption[];help?:string;helpLabel?:string;disabled?:boolean;stacked?:boolean;native?:boolean}>();
const emit=defineEmits<{'update:modelValue':[value:string]}>();
const compact=inject(compactProfileKey,()=>false),trigger=ref<HTMLButtonElement>(),menu=ref<HTMLElement>(),open=ref(false),active=ref(-1),touch=ref(false),position=ref<Record<string,string>>({}),direction=ref('ltr'),portal=ref<string|HTMLElement>('body');
const nativeControl=computed(()=>props.native||touch.value),selected=computed(()=>props.items.find(item=>item.value===props.modelValue));
const optionId=(index:number)=>`${props.id}-option-${index}`;
let observer:ResizeObserver|undefined,media:MediaQueryList|undefined,typeBuffer='',typeTimer:ReturnType<typeof setTimeout>|undefined;
const enabled=()=>props.items.map((item,index)=>item.disabled?-1:index).filter(index=>index>=0);
function close(){open.value=false;typeBuffer='';clearTimeout(typeTimer);}
function update(value:unknown){if(!props.disabled&&isOptionValue(value,props.items))emit('update:modelValue',value);}
function color(value:unknown){return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value.toLowerCase():undefined;}
const slotItem=(item:UiOption)=>({...item,raw:item});
function place(){
 if(!open.value||!trigger.value)return;
 const rect=trigger.value.getBoundingClientRect(),vh=window.innerHeight,vw=window.innerWidth;
 const below=vh-rect.bottom-8,above=rect.top-8,w=Math.min(Math.max(rect.width,180),360,vw-16),height=Math.min(248,Math.max(below,above));
 const rtl=getComputedStyle(trigger.value).direction==='rtl';direction.value=rtl?'rtl':'ltr';
 const left=Math.max(8,Math.min(rtl?rect.right-w:rect.left,vw-w-8));
 position.value={position:'fixed',left:left+'px',width:w+'px',maxHeight:Math.max(24,height)+'px',...(below>=Math.min(248,menu.value?.scrollHeight??248)||below>=above?{top:rect.bottom+4+'px'}:{bottom:vh-rect.top+4+'px'})};
}
function reveal(){void nextTick(()=>{menu.value?.querySelector<HTMLElement>(`[id="${CSS.escape(optionId(active.value))}"]`)?.scrollIntoView({block:'nearest'});place();});}
function show(edge?:'first'|'last'){
 if(props.disabled||nativeControl.value)return;
 portal.value=trigger.value?.closest<HTMLElement>('[role=dialog]')??'body';
 const values=enabled(),index=props.items.findIndex(item=>item.value===props.modelValue&&!item.disabled);
 active.value=edge==='first'?(values[0]??-1):edge==='last'?(values.at(-1)??-1):index>=0?index:(values[0]??-1);
 open.value=true;place();reveal();
}
function choose(index:number){const item=props.items[index];if(item&&!item.disabled){update(item.value);close();trigger.value?.focus();}}
function key(event:KeyboardEvent){
 if(props.disabled)return;
 if(event.key==='Tab'){close();return;}
 if(event.key==='Escape'){if(open.value){event.preventDefault();event.stopPropagation();close();}return;}
 if(event.key==='Enter'||event.key===' '&&!typeBuffer){event.preventDefault();if(open.value)choose(active.value);else show();return;}
 if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
  event.preventDefault();if(!open.value){show(event.key==='Home'?'first':event.key==='End'?'last':undefined);return;}
  const indexes=enabled(),at=indexes.indexOf(active.value);
  active.value=event.key==='Home'?(indexes[0]??-1):event.key==='End'?(indexes.at(-1)??-1):indexes[Math.max(0,Math.min(indexes.length-1,at+(event.key==='ArrowDown'?1:-1)))]??-1;reveal();return;
 }
 if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
  event.preventDefault();if(!open.value)show();typeBuffer+=event.key.toLocaleLowerCase();clearTimeout(typeTimer);typeTimer=setTimeout(()=>typeBuffer='',700);
  const repeated=[...typeBuffer].every(char=>char===typeBuffer[0]),needle=repeated?typeBuffer[0]!:typeBuffer;
  const candidates=enabled(),start=repeated?candidates.indexOf(active.value)+1:0;
  const ordered=[...candidates.slice(start),...candidates.slice(0,start)];
  const found=ordered.find(index=>props.items[index]!.title.toLocaleLowerCase().startsWith(needle));if(found!==undefined){active.value=found;reveal();}
 }
}
function outside(event:Event){if(!trigger.value?.contains(event.target as Node)&&!menu.value?.contains(event.target as Node))close();}
watch(nativeControl,()=>{close();void nextTick(()=>{observer?.disconnect();if(trigger.value)observer?.observe(trigger.value);});});
function touchChange(){touch.value=!!media?.matches;if(touch.value)close();}
watch(()=>[props.disabled,props.modelValue,props.items],()=>{if(props.disabled)close();if(open.value){const item=props.items[active.value];if(!item||item.disabled)active.value=enabled()[0]??-1;place();}});
onMounted(()=>{media=window.matchMedia('(pointer: coarse) and (max-width: 767px)');touchChange();media.addEventListener('change',touchChange);document.addEventListener('pointerdown',outside,true);document.addEventListener('focusin',outside,true);window.addEventListener('resize',place);document.addEventListener('scroll',place,true);observer=new ResizeObserver(place);if(trigger.value)observer.observe(trigger.value);});
onBeforeUnmount(()=>{close();observer?.disconnect();media?.removeEventListener('change',touchChange);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('focusin',outside,true);window.removeEventListener('resize',place);document.removeEventListener('scroll',place,true);});
</script>
<template>
 <div class="au-select-field" :class="{'au-field-row field-row':!stacked}">
  <AuHelp v-if="help" :label="helpLabel??label" :text="help" :help-key="id"><label :for="id">{{label}}</label></AuHelp><label v-else :for="id">{{label}}</label>
  <select v-if="nativeControl" v-bind="$attrs" :id="id" class="au-select-control au-select-native" :aria-label="label" :value="modelValue" :disabled="disabled" @change="update(($event.target as HTMLSelectElement).value)">
   <option v-if="!selected" :value="modelValue" selected disabled hidden>{{modelValue}}</option><option v-for="item in items" :key="item.value" :value="item.value" :selected="item.value===modelValue" :disabled="item.disabled">{{item.title}}</option>
  </select>
  <button v-else v-bind="$attrs" :id="id" ref="trigger" type="button" role="combobox" class="au-select-control au-select-trigger" :aria-label="label" aria-haspopup="listbox" :aria-expanded="open" :aria-controls="open?`${id}-listbox`:undefined" :aria-activedescendant="open&&active>=0?optionId(active):undefined" :disabled="disabled" @click="open?close():show()" @keydown="key">
   <span class="au-select-selection"><slot v-if="selected" name="selection-prepend" :item="slotItem(selected)"><span v-if="color(selected.color)" class="au-option-paint" aria-hidden="true" :style="{backgroundColor:color(selected.color)}"/></slot><span class="au-option-title">{{selected?.title??modelValue}}</span></span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
  </button>
  <Teleport :to="portal"><div v-if="open" :id="`${id}-listbox`" ref="menu" role="listbox" :aria-label="label" :dir="direction" class="au-overlay au-select-popup" :class="{'au-profile-compact':compact()}" :style="position" @pointerdown.prevent>
   <div v-for="(item,index) in items" :id="optionId(index)" :key="item.value" role="option" :aria-selected="item.value===modelValue" :aria-disabled="item.disabled?'true':undefined" class="au-select-option" :class="{'au-select-option-active':index===active}" @pointermove="!item.disabled&&(active=index)" @click="choose(index)"><slot name="item-prepend" :item="slotItem(item)"><span v-if="color(item.color)" class="au-option-paint" aria-hidden="true" :style="{backgroundColor:color(item.color)}"/></slot><span class="au-option-title">{{item.title}}</span><svg v-if="item.value===modelValue" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m3 7 3 3 5-6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></div>
  </div></Teleport>
 </div>
</template>
