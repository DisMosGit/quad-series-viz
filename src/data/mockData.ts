import { formatMetric, SERIES_META } from '../types/chart.types';
import type { ChartRow, MetricKey, QuadChartProps, SeriesPoint } from '../types/chart.types';

/**
 * Deterministic 30-day demo dataset.
 *
 * The four series intentionally reproduce the shapes, magnitudes and the
 * `12.06.2026` tooltip values of the reference design:
 *   - Cost           30 -> 120, rising with a mid-period dip   (yellow area)
 *   - ROI confirmed 161.47 -> ~180, starting high and dipping  (green spline)
 *   - Conversions   36 -> 30 -> 36, flat then stepping up      (purple line)
 *   - CPA           0.86 -> 5.2 with one spend spike           (blue bars)
 *
 * The values are generated with a seeded PRNG instead of `Math.random()` so the
 * demo renders identically on every reload, screenshots are diffable and tests
 * stay stable.
 */

/** Last day of the demo window; the reference tooltip shows this date. */
const END_DATE = { year: 2026, month: 6, day: 12 };

const DAYS = 30;

/** mulberry32 — tiny, fast, deterministic 32-bit PRNG. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shifts a y-m-d triple by a whole number of days. */
function addDays(year: number, month: number, day: number, offset: number): { year: number; month: number; day: number } {
  const shifted = new Date(Date.UTC(year, month - 1, day + offset));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

/** UTC-based so the generated dates never shift with the local timezone. */
function formatDate(year: number, month: number, day: number): string {
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
}

/** Linear interpolation across the 30 demo days, rounded to `decimals`. */
function interpolate(dayIndex: number, keys: readonly number[], decimals: number): number {
  const lastIndex = keys.length - 1;
  const position = (dayIndex / (DAYS - 1)) * lastIndex;
  const lower = Math.floor(position);
  const upper = Math.min(lower + 1, lastIndex);
  const ratio = position - lower;
  const lowerValue = keys[lower] ?? 0;
  const upperValue = keys[upper] ?? lowerValue;
  return Number((lowerValue + (upperValue - lowerValue) * ratio).toFixed(decimals));
}

/** Each series' hand-authored curve, sampled by {@link interpolate}. */
const CURVES: Record<MetricKey, { keys: readonly number[]; decimals: number; jitter: number }> = {
  cost: { keys: [25, 38, 55, 72, 88, 102, 118], decimals: 2, jitter: 0.04 },
  cpa: { keys: [0.86, 1.23, 1.8, 2.6, 3.4, 4.2, 5.2, 4.4, 3.2, 2.1, 1.4, 1.13], decimals: 2, jitter: 0.06 },
  roiConfirmed: { keys: [180.5, 161.47, 179, 186.29, 181], decimals: 2, jitter: 0 },
  conversions: { keys: [36, 31, 29, 36], decimals: 0, jitter: 0 },
};

function buildSeries(metric: MetricKey, random: () => number): SeriesPoint[] {
  const curve = CURVES[metric];
  const points: SeriesPoint[] = [];
  for (let dayIndex = 0; dayIndex < DAYS; dayIndex += 1) {
    const offset = dayIndex - (DAYS - 1);
    const { year, month, day } = addDays(END_DATE.year, END_DATE.month, END_DATE.day, offset);
    const base = interpolate(dayIndex, curve.keys, curve.decimals);
    const wobble = curve.jitter === 0 ? 0 : base * curve.jitter * (random() - 0.5);
    points.push({
      date: formatDate(year, month, day),
      value: Number((base + wobble).toFixed(curve.decimals)),
    });
  }
  return points;
}

const random = createRandom(0x5eed_2026);

/** The four demo series, ready to spread into {@link QuadChartProps}. */
export const mockQuadData: Pick<QuadChartProps, 'areaData' | 'splineData' | 'lineData' | 'barData'> = {
  areaData: buildSeries('cost', random),
  splineData: buildSeries('roiConfirmed', random),
  lineData: buildSeries('conversions', random),
  barData: buildSeries('cpa', random),
};

/** The most recent day, used by the dashboard rail for its headline numbers. */
export function getLastRow(): ChartRow {
  const { areaData, splineData, lineData, barData } = mockQuadData;
  const last = <T,>(list: T[]): T | undefined => list[list.length - 1];
  return {
    date: last(areaData)?.date ?? '',
    cost: last(areaData)?.value ?? null,
    cpa: last(barData)?.value ?? null,
    roiConfirmed: last(splineData)?.value ?? null,
    conversions: last(lineData)?.value ?? null,
  };
}

/** `Cost: 44.36` — the rail/tooltip copy shown in the reference. */
export function formatRowMetric(row: ChartRow, key: MetricKey): string {
  const value = row[key];
  if (typeof value !== 'number') return '—';
  return formatMetric(key, value);
}

/** Ordered metric labels resolved from the shared series metadata. */
export const RAIL_METRICS: readonly { key: MetricKey; label: string }[] = [...SERIES_META]
  .sort((a, b) => a.tooltipOrder - b.tooltipOrder)
  .map(({ key, label }) => ({ key, label }));
