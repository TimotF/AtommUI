import {createApp,h,ref} from 'vue';
import {AuRoot,AuButton,AuActionMenu,AuSelect,createAtommVuetify} from '../../src/index';
import '../../src/atomm-ui.css';import '../../src/compact.css';
const open=ref(false),value=ref('15'),actions=ref(0);
const items=[{value:'0',title:'Free'},{value:'15',title:'15°'},{value:'disabled',title:'Unavailable',disabled:true},{value:'90',title:'90°'}];
createApp({render:()=>h(AuRoot,{profile:'compact'},()=>[
 h(AuButton,{id:'trigger',onClick:()=>open.value=!open.value},()=> 'Options'),
 h(AuSelect,{id:'standalone',label:'Standalone',modelValue:value.value,items,'onUpdate:modelValue':(v:string)=>value.value=v}),
 h(AuActionMenu,{id:'actions',modelValue:open.value,activator:'#trigger',label:'Options',items:[{value:'reset',title:'Reset',id:'reset'}],'onUpdate:modelValue':(v:boolean)=>open.value=v,onSelect:()=>actions.value++},{after:()=>[
  h(AuSelect,{id:'nested',label:'Rotation step',modelValue:value.value,items,'onUpdate:modelValue':(v:string)=>value.value=v}),
  h(AuButton,{id:'after'},()=> 'Next field')]}),
 h('output',{id:'value'},value.value),h('output',{id:'action-count'},String(actions.value)),
])}).use(createAtommVuetify()).mount('#app');
