import { DOMParser as XmlDOMParser } from '@xmldom/xmldom';
import { ExtrudeGeometry, ShapeGeometry, ShapePath, BufferGeometry, BufferAttribute } from 'three';
import {ClipperD,ClipType,FillRule,type PathsD} from 'clipper2-ts';
import { SVGLoader, type StrokeStyle } from 'three/addons/loaders/SVGLoader.js';

export type PreviewMeshData = {
  position: Float32Array; normal: Float32Array; uv: Float32Array; index: Uint32Array | null;
  groups: { start: number; count: number; materialIndex?: number }[]; engraved: boolean;
};
export type PreviewOutline = { path: string; engraving?: readonly string[]; thickness: number; curveSegments?: number };
export type PreviewArtworkOptions = {curveSegments?:number};

/** SVGLoader uses DOMParser; a Worker has no native DOM. No network or SVG scripts are used. */
if (typeof globalThis.DOMParser === 'undefined') {
  class WorkerDOMParser {
    parseFromString(text: string, type: 'image/svg+xml') {
      const xml = new XmlDOMParser().parseFromString(text, type);
      // xmldom supplies the XML DOM; SVGLoader also looks up gradient tag names.
      // This entry generates path-only XML, rather than accepting arbitrary SVG documents.
      Object.assign(xml, { querySelectorAll: (selector: string) => selector.split(',').flatMap(tag => {
        if (!/^[A-Za-z]+$/.test(tag.trim())) throw new Error('Unsupported preview selector');
        return Array.from(xml.getElementsByTagName(tag.trim()));
      }) });
      return xml;
    }
  }
  Object.assign(globalThis, { DOMParser: WorkerDOMParser });
}

function shapes(path: string) {
  if (!path.trim() || /[^MmZzLlHhVvCcSsQqTtAaEe\d\s.,+\-]/.test(path)) throw new Error('Invalid preview outline');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path fill="#000000" fill-rule="nonzero" d="${path}"/></svg>`;
  // r185+: createShapes() delegates to toShapes() and emits a deprecation warning.
  return new SVGLoader().parse(svg).paths.flatMap(item => item.toShapes());
}

/** Coordinates stay in physical mm, Y down. Flip Y once on the display content group. */
export function previewMeshes(outline: PreviewOutline): PreviewMeshData[] {
  if (!Number.isFinite(outline.thickness) || outline.thickness <= 0) throw new Error('Invalid preview thickness');
  const curveSegments=outline.curveSegments??96;
  if(!Number.isInteger(curveSegments)||curveSegments<4||curveSegments>96)throw new Error('Invalid preview curve segments');
  const pack = (geometry: BufferGeometry, engraved: boolean): PreviewMeshData => {
    geometry.translate(0, 0, engraved ? outline.thickness / 2 + .05 : -outline.thickness / 2);
    const position = new Float32Array(geometry.getAttribute('position').array);
    const uv = new Float32Array(position.length / 3 * 2);
    // World-space UVs in mm; the material catalog sets the physical tile size.
    const normals = geometry.getAttribute('normal');
    for (let i = 0; i < position.length / 3; i++) {
      uv[2 * i] = position[3 * i];
      // Extruded sides sample the plywood layers along thickness, including hole walls.
      uv[2 * i + 1] = Math.abs(normals.getZ(i)) < .5 ? position[3 * i + 2] : position[3 * i + 1];
    }
    const data = { position, normal: new Float32Array(geometry.getAttribute('normal').array), uv,
      index: geometry.index ? new Uint32Array(geometry.index.array) : null,
      groups: geometry.groups.map(group => ({ ...group })), engraved };
    geometry.dispose();
    return data;
  };
  const meshes = [pack(new ExtrudeGeometry(shapes(outline.path), { depth: outline.thickness, bevelEnabled: false, curveSegments }), false)];
  if (outline.engraving?.length) meshes.push(pack(new ShapeGeometry(outline.engraving.flatMap(shapes), curveSegments), true));
  return meshes;
}

/** The caller owns and disposes this geometry; buffer coordinates and material groups are retained. */
export function geometryFromPreview(data:PreviewMeshData):BufferGeometry {
 const geometry=new BufferGeometry();
 geometry.setAttribute('position',new BufferAttribute(data.position,3));geometry.setAttribute('normal',new BufferAttribute(data.normal,3));geometry.setAttribute('uv',new BufferAttribute(data.uv,2));
 if(data.index)geometry.setIndex(new BufferAttribute(data.index,1));for(const group of data.groups)geometry.addGroup(group.start,group.count,group.materialIndex);return geometry;
}

/** Font contours may cross themselves (e.g. Montserrat Light B/R). Earcut
 * requires simple polygons; normalize SVGLoader's sampled curves using the
 * SVG fill rule before its public ShapePath.toShapes() conversion. This is
 * display tessellation only: the original production Beziers are untouched. */
function artworkShapes(path:ShapePath,curveSegments:number){
 const contours=path.subPaths.map(sub=>sub.getPoints(curveSegments)).filter(points=>points.length>=3);
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const points of contours)for(const p of points){if(!Number.isFinite(p.x)||!Number.isFinite(p.y))throw Error('Invalid preview artwork coordinates');minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
 if(!contours.length)return[];
 const extent=Math.max(maxX-minX,maxY-minY);if(extent===0)return[];
 const scale=10_000/extent;if(!Number.isFinite(scale)||scale<=0)throw Error('Invalid preview artwork extent');
 // Keep clipping integers safe regardless of physical mm. Its normalized
 // precision is 1e-10 of the artwork extent, finer than Float32 display buffers.
 const clipper=new ClipperD(6),solution:PathsD=[];
 for(const points of contours)clipper.addSubject(points.map(p=>({x:(p.x-minX)*scale,y:(p.y-minY)*scale})));
 const fillRule=(path.userData?.style as {fillRule?:string}|undefined)?.fillRule==='evenodd'?FillRule.EvenOdd:FillRule.NonZero;
 if(!clipper.execute(ClipType.Union,fillRule,solution))throw Error('Preview artwork normalization failed');
 const normalized=new ShapePath();normalized.userData={style:{fillRule:'nonzero'}};
 for(const points of solution){if(points.length<3)continue;normalized.moveTo(points[0]!.x/scale+minX,points[0]!.y/scale+minY);for(const p of points.slice(1))normalized.lineTo(p.x/scale+minX,p.y/scale+minY);normalized.currentPath!.closePath();}
 return normalized.toShapes();
}

/** Flat, single-ink artwork from a consumer-generated path-only SVG.
 * SVGLoader owns fill rules, counters and transforms; its stroke adapter owns
 * widths/joins/caps. No physical thickness is invented for an engraving.
 * This does not load external SVGs, images, fonts, CSS or referenced elements. */
export function previewSvgArtwork(svg:string,options:PreviewArtworkOptions={}):PreviewMeshData|null {
 const curveSegments=options.curveSegments??64;
 if(!Number.isInteger(curveSegments)||curveSegments<4||curveSegments>96)throw new Error('Invalid preview curve segments');
 if(/<!DOCTYPE|<!ENTITY/i.test(svg))throw new Error('Invalid preview artwork');
 const parsed=new SVGLoader().parse(svg);
 for(const element of Array.from(parsed.xml.getElementsByTagName('*'))){
  if(!['svg','g','path'].includes(element.localName||element.nodeName))throw new Error('Preview artwork must contain paths only');
  // This mesh contains opaque single-ink geometry, not composited SVG paint.
  // Reject unsupported presentation instead of silently displaying hidden or
  // partially transparent content as a fully opaque engraving.
  if(['opacity','visibility','display','fill-opacity','stroke-opacity'].some(name=>element.hasAttribute(name))||/(?:^|;)\s*(?:opacity|visibility|display|fill-opacity|stroke-opacity)\s*:/i.test(element.getAttribute('style')??''))throw new Error('Preview artwork must be opaque and visible');
 }
 const geometries:BufferGeometry[]=[];
 try{
  for(const path of parsed.paths){
   const style=path.userData?.style as StrokeStyle&{fill?:string;stroke?:string;fillOpacity?:number;strokeOpacity?:number};
   if(style?.fill!=='none'&&style?.fillOpacity!==0){
    // Follow the same SVGLoader -> Shapes -> ExtrudeGeometry path as stock.
    // A zero-depth extrusion supplies the flat engraving cap, without inventing
    // relief. The coincident reverse cap and degenerate side faces are omitted.
    geometries.push(new ExtrudeGeometry(artworkShapes(path,curveSegments),{depth:0,bevelEnabled:false,curveSegments}));
   }
   if(style?.stroke&&style.stroke!=='none'&&style.strokeWidth>0&&style.strokeOpacity!==0){
    for(const subpath of path.subPaths){
     const stroke=SVGLoader.pointsToStroke(subpath.getPoints(curveSegments),style,12,0);
     if(stroke)geometries.push(stroke);
    }
   }
  }
  const count=geometries.reduce((sum,g)=>{const n=g.getAttribute('normal');for(let i=0;i<n.count;i++)if(n.getZ(i)>.5)sum++;return sum;},0);
  if(!count)return null;
  const position=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2);
  let offset=0;
  for(const geometry of geometries){
   const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal');
   for(let i=0;i<p.count;i++){
    if(n.getZ(i)<=.5)continue;
    const xyz=offset*3,xy=offset*2;
    position[xyz]=p.getX(i);position[xyz+1]=p.getY(i);position[xyz+2]=p.getZ(i);
    normal[xyz]=n.getX(i);normal[xyz+1]=n.getY(i);normal[xyz+2]=n.getZ(i);
    uv[xy]=p.getX(i);uv[xy+1]=p.getY(i);
    offset++;
   }
  }
  return{position,normal,uv,index:null,groups:[],engraved:true};
 }finally{for(const geometry of geometries)geometry.dispose();}
}
