import { CHART_COLORS, formatMetric, metricValues, SERIES_META } from '../types/chart.types';
import type { ChartRow, MetricKey, TooltipEntryPayload } from '../types/chart.types';

/**
 * The payload entry Recharts hands to a tooltip `content` component. Only the
 * fields this component reads are declared, which keeps the component free of
 * `any` while staying easy to render manually in tests.
 */
interface TooltipPayloadEntry {
  dataKey?: string | number;
  value?: number | string;
  payload?: TooltipEntryPayload;
}

interface CustomTooltipProps {
  active?: boolean;
  /** Full `DD.MM.YYYY` date of the hovered point. */
  label?: string | number;
  payload?: readonly TooltipPayloadEntry[];
}

/** Row order matches the render order in {@link QuadChart}, top row first. */
const TOOLTIP_KEYS: readonly MetricKey[] = SERIES_META.map((meta) => meta.key);

/**
 * The hovered row's *original* values. Recharts hands the same dataset row to
 * every entry, so the first entry carrying a payload is enough — but the metric
 * keys on that object are the rescaled numbers, hence `raw`.
 */
function readRawRow(entries: readonly TooltipPayloadEntry[]): ChartRow | undefined {
  for (const entry of entries) {
    const payload = entry.payload;
    if (!payload) continue;
    if ('raw' in payload && payload.raw) return payload.raw;
    if ('cost' in payload || 'value' in payload) return payload as ChartRow;
  }
  return undefined;
}

function readValue(row: ChartRow | undefined, key: MetricKey): number | null {
  return metricValues(row ? [row] : [], key)[0] ?? null;
}

/**
 * The custom tooltip: white card, rounded corners, drop shadow, the full date
 * and one row per metric with a color-coded dot.
 */
export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const row = readRawRow(payload);
  if (!row) return null;

  const rows = TOOLTIP_KEYS.flatMap((key) => {
    const value = readValue(row, key);
    const meta = SERIES_META.find((candidate) => candidate.key === key);
    if (value === null || !meta) return [];
    return [
      {
        key,
        label: meta.label,
        text: formatMetric(key, value),
        color: CHART_COLORS.tooltip[key] as string,
      },
    ];
  });

  if (rows.length === 0) return null;

  return (
    <div className="pointer-events-none rounded-xl bg-white px-4 py-3 text-sm whitespace-nowrap shadow-xl">
      <p className="mb-1.5 text-gray-500">{row.date || String(label ?? '')}</p>
      <ul className="space-y-1">
        {rows.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-gray-900">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium">{item.label}:</span>
            <span className="font-semibold tabular-nums">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
