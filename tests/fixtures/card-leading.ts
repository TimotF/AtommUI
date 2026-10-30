import {createApp,h,ref} from 'vue';
import {AuRoot,AuCard,AuButton,createAtommVuetify} from '../../src/index';
import '../../src/atomm-ui.css';import '../../src/compact.css';
const count=ref(0),rtl=new URLSearchParams(location.search).has('rtl');
createApp({render:()=>h(AuRoot,{profile:'compact',direction:rtl?'rtl':'ltr'},()=>h('main',{style:'width:300px;padding:8px'},[h(AuCard,{id:'leading',title:'Content'}, {'header-leading':()=>h(AuButton,{id:'handle',icon:true,'aria-label':'Move',onClick:()=>count.value++},()=> '⠿'),default:()=>h('p',{id:'count'},String(count.value))}),h(AuCard,{id:'plain',title:'Normal'},()=> 'Normal fields')]))}).use(createAtommVuetify()).mount('#app');
