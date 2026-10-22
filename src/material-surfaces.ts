import pineThumbnail from './assets/materials/pine-thumbnail.jpg';
import walnutThumbnail from './assets/materials/walnut-thumbnail.jpg';

/** Picker thumbnails are reduced from the same photographs as the detailed 3D maps. */
export const materialSurfaces = {
  // Keep historical IDs for saved consumer values; pine now previews a light plywood face.
  pine: { thumbnail: pineThumbnail, tileMm: 180, offset: [.15, .2], fallback: '#d8c7a6' },
  walnut: { thumbnail: walnutThumbnail, tileMm: 180, offset: [.2, .3], fallback: '#775741' },
} as const;
export type WoodKind = keyof typeof materialSurfaces;
