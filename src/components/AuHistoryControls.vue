<script setup lang="ts">
import AuButton from './AuButton.vue';
import AuIcon from './AuIcon.vue';
const props=withDefaults(defineProps<{
 label:string; undoLabel:string; redoLabel:string;
 canUndo?:boolean; canRedo?:boolean; disabled?:boolean;
 undoId?:string; redoId?:string;
}>(),{canUndo:false,canRedo:false,disabled:false});
const emit=defineEmits<{undo:[];redo:[]}>();
function undo(){if(props.canUndo&&!props.disabled)emit('undo');}
function redo(){if(props.canRedo&&!props.disabled)emit('redo');}
</script>
<template>
 <div class="au-history-controls" role="group" :aria-label="label">
  <AuButton :id="undoId" type="button" :disabled="disabled||!canUndo" @click="undo"><span class="au-history-action"><AuIcon path="M6 3 2 7l4 4M2 7h7a4 4 0 0 1 4 4v2"/><span>{{undoLabel}}</span></span></AuButton>
  <AuButton :id="redoId" type="button" :disabled="disabled||!canRedo" @click="redo"><span class="au-history-action"><AuIcon path="m10 3 4 4-4 4m4-4H7a4 4 0 0 0-4 4v2"/><span>{{redoLabel}}</span></span></AuButton>
 </div>
</template>
