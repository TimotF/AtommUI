import { TextureLoader, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { materialSurfaces, type WoodKind } from '../material-surfaces.js';
import pineNormal from '../assets/materials/pine-normal.jpg';
import pineRoughness from '../assets/materials/pine-roughness.jpg';
import walnutNormal from '../assets/materials/walnut-normal.jpg';
import walnutRoughness from '../assets/materials/walnut-roughness.jpg';

const detailMaps = {
  pine: { normal: pineNormal, roughness: pineRoughness },
  walnut: { normal: walnutNormal, roughness: walnutRoughness },
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
      texture.anisotropy = Math.min(8, this.anisotropy);
      if (color) texture.colorSpace = SRGBColorSpace;
      return texture;
    };
    const color = load(surface.color, true), normal = load(details.normal, false), roughness = load(details.roughness, false);
    const textures = { color, normal, roughness, ready: Promise.all(pending).then(results => results.every(Boolean)) };
    this.cache.set(kind, textures);
    return textures;
  }

  dispose() {
    for (const maps of this.cache.values()) { maps.color.dispose(); maps.normal.dispose(); maps.roughness.dispose(); }
    this.cache.clear();
  }
}
