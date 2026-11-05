import {test,expect} from '@playwright/test';
for(const nested of [false,true])test(`select owns keyboard navigation ${nested?'inside action menu':'standalone'}`,async({page})=>{
 await page.goto('/tests/fixtures/nested-select.html');
 if(nested)await page.locator('#trigger').click();
 const select=page.locator(nested?'#nested':'#standalone');await select.focus();
 await select.press('Enter');await expect(select).toHaveAttribute('aria-expanded','true');
 await select.press('ArrowDown');await expect(select).toBeFocused();await expect(select).toHaveAttribute('aria-expanded','true');
 await expect(select).toHaveAttribute('aria-activedescendant',`${nested?'nested':'standalone'}-option-3`);
 await select.press('Enter');await expect(page.locator('#value')).toHaveText('90');await expect(select).toBeFocused();
 await select.press('Space');await select.press('Home');await expect(select).toHaveAttribute('aria-activedescendant',`${nested?'nested':'standalone'}-option-0`);
 await select.press('End');await select.press('ArrowUp');await select.press('Enter');await expect(page.locator('#value')).toHaveText('15');
 await select.press('f');await select.press('Enter');await expect(page.locator('#value')).toHaveText('0');
 await select.press('Enter');await select.press('Escape');await expect(select).toHaveAttribute('aria-expanded','false');await expect(select).toBeFocused();
 if(nested){
  await expect(page.locator('#actions')).toBeVisible();
  await select.press('Tab');await expect(page.locator('#after')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('#actions')).toBeHidden();await expect(page.locator('#trigger')).toBeFocused();
  await page.locator('#trigger').click();await page.locator('#reset').click();await expect(page.locator('#action-count')).toHaveText('1');
 }
 if(!nested){await select.click();await page.getByRole('option',{name:'90°',exact:true}).click();await expect(page.locator('#value')).toHaveText('90');}
});
