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
  await expect(dialog.locator('.v-overlay__content')).toBeFocused();
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


test('canvas actions use the official shell without changing ordinary buttons',async({page})=>{
  await page.goto('/?review-controls');
  const button=page.locator('#review-canvas-action');
  await expect(button).toHaveCSS('width','32px');await expect(button).toHaveCSS('height','32px');
  await expect(button).toHaveCSS('border-radius','8px');await expect(button).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('#review-move-zoom')).toHaveCSS('border-radius','6px');
  await expect(page.locator('#review-canvas-label')).toHaveClass(/v-btn--variant-outlined/);
  await expect(page.locator('#review-canvas-label')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('#review-canvas-label .v-btn__underlay')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await button.focus();await button.press('Space');await expect(button).toHaveAttribute('aria-pressed','true');
  await button.press('Enter');await expect(button).toHaveAttribute('aria-pressed','false');
});

test('stacked canvas controls keep two rows, events and accessible fit at narrow widths', async ({page})=>{
  await page.goto('/?review-controls&stacked');
  const tools=page.locator('#review-scene-controls');
  for(const [width,dir] of [[1280,'ltr'],[960,'ltr'],[960,'rtl']] as const) {
    await page.setViewportSize({width,height:853});
    await page.locator('html').evaluate((element,direction)=>element.setAttribute('dir',direction),dir);
    const [slider,zoom,action,stage]=await Promise.all([tools.locator('.au-scene-explode').boundingBox(),tools.locator('.au-zoom-controls').boundingBox(),page.locator('#review-canvas-action').boundingBox(),page.locator('.au-stage').boundingBox()]);
    expect(slider!.y+slider!.height).toBeLessThanOrEqual(zoom!.y);
    expect(action!.y).toBe(zoom!.y);
    expect(zoom!.x).toBeGreaterThanOrEqual(stage!.x);
    expect(zoom!.x+zoom!.width).toBeLessThanOrEqual(stage!.x+stage!.width);
    const buttons=tools.locator('.au-zoom-controls > .au-button');
    for(const button of await buttons.all()) {
      await expect(button).toHaveCSS('background-color','rgb(255, 255, 255)');
      await expect(button).toHaveCSS('border-radius','8px');
      await expect(button).toHaveClass(/v-btn--variant-outlined/);
    }
  }
  await page.locator('html').evaluate(element=>element.setAttribute('dir','ltr'));
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await expect(tools.locator('.au-zoom-value')).toHaveText('114 %');
  await tools.locator('.au-zoom-value').click();
  await page.getByRole('button',{name:'150 %',exact:true}).click();
  const fit=tools.getByRole('button',{name:'Fit',exact:true});
  await expect(fit).toHaveText('');
  await fit.hover();await expect(page.getByRole('tooltip')).toContainText('Fit');
  await fit.focus();await fit.press('F1');await expect(page.getByRole('tooltip')).toContainText('Fit');
  await fit.press('Enter');await expect(tools.locator('.au-zoom-value')).toHaveText('100 %');
  await page.keyboard.press('Escape');
  const slider=tools.getByRole('slider');
  await slider.focus();await slider.press('ArrowRight');await expect(slider).toHaveAttribute('aria-valuenow','21');
  await page.locator('#review-disable').click();
  await expect(fit).toBeDisabled();await expect(tools.getByRole('button',{name:'Zoom in',exact:true})).toBeDisabled();
  await expect(slider).toBeDisabled();
});


test('two or three preview tabs fit their visible labels without an empty trailing segment',async({page})=>{
 for(const count of [2,3]) {
  await page.goto('/?review-controls&tabs='+count);
  for(const width of [1280,1135,960]) for(const direction of ['ltr','rtl']) {
   await page.setViewportSize({width,height:853});
   await page.locator('html').evaluate((element,dir)=>element.setAttribute('dir',dir),direction);
   const group=page.locator('#review-tabs');
   const [track,first,last]=await Promise.all([group.boundingBox(),group.locator('.v-tab').first().boundingBox(),group.locator('.v-tab').last().boundingBox()]);
   const start=direction==='rtl'?track!.x+track!.width-first!.x-first!.width:first!.x-track!.x;
   const end=direction==='rtl'?last!.x-track!.x:track!.x+track!.width-last!.x-last!.width;
   expect(start).toBeGreaterThanOrEqual(1);expect(start).toBeLessThanOrEqual(3);
   expect(end).toBeGreaterThanOrEqual(1);expect(end).toBeLessThanOrEqual(3);
  }
  const tabs=page.locator('#review-tabs .v-tab');
  await tabs.last().click();await expect(tabs.last()).toHaveAttribute('aria-selected','true');
  await tabs.first().focus();await tabs.first().press('Enter');await expect(tabs.first()).toHaveAttribute('aria-selected','true');
 }
});


test('preview segmented choices keep SVG on one line without changing parameter wrapping',async({page})=>{
  await page.goto('/?review-controls&tabs=2&segmented');
  const group=page.locator('#review-tabs'),svg=group.getByRole('button',{name:'SVG',exact:true}),three=group.getByRole('button',{name:'3D',exact:true});
  for(const width of [390,960,1135,1456])for(const direction of ['ltr','rtl']){
    await page.setViewportSize({width,height:853});
    await page.locator('html').evaluate((el,dir)=>el.setAttribute('dir',dir),direction);
    const content=await group.locator('.v-btn__content').evaluateAll(elements=>elements.map(el=>{
      const c=getComputedStyle(el),r=el.getBoundingClientRect();return {height:r.height,lineHeight:parseFloat(c.lineHeight),scroll:el.scrollWidth,width:r.width};
    }));
    for(const label of content){expect(label.height).toBeLessThanOrEqual(label.lineHeight+1);expect(label.scroll).toBeLessThanOrEqual(label.width+1);}
    const bounds=await group.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);
    const [first,last]=await Promise.all([three.boundingBox(),svg.boundingBox()]);
    const start=direction==='rtl'?bounds!.x+bounds!.width-first!.x-first!.width:first!.x-bounds!.x;
    const end=direction==='rtl'?last!.x-bounds!.x:bounds!.x+bounds!.width-last!.x-last!.width;
    expect(start).toBeCloseTo(2,0);expect(end).toBeCloseTo(2,0);
  }
  await svg.click();await expect(svg).toHaveAttribute('aria-pressed','true');
  await three.focus();await three.press('Enter');await expect(three).toHaveAttribute('aria-pressed','true');
  const parameters=page.locator('#review-parameter-choices');
  await expect(parameters.locator('.v-btn__content').first()).toHaveCSS('white-space','normal');
  await expect(parameters.locator('.v-btn__content').first()).toHaveCSS('overflow-wrap','anywhere');
  const buttons=await parameters.locator('button').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().width));
  expect(buttons[0]).toBeCloseTo(buttons[1],1);
});


test('shared action menus use compact rows, skip disabled actions and close on selection',async({page})=>{
 await page.goto('/?review-controls&actions');await page.locator('#review-actions-trigger').click();
 const menu=page.getByRole('menu',{name:'Actions',exact:true});await expect(menu).toBeVisible();
 const rows=await menu.getByRole('menuitem').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));expect(rows).toEqual([32,32,32]);
 await expect(menu.getByRole('menuitem',{name:'Unavailable'})).toBeDisabled();
 await menu.getByRole('menuitem',{name:'X +90°'}).click();await expect(menu).toBeHidden();await expect(page.locator('#review-action-result')).toHaveText('rotate');
 await page.locator('#review-actions-trigger').click();await expect(menu).toBeVisible();await page.keyboard.press('Escape');await expect(menu).toBeHidden();
 const help=page.getByRole('button',{name:'Help: fit correction',exact:true}),rect=await help.boundingBox();expect(rect!.width).toBeGreaterThanOrEqual(24);expect(rect!.height).toBeGreaterThanOrEqual(24);
 await help.focus();await expect(page.getByRole('tooltip')).toContainText('Measure the actual thickness.');await page.keyboard.press('Escape');
});
