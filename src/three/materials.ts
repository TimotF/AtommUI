import { DataTexture, LinearFilter, TextureLoader, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { materialSurfaces, type WoodKind } from '../material-surfaces.js';
import pineColor from '../assets/materials/pine-color.webp';
import walnutColor from '../assets/materials/walnut-color.webp';
import pineNormal from '../assets/materials/pine-normal.jpg';
import pineRoughness from '../assets/materials/pine-roughness.jpg';
import walnutNormal from '../assets/materials/walnut-normal.jpg';
import walnutRoughness from '../assets/materials/walnut-roughness.jpg';

const detailMaps = {
  pine: { color: pineColor, normal: pineNormal, roughness: pineRoughness },
  walnut: { color: walnutColor, normal: walnutNormal, roughness: walnutRoughness },
};
type WoodTextures = { color: Texture; normal: Texture; roughness: Texture; ready: Promise<boolean> };

/** Each stage owns its lazily decoded textures across geometry rebuilds. */
export class PreviewMaterialLibrary {
  private cache = new Map<WoodKind, WoodTextures>();
  constructor(private anisotropy: number, private loader: Pick<TextureLoader, 'load'> = new TextureLoader()) {}

  get(kind: WoodKind): WoodTextures {
    const previous = this.cache.get(kind); if (previous) return previous;
    const surface = materialSurfaces[kind], details = detailMaps[kind];
    const pending: Promise<boolean>[] = [];
    const load = (url: string, color: boolean) => {
      let texture!: Texture;
      pending.push(new Promise<boolean>(resolve => {
        texture = this.loader.load(url, () => resolve(true), undefined, () => resolve(false));
      }));
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat.set(1 / surface.tileMm, 1 / surface.tileMm);
      texture.offset.set(surface.offset[0], surface.offset[1]);
      texture.anisotropy = Math.min(16, this.anisotropy);
      if (color) texture.colorSpace = SRGBColorSpace;
      return texture;
    };
    const color = load(details.color, true), normal = load(details.normal, false), roughness = load(details.roughness, false);
    const textures = { color, normal, roughness, ready: Promise.all(pending).then(results => results.every(Boolean)) };
    this.cache.set(kind, textures);
    return textures;
  }

  dispose() {
    for (const maps of this.cache.values()) { maps.color.dispose(); maps.normal.dispose(); maps.roughness.dispose(); }
    this.cache.clear();
  }
}

/** Display-only laser-charred cross-section, with faint plies independent of face UVs. */
export function plywoodEdgeTexture() {
  const colors = [[10,8,6],[22,16,12],[35,25,17],[43,31,21],[39,28,19],[32,23,16],[26,19,13],[20,15,11]];
  const data = new Uint8Array(colors.flatMap(color => [...color,255]));
  const texture = new DataTexture(data,1,colors.length);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
