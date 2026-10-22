import pineColor from './assets/materials/pine-color.jpg';
import walnutColor from './assets/materials/walnut-color.jpg';

/** One photographic colour source for both picker thumbnails and 3D faces. */
export const materialSurfaces = {
  pine: { color: pineColor, tileMm: 450, offset: [.35, .5], fallback: '#d1b98f', edge: '#765333' },
  walnut: { color: walnutColor, tileMm: 450, offset: [.2, .3], fallback: '#775741', edge: '#4a3023' },
} as const;
export type WoodKind = keyof typeof materialSurfaces;
