/** World coordinates are millimetres; display units never change source geometry. */
export type SvgBounds = { x: number; y: number; width: number; height: number };
export function safeSvgBounds(bounds: SvgBounds): SvgBounds {
  return bounds && [bounds.x,bounds.y,bounds.width,bounds.height].every(Number.isFinite) && bounds.width > 0 && bounds.height > 0
    ? { ...bounds } : { x: 0, y: 0, width: 100, height: 100 };
}
