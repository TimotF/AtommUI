import {test,expect} from '@playwright/test';
for(const rtl of [false,true])test('card leading action stays independent '+(rtl?'RTL':'LTR'),async({page})=>{
 await page.setViewportSize({width:320,height:700});await page.goto('/tests/fixtures/card-leading.html'+(rtl?'?rtl':''));
 const grip=page.locator('#handle'),toggle=page.locator('#leading-title');await expect(toggle).toHaveAttribute('aria-expanded','true');
 expect(await grip.evaluate(e=>e.closest('section')===document.querySelector('#leading-title')?.closest('section'))).toBe(true);expect(await grip.evaluate(e=>!!e.parentElement?.closest('button'))).toBe(false);
 await grip.click();await expect(page.locator('#count')).toHaveText('1');await expect(toggle).toHaveAttribute('aria-expanded','true');
 await toggle.click();await expect(page.locator('#leading')).toBeHidden();await expect(grip).toBeVisible();await grip.focus();await grip.press('Space');await expect(toggle).toHaveAttribute('aria-expanded','false');await grip.press('Tab');await expect(toggle).toBeFocused();await toggle.press('Enter');await expect(page.locator('#count')).toHaveText('2');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('#plain-title')).toBeVisible();
});
