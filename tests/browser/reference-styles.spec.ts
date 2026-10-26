import {test,expect} from '@playwright/test';
test('reference variants preserve legacy defaults, align rows and keep thumbnail selection stable',async({page})=>{
 await page.goto('/?review-controls&reference-styles');
 await expect(page.locator('#reference-alert-error')).toHaveCSS('color','rgb(180, 35, 24)');
 await expect(page.locator('#reference-alert-error .au-icon')).toHaveCount(0);
 await expect(page.locator('#reference-thumb .au-example-preview')).toHaveCSS('padding','0px');
 const legacyPreview=await page.locator('#reference-thumb .au-example-preview').boundingBox();expect(legacyPreview!.width).not.toBe(legacyPreview!.height);
 const oldRow=await page.locator('#reference-number').locator('xpath=ancestor::div[contains(@class,"au-field-row")]').boundingBox();expect(oldRow!.height).toBe(28);
 for(const width of [1280,960,390]){
  await page.setViewportSize({width,height:1000});await page.goto('/?review-controls&reference-styles&reference');
  const alert=page.locator('#reference-alert-error');await expect(alert).toHaveAttribute('role','alert');await expect(alert).toHaveCSS('padding','12px');await expect(alert).toHaveCSS('border-radius','6px');await expect(alert).toHaveCSS('background-color','rgb(254, 233, 231)');
  const primary=await page.locator('.au-root').evaluate(e=>getComputedStyle(e).getPropertyValue('--v-theme-on-surface').trim());
  expect(await alert.evaluate(e=>getComputedStyle(e).color.replace(/[^\d,]/g,'').replaceAll(',',' '))).toBe(primary.replaceAll(',','').replace(/\s+/g,' '));
  for(const tone of ['error','info','warning','success'])await expect(page.locator('#reference-alert-'+tone+' .au-icon[aria-hidden=true]')).toHaveCount(1);
  const row=page.locator('#reference-fields .au-field-row').first();await expect(row).toHaveCSS('padding','8px 0px');expect((await row.boundingBox())!.height).toBe(44);await expect(page.locator('#reference-fields .au-group-content')).toHaveCSS('gap','0px');
  await expect(page.locator('#reference-number')).toHaveValue('6');await page.locator('#reference-number').fill('0,');await expect(page.locator('#reference-number')).toHaveValue('0,');
  const preview=page.locator('#reference-thumb .au-example-preview'),before=await preview.boundingBox();expect(Math.abs(before!.width-before!.height)).toBeLessThan(.1);expect(before!.width).toBeLessThanOrEqual(140);await expect(preview).toHaveCSS('padding','14px');await expect(preview).not.toHaveCSS('box-shadow','none');
  await page.locator('#reference-thumb').click();await expect(page.locator('#reference-thumb')).toHaveAttribute('aria-pressed','true');expect(await preview.boundingBox()).toMatchObject({width:before!.width,height:before!.height});
  await page.locator('#reference-thumb').focus();await page.keyboard.press('Space');await expect(page.locator('#reference-thumb')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#reference-photo .au-example-preview')).toHaveCSS('padding','0px');await expect(page.locator('#reference-disabled')).toBeDisabled();expect(await page.locator('html').evaluate(e=>e.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.goto('/?review-controls&reference-styles&reference&rtl');await expect(page.locator('#reference-alert-error .au-icon')).toHaveCSS('color','rgb(236, 34, 31)');
 const row=page.locator('#reference-fields .au-field-row').first();expect(await row.evaluate(e=>getComputedStyle(e).direction)).toBe('rtl');
});
