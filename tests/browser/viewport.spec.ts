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
  await button.focus(); await expect(button).toHaveCSS('outline-color', 'rgb(229, 83, 75)');
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
