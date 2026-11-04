<script setup lang="ts">
import {computed,ref,useId} from 'vue';
import AuIcon from './AuIcon.vue';
const props=defineProps<{id?:string;label:string;hint:string;accept?:string;disabled?:boolean;loading?:boolean;error?:string}>();
const emit=defineEmits<{select:[file:File]}>();
const generated=useId(),input=ref<HTMLInputElement>(),over=ref(false);
const fieldId=computed(()=>props.id??`au-file-${generated}`),blocked=computed(()=>props.disabled||props.loading);
function choose(){if(!blocked.value)input.value?.click();}
defineExpose({choose});
function changed(event:Event){const target=event.target as HTMLInputElement,file=target.files?.[0];target.value='';if(file&&!blocked.value)emit('select',file);}
function leave(event:DragEvent){if(event.relatedTarget instanceof Node&&(event.currentTarget as Node).contains(event.relatedTarget))return;over.value=false;}
function drop(event:DragEvent){over.value=false;const file=event.dataTransfer?.files[0];if(file&&!blocked.value)emit('select',file);}
</script>
<template>
 <div class="au-file-dropzone" :class="{'au-file-dropzone-over':over&&!blocked,'au-file-dropzone-error':!!error}" :aria-busy="loading?'true':undefined">
  <input :id="fieldId" ref="input" type="file" :accept="accept" :disabled="blocked" hidden @change="changed" />
  <button :id="`${fieldId}-trigger`" type="button" class="au-file-dropzone-target" :aria-label="label" :aria-describedby="`${fieldId}-hint${error?' '+fieldId+'-error':''}`" :disabled="blocked" @click="choose" @dragover.prevent @dragenter.prevent="over=true" @dragleave="leave" @drop.prevent="drop">
   <AuIcon path="M8 11V2m-3 3 3-3 3 3M2 10v4h12v-4" />
   <span class="au-file-dropzone-label">{{label}}</span>
   <span :id="`${fieldId}-hint`" class="au-file-dropzone-hint">{{hint}}</span>
  </button>
  <p v-if="error" :id="`${fieldId}-error`" class="au-file-dropzone-message" role="alert">{{error}}</p>
 </div>
</template>
