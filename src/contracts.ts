export type UiLocale = 'fr' | 'en';
export interface UiOption { value: string; title: string; disabled?: boolean; color?: string }
export interface UiTab extends UiOption { testId?: string; compactTitle?: string }
export interface UiSwatch { value: string; color: string; title: string; dark?: boolean }
export type DecimalAdjustment = (text: string, delta: number) => string | null;

/** Controls cannot turn markup-like strings into HTML or arbitrary CSS values. */
export function safeHexColor(color: unknown, fallback = '#c44336'): string {
  const safeFallback = /^#[0-9a-f]{6}$/i.test(fallback) ? fallback.toLowerCase() : '#c44336';
  return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : safeFallback;
}
export function finiteSliderValue(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && Number.isFinite(min) && Number.isFinite(max) && min <= max ? Math.max(min, Math.min(max, value)) : null;
}
export function isOptionValue(value: unknown, items: readonly UiOption[]): value is string {
  return typeof value === 'string' && items.some(item => item.value === value && !item.disabled);
}
