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

test('world assemblies fit all bounding corners in wide and narrow viewports',async()=>{
 const {assemblyFrame}=await import('../dist/three.js');const {Box3,Vector3,PerspectiveCamera}=await import('three');
 for(const aspect of [.5,1,2.5])for(const bounds of [new Box3(new Vector3(-120,-90,-35),new Vector3(120,90,35)),new Box3(new Vector3(0,0,0),new Vector3(300,200,260))]){
  const up=new Vector3(0,0,1),f=assemblyFrame(bounds,aspect,35,up,new Vector3(.7,-1,1.1));
  const camera=new PerspectiveCamera(35,aspect,.01,f.distance*40);camera.up.copy(up);camera.position.copy(f.center).addScaledVector(f.direction,f.distance);camera.lookAt(f.center);camera.updateMatrixWorld();
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z<1);}
 }
 assert.throws(()=>assemblyFrame(new Box3(),1,35,new Vector3(0,0,1),new Vector3(0,0,1)));
});
test('owned preview geometry retains holes, indices, groups and physical millimetre coordinates',async()=>{
 const {geometryFromPreview}=await import('../dist/three.js');const data=previewMeshes({path:'M0 0H20V10H0Z M8 3V7H12V3Z',thickness:3})[0],geometry=geometryFromPreview(data);
 assert.deepEqual(geometry.groups,data.groups);assert.deepEqual(geometry.getAttribute('position').array,data.position);geometry.computeBoundingBox();assert.deepEqual(geometry.boundingBox.min.toArray(),[0,0,-1.5]);assert.deepEqual(geometry.boundingBox.max.toArray(),[20,10,1.5]);geometry.dispose();
});
