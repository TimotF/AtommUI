<script setup lang="ts">
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import type { SvgBounds } from '../viewport.js';
import { safeSvgBounds } from '../viewport.js';
const props=withDefaults(defineProps<{bounds:SvgBounds;label:string;displayUnit?:'mm'|'in';locale?:string;grid?:boolean}>(),{grid:true});
const emit=defineEmits<{zoomchange:[percent:number]}>();
const toDisplay=(value:number,unit:string)=>unit==='in'?value/25.4:value;
const fromDisplay=(value:number,unit:string)=>unit==='in'?value*25.4:value;
const mount=ref<HTMLElement>(),scale=ref(1),width=ref(600),height=ref(500),center=ref({x:150,y:150}),dragging=ref(false);
const rulerWidth=40,rulerHeight=24;
const canvas=computed(()=>safeSvgBounds(props.bounds));
const plotWidth=computed(()=>Math.max(1,width.value-rulerWidth)),plotHeight=computed(()=>Math.max(1,height.value-rulerHeight));
const fittedPixelsPerMm=computed(()=>Math.max(.0001,Math.min(Math.max(1,plotWidth.value-40)/Math.max(1,canvas.value.width),Math.max(1,plotHeight.value-40)/Math.max(1,canvas.value.height))));
const pixelsPerMm=computed(()=>fittedPixelsPerMm.value*scale.value);
const viewport=computed(()=>{const w=plotWidth.value/pixelsPerMm.value,h=plotHeight.value/pixelsPerMm.value;return{x:center.value.x-w/2,y:center.value.y-h/2,width:w,height:h};});
const viewBox=computed(()=>{const b=viewport.value;return `${b.x} ${b.y} ${b.width} ${b.height}`;});
const unit=computed(()=>props.displayUnit??'mm');
const majorStep=computed(()=>{const target=toDisplay(100/pixelsPerMm.value,unit.value),power=10**Math.floor(Math.log10(target));return fromDisplay([1,2,5,10].map(value=>value*power).reduce((a,b)=>Math.abs(a-target)<Math.abs(b-target)?a:b),unit.value);});
function ticks(start:number,length:number,step:number){const first=Math.ceil(start/step),last=Math.floor((start+length)/step);return Array.from({length:Math.min(160,Math.max(0,last-first+1))},(_,i)=>Number(((first+i)*step).toPrecision(12)));}
const majorX=computed(()=>ticks(viewport.value.x,viewport.value.width,majorStep.value)),majorY=computed(()=>ticks(viewport.value.y,viewport.value.height,majorStep.value));
const isMinor=(value:number)=>Math.abs(value/majorStep.value-Math.round(value/majorStep.value))>.00001;
const minorX=computed(()=>ticks(viewport.value.x,viewport.value.width,majorStep.value/5).filter(isMinor)),minorY=computed(()=>ticks(viewport.value.y,viewport.value.height,majorStep.value/5).filter(isMinor));
const xPixel=(value:number)=>(value-viewport.value.x)*pixelsPerMm.value,yPixel=(value:number)=>(value-viewport.value.y)*pixelsPerMm.value;
const label=(value:number)=>new Intl.NumberFormat(props.locale??'en',{maximumFractionDigits:Math.max(0,Math.min(6,-Math.floor(Math.log10(toDisplay(majorStep.value,unit.value)))))}).format(toDisplay(Object.is(value,-0)?0:value,unit.value));

let observer:ResizeObserver|undefined;
let down:{x:number;y:number;center:{x:number;y:number};pixelsPerMm:number;pointerId:number;target:Element|null;moved:boolean}|null=null;
function fit(){center.value={x:canvas.value.x+canvas.value.width/2,y:canvas.value.y+canvas.value.height/2};scale.value=1;emit('zoomchange',100);}
function setZoom(percent:number,anchor?:{x:number;y:number}){if(!Number.isFinite(percent))return;const next=Math.max(.1,Math.min(40,percent/100));if(anchor){const before=pixelsPerMm.value,world={x:viewport.value.x+anchor.x/before,y:viewport.value.y+anchor.y/before},after=fittedPixelsPerMm.value*next;center.value={x:world.x-(anchor.x-plotWidth.value/2)/after,y:world.y-(anchor.y-plotHeight.value/2)/after};}scale.value=next;emit('zoomchange',Math.round(next*100));}
/** factor < 1 zooms in, matching the reference generator. */
function zoom(factor:number){if(Number.isFinite(factor)&&factor>0)setZoom(scale.value*100/factor);}
function wheel(event:WheelEvent){
 const rect=mount.value?.getBoundingClientRect();if(!rect)return;
 // Trackpad pinch arrives as Ctrl+wheel with small deltas. Match the 3D
 // preview's tenfold pinch gain without changing ordinary wheel scrolling.
 const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?plotHeight.value:1)*(event.ctrlKey?10:1);
 setZoom(scale.value*100/Math.exp(Math.max(-500,Math.min(500,delta))*.0015),{x:event.clientX-rect.left-rulerWidth,y:event.clientY-rect.top-rulerHeight});
}
function pointerDown(event:PointerEvent){if(down||!event.isPrimary||event.button!==0&&event.button!==1)return;mount.value?.focus({preventScroll:true});down={x:event.clientX,y:event.clientY,center:{...center.value},pixelsPerMm:pixelsPerMm.value,pointerId:event.pointerId,target:event.target instanceof Element?event.target:null,moved:false};mount.value?.setPointerCapture(event.pointerId);}
function pointerMove(event:PointerEvent){if(!down||down.pointerId!==event.pointerId)return;const dx=event.clientX-down.x,dy=event.clientY-down.y;if(Math.hypot(dx,dy)>5)down.moved=true;if(!down.moved)return;dragging.value=true;center.value={x:down.center.x-dx/down.pixelsPerMm,y:down.center.y-dy/down.pixelsPerMm};}
function pointerUp(event:PointerEvent){if(!down||down.pointerId!==event.pointerId)return;down=null;dragging.value=false;if(mount.value?.hasPointerCapture(event.pointerId))mount.value.releasePointerCapture(event.pointerId);}
function pointerCancel(event:PointerEvent){if(down?.pointerId===event.pointerId){center.value=down.center;down=null;dragging.value=false;}}
function keyboard(event:KeyboardEvent){if(event.key==='Escape'){if(down){center.value=down.center;pointerUp({pointerId:down.pointerId} as PointerEvent);}return;}if(event.key==='0'){event.preventDefault();fit();}else if(event.key==='+'||event.key==='='){event.preventDefault();zoom(.88);}else if(event.key==='-'){event.preventDefault();zoom(1.12);}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const step=40/pixelsPerMm.value;center.value={x:center.value.x+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),y:center.value.y+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0)};}}
watch([()=>canvas.value.x,()=>canvas.value.y,()=>canvas.value.width,()=>canvas.value.height],fit,{immediate:true});
onMounted(()=>{observer=new ResizeObserver(entries=>{const size=entries[0].contentRect;if(size.width>0&&size.height>0){width.value=size.width;height.value=size.height;}});observer.observe(mount.value!);fit();});
onBeforeUnmount(()=>{observer?.disconnect();down=null;});
defineExpose({zoom,fit,setZoom});
</script>
<template>
 <div ref="mount" class="au-svg-viewport" :class="{dragging}" role="region" :aria-label="props.label" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + - 0 Escape" tabindex="0" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerCancel" @lostpointercapture="pointerCancel" @wheel.prevent="wheel" @keydown="keyboard">
  <div class="au-svg-viewport-plot">
   <svg v-if="grid !== false" class="au-svg-viewport-grid" :viewBox="viewBox" preserveAspectRatio="none" aria-hidden="true">
    <g class="grid-minor"><line v-for="x in minorX" :key="'x'+x" :x1="x" :x2="x" :y1="viewport.y" :y2="viewport.y+viewport.height"/><line v-for="y in minorY" :key="'y'+y" :y1="y" :y2="y" :x1="viewport.x" :x2="viewport.x+viewport.width"/></g>
    <g class="grid-major"><line v-for="x in majorX" :key="'x'+x" :x1="x" :x2="x" :y1="viewport.y" :y2="viewport.y+viewport.height"/><line v-for="y in majorY" :key="'y'+y" :y1="y" :y2="y" :x1="viewport.x" :x2="viewport.x+viewport.width"/></g>
   </svg>
   <svg class="au-svg-viewport-pieces" :viewBox="viewBox" preserveAspectRatio="none">
    <g class="au-svg-content"><slot /></g>
    <g class="au-svg-overlay" data-preview-only="true"><slot name="overlay" /></g>
   </svg>
  </div>
  <svg class="au-svg-viewport-ruler ruler-x" :viewBox="`0 0 ${plotWidth} ${rulerHeight}`" preserveAspectRatio="none" aria-hidden="true"><line v-for="x in minorX" :key="'minor'+x" :x1="xPixel(x)" :x2="xPixel(x)" y1="19" y2="24"/><g v-for="x in majorX" :key="x"><line :x1="xPixel(x)" :x2="xPixel(x)" y1="15" y2="24"/><text :x="xPixel(x)" y="11" text-anchor="middle">{{label(x)}}</text></g></svg>
  <svg class="au-svg-viewport-ruler ruler-y" :viewBox="`0 0 ${rulerWidth} ${plotHeight}`" preserveAspectRatio="none" aria-hidden="true"><line v-for="y in minorY" :key="'minor'+y" :y1="yPixel(y)" :y2="yPixel(y)" x1="35" x2="40"/><g v-for="y in majorY" :key="y"><line :y1="yPixel(y)" :y2="yPixel(y)" x1="31" x2="40"/><text x="3" :y="yPixel(y)-4">{{label(y)}}</text></g></svg>
  <span class="au-svg-viewport-unit" aria-hidden="true">{{unit}}</span>
 </div>
</template>

<style scoped>
.au-svg-viewport{position:relative;width:100%;height:100%;min-height:120px;overflow:hidden;outline:none;touch-action:none;background:#f5f6f7;user-select:none;cursor:grab;border:1px solid #dfe2e5;border-radius:5px}.au-svg-viewport.dragging{cursor:grabbing}
.au-svg-viewport-plot{position:absolute;inset:24px 0 0 40px;overflow:hidden}.au-svg-viewport-grid,.au-svg-viewport-pieces{position:absolute;inset:0;width:100%;height:100%;display:block}.au-svg-viewport-grid{pointer-events:none}.au-svg-viewport-grid line{vector-effect:non-scaling-stroke;stroke-width:1px}.grid-minor{stroke:#e9ebed}.grid-major{stroke:#dce0e4}
.au-svg-content{fill:none;stroke:#FE0002;stroke-width:.85px}.au-svg-content :deep(path),.au-svg-content :deep(circle),.au-svg-content :deep(rect),.au-svg-content :deep(line),.au-svg-content :deep(polyline),.au-svg-content :deep(polygon),.au-svg-content :deep(ellipse){vector-effect:non-scaling-stroke}
.au-svg-viewport-ruler{position:absolute;display:block;background:#f8f9fa;pointer-events:none}.ruler-x{top:0;left:40px;width:calc(100% - 40px);height:24px;border-bottom:1px solid #cdd2d7}.ruler-y{top:24px;left:0;height:calc(100% - 24px);width:40px;border-right:1px solid #cdd2d7}.au-svg-viewport-ruler line{stroke:#929aa3;stroke-width:1px}.au-svg-viewport-ruler text{font:10px system-ui,sans-serif;fill:#626b74;font-variant-numeric:tabular-nums}.au-svg-viewport-unit{position:absolute;left:0;top:0;width:40px;height:24px;display:grid;place-items:center;background:#f8f9fa;color:#626b74;font-size:9px;border-right:1px solid #cdd2d7;border-bottom:1px solid #cdd2d7;pointer-events:none}
</style>
