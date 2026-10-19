import {Box3,Vector3,MathUtils} from 'three';
/** Perspective framing of consumer-owned world-space content, without modifying the model. */
export function assemblyFrame(bounds:Box3,aspect:number,fov:number,up:Vector3,direction:Vector3){
 const radius=bounds.getSize(new Vector3()).length()/2;
 if(bounds.isEmpty()||![...bounds.min.toArray(),...bounds.max.toArray(),aspect,fov,radius].every(Number.isFinite)||radius<=0||aspect<=0||fov<=0||fov>=180)throw new Error('Invalid assembly bounds');
 const forward=direction.clone().normalize(),right=up.clone().cross(forward).normalize(),vertical=forward.clone().cross(right);
 if(right.lengthSq()<.99||forward.lengthSq()<.99)throw new Error('Invalid assembly orientation');
 const center=bounds.getCenter(new Vector3()),tanY=Math.tan(MathUtils.degToRad(fov)/2),tanX=tanY*aspect;
 const corners=[bounds.min.x,bounds.max.x].flatMap(x=>[bounds.min.y,bounds.max.y].flatMap(y=>[bounds.min.z,bounds.max.z].map(z=>new Vector3(x,y,z).sub(center))));
 const distance=Math.max(...corners.map(p=>p.dot(forward)+Math.max(Math.abs(p.dot(right))/tanX,Math.abs(p.dot(vertical))/tanY)))*1.12;
 return {center,distance,radius,direction:forward};
}
