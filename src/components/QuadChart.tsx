import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS, buildChartRows, formatAxisTick, getSharedDomain, normalizeSeries } from '../types/chart.types';
import type { ChartRow, MetricKey, QuadChartDatum, QuadChartProps } from '../types/chart.types';
import type { ActiveDotProps, DotItemDotProps } from 'recharts';
import { CustomTooltip } from './CustomTooltip';

/** Target number of x-axis labels regardless of how many days are passed in. */
const MAX_X_TICKS = 8;
const DEFAULT_HEIGHT = '100%';

/** Keeps the first and last markers clear of the plot edges, like the reference. */
const PLOT_MARGIN = { top: 10, right: 14, bottom: 4, left: 14 };

/**
 * Recharts' numeric `interval` is the number of ticks to *skip*: 0 shows every
 * label, 1 shows every other one, and so on.
 */
function resolveTickInterval(length: number): number {
  if (length <= MAX_X_TICKS) return 0;
  return Math.max(0, Math.ceil(length / MAX_X_TICKS) - 1);
}

/** Half-extent of the square markers on the purple line, in pixels. */
const SQUARE_HALF_SIZE = 2.8;
const ACTIVE_SQUARE_HALF_SIZE = 4.5;

/**
 * Square markers for the purple line.
 *
 * Recharts 3 dropped the `symbol` prop from `<Line>`, so the square is drawn by
 * the `dot` render-prop. `dot` and `activeDot` are typed differently upstream
 * (`DotItemDotProps` vs `ActiveDotProps`), so each gets its own renderer; both
 * only need the pixel centre.
 */
function SquareDot({ cx, cy, halfSize }: { cx?: number; cy?: number; halfSize: number }) {
  if (typeof cx !== 'number' || typeof cy !== 'number') return <g />;
  return (
    <rect x={cx - halfSize} y={cy - halfSize} width={halfSize * 2} height={halfSize * 2} fill={CHART_COLORS.line} />
  );
}

function renderSquareDot({ cx, cy }: DotItemDotProps) {
  return <SquareDot cx={cx} cy={cy} halfSize={SQUARE_HALF_SIZE} />;
}

function renderActiveSquareDot({ cx, cy }: ActiveDotProps) {
  return <SquareDot cx={cx} cy={cy} halfSize={ACTIVE_SQUARE_HALF_SIZE} />;
}

/**
 * Renders 4 time-series in one composed chart: a yellow area, a green smooth
 * spline, a purple square-marked line and blue bars.
 *
 * Notes on the shared axis: the four metrics have incompatible magnitudes
 * (Cost ~30-120, CPA ~0.5-5, ROI ~161-186, Conversions ~30-36), so every series
 * is rescaled into one shared domain — anchored to the ROI range with
 * `ROI_SPAN` in `chart.types.ts` — which keeps all four curves at their
 * reference height. The tooltip always reports the *raw* values.
 */
export function QuadChart({
  areaData,
  splineData,
  lineData,
  barData,
  height = DEFAULT_HEIGHT,
  className,
  showYAxis = false,
}: QuadChartProps) {
  const rows: ChartRow[] = buildChartRows({ areaData, splineData, lineData, barData });
  const domain = getSharedDomain(rows);

  const scaled: Record<MetricKey, (number | null)[]> = {
    cost: normalizeSeries(rows, 'cost', domain),
    cpa: normalizeSeries(rows, 'cpa', domain),
    roiConfirmed: normalizeSeries(rows, 'roiConfirmed', domain),
    conversions: normalizeSeries(rows, 'conversions', domain),
  };

  /**
   * Only the metric keys are replaced by their rescaled values; `raw` keeps the
   * original numbers so the tooltip can report them.
   */
  const chartData: QuadChartDatum[] = rows.map((row, index) => ({
    date: row.date,
    cost: scaled.cost[index] ?? null,
    cpa: scaled.cpa[index] ?? null,
    roiConfirmed: scaled.roiConfirmed[index] ?? null,
    conversions: scaled.conversions[index] ?? null,
    raw: row,
  }));

  return (
    <div className={className} style={{ height, minHeight: 160, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={PLOT_MARGIN}>
          {/* Horizontal hairlines only — no vertical grid. */}
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeWidth={1} strokeOpacity={0.6} />

          {/* Painted first, so the area tints the bars while both lines stay on top. */}
          <Bar
            dataKey="cpa"
            fill={CHART_COLORS.bar}
            fillOpacity={CHART_COLORS.barFillOpacity}
            barSize={20}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />

          {/*
            Yellow area, no stroke. `baseValue` is anchored to the domain floor
            so the fill reaches the baseline even though the cost series has a
            non-zero minimum (the reference area fills from the axis up).
          */}
          <Area
            dataKey="cost"
            fill={CHART_COLORS.area}
            fillOpacity={CHART_COLORS.areaFillOpacity}
            stroke="none"
            type="linear"
            baseValue={domain[0]}
            isAnimationActive={false}
          />

          {/* Green smooth spline (ROI). */}
          <Line
            dataKey="roiConfirmed"
            type="monotone"
            stroke={CHART_COLORS.spline}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: CHART_COLORS.activeDotFill, stroke: 'none' }}
            isAnimationActive={false}
          />

          {/* Purple line with square markers (Conversions). */}
          <Line
            dataKey="conversions"
            type="linear"
            stroke={CHART_COLORS.line}
            strokeWidth={2}
            dot={renderSquareDot}
            activeDot={renderActiveSquareDot}
            isAnimationActive={false}
          />

          <XAxis
            dataKey="date"
            tickFormatter={formatAxisTick}
            interval={resolveTickInterval(rows.length)}
            tickMargin={8}
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART_COLORS.tick, fontSize: 11 }}
            padding={{ left: PLOT_MARGIN.left, right: PLOT_MARGIN.right }}
          />

          {/*
            Single hidden axis. `showYAxis` only makes sense for whichever metric
            the shared domain is anchored to; the labels are normalized units.
          */}
          <YAxis
            hide={!showYAxis}
            domain={domain}
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART_COLORS.tick, fontSize: 11 }}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: CHART_COLORS.cursor, strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default QuadChart;
