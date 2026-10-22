import { DOMParser as XmlDOMParser } from '@xmldom/xmldom';
import { ExtrudeGeometry, ShapeGeometry, BufferGeometry, BufferAttribute } from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export type PreviewMeshData = {
  position: Float32Array; normal: Float32Array; uv: Float32Array; index: Uint32Array | null;
  groups: { start: number; count: number; materialIndex?: number }[]; engraved: boolean;
};
export type PreviewOutline = { path: string; engraving?: readonly string[]; thickness: number };

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
  const pack = (geometry: BufferGeometry, engraved: boolean): PreviewMeshData => {
    geometry.translate(0, 0, engraved ? outline.thickness / 2 + .05 : -outline.thickness / 2);
    const position = new Float32Array(geometry.getAttribute('position').array);
    const uv = new Float32Array(position.length / 3 * 2);
    // World-space UVs in mm; the material catalog sets the physical tile size.
    for (let i = 0; i < position.length / 3; i++) { uv[2 * i] = position[3 * i]; uv[2 * i + 1] = position[3 * i + 1]; }
    const data = { position, normal: new Float32Array(geometry.getAttribute('normal').array), uv,
      index: geometry.index ? new Uint32Array(geometry.index.array) : null,
      groups: geometry.groups.map(group => ({ ...group })), engraved };
    geometry.dispose();
    return data;
  };
  const meshes = [pack(new ExtrudeGeometry(shapes(outline.path), { depth: outline.thickness, bevelEnabled: false, curveSegments: 96 }), false)];
  if (outline.engraving?.length) meshes.push(pack(new ShapeGeometry(outline.engraving.flatMap(shapes), 96), true));
  return meshes;
}

/** The caller owns and disposes this geometry; buffer coordinates and material groups are retained. */
export function geometryFromPreview(data:PreviewMeshData):BufferGeometry {
 const geometry=new BufferGeometry();
 geometry.setAttribute('position',new BufferAttribute(data.position,3));geometry.setAttribute('normal',new BufferAttribute(data.normal,3));geometry.setAttribute('uv',new BufferAttribute(data.uv,2));
 if(data.index)geometry.setIndex(new BufferAttribute(data.index,1));for(const group of data.groups)geometry.addGroup(group.start,group.count,group.materialIndex);return geometry;
}
