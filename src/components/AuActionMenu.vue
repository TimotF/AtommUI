<script setup lang="ts">
import {computed,inject,nextTick,watch} from 'vue';
import {VMenu} from 'vuetify/components/VMenu';
import {VList,VListItem} from 'vuetify/components/VList';
import {compactProfileKey} from '../profile.js';
export interface ActionMenuItem {value:string;title:string;id?:string;disabled?:boolean;active?:boolean;group?:string}
const props=defineProps<{id:string;modelValue:boolean;activator:string;label:string;items:readonly ActionMenuItem[]}>();
const emit=defineEmits<{'update:modelValue':[value:boolean];select:[value:string]}>();
const compact=inject(compactProfileKey,()=>false);
const classes=computed(()=>`au-overlay au-action-menu${compact()?' au-profile-compact':''}`);
watch(()=>props.modelValue,async open=>{await nextTick();if(open)document.getElementById(props.id)?.focus({preventScroll:true});});
function close(event:KeyboardEvent){if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();event.stopPropagation();emit('update:modelValue',false);document.querySelector<HTMLElement>(props.activator)?.focus({preventScroll:true});}}
function choose(item:ActionMenuItem){if(item.disabled)return;emit('update:modelValue',false);emit('select',item.value);}
</script>
<template>
 <VMenu :model-value="modelValue" :activator="activator" :open-on-click="false" location="top start" :offset="8" :transition="false" :z-index="3" :content-class="classes" :close-on-content-click="false" @update:model-value="emit('update:modelValue',$event)">
  <VList :id="id" class="au-action-list" role="menu" :aria-label="label" density="compact" @keydown="close">
   <slot name="before" />
   <template v-for="(item,index) in items" :key="item.value">
    <div v-if="item.group && (index===0 || items[index-1].group!==item.group)" class="au-action-group" role="presentation">{{item.group}}</div>
    <VListItem :id="item.id" :role="item.active===undefined?'menuitem':'menuitemradio'" :aria-checked="item.active===undefined?undefined:String(item.active)" :aria-disabled="String(!!item.disabled)" :title="item.title" :disabled="item.disabled" :active="item.active" :data-value="item.value" density="compact" min-height="32" @click="choose(item)" />
   </template>
   <div v-if="$slots.after" class="au-action-fields"><slot name="after" /></div>
  </VList>
 </VMenu>
</template>
