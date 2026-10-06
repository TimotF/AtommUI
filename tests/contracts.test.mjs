import test from 'node:test';
import assert from 'node:assert/strict';
import { safeHexColor, finiteSliderValue, isOptionValue } from '../src/contracts.ts';
import { adjustNumericDraft, decimalStepDelta } from '../src/numeric.ts';

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

test('numeric adjustments preserve decimal precision and clamp only complete drafts', () => {
  assert.equal(adjustNumericDraft('0.1', .01), '0.11');
  assert.equal(adjustNumericDraft('0,1', .01), '0,11');
  assert.equal(adjustNumericDraft('0.005', .01), '0.015');
  assert.equal(adjustNumericDraft('1', .5, {decimalSeparator:','}), '1,5');
  assert.equal(adjustNumericDraft('999999999999999.1', .01), '999999999999999.11');
  assert.equal(adjustNumericDraft('0.1', -.2, {min:0}), '0');
  assert.equal(adjustNumericDraft('99', 10, {max:100}), '100');
  assert.equal(adjustNumericDraft('0.001', 0, {min:.005}), '0.005');
  for(const value of ['', '-', '+', '0,', '1.', '1e2', 'NaN', 'Infinity', '<img>', ' '.repeat(300)]) assert.equal(adjustNumericDraft(value, 1), null);
  for(const bounds of [{min:NaN},{max:Infinity},{min:10,max:0}]) assert.equal(adjustNumericDraft('1', 1, bounds), null);
  for(const delta of [NaN,Infinity,-Infinity]) assert.equal(adjustNumericDraft('1',delta),null);
});
test('scrub units and speed modifiers do not accumulate binary rounding or accept malformed steps', () => {
  assert.equal(decimalStepDelta(3,.1),.3);
  assert.equal(decimalStepDelta(-3,.01),-.03);
  assert.equal(decimalStepDelta(3,.01,10),.3);
  assert.equal(decimalStepDelta(3,.01,.1),.003);
  assert.equal(adjustNumericDraft('0.1',decimalStepDelta(3,.1)), '0.4');
  for(const [units,step,multiplier] of [[1.5,1,1],[Infinity,1,1],[1,0,1],[1,-1,1],[1,NaN,1],[1,1,0],[1,1,Infinity]]) assert.equal(decimalStepDelta(units,step,multiplier),null);
});
