import {test,expect} from '@playwright/test';
test('RTL mirrors zoom controls while numeric readouts keep their left-to-right order',async({page})=>{
 await page.goto('/?review-controls&rtl');
 const readout=page.locator('.au-zoom-value bdi');
 await expect(readout).toHaveText('100 %');await expect(readout).toHaveAttribute('dir','ltr');
 const order=await readout.evaluate(element=>{const text=element.firstChild!;const a=document.createRange(),b=document.createRange();a.setStart(text,0);a.setEnd(text,3);b.setStart(text,4);b.setEnd(text,5);return{number:a.getBoundingClientRect().left,percent:b.getBoundingClientRect().left};});
 expect(order.number).toBeLessThan(order.percent);
 await page.locator('.au-zoom-value').click();
 const option=page.getByRole('button',{name:'150 %',exact:true});await expect(option.locator('bdi')).toHaveAttribute('dir','ltr');await option.click();await expect(readout).toHaveText('150 %');
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();await expect(readout).not.toHaveText('150 %');
 await page.getByRole('button',{name:'Fit',exact:true}).click();await expect(readout).toHaveText('100 %');
});
