import { test, expect } from '@playwright/test';
const errors = new WeakMap<object,string[]>();
test.beforeEach(async({page}) => { const messages:string[] = []; errors.set(page,messages); page.on('pageerror',e=>messages.push(e.message)); page.on('console',m=>{if(m.type()==='error')messages.push(m.text());}); await page.goto('/'); });
test.afterEach(async({page}) => expect(errors.get(page)).toEqual([]));

test('raw decimals, errors, locale and actual Vuetify controls',async({page}) => {
  const input = page.locator('#gallery-number');
  await expect(input).toHaveValue('0,25'); await input.fill('-');
  await expect(input).toHaveValue('-'); await expect(input).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#gallery-action')).toBeDisabled();
  await page.locator('#gallery-language').locator('..').click(); await page.getByRole('option',{name:'English',exact:true}).click();
  await expect(input).toHaveValue('-'); await input.fill('0.35');
  await expect(input).toHaveAttribute('aria-invalid','false'); await input.press('Shift+ArrowUp'); await expect(input).toHaveValue('0.45');
  const alignment=await input.evaluate(el=>{const unit=el.parentElement!.querySelector('.v-text-field__suffix')!.getBoundingClientRect(),value=el.getBoundingClientRect();return {offset:Math.abs(unit.top+unit.height/2-value.top-value.height/2),height:value.height};});
  expect(alignment.height).toBe(28); expect(alignment.offset).toBeLessThanOrEqual(1);
  await page.locator('#gallery-material').locator('..').click(); await page.getByRole('option',{name:'Plywood',exact:true}).click();
  await expect(page.locator('#gallery-material')).toHaveValue('Plywood');
  const slider = page.getByRole('slider',{name:'Preview',exact:true}); await slider.focus(); await slider.press('End'); await expect(slider).toHaveAttribute('aria-valuenow','100'); await slider.press('Home'); await expect(slider).toHaveAttribute('aria-valuenow','0');
  await page.locator('#gallery-checkbox').uncheck(); await expect(page.locator('#gallery-checkbox')).not.toBeChecked();
  await page.locator('#gallery-action').click(); await expect(page.getByText('Action confirmed.',{exact:true})).toBeVisible();
});
test('tooltip supports label hover, focus, touch/click, Escape and escaping text',async({page}) => {
  const help = page.locator('[data-help="gallery-number"]');
  await expect(help.locator('.v-badge__badge')).toHaveText('?');
  await expect(help.locator('.v-badge__badge')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(help.locator('.v-badge__badge')).toHaveCSS('color','rgb(61, 62, 66)');
  await expect(help).toHaveCSS('cursor','help');
  const raised=await help.evaluate(el=>el.getBoundingClientRect().top < el.parentElement!.querySelector('label')!.getBoundingClientRect().top);
  expect(raised).toBe(true);
  await help.hover(); await expect(page.getByRole('tooltip').filter({hasText:'Les valeurs incomplètes'})).toBeVisible();
  const tooltip=page.getByRole('tooltip').filter({hasText:'Les valeurs incomplètes'});
  await expect(help).toHaveAttribute('aria-describedby',await tooltip.getAttribute('id') as string);
  await tooltip.hover(); await page.waitForTimeout(180); await expect(tooltip).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip').filter({hasText:'Les valeurs incomplètes'})).not.toBeVisible();
  await page.mouse.move(700,200); await help.focus(); await expect(page.getByRole('tooltip').filter({hasText:'Les valeurs incomplètes'})).toBeVisible();
  await help.click(); await page.mouse.move(700,200); await expect(page.getByRole('tooltip').filter({hasText:'Les valeurs incomplètes'})).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('tab',{name:'Détails',exact:true}).click();
  await expect(page.locator('.gallery-escaped')).toHaveText('<img src=x onerror=alert(1)>'); await expect(page.locator('.gallery-escaped img')).toHaveCount(0);
});
test('generic example cards are selectable with mouse and keyboard',async({page})=>{
  const first=page.getByTestId('gallery-example-A'),second=page.getByTestId('gallery-example-B'),third=page.getByTestId('gallery-example-C');
  await expect(first).toHaveAttribute('aria-pressed','true');
  await second.click();await expect(second).toHaveAttribute('aria-pressed','true');await expect(first).toHaveAttribute('aria-pressed','false');
  await third.focus();await third.press('Enter');await expect(third).toHaveAttribute('aria-pressed','true');
  const rows=await page.locator('.gallery-examples .au-example-row').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect(),preview=el.querySelector('.au-example-preview')!.getBoundingClientRect(),title=el.querySelector('.au-example-title')!.getBoundingClientRect();return{top:r.top,bottom:r.bottom,previewRight:preview.right,titleLeft:title.left};}));
  expect(rows).toHaveLength(3);expect(rows[0].bottom).toBeLessThanOrEqual(rows[1].top);expect(rows[1].bottom).toBeLessThanOrEqual(rows[2].top);expect(rows.every(row=>row.previewRight<=row.titleLeft)).toBe(true);
});
test('select previews show safe colours and preserve actual option semantics',async({page})=>{
  const field=page.locator('#gallery-material').locator('xpath=ancestor::div[contains(@class,"au-select-control")]');
  await expect(field.locator('.au-option-paint')).toHaveCSS('background-color','rgb(196, 67, 54)');
  await page.locator('#gallery-material').locator('..').click();
  const wood=page.getByRole('option',{name:'Contreplaqué',exact:true});
  await expect(wood.locator('.au-option-paint')).toHaveCSS('background-color','rgb(210, 167, 115)');
  const unavailable=page.getByRole('option',{name:'Indisponible',exact:true});
  await expect(unavailable).toHaveAttribute('aria-disabled','true');await expect(unavailable.locator('.au-option-paint')).toHaveCount(0);
  await wood.click();await expect(page.locator('#gallery-material')).toHaveValue('Contreplaqué');
  await expect(field.locator('.au-option-paint')).toHaveCSS('background-color','rgb(210, 167, 115)');
});
test('the same Vuetify help badge and fields work inside a teleported settings menu',async({page})=>{
  const trigger=page.locator('#gallery-settings-trigger');await trigger.focus();await trigger.press('Enter');
  const menu=page.getByRole('dialog',{name:'Réglages détaillés',exact:true});await expect(menu).toBeVisible();
  const help=menu.locator('[data-help="gallery-overlay-select"]');
  await expect(help.locator('.v-badge__badge')).toHaveText('?');await expect(help).toHaveCSS('border-top-width','0px');await expect(help).toHaveCSS('border-radius','50%');await expect(help).toHaveCSS('cursor','help');
  await expect(menu.locator('#gallery-overlay-number')).toHaveCSS('height','28px');
  await help.focus();const tooltip=page.getByRole('tooltip').filter({hasText:'La même aide fonctionne'});await expect(tooltip).toBeVisible();
  await page.keyboard.press('Escape');await expect(tooltip).not.toBeVisible();
  if(await menu.isVisible()) {await menu.locator('#gallery-overlay-number').focus();await page.keyboard.press('Escape');}
  await expect(menu).not.toBeVisible();await expect(trigger).toBeFocused();
});
test.describe('touch',()=>{
  test.use({hasTouch:true,viewport:{width:600,height:900}});
  test('help badge opens a readable popover by touch and closes on an outside touch',async({page})=>{
    const help=page.locator('[data-help="gallery-number"]');
    await help.tap();const tooltip=page.getByRole('tooltip').filter({hasText:'Les valeurs incomplètes'});
    await expect(tooltip).toBeVisible();
    const bounds=(await tooltip.boundingBox())!;expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(600);
    await page.locator('#gallery-reset').tap();await expect(tooltip).not.toBeVisible();
  });
});
for (const width of [1280,960,885,600]) test(`layout ${width}px and RTL fit the container`,async({page}) => {
  await page.setViewportSize({width,height:900});
  const boxes=await page.locator('.au-rail-lead,.au-stage,.au-rail-parameters').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};}));
  expect(boxes[0].x+boxes[0].width).toBeCloseTo(boxes[1].x,1);expect(boxes[1].x+boxes[1].width).toBeCloseTo(boxes[2].x,1);
  expect(boxes[1].width).toBeGreaterThanOrEqual(260);expect(boxes.every(r=>r.y===0&&r.height===900)).toBe(true);
  await expect(page.locator('#gallery-action')).toHaveCSS('height','32px');
  await expect(page.getByRole('tab',{name:'Aperçu',exact:true})).toHaveCSS('background-color','rgb(41, 42, 45)');
  await expect(page.getByRole('tab',{name:'Aperçu',exact:true})).toHaveCSS('color','rgb(255, 255, 255)');
  for(const rail of ['.au-rail-lead','.au-rail-parameters']) await expect(page.locator(rail)).toHaveCSS('background-color','rgb(246, 246, 247)');
  await expect(page.locator('section.au-card').first()).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('section.au-card').first()).toHaveCSS('border-top-color','rgb(214, 216, 219)');
  const alert=page.locator('.au-rail-lead .au-alert');await expect(alert).toHaveCSS('flex-grow','0');
  expect((await alert.boundingBox())!.height).toBeLessThan(220);
  const titles=await page.locator('.au-card-header .v-btn__content > span').evaluateAll(elements=>elements.map(el=>{
    const range=document.createRange();range.selectNodeContents(el);const text=range.getBoundingClientRect(),header=el.closest('.au-card-header')!.getBoundingClientRect();
    return {left:text.left-header.left,right:header.right-text.right,top:text.top-header.top,bottom:header.bottom-text.bottom};
  }));
  expect(titles.every(title=>title.left>=0&&title.right>=0&&title.top>=0&&title.bottom>=0)).toBe(true);
  await page.screenshot({path:`test-results/gallery-${width}.png`});
  await page.locator('#gallery-direction').locator('..').click(); await page.getByRole('option',{name:'RTL',exact:true}).click();
  await expect(page.locator('.au-root')).toHaveAttribute('dir','rtl');
  const dimensions = await page.evaluate(() => ({viewport:innerWidth,body:document.body.scrollWidth,root:document.querySelector('.au-root')!.scrollWidth}));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport); expect(dimensions.root).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.locator('.au-layout')).toHaveCSS('display','flex');
  const rtl=await page.locator('.au-rail-lead,.au-stage,.au-rail-parameters').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width};}));
  expect(rtl[2].x+rtl[2].width).toBeCloseTo(rtl[1].x,1);expect(rtl[1].x+rtl[1].width).toBeCloseTo(rtl[0].x,1);
  expect(rtl.every(r=>r.y===0)).toBe(true);
  await page.screenshot({path:`test-results/gallery-${width}-rtl.png`});
  await page.locator('#gallery-number').fill(''); await expect(page.locator('#gallery-action')).toBeDisabled();
});
