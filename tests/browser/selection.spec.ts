import {test,expect} from '@playwright/test';

test('compact selection stays above transparent and opaque previews without shifting the card',async({page})=>{
 await page.goto('/?selection-review');
 for(const kind of ['transparent','opaque','png','row']){
  const card=page.getByTestId('selection-'+kind),before=await card.boundingBox();
  const ring=await card.evaluate(e=>{const s=getComputedStyle(e,'::before');return{width:s.borderTopWidth,color:s.borderTopColor,z:s.zIndex,pointer:s.pointerEvents,content:s.content};});
  expect(ring).toMatchObject({width:'2px',color:'rgb(41, 42, 45)',z:'1',pointer:'none'});expect(ring.content).toBe('""');
  await card.click();await expect(card).toHaveAttribute('aria-pressed','false');expect(await card.boundingBox()).toEqual(before);
  expect(await card.evaluate(e=>getComputedStyle(e,'::before').content)).toBe('none');
  await card.press('Space');await expect(card).toHaveAttribute('aria-pressed','true');expect(await card.boundingBox()).toEqual(before);
  expect(await card.evaluate(e=>{const s=getComputedStyle(e);return e.matches(':focus-visible')&&s.outlineStyle==='solid'&&s.outlineWidth==='2px'&&s.outlineColor!==getComputedStyle(e,'::before').borderTopColor;})).toBe(true);
 }
 const disabled=page.getByTestId('selection-disabled');await expect(disabled).toBeDisabled();await expect(disabled).toHaveAttribute('aria-pressed','true');
});

test('row selection works in RTL and the historical profile does not acquire the new ring',async({page})=>{
 await page.goto('/?selection-review&rtl');const card=page.getByTestId('selection-row');await expect(card).toHaveCSS('direction','rtl');
 expect(await card.evaluate(e=>getComputedStyle(e,'::before').borderInlineStartWidth)).toBe('2px');
 await page.goto('/?selection-review&legacy');expect(await page.getByTestId('selection-transparent').evaluate(e=>getComputedStyle(e,'::before').content)).toBe('none');
});
