/** Optional entry: importing the ordinary UI never imports three.js. */
export { previewMeshes, geometryFromPreview, previewSvgArtwork } from './three/geometry.js';
export type { PreviewMeshData, PreviewOutline, PreviewArtworkOptions } from './three/geometry.js';
export { PreviewStage, springStep } from './three/stage.js';
export type { PreviewSize, PreviewAppearance, PreviewDiagnostics, PreviewStageOptions, PreviewStageContext, PreviewStageExtension } from './three/stage.js';

export {assemblyFrame} from './three/assembly.js';
export { PreviewMaterialLibrary, plywoodEdgeTexture } from './three/materials.js';
export { materialSurfaces } from './material-surfaces.js';
export type { WoodKind } from './material-surfaces.js';
