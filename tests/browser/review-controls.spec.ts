import { test, expect } from '@playwright/test';
test('Tips capsule opens a framed, scrollable dialog and restores focus', async ({page})=>{
  await page.setViewportSize({width:1280,height:550});
  await page.goto('/?review-controls');
  const trigger=page.locator('#review-tips');
  await expect(trigger).toHaveCSS('height','32px');
  await expect(trigger).toHaveCSS('border-radius','999px');
  await expect(trigger).toHaveCSS('background-color','rgb(255, 255, 255)');
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Fabrication Tips'});
  await expect(dialog).toBeVisible();
  const header=dialog.locator('.au-dialog-header'),footer=dialog.locator('.au-dialog-actions'),body=dialog.locator('.au-dialog-body');
  const before=[await header.boundingBox(),await footer.boundingBox()];
  await body.evaluate(element=>element.scrollTop=element.scrollHeight);
  expect((await header.boundingBox())!.y).toBe(before[0]!.y);
  expect((await footer.boundingBox())!.y).toBe(before[1]!.y);
  await expect(page.getByRole('button',{name:'Close tips',exact:true})).toBeInViewport();
  await page.getByRole('button',{name:'Close tips',exact:true}).click();
  await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
  await trigger.press('Enter');await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
});

test('detached zoom keeps its state and events when moved back inline',async({page})=>{
  await page.goto('/?review-controls');
  await expect(page.locator('#review-zoom-dock .au-zoom-controls')).toHaveCount(1);
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await expect(page.locator('.au-zoom-value')).toHaveText('114 %');
  await page.locator('#review-move-zoom').click();
  await expect(page.locator('#review-scene-controls .au-zoom-controls')).toHaveCount(1);
  await expect(page.locator('.au-zoom-value')).toHaveText('114 %');
  await page.locator('.au-zoom-value').click();await page.getByRole('button',{name:'150 %',exact:true}).click();
  await expect(page.locator('.au-zoom-value')).toHaveText('150 %');
  await page.locator('#review-collapse').click();await expect(page.locator('#review-expand')).toBeFocused();
  await page.locator('#review-expand').click();await expect(page.locator('#review-collapse')).toBeFocused();
  await expect(page.locator('#review-header-action')).toBeVisible();
});

test('touch close actions have 44px hit areas',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:600},hasTouch:true});
  const page=await context.newPage();await page.goto('/?review-controls');
  for(const selector of ['.au-onboarding-card > header button']) {
    const box=await page.locator(selector).boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator('#review-tips').click();
  const close=page.getByRole('button',{name:'Close tips',exact:true});const box=await close.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
  await close.click();await context.close();
});
