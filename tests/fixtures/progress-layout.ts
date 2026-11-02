import {createApp,h,ref} from 'vue';
import {AuRoot,AuProgress,createAtommVuetify} from '../../src/index';
import '../../src/atomm-ui.css';import '../../src/compact.css';
const count=ref(0),q=new URLSearchParams(location.search),profile=q.has('default')?'default':'compact';
createApp({render:()=>h(AuRoot,{profile,direction:q.has('rtl')?'rtl':'ltr'},()=>h('main',{},[
 h(AuProgress,{label:'Étapes 2/3 : Contours et numéros',value:2/3*100,cancelLabel:'Annuler',cancelId:'cancel-progress',onCancel:()=>count.value++}),
 h('p',{id:'cancel-count','aria-live':'polite'},String(count.value)),
]))}).use(createAtommVuetify()).mount('#app');
