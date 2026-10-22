import pineThumbnail from './assets/materials/pine-thumbnail.jpg';
import walnutThumbnail from './assets/materials/walnut-thumbnail.jpg';

/** Picker thumbnails are reduced from the same photographs as the detailed 3D maps. */
export const materialSurfaces = {
  // Keep historical IDs for saved consumer values; pine now previews a light plywood face.
  pine: { thumbnail: pineThumbnail, tileMm: 90, offset: [.15, .2], fallback: '#e0c494', normalScale: .035 },
  walnut: { thumbnail: walnutThumbnail, tileMm: 180, offset: [.2, .3], fallback: '#775741', normalScale: .05 },
} as const;
export type WoodKind = keyof typeof materialSurfaces;
