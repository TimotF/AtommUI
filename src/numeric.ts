export interface NumericBounds { min?: number; max?: number; decimalSeparator?: '.' | ',' }
interface Decimal { units: bigint; scale: number }

function draft(text: string): Decimal | null {
  if (typeof text !== 'string' || text.length > 256 || !/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text) || !Number.isFinite(Number(text.replace(',', '.')))) return null;
  const normalized = text.replace(',', '.'), negative = normalized.startsWith('-');
  const [whole, fraction = ''] = normalized.replace(/^[+-]/, '').split('.');
  return { units: BigInt(`${whole || '0'}${fraction}`) * (negative ? -1n : 1n), scale: fraction.length };
}
function numeric(value: number): Decimal | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const [mantissa, exponent = '0'] = String(value).toLowerCase().split('e'), parsed = draft(mantissa);
  if (!parsed) return null;
  const scale = parsed.scale - Number(exponent);
  return scale >= 0 ? { units: parsed.units, scale } : { units: parsed.units * 10n ** BigInt(-scale), scale: 0 };
}
function format(units: bigint, scale: number, separator: '.' | ','): string {
  const negative = units < 0n, digits = (negative ? -units : units).toString().padStart(scale + 1, '0');
  const whole = scale ? digits.slice(0, -scale) : digits, fraction = scale ? digits.slice(-scale).replace(/0+$/, '') : '';
  return `${negative ? '-' : ''}${whole}${fraction ? separator + fraction : ''}`;
}

/** Exact decimal adjustment; incomplete drafts are never coerced or silently repaired. */
export function adjustNumericDraft(text: string, delta: number, bounds: NumericBounds = {}): string | null {
  const initial = draft(text), change = numeric(delta);
  const lower = bounds.min === undefined ? null : numeric(bounds.min), upper = bounds.max === undefined ? null : numeric(bounds.max);
  if (!initial || !change || bounds.min !== undefined && !lower || bounds.max !== undefined && !upper || lower && upper && bounds.min! > bounds.max!) return null;
  const scale = Math.max(initial.scale, change.scale, lower?.scale ?? 0, upper?.scale ?? 0);
  const at = (value: Decimal) => value.units * 10n ** BigInt(scale - value.scale);
  let next = at(initial) + at(change);
  if (lower && next < at(lower)) next = at(lower);
  if (upper && next > at(upper)) next = at(upper);
  return format(next, scale, text.includes(',') ? ',' : bounds.decimalSeparator ?? '.');
}

/** Integer scrub steps multiplied without introducing 0.1 × 3 floating noise. */
export function decimalStepDelta(steps: number, step: number, multiplier = 1): number | null {
  const size = numeric(step), factor = numeric(multiplier);
  if (!Number.isSafeInteger(steps) || !size || step <= 0 || !factor || multiplier <= 0) return null;
  const result = Number(format(BigInt(steps) * size.units * factor.units, size.scale + factor.scale, '.'));
  return Number.isFinite(result) ? result : null;
}
