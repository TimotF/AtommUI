import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { AuRoot, AuButton, AuSlider, AuProgress, AuNumericField, AuSelect, AuSummary, AuExampleCard, createAtommVuetify } from '../dist/atomm-ui.js';

async function render(children, direction = 'ltr') {
  const app = createSSRApp(() => h(AuRoot, {direction}, () => children));
  app.use(createAtommVuetify());
  return renderToString(app);
}

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
