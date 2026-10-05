import test from 'node:test';
import assert from 'node:assert/strict';
import { safeHexColor, finiteSliderValue, isOptionValue } from '../src/contracts.ts';

test('swatches accept only full hex colours, including a validated fallback', () => {
  assert.equal(safeHexColor('#C44336'),'#c44336');
  for (const value of ['red','#fff','#12345678','url(https://example.test)','var(--secret)','<script>',null,undefined,1]) assert.equal(safeHexColor(value),'#c44336');
  assert.equal(safeHexColor('invalid','#D2A773'),'#d2a773');
  assert.equal(safeHexColor('invalid','url(remote)'),'#c44336');
});
test('slider clamps finite values and rejects coercion and malformed ranges', () => {
  assert.equal(finiteSliderValue(-1,0,100),0); assert.equal(finiteSliderValue(101,0,100),100); assert.equal(finiteSliderValue(35,0,100),35);
  for (const value of [NaN,Infinity,-Infinity,'35',null,undefined,{},[]]) assert.equal(finiteSliderValue(value,0,100),null);
  assert.equal(finiteSliderValue(35,NaN,100),null); assert.equal(finiteSliderValue(35,100,0),null);
});
test('selects reject injected, absent and disabled option values', () => {
  const items = [{value:'paper',title:'Paper'},{value:'disabled',title:'Disabled',disabled:true}];
  assert.equal(isOptionValue('paper',items),true);
  for (const value of ['disabled','wood','<img>',null,0,{},[]]) assert.equal(isOptionValue(value,items),false);
});
