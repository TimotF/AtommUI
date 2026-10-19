import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp, h, ref } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { AuRoot, AuFieldGroups, AuFieldGroup, AuNumericField, AuSceneControls, AuOnboarding, AuOnboardingCard, useOnboarding, readOnboardingProgress, pendingOnboardingSteps, positionOnboarding, createAtommVuetify } from '../dist/atomm-ui.js';

async function render(children) {
  return renderToString(createSSRApp(() => h(AuRoot, {profile:'compact'}, () => children)).use(createAtommVuetify()));
}

test('grouped cards preserve full field associations and independent collapsed regions', async () => {
  const html = await render(h(AuFieldGroups, {}, () => [
    h(AuFieldGroup, {title:'Dimensions <img>', help:'Choose a width'}, () => h(AuNumericField,{id:'width',label:'Width',modelValue:'0,'})),
    h(AuFieldGroup, {title:'Options',collapsible:true,initialOpen:false}, () => 'Hidden settings'),
  ]));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length,new Set(ids).size);
  assert.match(html,/role="group" aria-labelledby="au-group-/);
  assert.match(html,/aria-expanded="false"/);
  assert.match(html,/<div[^>]*class="au-group-content"[^>]*hidden/);
  assert.match(html,/for="width"/);
  assert.match(html,/value="0,"/);
  assert.ok(html.includes('Dimensions &lt;img&gt;')&&!html.includes('<img>'));
});

test('scene controls expose explosion only when supported and use separate IDs for each instance', async () => {
  const props={percent:100,label:'Zoom',zoomInLabel:'Closer',zoomOutLabel:'Further',recenterLabel:'Fit'};
  const basic = await render(h(AuSceneControls,props));
  assert.ok(!basic.includes('au-scene-explode'));
  const html = await render([h(AuSceneControls,{...props,explode:35,explodeLabel:'Explode'}),h(AuSceneControls,{...props,explode:0,explodeLabel:'Explode'})]);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length,new Set(ids).size);
  assert.match(html,/aria-valuenow="35"/);
  assert.ok(html.includes('35%')&&html.includes('100 %'));
  const disabled=await render(h(AuSceneControls,{...props,explode:35,explodeLabel:'Explode',disabled:true}));
  assert.match(disabled,/aria-disabled="true"/);
});

test('onboarding cards are nonmodal labelled dialogs with escaped consumer copy', async () => {
  const html=await render(h(AuOnboardingCard,{title:'Safe <img>',text:'<script>alert(1)</script>',label:'Tip',closeLabel:'Close',nextLabel:'Got it',hideLabel:'Hide'}));
  assert.match(html,/role="dialog"[^>]*aria-labelledby="au-tip-title-/);
  assert.ok(!html.includes('aria-modal="true"'));
  assert.ok(html.includes('Safe &lt;img&gt;')&&html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<img>')&&!html.includes('<script>'));
  const closed=await render(h(AuOnboarding,{root:null,step:null,open:false,label:'Tip',closeLabel:'Close',nextLabel:'Got it',hideLabel:'Hide'}));
  assert.ok(!closed.includes('au-onboarding-card'));
});

test('corrupt or future guide preferences never break the app or restore arbitrary state', () => {
  for(const raw of [null,'{','null','{}',JSON.stringify({version:2,completed:[],hidden:true}),JSON.stringify({version:1,completed:[3],hidden:false}),'x'.repeat(64_001)]) assert.deepEqual(readOnboardingProgress(raw),{version:1,completed:[],hidden:false});
  assert.deepEqual(readOnboardingProgress('{"version":1,"completed":["a","a","b"],"hidden":true}'),{version:1,completed:['a','b'],hidden:true});
  const steps=[{id:'a',target:'#a',title:'A',text:''},{id:'b',target:'#b',title:'B',text:'',available:false},{id:'c',target:'#c',title:'C',text:'',complete:true},{id:'a',target:'#duplicate',title:'Duplicate',text:''}];
  assert.deepEqual(pendingOnboardingSteps(steps,[]).map(step=>step.id),['a']);
  assert.deepEqual(pendingOnboardingSteps(steps,['a']),[]);
});

test('guide sessions keep completion, hiding and persistence independent per instance', async () => {
  let first,second;const saved=new Map();const storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)};
  const steps=ref([{id:'a',target:'#a',title:'A',text:''},{id:'b',target:'#b',title:'B',text:''}]);
  const Host={setup(){first=useOnboarding(steps,{storage,storageKey:'first'});second=useOnboarding(steps,{storage,storageKey:'second'});return()=>h('div');}};
  await render(h(Host));
  first.restart();second.restart();assert.equal(first.current.value.id,'a');
  first.next();assert.equal(first.current.value.id,'b');assert.equal(second.current.value.id,'a');
  first.hide();assert.equal(first.current.value,null);assert.equal(second.hidden.value,false);
  first.resume();assert.equal(first.current.value.id,'b');first.next();assert.equal(first.current.value,null);
  assert.deepEqual(readOnboardingProgress(saved.get('first')).completed,['a','b']);
  first.restart();assert.equal(first.current.value.id,'a');
});

test('guide placement stays inside narrow viewports and rejects hidden or invalid targets', () => {
  for(const width of [320,390,1280]) for(const target of [{left:0,right:90,top:0,bottom:30},{left:width-80,right:width,top:650,bottom:700},{left:width/2-20,right:width/2+20,top:300,bottom:330}]) {
    const position=positionOnboarding(target,{width,height:720},240);
    assert.ok(position);assert.ok(position.left>=12);assert.ok(position.left+position.width<=width-12);assert.ok(position.top>=12&&position.top+240<=708);
  }
  for(const target of [{left:NaN,right:10,top:0,bottom:10},{left:10,right:0,top:0,bottom:10},{left:0,right:20,top:800,bottom:820}]) assert.equal(positionOnboarding(target,{width:390,height:720},200),null);
});
