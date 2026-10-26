import { test, expect, type Page, type Locator } from '@playwright/test';
const failures = new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const errors:string[]=[];failures.set(page,errors);page.on('pageerror',e=>errors.push(e.message));await page.goto('/');});
test.afterEach(async({page})=>expect(failures.get(page)).toEqual([]));
async function start(page:Page,input:Locator) {
  await input.scrollIntoViewIfNeeded(); const bounds=(await input.boundingBox())!;
  const point={x:bounds.x+bounds.width*.4,y:bounds.y+bounds.height/2};
  await page.mouse.move(point.x,point.y);await page.mouse.down();return point;
}
async function drag(page:Page,input:Locator,pixels:number) {const point=await start(page,input);await page.mouse.move(point.x+pixels,point.y,{steps:4});await page.mouse.up();}

test('numeric click edits, small movement stays a click, and scrub increments exact decimals',async({page})=>{
  const input=page.locator('#gallery-number');await input.click();await expect(input).toBeFocused();
  await input.fill('0,1');const point=await start(page,input);await page.mouse.move(point.x+3,point.y);await page.mouse.up();
  await expect(input).toHaveValue('0,1');await expect(input).toBeFocused();
  await drag(page,input,8);await expect(input).toHaveValue('0,11');
  const field=input.locator('xpath=ancestor::div[contains(@class,"au-numeric-control")]').locator('.v-field');
  await expect(field).toHaveCSS('background-color','rgb(255, 255, 255)');await expect(field).toHaveCSS('border-top-width','1px');await expect(field).toHaveCSS('border-radius','6px');
  await expect(input).toHaveCSS('text-align','end');
});
test('scrub rounds halfway between steps equally in both directions',async({page})=>{
  const input=page.locator('#gallery-scrub');
  await input.fill('6');await drag(page,input,12);await expect(input).toHaveValue('6,1');
  await input.fill('6');await drag(page,input,-12);await expect(input).toHaveValue('5,9');
});
test('bounds constrain scrub and keyboard while raw typed drafts remain intact',async({page})=>{
  const input=page.locator('#gallery-scrub');await input.fill('9,9');await drag(page,input,40);await expect(input).toHaveValue('10');
  await input.fill('0,1');await drag(page,input,-40);await expect(input).toHaveValue('0');
  await input.fill('11');await expect(input).toHaveValue('11');await input.press('Shift+ArrowUp');await expect(input).toHaveValue('10');
  for(const draft of ['-', '0,', '']) {await input.fill(draft);await drag(page,input,32);await expect(input).toHaveValue(draft);await input.press('Shift+ArrowUp');await expect(input).toHaveValue(draft);}
  const integer=page.locator('#gallery-integer');await integer.fill('2');await integer.press('Shift+Alt+ArrowUp');await expect(integer).toHaveValue('2');
  await integer.fill('99');await drag(page,integer,24);await expect(integer).toHaveValue('100');
  await integer.fill('2.5');await drag(page,integer,24);await expect(integer).toHaveValue('2.5');
});
test('dragging a selected numeric value adjusts instead of starting a text transfer',async({page})=>{
  const input=page.locator('#gallery-scrub');await input.fill('6,05');await input.press('ControlOrMeta+A');
  const bounds=(await input.boundingBox())!,point={x:bounds.x+bounds.width-12,y:bounds.y+bounds.height/2};
  await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+8,point.y,{steps:8});await page.mouse.up();
  await expect(input).toHaveValue('6,1');
});
test('Escape restores the exact initial draft and capture loss cancels the gesture',async({page})=>{
  const input=page.locator('#gallery-scrub');await input.fill('6,050');let point=await start(page,input);
  await page.mouse.move(point.x+16,point.y,{steps:4});await expect(input).toHaveValue('6,15');
  await page.keyboard.press('Escape');await expect(input).toHaveValue('6,050');await page.mouse.move(point.x+32,point.y);await page.mouse.up();await expect(input).toHaveValue('6,050');
  await input.evaluate(el=>el.addEventListener('pointerdown',event=>{el.setAttribute('data-test-pointer',String((event as PointerEvent).pointerId));},{once:true}));
  point=await start(page,input);await page.mouse.move(point.x+16,point.y,{steps:4});await expect(input).toHaveValue('6,15');
  const captured=await input.evaluate(el=>el.hasPointerCapture(Number(el.getAttribute('data-test-pointer'))));expect(captured).toBe(true);
  await input.evaluate(el=>el.releasePointerCapture(Number(el.getAttribute('data-test-pointer'))));await page.mouse.move(point.x+17,point.y);await expect(input).toHaveValue('6,050');await page.mouse.up();
});
test('readonly, disabled and typing-only fields do not scrub, and modifiers keep decimal precision',async({page})=>{
  for(const [id,value] of [['gallery-readonly','4'],['gallery-disabled','5'],['gallery-no-drag','3']]) {const input=page.locator(`#${id}`);await drag(page,input,32);await expect(input).toHaveValue(value);}
  await page.locator('#gallery-readonly').press('Shift+ArrowUp');await expect(page.locator('#gallery-readonly')).toHaveValue('4');
  const input=page.locator('#gallery-scrub');await input.fill('0,1');await input.press('Shift+ArrowUp');await expect(input).toHaveValue('0,6');
  await input.press('Shift+Alt+ArrowDown');await expect(input).toHaveValue('0,595');
  await page.keyboard.down('Alt');await drag(page,input,8);await page.keyboard.up('Alt');await expect(input).toHaveValue('0,6');
});
test('external model updates and unmount stop captured scrubs without overwriting new state',async({page})=>{
  const input=page.locator('#gallery-scrub');let point=await start(page,input);await page.mouse.move(point.x+8,point.y);await expect(input).toHaveValue('6,1');
  await page.locator('#gallery-scrub-reset').focus();await page.keyboard.press('Enter');await expect(input).toHaveValue('2,5');await page.mouse.move(point.x+40,point.y);await page.mouse.up();await expect(input).toHaveValue('2,5');
  point=await start(page,input);await page.mouse.move(point.x+16,point.y);await expect(input).toHaveValue('2,6');
  await page.locator('#gallery-show-scrub').focus();await page.keyboard.press('Space');await expect(input).toHaveCount(0);
  await page.mouse.move(point.x+48,point.y);await page.mouse.up();await expect(page.locator('#gallery-scrub-value')).toHaveText('2,6');
});
test('segmented choices use a single button tab stop, skip disabled choices and follow RTL',async({page})=>{
  const group=page.getByRole('group',{name:'Densité',exact:true}),gap=group.getByRole('button',{name:'Écart',exact:true}),count=group.getByRole('button',{name:'Nombre',exact:true});
  await expect(gap).toHaveAttribute('aria-pressed','true');await expect(group.getByRole('button',{name:'Indisponible',exact:true})).toBeDisabled();
  await gap.focus();await gap.press('ArrowRight');await expect(count).toHaveAttribute('aria-pressed','true');await expect(count).toBeFocused();
  await count.press('Home');await expect(gap).toBeFocused();await gap.press('End');await expect(count).toBeFocused();
  const stops=await group.getByRole('button').evaluateAll(elements=>elements.filter(el=>el.getAttribute('tabindex')==='0').length);expect(stops).toBe(1);
  await page.locator('#gallery-direction').click();await page.getByRole('option',{name:'RTL',exact:true}).click();
  await count.focus();await count.press('ArrowRight');await expect(gap).toHaveAttribute('aria-pressed','true');
});
test('large example previews fit their cards and reduced motion removes hover transitions',async({page})=>{
  const rows=page.locator('.gallery-examples .au-example-preview');
  const heights=await rows.evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().height));expect(heights.every(height=>height>=70)).toBe(true);
  const card=page.getByTestId('gallery-example-B');await card.hover();await expect(card).toHaveCSS('transform','none');await expect(card.locator('.au-example-preview svg')).not.toHaveCSS('transform','none');
  await page.emulateMedia({reducedMotion:'reduce'});await expect(card).toHaveCSS('transition-duration','0s');await expect(card.locator('.au-example-preview')).toHaveCSS('transition-duration','0s');
  const heading=page.locator('#gallery-scrub-contract-title.au-card-heading');
  await expect(heading).toHaveCSS('margin-top','0px');await expect(heading).toHaveCSS('margin-bottom','0px');await expect(heading).toHaveCSS('border-bottom-width','0px');await expect(heading).toHaveCSS('text-transform','none');
});

test.describe('native touch gestures',()=>{
  test.use({hasTouch:true,viewport:{width:600,height:900}});
  test('vertical movement scrolls the panel while horizontal movement scrubs and touchCancel restores',async({page})=>{
    const input=page.locator('#gallery-scrub');await input.scrollIntoViewIfNeeded();
    const panel=page.locator('.au-rail-parameters .gallery-rail-content');
    await panel.evaluate(el=>el.scrollTop=150);await input.scrollIntoViewIfNeeded();
    const bounds=(await input.boundingBox())!,point={x:bounds.x+bounds.width*.4,y:bounds.y+bounds.height/2};
    const session=await page.context().newCDPSession(page),touch=(x:number,y:number)=>[{x,y,radiusX:4,radiusY:4,force:1,id:1}];
    const before=await panel.evaluate(el=>el.scrollTop);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touch(point.x,point.y)});
    for(const delta of [12,24,36,48,60]) await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touch(point.x,point.y-delta)});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect(input).toHaveValue('6,05');await expect.poll(()=>panel.evaluate(el=>el.scrollTop)).toBeGreaterThan(before);
    await input.scrollIntoViewIfNeeded();const next=(await input.boundingBox())!,x=next.x+next.width*.4,y=next.y+next.height/2;
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touch(x,y)});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touch(x+16,y)});await expect(input).toHaveValue('6,15');
    await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await expect(input).toHaveValue('6,05');await session.detach();
  });
});
