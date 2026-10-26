import { test, expect, type Locator } from '@playwright/test';

const viewBox = (viewport: Locator) => viewport.locator('.au-svg-viewport-pieces').evaluate(el => el.getAttribute('viewBox')!.split(' ').map(Number));
async function wheel(viewport: Locator, deltaY: number, ctrlKey = false, deltaMode = 0) {
  return viewport.evaluate((el, args) => {
    const rect = el.getBoundingClientRect();
    const event = new WheelEvent('wheel', { ...args, bubbles: true, cancelable: true, clientX: Math.round(rect.left + rect.width * .7), clientY: Math.round(rect.top + rect.height * .4) });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  }, { deltaY, ctrlKey, deltaMode });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?harmonisation');
  await page.getByRole('tab', { name: 'SVG', exact: true }).click();
  await expect(page.locator('.au-svg-viewport')).toBeVisible();
});

test('trackpad pinch matches a tenfold wheel delta and preserves the pointer anchor', async ({ page }) => {
  const viewport = page.locator('.au-svg-viewport');
  const before = await viewBox(viewport);
  expect(await wheel(viewport, -2, true)).toBe(true);
  const pinched = await viewBox(viewport);
  // Zoom remains centred on the same world coordinate beneath the pointer.
  const anchor = await viewport.evaluate(el => {
    const r = el.getBoundingClientRect(), plot = el.querySelector('.au-svg-viewport-pieces')!.getBoundingClientRect();
    return [(Math.round(r.left + r.width * .7) - r.left - 40) / plot.width, (Math.round(r.top + r.height * .4) - r.top - 24) / plot.height];
  });
  for (let axis = 0; axis < 2; axis++) expect(pinched[axis] + pinched[axis + 2] * anchor[axis]).toBeCloseTo(before[axis] + before[axis + 2] * anchor[axis], 6);
  expect(before[2] / pinched[2]).toBeCloseTo(Math.exp(.03), 8);
  await wheel(viewport, 2, true);
  const reversed = await viewBox(viewport);
  reversed.forEach((value, index) => expect(value).toBeCloseTo(before[index], 7));
  await wheel(viewport, -20);
  const scrolled = await viewBox(viewport);
  scrolled.forEach((value, index) => expect(value).toBeCloseTo(pinched[index], 7));
});

test('ordinary wheel speed, delta units, zoom limits and keyboard controls are preserved', async ({ page }) => {
  const viewport = page.locator('.au-svg-viewport');
  const before = await viewBox(viewport);
  await wheel(viewport, -100);
  expect(before[2] / (await viewBox(viewport))[2]).toBeCloseTo(Math.exp(.15), 8);
  await viewport.press('0');
  await wheel(viewport, -1, false, 1);
  expect(before[2] / (await viewBox(viewport))[2]).toBeCloseTo(Math.exp(.024), 8);
  await viewport.press('0');
  await wheel(viewport, -1, false, 2);
  const height = await viewport.evaluate(el => el.getBoundingClientRect().height - 24);
  expect(before[2] / (await viewBox(viewport))[2]).toBeCloseTo(Math.exp(Math.min(500, height) * .0015), 8);
  await viewport.press('0');
  for (let i = 0; i < 10; i++) await wheel(viewport, -1e6, true);
  expect(before[2] / (await viewBox(viewport))[2]).toBeCloseTo(40, 7);
  for (let i = 0; i < 15; i++) await wheel(viewport, 1e6, true);
  expect(before[2] / (await viewBox(viewport))[2]).toBeCloseTo(.1, 7);
  await viewport.press('0'); await viewport.press('+');
  expect((await viewBox(viewport))[2]).toBeLessThan(before[2]);
  await viewport.press('0'); await viewport.press('ArrowRight');
  expect((await viewBox(viewport))[0]).toBeGreaterThan(before[0]);
  await viewport.press('0');
  (await viewBox(viewport)).forEach((value, index) => expect(value).toBeCloseTo(before[index], 7));
});

test('preview keyboard focus uses a faint shadow without an outline while button focus keeps its accent', async ({ page }) => {
  const viewport = page.locator('.au-svg-viewport');
  await page.keyboard.press('Tab'); await viewport.focus();
  expect(await viewport.evaluate(el => el.matches(':focus-visible'))).toBe(true);
  await expect(viewport).toHaveCSS('outline-style', 'none');
  const shadow = await viewport.evaluate(el => {
    const style = getComputedStyle(el, '::after');
    return { shadow: style.boxShadow, pointerEvents: style.pointerEvents, zIndex: style.zIndex };
  });
  expect(shadow.shadow).toBe('rgba(23, 23, 25, 0.04) 0px 0px 8px 0px inset');
  expect(shadow.pointerEvents).toBe('none'); expect(shadow.zIndex).toBe('1');
  const button = page.locator('#demo-guide');
  await page.keyboard.press('Tab'); await button.focus(); await expect(button).toBeFocused();
  await expect(button).toHaveCSS('outline-style','solid');
  await expect(button).toHaveCSS('outline-width','2px');
});

test('drag cancellation restores the view after pinch zoom', async ({ page }) => {
  const viewport = page.locator('.au-svg-viewport');
  await wheel(viewport, -4, true);
  const before = await viewBox(viewport), rect = (await viewport.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2 + 60, rect.y + rect.height / 2 + 40);
  expect((await viewBox(viewport))[0]).not.toBe(before[0]);
  await page.keyboard.press('Escape'); await page.mouse.up();
  (await viewBox(viewport)).forEach((value, index) => expect(value).toBeCloseTo(before[index], 7));
});


test('two native touch points zoom about their midpoint and release without a jump',async({page})=>{
 const viewport=page.locator('.au-svg-viewport'),box=(await viewport.boundingBox())!,before=await viewBox(viewport);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 const x=box.x+box.width*.55,y=box.y+box.height*.5;
 const touch=(distance:number)=>[{x:x-distance/2,y,id:1},{x:x+distance/2,y,id:2}];
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touch(80)});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touch(120)});
 await expect.poll(async()=>before[2]/(await viewBox(viewport))[2]).toBeCloseTo(1.5,1);
 const enlarged=await viewBox(viewport),plot=await viewport.locator('.au-svg-viewport-pieces').boundingBox();
 const ax=(x-plot!.x)/plot!.width,ay=(y-plot!.y)/plot!.height;
 expect(enlarged[0]+enlarged[2]*ax).toBeCloseTo(before[0]+before[2]*ax,2);
 expect(enlarged[1]+enlarged[3]*ay).toBeCloseTo(before[1]+before[3]*ay,2);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[touch(120)[0]]});
 const released=await viewBox(viewport);released.forEach((v,i)=>expect(v).toBeCloseTo(enlarged[i],6));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await cdp.detach();
});

test('frameBounds fits a physical region without altering the SVG geometry',async({page})=>{
 const viewport=page.locator('.au-svg-viewport'),original=await viewport.locator('.au-svg-content path').getAttribute('d');
 await page.locator('#demo-frame-region').click();const box=await viewBox(viewport);
 expect(box[0]+box[2]/2).toBeCloseTo(35,6);expect(box[1]+box[3]/2).toBeCloseTo(20,6);
 expect(box[0]).toBeLessThan(20);expect(box[0]+box[2]).toBeGreaterThan(50);
 expect(box[1]).toBeLessThan(10);expect(box[1]+box[3]).toBeGreaterThan(30);
 expect(await viewport.locator('.au-svg-content path').getAttribute('d')).toBe(original);
});
