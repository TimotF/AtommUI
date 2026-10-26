<script setup lang="ts">
import {computed,nextTick,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import AuButton from './AuButton.vue';
const props=withDefaults(defineProps<{standard?:boolean;leadCollapsed?:boolean;leadCollapsible?:boolean;collapseLabel?:string;expandLabel?:string;leadLabel?:string;stageLabel?:string;parametersLabel?:string;leadId?:string}>(),{standard:false,leadId:'rail-import'});
const emit=defineEmits<{'update:leadCollapsed':[value:boolean]}>();
const local=ref(false),collapsed=computed(()=>props.leadCollapsed??local.value),root=ref<HTMLElement>(),lead=ref<HTMLElement>(),expand=ref<InstanceType<typeof AuButton>>(),collapse=ref<InstanceType<typeof AuButton>>(),narrow=ref(false);
const regions=computed(()=>props.standard&&narrow.value?['stage','lead','parameters']:['lead','stage','parameters']);
let observer:ResizeObserver|undefined;
function leadRef(value:unknown){lead.value=value as HTMLElement;}
function collapseRef(value:unknown){collapse.value=value as InstanceType<typeof AuButton>;}
function expandRef(value:unknown){expand.value=value as InstanceType<typeof AuButton>;}
function focus(button:InstanceType<typeof AuButton>|undefined){(button?.$el as HTMLElement|undefined)?.focus();}
function toggle(value:boolean){local.value=value;emit('update:leadCollapsed',value);void nextTick(()=>focus(value?expand.value:collapse.value));}
watch(collapsed,(value)=>{if(value&&lead.value?.contains(document.activeElement))void nextTick(()=>focus(expand.value));});
onMounted(()=>{observer=new ResizeObserver(entries=>{narrow.value=(entries[0]?.contentRect.width??0)<960;});if(root.value)observer.observe(root.value);});
onBeforeUnmount(()=>observer?.disconnect());
</script>
<template>
 <div ref="root" class="au-layout gen-body" :class="{'au-layout-standard':standard,'au-layout-collapsible':leadCollapsible}">
  <template v-for="region in regions" :key="region">
   <aside v-if="region==='lead'" :id="leadId" :ref="leadRef" class="au-rail au-rail-lead gen-rail gen-rail-lead" :aria-label="leadLabel" :hidden="collapsed">
    <header v-if="leadCollapsible" class="au-layout-lead-header"><h2>{{leadLabel}}</h2><AuButton :ref="collapseRef" icon :aria-label="collapseLabel" :aria-controls="leadId" aria-expanded="true" @click="toggle(true)"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="3" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 3v14m7-10-3 3 3 3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></AuButton></header>
    <slot name="lead" :collapse="()=>toggle(true)"/>
   </aside>
   <main v-else-if="region==='stage'" class="au-stage gen-canvas" data-testid="preview" :aria-label="stageLabel"><slot name="stage"/><AuButton v-if="leadCollapsible&&collapsed" :ref="expandRef" class="au-layout-expand" :aria-label="expandLabel" :aria-controls="leadId" aria-expanded="false" @click="toggle(false)"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="3" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 3v14m4-10 3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>{{leadLabel}}</AuButton></main>
   <aside v-else class="au-rail au-rail-parameters gen-rail gen-rail-params" :aria-label="parametersLabel"><slot name="parameters"/></aside>
  </template>
 </div>
</template>
