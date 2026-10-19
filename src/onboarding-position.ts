export interface OnboardingRect { left: number; right: number; top: number; bottom: number }
export type OnboardingSide = 'left' | 'right' | 'top' | 'bottom';
/** Adjacent card placement derived from Sliceform's guide, without product dependencies. */
export function positionOnboarding(target: OnboardingRect, viewport: { width: number; height: number }, height: number) {
  const margin = 12, gap = 10, clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  if (![target.left, target.right, target.top, target.bottom, viewport.width, viewport.height, height].every(Number.isFinite) || target.right <= target.left || target.bottom <= target.top || viewport.width < 80 || viewport.height < 80 || height <= 0) return null;
  if (target.right <= 0 || target.bottom <= 0 || target.left >= viewport.width || target.top >= viewport.height) return null;
  const width = Math.min(280, viewport.width - 2 * margin), safeHeight = Math.min(height, viewport.height - 2 * margin);
  const cx = (target.left + target.right) / 2, cy = (target.top + target.bottom) / 2;
  const preference: OnboardingSide[] = cx < viewport.width / 3 ? ['right', 'bottom', 'top', 'left'] : cx > viewport.width * 2 / 3 ? ['left', 'bottom', 'top', 'right'] : cy < viewport.height / 2 ? ['bottom', 'top', 'right', 'left'] : ['top', 'bottom', 'right', 'left'];
  const positions = {
    right: { left: target.right + gap, top: cy - safeHeight / 2, free: viewport.width - margin - target.right - gap },
    left: { left: target.left - width - gap, top: cy - safeHeight / 2, free: target.left - margin - gap },
    bottom: { left: cx - width / 2, top: target.bottom + gap, free: viewport.height - margin - target.bottom - gap },
    top: { left: cx - width / 2, top: target.top - safeHeight - gap, free: target.top - margin - gap },
  };
  const side = preference.find(side => positions[side].free >= (side === 'left' || side === 'right' ? width : safeHeight)) ?? [...preference].sort((a, b) => positions[b].free - positions[a].free)[0];
  const left = clamp(positions[side].left, margin, viewport.width - width - margin), top = clamp(positions[side].top, margin, viewport.height - safeHeight - margin);
  const facing = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' } as const;
  return { left, top, width, arrow: facing[side], arrowOffset: side === 'left' || side === 'right' ? clamp(cy - top, 16, safeHeight - 16) : clamp(cx - left, 16, width - 16), beaconLeft: clamp(target.right - 4, margin, viewport.width - margin), beaconTop: clamp(target.top - 4, margin, viewport.height - margin) };
}
