import { test, expect } from '@playwright/test';

test('wood thumbnails decode embedded photographs and keep material selection semantics', async ({ page }) => {
 await page.goto('/?harmonisation');
 const images=page.locator('.au-material-thumbnail image');
 await expect(images).toHaveCount(2);
 const photos=await images.evaluateAll(async elements=>Promise.all(elements.map(async el=>{
  const url=el.getAttribute('href')!;
  const image=new Image();image.src=url;await image.decode();
  return {embedded:url.startsWith('data:image/jpeg;base64,'),width:image.naturalWidth,height:image.naturalHeight,url};
 })));
 expect(photos.every(photo=>photo.embedded&&photo.width===1024&&photo.height===1024)).toBe(true);
 expect(photos[0].url).not.toBe(photos[1].url);
 const walnut=page.getByRole('button',{name:'Noyer noir',exact:true});
 await walnut.click();await expect(walnut).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Couleur unie',exact:true}).click();
 await expect(page.locator('#demo-color')).toBeVisible();
});
