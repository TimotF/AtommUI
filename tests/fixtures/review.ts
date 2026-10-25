import {createApp,h,onMounted,onBeforeUnmount,ref} from 'vue';
import {AuRoot,AuLayout,AuCard,AuPanelHeader,AuButton,AuSegmentedControl,createAtommVuetify} from '@timotf/atomm-ui';
import {PreviewStage,previewMeshes} from '@timotf/atomm-ui/three';
import '@timotf/atomm-ui/style.css';import '@timotf/atomm-ui/compact.css';
const q=new URLSearchParams(location.search);
const App={setup(){
 const host=ref<HTMLElement>(),width=Number(q.get('width')??1280);let stage:PreviewStage|undefined;
 onMounted(()=>{if(q.has('three')){stage=new PreviewStage(host.value!,()=>{});stage.setContent(previewMeshes({path:'M0 0H60V40H0Z',thickness:2}),{width:60,height:40,thickness:2});stage.setAppearance({material:'solid',color:'#4e7190'});(window as any).reviewStage=stage;}});
 onBeforeUnmount(()=>stage?.dispose());
 return()=>h('div',{class:'host',style:{width:width+'px'}},[h(AuRoot,{profile:'compact',direction:q.has('rtl')?'rtl':'ltr'},()=>h(AuLayout,{standard:!q.has('legacy'),leadCollapsed:q.has('no-lead')},{
  lead:()=>[h(AuPanelHeader,{},()=> 'Templates'),h(AuButton,{},()=> 'Example')],
  stage:()=>h('div',{class:'stage-host',ref:host},q.has('three')?[]:'Canvas'),
  parameters:()=>[h(AuPanelHeader,{class:'au-parameters-header'},()=>[h('div',{class:'unit'},[h(AuSegmentedControl,{label:'Units',modelValue:'mm',items:[{value:'mm',title:'mm'},{value:'in',title:'in'}]})]),h(AuButton,{},()=> 'Reset')]),h('div',{class:'au-parameters-content'},[h(AuCard,{id:'fixture',title:'Settings'},()=> 'Parameters')]),h('footer',{class:'au-parameters-footer'},[h(AuButton,{block:true},()=> 'Export')])],
 }))]);
}};
createApp(App).use(createAtommVuetify('en')).mount('#app');
