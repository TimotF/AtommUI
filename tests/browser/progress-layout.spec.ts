import {test,expect} from '@playwright/test';
for(const rtl of [false,true])for(const compact of [false,true])test(`progress cancel geometry ${compact?'compact':'default'} ${rtl?'RTL':'LTR'}`,async({page})=>{
 await page.setViewportSize({width:320,height:500});await page.goto('/tests/fixtures/progress-layout.html?'+[rtl?'rtl':'',compact?'':'default'].filter(Boolean).join('&'));
 const cancel=page.locator('#cancel-progress'),bounds=await cancel.boundingBox();expect(bounds).not.toBeNull();expect(bounds!.height).toBe(compact?32:28);expect(bounds!.width).toBeGreaterThanOrEqual(24);
 await cancel.focus();await cancel.press('Enter');await expect(page.locator('#cancel-count')).toHaveText('1');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
