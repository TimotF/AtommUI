import test from 'node:test';
import assert from 'node:assert/strict';
import { previewMeshes, springStep } from '../dist/three.js';

function topArea(mesh) {
  const p = mesh.position, n = mesh.normal, index = mesh.index ?? Array.from({length:p.length / 3}, (_,i)=>i);
  let area = 0;
  for(let i=0;i<index.length;i+=3) {
    const [a,b,c] = [index[i],index[i+1],index[i+2]];
    if([a,b,c].some(x=>n[3*x+2]<.99)) continue;
    area += Math.abs((p[3*b]-p[3*a])*(p[3*c+1]-p[3*a+1])-(p[3*b+1]-p[3*a+1])*(p[3*c]-p[3*a]))/2;
  }
  return area;
}
test('SVGLoader works without a browser and preserves cut holes and engraved counters', () => {
  const path='M0 0H20V10H0Z M8 3V7H12V3Z';
  const meshes=previewMeshes({path,thickness:3,engraving:['M1 1H6V6H1Z M2 2V5H5V2Z']});
  assert.equal(meshes.length,2);
  assert.equal(topArea(meshes[0]),184);
  assert.equal(topArea(meshes[1]),16);
  assert.equal(meshes[1].engraved,true);
  for(const mesh of meshes) {
    assert(mesh.position.every(Number.isFinite));
    for(let i=0;i<mesh.position.length/3;i++) {
      assert.equal(mesh.uv[2*i],mesh.position[3*i]);
      assert.equal(mesh.uv[2*i+1],mesh.position[3*i+1]);
    }
  }
});
test('preview accepts only path data, never HTML, external images or invalid thickness', () => {
  for(const path of ['', 'M0 0NaN', '\"/><image href=\"https://example.org\"/>']) assert.throws(()=>previewMeshes({path,thickness:3}));
  for(const thickness of [NaN,Infinity,0,-1]) assert.throws(()=>previewMeshes({path:'M0 0H10V10Z',thickness}));
});
test('the display spring overshoots once and settles without depending on frame rate', () => {
  const run=step=>{let value=.1,velocity=0,min=0;for(let time=0;time<.8;time+=step){({value,velocity}=springStep(value,velocity,0,step));min=Math.min(min,value);}return {value,velocity,min};};
  for(const result of [run(1/60),run(1/120)]) {
    assert(result.min<0,'one small overshoot'); assert(Math.abs(result.value)<.001); assert(Math.abs(result.velocity)<.005);
  }
});
