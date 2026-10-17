import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { AuTextField, AuZoomControls, AuTooltip, AuColorField, AuSvgViewport, AuSwitch, AuRoot, AuButton, AuSlider, AuProgress, AuNumericField, AuSelect, AuSummary, AuExampleCard, AuSegmentedControl, AuPanelHeader, AuFieldNote, createAtommVuetify } from '../dist/atomm-ui.js';

async function render(children, direction = 'ltr') {
  const app = createSSRApp(() => h(AuRoot, {direction}, () => children));
  app.use(createAtommVuetify());
  return renderToString(app);
}

test('compact profile and reusable panel text keep ordinary document semantics', async () => {
  const app = createSSRApp(() => h(AuRoot, {profile:'compact'}, () => [
    h(AuPanelHeader, {id:'heading'}, () => h('strong', 'Settings')),
    h(AuFieldNote, {id:'note'}, () => 'Choose a material'),
  ]));
  app.use(createAtommVuetify());
  const html = await renderToString(app);
  assert.match(html, /class="[^"]*au-root[^"]*au-profile-compact/);
  assert.match(html, /<header[^>]*id="heading"/);
  assert.match(html, /<p[^>]*id="note"/);
});

test('ordinary buttons are actions; only explicit toggles expose aria-pressed', async () => {
  const ordinary = await render(h(AuButton, {id:'action'}, () => 'Export'));
  assert.ok(ordinary.includes('<button'));
  assert.ok(!ordinary.includes('aria-pressed'));
  for (const active of [true,false]) {
    const toggle = await render(h(AuButton, {active}, () => 'Orient'));
    assert.ok(toggle.includes(`aria-pressed="${active}"`));
  }
});

test('slider readout and accessible thumb agree for malformed and out-of-range props', async () => {
  for (const [value,expected] of [[NaN,0],[Infinity,0],[-10,0],[150,100],[35,35]]) {
    const html = await render(h(AuSlider,{id:'range',label:'Preview',modelValue:value}));
    assert.ok(html.includes(`aria-valuenow="${expected}"`));
    assert.match(html,new RegExp(`id="range-value"[^>]*>${expected}%`));
    assert.ok(!html.includes('NaN')&&!html.includes('Infinity'));
  }
  for (const range of [{min:NaN,max:100},{min:100,max:0},{min:0,max:0},{step:-1}]) {
    const html = await render(h(AuSlider,{id:'invalid-range',label:'Preview',modelValue:35,...range}));
    assert.ok(html.includes('aria-disabled="true"'));
    assert.ok(!html.includes('NaN')&&!html.includes('Infinity'));
  }
});

test('multiple progress controls use unique IDs and invalid progress is indeterminate', async () => {
  const html = await render([
    h(AuProgress,{id:'first',label:'Updating',value:NaN,cancelLabel:'Cancel'}),
    h(AuProgress,{id:'second',label:'Updating',value:150,cancelLabel:'Cancel'}),
    h(AuProgress,{label:'Updating',value:-5,cancelLabel:'Cancel'}),
  ]);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(html.includes('id="first-cancel"')&&html.includes('id="second-cancel"'));
  assert.ok(!html.match(/<div[^>]*id="first"[^>]*aria-valuenow/));
  assert.ok(html.match(/<div[^>]*id="second"[^>]*aria-valuenow="100"/));
  assert.ok(!html.includes('NaN'));
});

test('numeric strings and metadata remain escaped text without coercing incomplete drafts', async () => {
  for (const value of ['', '-', '0,', '0.25', '<img src=x onerror=alert(1)>']) {
    const html=await render(h(AuNumericField,{id:'number',label:'Thickness',modelValue:value,error:'Invalid decimal'}));
    const escaped=value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
    const input = html.match(/<input\b[^>]*\bid="number"[^>]*>/)?.[0];
    assert.ok(input, 'the actual numeric input is rendered');
    assert.ok(value === '' ? /\bvalue(?:="")?(?=\s|>)/.test(input) : input.includes(`value="${escaped}"`));
    assert.ok(html.includes('aria-invalid="true"'));
    assert.ok(!html.includes('<img src=x'));
  }
  const html=await render(h(AuSummary,{label:'Result',items:[{label:'Parts',value:'<script>alert(1)</script>'}]}));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});

test('numeric display formatting presents two decimals while retaining the canonical model for gestures', async () => {
  const canonical='25.533517837524414';
  const html=await render(h(AuNumericField,{id:'rounded-number',label:'Gap',modelValue:canonical,formatDisplay:text=>Number(text).toFixed(2)}));
  const input=html.match(/<input\b[^>]*\bid="rounded-number"[^>]*>/)?.[0];
  assert.ok(input?.includes('value="25.53"'));
  assert.ok(!input.includes(canonical));
  assert.ok(input.includes('aria-keyshortcuts="Shift+ArrowUp Shift+ArrowDown"'));
});

test('direction is provided to Vuetify controls as well as the root DOM', async () => {
  const html=await render(h(AuSlider,{id:'direction',label:'Preview',modelValue:35}),'rtl');
  assert.ok(html.includes('dir="rtl"'));
  assert.ok(html.includes('v-locale--is-rtl'));
});

test('example cards remain generic accessible actions and escape their title',async () => {
  const title='<img src=x onerror=alert(1)>',ordinary=await render(h(AuExampleCard,{title},()=>h('svg',{'aria-hidden':'true'})));
  assert.ok(ordinary.includes('<button'));
  assert.ok(ordinary.includes('aria-label="&lt;img src=x onerror=alert(1)&gt;"'));
  assert.ok(!ordinary.includes('aria-pressed'));
  assert.ok(!ordinary.includes('<img src=x'));
  for(const active of [true,false]) {
    const html=await render(h(AuExampleCard,{title:'Example',active,disabled:true}));
    assert.ok(html.includes(`aria-pressed="${active}"`));
    assert.ok(html.includes('disabled'));
  }
  const row=await render(h(AuExampleCard,{title:'Preview',layout:'row'},()=>h('img',{src:'/local-preview.png',alt:''})));
  assert.ok(row.includes('au-example-row'));
  assert.match(row,/<img\b[^>]*\bsrc="\/local-preview\.png"[^>]*\balt(?:="")?(?=\s|>)/);
});

test('select colour metadata is optional and cannot inject CSS or markup',async()=>{
  const title='<img src=x onerror=alert(1)>',renderSelect=color=>render(h(AuSelect,{id:'material',label:'Material',modelValue:'first',items:[{value:'first',title,color}]}));
  const safe=await renderSelect('#D2A773');
  assert.ok(safe.includes('au-option-paint'));
  assert.ok(safe.includes('background-color:#d2a773'));
  assert.ok(safe.includes('&lt;img src=x onerror=alert(1)&gt;'));
  for(const color of [undefined,'url(https://invalid.example/image)','#abc','var(--external)','red']) {
    const html=await renderSelect(color);
    assert.ok(!html.includes('au-option-paint'));
    assert.ok(!html.includes('invalid.example'));
    assert.ok(!html.includes('<img src=x'));
  }
});

test('integer keyboard mode keeps raw text and explicit validation semantics',async()=>{
  const html=await render(h(AuNumericField,{id:'count',label:'Count',modelValue:'2.5',inputMode:'numeric',error:'Use a whole number'}));
  const input=html.match(/<input\b[^>]*\bid="count"[^>]*>/)?.[0];
  assert.ok(input?.includes('inputmode="numeric"'));
  assert.ok(input?.includes('value="2.5"'));
  assert.ok(input?.includes('aria-invalid="true"'));
});

test('numeric constraints do not coerce drafts and readonly/disabled remain native input states',async()=>{
  for(const props of [{min:2,max:100,modelValue:'101'}, {readOnly:true,modelValue:'-'}, {disabled:true,modelValue:'0,'}]) {
    const html=await render(h(AuNumericField,{id:'bounded',label:'Value',...props}));
    const input=html.match(/<input\b[^>]*\bid="bounded"[^>]*>/)?.[0];
    assert.ok(input?.includes(`value="${props.modelValue}"`));
    if(props.readOnly) assert.match(input,/\breadonly(?:="")?(?=\s|>)/);
    if(props.disabled) assert.match(input,/\bdisabled(?:="")?(?=\s|>)/);
  }
});
test('segmented choices expose radios with one keyboard stop, escape labels, and honour disabled options',async()=>{
  const items=[{value:'spacing',title:'Spacing'},{value:'disabled',title:'Disabled',disabled:true},{value:'count',title:'<img src=x>'}];
  const html=await render(h(AuSegmentedControl,{id:'mode',label:'Density mode',modelValue:'spacing',items}));
  assert.ok(html.includes('role="radiogroup"'));
  assert.equal((html.match(/role="radio"/g)??[]).length,3);
  assert.equal((html.match(/tabindex="0"/g)??[]).length,1);
  assert.ok(html.match(/<button[^>]*aria-checked="true"[^>]*data-value="spacing"/));
  const unavailable=html.match(/<button[^>]*data-value="disabled"[^>]*>/)?.[0];
  assert.match(unavailable??'',/\sdisabled(?:="")?(?=\s|>)/);
  assert.ok(html.includes('&lt;img src=x&gt;')); assert.ok(!html.includes('<img src=x>'));
  const disabled=await render(h(AuSegmentedControl,{label:'Density mode',modelValue:'spacing',items,disabled:true}));
  assert.ok(disabled.includes('aria-disabled="true"'));
  assert.equal((disabled.match(/tabindex="0"/g)??[]).length,0);
});

test('switch exposes persistent checked state, separate help, native disabled/loading and escaped copy',async()=>{
 for(const value of [true,false]) {
  const html=await render(h(AuSwitch,{id:'mirror',label:'Mirror <img>',modelValue:value,help:'Reflect <script>'}));
  const input=html.match(/<input\b[^>]*\bid="mirror"[^>]*>/)?.[0];
  assert.ok(input?.includes('role="switch"'));
  assert.equal(/\schecked(?:="")?(?=\s|>)/.test(input),value);
  assert.ok(html.includes('for="mirror"'));
  assert.ok(html.includes('data-help="mirror"'));
  assert.ok(!/<label[^>]*>[\s\S]*?<button[\s\S]*?<\/label>/.test(html));
  assert.ok(!html.includes('<img>')&&!html.includes('<script>'));
 }
 for(const props of [{disabled:true},{loading:true}]) {
  const html=await render(h(AuSwitch,{id:'busy',label:'Busy',modelValue:false,...props}));
  assert.match(html.match(/<input\b[^>]*\bid="busy"[^>]*>/)?.[0]??'',/\sdisabled(?:="")?(?=\s|>)/);
  if(props.loading)assert.ok(html.includes('aria-busy="true"'));
 }
});
test('SVG viewport isolates preview layers, supports multiple instances and normalizes invalid bounds',async()=>{
 const html=await render([h(AuSvgViewport,{label:'Drawing A',bounds:{x:10,y:-20,width:120,height:80}},{default:()=>h('path',{'data-operation':'cut',d:'M0 0H10'}),overlay:()=>h('circle',{cx:2,cy:2,r:1})}),h(AuSvgViewport,{label:'Drawing B',bounds:{x:NaN,y:0,width:0,height:Infinity},grid:false})]);
 assert.ok(html.includes('aria-label="Drawing A"')&&html.includes('aria-label="Drawing B"'));
 assert.equal((html.match(/class="au-svg-viewport-grid"/g)??[]).length,1);
 assert.ok(html.includes('data-preview-only="true"'));
 assert.ok(html.includes('data-operation="cut"'));
 assert.ok(!html.includes('NaN')&&!html.includes('Infinity'));
 assert.equal((html.match(/tabindex="0"/g)??[]).length,2);
});

test('free color field uses an accessible dialog action and sanitizes CSS without nesting help in the trigger',async()=>{
 const props={id:'paint',label:'Color <img>',hexLabel:'Hex color',invalidMessage:'Enter six hexadecimal digits',modelValue:'#2a6b8c',help:'Change preview color'};
 const html=await render(h(AuColorField,props));
 assert.ok(html.includes('background-color:#2a6b8c'));
 assert.ok(html.includes('aria-haspopup="dialog"'));
 assert.ok(html.includes('aria-expanded="false"'));
 assert.ok(html.includes('data-help="paint"'));
 assert.ok(!html.includes('<img>'));
 const unsafe=await render(h(AuColorField,{...props,disabled:true,modelValue:'url(https://invalid.example/paint)'}));
 assert.ok(!unsafe.includes('invalid.example'));
 assert.match(unsafe.match(/<button[^>]*id="paint"[^>]*>/)?.[0]??'',/\sdisabled(?:="")?(?=\s|>)/);
});


test('zoom controls keep translated actions, current percentage and disable invalid camera bounds', async () => {
 const props={percent:100,label:'Zoom <safe>',zoomInLabel:'Closer',zoomOutLabel:'Further',recenterLabel:'Fit'};
 const html=await render(h(AuZoomControls,props));
 for(const text of ['100 %','Closer','Further','Fit','Zoom &lt;safe&gt;'])assert.ok(html.includes(text));
 const invalid=await render(h(AuZoomControls,{...props,min:200,max:100}));
 assert.equal((invalid.match(/<button[^>]* disabled(?:="")?/g)||[]).length,4);
 assert.ok(!html.includes('<safe>'));
});

test('whole-activator tooltip preserves an ordinary named action and provides an accessible description', async () => {
 const html=await render(h(AuTooltip,{text:'<img src=x>'},{activator:({props})=>h(AuButton,{...props},()=> 'Import <SVG>')}));
 assert.match(html,/aria-describedby="au-tooltip-[^"]+"/);
 assert.ok(html.includes('Import &lt;SVG&gt;'));
 assert.ok(!html.includes('<img'));
 assert.ok(!html.includes('aria-pressed'));
});


test('touch help suppresses only the long-press action and cancels when the pointer moves', async (context) => {
 let binding;
 await render(h(AuTooltip,{text:'Help'},{activator:({props})=>{binding=props;return h(AuButton,{...props},()=> 'Choose');}}));
 context.mock.timers.enable({apis:['setTimeout']});
 let prevented=0;const click={preventDefault(){prevented++;},stopImmediatePropagation(){}};
 binding.onPointerdown({pointerType:'touch'});context.mock.timers.tick(450);binding.onPointerup();binding.onClickCapture(click);
 assert.equal(prevented,1);
 binding.onPointerdown({pointerType:'touch'});binding.onPointermove();context.mock.timers.tick(450);binding.onClickCapture(click);
 assert.equal(prevented,1);
 binding.onPointerdown({pointerType:'touch'});binding.onPointerup();binding.onClickCapture(click);
 assert.equal(prevented,1);
});

test('free text preserves Unicode, empty drafts and spaces with associated errors', async () => {
 for (const value of ['', '  Érable n° 2  ', '<script>']) {
  const html=await render(h(AuTextField,{id:'plant',label:'Nom',modelValue:value,error:'Corrigez le nom',help:'Aide'}));
  assert.match(html, /<label for="plant">Nom<\/label>/);
  assert.match(html, /aria-describedby="plant-error"/);
  assert.match(html, /data-help="plant"/);
  assert.ok(html.includes('Corrigez le nom'));
  assert.ok(!html.includes('<script>'));
  if(value.includes('Érable'))assert.ok(html.includes(value));
 }
 for(const state of [{disabled:true},{readOnly:true}]){
  const html=await render(h(AuTextField,{id:'locked',label:'Nom',modelValue:'A',...state}));
  assert.match(html,state.disabled?/\bdisabled\b/:/\breadonly\b/);
 }
});
