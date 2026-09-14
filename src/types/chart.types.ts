/**
 * Shared chart types, the strict color palette and the pure data helpers that
 * turn four independent time-series into a single Recharts-friendly dataset.
 *
 * Reference: `.codex/source/CleanShot 2026-06-17 at 17.09.14.gif`.
 * Colors below were sampled pixel-by-pixel from the reference frames.
 */

/** The four metrics rendered by {@link QuadChart}. */
export type MetricKey = 'cost' | 'cpa' | 'roiConfirmed' | 'conversions';

export type SeriesKind = 'area' | 'spline' | 'line' | 'bar';

/** One entry of a series passed in through {@link QuadChartProps}. */
export interface SeriesPoint {
  /** Display date, e.g. `12.06.2026`. Used as the join key across series. */
  date: string;
  value: number;
}

/**
 * A single point of the merged dataset. {@link QuadChart} renders every series
 * from this one array so all four metrics share a hover index and the custom
 * tooltip can show them together.
 */
export interface ChartRow {
  date: string;
  cost: number | null;
  cpa: number | null;
  roiConfirmed: number | null;
  conversions: number | null;
}

/**
 * A point of the dataset handed to Recharts: the metric keys hold the series
 * values rescaled into the shared domain (what the chart draws) and `raw` keeps
 * the original numbers so the tooltip can report them.
 */
export interface QuadChartDatum {
  date: string;
  cost: number | null;
  cpa: number | null;
  roiConfirmed: number | null;
  conversions: number | null;
  raw: ChartRow;
}

/** The `entry.payload` Recharts passes to a tooltip `content` component. */
export type TooltipEntryPayload = QuadChartDatum | ChartRow | SeriesPoint;

export interface QuadChartProps {
  /** Yellow area (Cost). */
  areaData: SeriesPoint[];
  /** Green smooth spline (ROI confirmed). */
  splineData: SeriesPoint[];
  /** Purple line with square markers (Conversions). */
  lineData: SeriesPoint[];
  /** Blue bars pinned to the baseline (CPA). */
  barData: SeriesPoint[];
  /** Height of the chart box. Defaults to `100%` so the parent controls it. */
  height?: number | string;
  className?: string;
  /**
   * Renders a Y axis. The four metrics have incompatible magnitudes, so each
   * series is scaled independently; the axis therefore shows the shared
   * normalized scale rather than raw units. Hidden by default, like the
   * reference design.
   */
  showYAxis?: boolean;
}

/** Static description of a rendered series. */
export interface SeriesMeta {
  key: MetricKey;
  /** Tooltip label, matching the reference copy exactly. */
  label: string;
  kind: SeriesKind;
  /** Front-end independent display order of the tooltip rows. */
  tooltipOrder: number;
}

/**
 * Strict pastel palette. Area yellow / spline green / line purple / bar blue,
 * plus the slightly deeper, fully saturated dots used inside the tooltip.
 */
export const CHART_COLORS = {
  area: '#FDE047',
  areaFillOpacity: 0.3,
  spline: '#16A34A',
  line: '#9333EA',
  bar: '#3B82F6',
  barFillOpacity: 0.5,
  /** Faint vertical crosshair drawn on hover. */
  cursor: 'rgba(147, 51, 234, 0.25)',
  /** The enlarged translucent dot under the cursor. */
  activeDotFill: '#86EFAC',
  grid: '#EFE2DF',
  tick: '#9CA3AF',
  tooltip: {
    cost: '#FDE047',
    cpa: '#3B82F6',
    roiConfirmed: '#16A34A',
    conversions: '#A21CAF',
  },
} as const;

/** Canonical render + tooltip order: Cost, CPA, ROI confirmed, Conversions. */
export const SERIES_META: readonly SeriesMeta[] = [
  { key: 'cost', label: 'Cost', kind: 'area', tooltipOrder: 0 },
  { key: 'cpa', label: 'CPA', kind: 'bar', tooltipOrder: 1 },
  { key: 'roiConfirmed', label: 'ROI confirmed', kind: 'spline', tooltipOrder: 2 },
  { key: 'conversions', label: 'Conversions', kind: 'line', tooltipOrder: 3 },
];

/**
 * How much of the shared axis the ROI series spans.
 *
 * Measured from the reference frames: the ROI curve's lowest point rests on the
 * axis floor while its highest point reaches ~68% of the plot height, so that
 * series alone spans `0.13 -> 1.0` of the usable range. Anchoring the shared
 * domain to `[roiMin, roiMin + (roiMax - roiMin) / ROI_SPAN]` keeps the green
 * curve full-height and renders every other series relative to it.
 */
export const ROI_SPAN = 0.87;

const METRIC_KEYS: readonly MetricKey[] = ['cost', 'cpa', 'roiConfirmed', 'conversions'];

/** Dev-only diagnostics; guarded so the helpers stay usable in plain Node. */
function warn(message: string): void {
  const isDev = typeof import.meta.env !== 'undefined' && import.meta.env.DEV;
  if (isDev) {
    console.warn(`[QuadChart] ${message}`);
  }
}

/**
 * Outer-joins the four series into one array keyed by `date`, preserving the
 * order given by the first series. Missing dates become `null`, which Recharts
 * renders as a gap instead of a crash.
 */
export function buildChartRows(props: Pick<QuadChartProps, 'areaData' | 'splineData' | 'lineData' | 'barData'>): ChartRow[] {
  const sources: Record<MetricKey, SeriesPoint[]> = {
    cost: props.areaData,
    cpa: props.barData,
    roiConfirmed: props.splineData,
    conversions: props.lineData,
  };

  const lengths = METRIC_KEYS.map((key) => sources[key].length);
  if (lengths.some((length) => length !== lengths[0])) {
    warn(`series lengths differ (${METRIC_KEYS.map((key, i) => `${key}: ${lengths[i]}`).join(', ')}); gaps render as breaks.`);
  }

  const order: string[] = [];
  const seen = new Set<string>();
  for (const key of METRIC_KEYS) {
    for (const point of sources[key]) {
      if (!seen.has(point.date)) {
        seen.add(point.date);
        order.push(point.date);
      }
    }
  }

  const byDate = new Map<string, Partial<Record<MetricKey, number>>>();
  for (const date of seen) {
    byDate.set(date, {});
  }
  for (const key of METRIC_KEYS) {
    for (const point of sources[key]) {
      const bucket = byDate.get(point.date);
      if (!bucket) continue;
      if (bucket[key] !== undefined) {
        warn(`duplicate date "${point.date}" in series "${key}"; the first value wins.`);
        continue;
      }
      bucket[key] = point.value;
    }
  }

  return order.map((date) => {
    const bucket = byDate.get(date) ?? {};
    return {
      date,
      cost: bucket.cost ?? null,
      cpa: bucket.cpa ?? null,
      roiConfirmed: bucket.roiConfirmed ?? null,
      conversions: bucket.conversions ?? null,
    };
  });
}

/** Any row shape that may carry one or more metric values. */
export type MetricRow = ChartRow | SeriesPoint | Partial<Record<MetricKey, number | null>>;

/** Every finite value of one metric across the rows, in order. */
export function metricValues(rows: readonly MetricRow[], key: MetricKey): number[] {
  const values: number[] = [];
  for (const row of rows) {
    const value = (row as Partial<Record<MetricKey, number | null>>)[key];
    if (typeof value === 'number' && Number.isFinite(value)) values.push(value);
  }
  return values;
}

/** Min/max of one series, ignoring gaps. */
export function getSeriesExtent(rows: readonly MetricRow[], key: MetricKey): { min: number; max: number } | null {
  const values = metricValues(rows, key);
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

function withPadding(min: number, max: number): [number, number] {
  if (min === max) {
    const pad = Math.abs(min) * 0.05 || 1;
    return [min - pad, max + pad];
  }
  return [min, max];
}

/**
 * The y-domain shared by every series. Prefers the ROI-anchored domain (see
 * {@link ROI_SPAN}) so the spline spans the plot exactly like the reference;
 * falls back to the extremes of all four series when ROI is missing or flat.
 */
export function getSharedDomain(rows: readonly ChartRow[]): [number, number] {
  const roi = getSeriesExtent(rows, 'roiConfirmed');
  if (roi && roi.max > roi.min) {
    return [roi.min, roi.min + (roi.max - roi.min) / ROI_SPAN];
  }

  const all = METRIC_KEYS.flatMap((key) => metricValues(rows, key));
  if (all.length === 0) return [0, 1];

  const min = Math.min(...all);
  const max = Math.max(...all);
  const nonzeroMin = min === 0 ? max : min;
  let [low, high] = withPadding(nonzeroMin, max);
  if (high === low) high = low + 1;
  return [low, high];
}

/**
 * Rescales one series into the shared domain so each metric keeps its own shape
 * while sharing a single axis. `null` gaps stay `null`.
 */
export function normalizeSeries(rows: readonly ChartRow[], key: MetricKey, domain: readonly [number, number]): (number | null)[] {
  const extent = getSeriesExtent(rows, key);
  if (!extent || extent.max === extent.min) {
    const midpoint = (domain[0] + domain[1]) / 2;
    return rows.map((row) => (row[key] === null ? null : midpoint));
  }

  const scale = (domain[1] - domain[0]) / (extent.max - extent.min);
  return rows.map((row) => {
    const value = row[key];
    return typeof value === 'number' ? domain[0] + (value - extent.min) * scale : null;
  });
}

/** Formats a metric value for the tooltip, matching the reference copy. */
export function formatMetric(key: MetricKey, value: number): string {
  if (key === 'conversions') return Math.round(value).toString();
  return value.toFixed(2);
}

/** Recharts renders a `false` tick when the formatter returns a non-string. */
export function formatAxisTick(date: string): string {
  return date.length >= 5 ? date.slice(0, 5) : date;
}
