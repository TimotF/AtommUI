import {test,expect} from '@playwright/test';
const url='/tests/fixtures/review.html';
const data=async(page:any)=>JSON.parse(await page.locator('.stage-host').getAttribute('data-preview-diagnostics'));
const sameCamera=(actual:number[],expected:number[])=>actual.forEach((value,i)=>expect(value).toBeCloseTo(expected[i],10));

test('reduced-motion rendering sleeps and wakes for camera, material, content and explicit changes',async({page})=>{
 test.setTimeout(45000);
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'?three');
 await expect.poll(async()=>(await data(page))?.renders).toBeGreaterThan(0);await page.waitForTimeout(1300);const first=await data(page);
 await page.waitForTimeout(1300);expect((await data(page)).renders).toBe(first.renders);
 for(const code of ['s.zoom(.88)','s.setAppearance({material:"solid",color:"#993333"})','s.invalidate()']){
  const before=await data(page);await page.evaluate(code=>{const s=(window as any).reviewStage;new Function('s',code)(s);},code);
  await expect.poll(async()=>(await data(page)).renders).toBeGreaterThan(before.renders);
 }
 const position=await page.locator('.stage-host').boundingBox(),beforeDrag=await data(page);
 await page.mouse.move(position!.x+position!.width/2,position!.y+position!.height/2);await page.mouse.down();await page.mouse.move(position!.x+position!.width/2+40,position!.y+position!.height/2+15);await page.mouse.up();
 await expect.poll(async()=>(await data(page)).renders).toBeGreaterThan(beforeDrag.renders);
 const camera=(await data(page)).camera;expect(camera).not.toEqual(beforeDrag.camera);
 await page.evaluate(()=>(window as any).reviewStage.setAppearance({material:'walnut',color:'#ffffff'}));
 await page.waitForTimeout(1600);const wood=await data(page);sameCamera(wood.camera,camera);await page.waitForTimeout(1300);expect((await data(page)).renders).toBe(wood.renders);
 await page.evaluate(()=>(window as any).reviewStage.setActive(false));await page.waitForTimeout(1100);const inactive=await data(page);await page.evaluate(()=>(window as any).reviewStage.setAppearance({material:'solid',color:'#224466'}));await page.waitForTimeout(1100);expect((await data(page)).renders).toBe(inactive.renders);
 await page.evaluate(()=>(window as any).reviewStage.setActive(true));await expect.poll(async()=>(await data(page)).renders).toBeGreaterThan(inactive.renders);
 await page.locator('.stage-host').evaluate(e=>{e.style.display='none';});await page.waitForTimeout(1100);const zero=await data(page);await page.waitForTimeout(1100);expect((await data(page)).renders).toBe(zero.renders);
 await page.locator('.stage-host').evaluate(e=>{e.style.display='';});await expect.poll(async()=>(await data(page)).renders).toBeGreaterThan(zero.renders);sameCamera((await data(page)).camera,camera);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(1100);const animated=await data(page);await page.waitForTimeout(1100);expect((await data(page)).renders).toBeGreaterThan(animated.renders+10);
 await page.evaluate(()=>(window as any).reviewStage.dispose());await expect(page.locator('.stage-host canvas')).toHaveCount(0);await expect(page.locator('.stage-host')).not.toHaveAttribute('data-preview-diagnostics');
});

test('animated extensions keep their previous contract; static extensions request frames explicitly',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'?three');await expect.poll(async()=>(await data(page))?.renders).toBeGreaterThan(0);
 await page.evaluate(()=>{(window as any).removeExtension=(window as any).reviewStage.installExtension(()=>({beforeRender(){},dispose(){}}));});
 await page.waitForTimeout(1100);const moving=await data(page);await page.waitForTimeout(1100);expect((await data(page)).renders).toBeGreaterThan(moving.renders+10);
 await page.evaluate(()=>{(window as any).removeExtension();(window as any).removeExtension=(window as any).reviewStage.installExtension((context:any)=>{(window as any).invalidate=context.invalidate;return{continuous:false,beforeRender(){},dispose(){}};});});
 await page.waitForTimeout(1100);const staticTool=await data(page);await page.waitForTimeout(1100);expect((await data(page)).renders).toBe(staticTool.renders);
 await page.evaluate(()=>(window as any).invalidate());await expect.poll(async()=>(await data(page)).renders).toBeGreaterThan(staticTool.renders);
});

for(const lead of [true,false])for(const rtl of [false,true])test(`standard layout is canvas-first in a narrow container, lead=${lead}, rtl=${rtl}`,async({page})=>{
 for(const width of [390,760,960,1280]){
  await page.goto(url+`?width=${width}${lead?'':'&no-lead'}${rtl?'&rtl':''}`);await expect(page.locator('#fixture-title')).toBeVisible();
  const geometry=await page.evaluate(()=>{const root=document.querySelector('.host')!,stage=document.querySelector('.au-stage')!,header=document.querySelector('.au-parameters-header')!,lead=document.querySelector('.au-rail-lead')!,rail=document.querySelector('.au-rail-parameters')!,footer=document.querySelector('.au-parameters-footer')!;return{root:root.getBoundingClientRect().toJSON(),stage:stage.getBoundingClientRect().toJSON(),lead:lead.getBoundingClientRect().toJSON(),header:header.getBoundingClientRect().toJSON(),rail:rail.getBoundingClientRect().toJSON(),footer:footer.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth};});
  expect(geometry.overflow).toBe(false);
  if(width<960){expect(geometry.stage.y).toBe(geometry.root.y);expect(geometry.header.y).toBeGreaterThanOrEqual(geometry.stage.bottom);if(lead)expect(geometry.lead.y).toBeGreaterThanOrEqual(geometry.stage.bottom);await expect(page.getByRole('button',{name:'Export',exact:true})).toBeInViewport();}
  else expect(geometry.rail.width).toBe(320);
 }
});

test('legacy layout does not opt into the new ordering',async({page})=>{
 await page.goto(url+'?width=760&legacy');await expect(page.locator('.au-layout')).not.toHaveClass(/au-layout-standard/);await expect(page.locator('.au-stage')).toHaveCSS('order','0');
});


test('official compact controls retain dimensions, visible selection and native keyboard choice',async({page})=>{
 await page.goto(url);
 const button=page.getByRole('button',{name:'Export',exact:true}),footer=page.locator('.au-parameters-footer');
 expect((await button.boundingBox())!.width).toBeCloseTo((await footer.boundingBox())!.width-32,1);
 await expect(button).toHaveCSS('height','32px');await expect(button).toHaveCSS('background-color','rgb(41, 42, 45)');
 await expect(page.locator('.v-switch__track')).toHaveCSS('width','36px');await expect(page.locator('.v-switch__track')).toHaveCSS('height','20px');
 await expect(page.locator('.v-switch__thumb')).toHaveCSS('width','14px');
 await page.getByRole('combobox',{name:'Native theme'}).selectOption('theatre');
 await page.locator('#numeric').press('Shift+ArrowUp');await expect(page.locator('#fixture-values')).toHaveText('theatre|12.5|true');
 await page.locator('#fixture-title').click();await expect(page.locator('#fixture')).not.toBeVisible();
 await page.locator('#fixture-title').click();await expect(page.locator('#fixture')).toBeVisible();
});
