import {test,expect} from '@playwright/test';
test('opt-in text rows fit the parameter rail, preserve values and keep stacked defaults',async({page})=>{
 for(const width of [1280,960,390]){
  await page.setViewportSize({width,height:900});await page.goto('/?review-controls&text-row');
  const input=page.locator('#review-text-row'), label=page.locator('#review-text-row-label');
  await expect(input).toHaveValue('Éléonore François · atelier-orbe.example');
  const boxes=await Promise.all([label.boundingBox(),input.boundingBox()]);
  expect(boxes[0]!.x+boxes[0]!.width).toBeLessThanOrEqual(boxes[1]!.x);
  await expect(input).toHaveCSS('height','28px');
  expect(await page.locator('html').evaluate(e=>e.scrollWidth<=innerWidth)).toBe(true);
  const stacked=await Promise.all([page.locator('#review-text-stacked-label').boundingBox(),page.locator('#review-text-stacked').boundingBox()]);
  expect(stacked[0]!.y+stacked[0]!.height).toBeLessThan(stacked[1]!.y);
  await input.fill('');await expect(input).toHaveValue('');await input.fill('Renée & Atelier · '+ 'long '.repeat(30));
  await expect(page.locator('#review-text-readonly')).toHaveValue('Renée & Atelier · '+ 'long '.repeat(30));
  await expect(page.locator('#review-text-readonly')).toHaveAttribute('readonly','');await expect(page.locator('#review-text-disabled')).toBeDisabled();
  await expect(input).toHaveAttribute('aria-describedby','review-text-row-error');
  await page.getByRole('button',{name:'Help: activity',exact:true}).click();await expect(page.getByText('Keep the complete text.',{exact:true})).toBeVisible();await page.keyboard.press('Escape');
 }
 await page.goto('/?review-controls&text-row&rtl');
 const label=await page.locator('#review-text-row-label').boundingBox(),input=await page.locator('#review-text-row').boundingBox();expect(input!.x+input!.width).toBeLessThanOrEqual(label!.x);
});
