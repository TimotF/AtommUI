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
for (const width of [1280,960,600]) test(`layout ${width}px and RTL fit the container`,async({page}) => {
  await page.setViewportSize({width,height:900});
  await page.locator('#gallery-direction').locator('..').click(); await page.getByRole('option',{name:'RTL',exact:true}).click();
  await expect(page.locator('.au-root')).toHaveAttribute('dir','rtl');
  const dimensions = await page.evaluate(() => ({viewport:innerWidth,body:document.body.scrollWidth,root:document.querySelector('.au-root')!.scrollWidth}));
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport); expect(dimensions.root).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.locator('.au-layout')).toHaveCSS('display',width===1280?'flex':'grid');
  await expect(page.locator('.au-rail-parameters')).toHaveCSS('width',width===1280?'320px':width===960?'480px':'600px');
  await page.locator('#gallery-number').fill(''); await expect(page.locator('#gallery-action')).toBeDisabled();
});
