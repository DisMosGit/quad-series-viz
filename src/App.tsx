import { useMemo } from 'react';
import { QuadChart } from './components/QuadChart';
import { RAIL_METRICS, formatRowMetric, getLastRow, mockQuadData } from './data/mockData';
import type { MetricKey } from './types/chart.types';

/**
 * Annualized-style rail metrics from the reference: the RAIL_METRICS order is
 * Cost, CPA, ROI confirmed, Conversions.
 */
const RAIL_HEADLINES: Record<MetricKey, { percent: string; currency: string; count: string }> = {
  cost: { percent: '12%', currency: '$120.40', count: '118' },
  cpa: { percent: '3%', currency: '$1.23', count: '3' },
  roiConfirmed: { percent: '68%', currency: '$161.47', count: '180' },
  conversions: { percent: '41%', currency: '$0.00', count: '36' },
};

/**
 * The reference shell: light-blue strip, `Tdy` metrics rail and the chart panel.
 * Swap this for the three-line example below when only the chart is needed:
 *
 * ```tsx
 * <QuadChart areaData={areaData} splineData={splineData} lineData={lineData} barData={barData} />
 * ```
 */
export default function App() {
  const lastRow = useMemo(() => getLastRow(), []);

  return (
    <div className="min-h-screen bg-[#FCE0E3] text-gray-900 antialiased">
      <div className="h-8 bg-[#E5F0FC]" />

      <div className="grid grid-cols-[176px_1fr] items-start gap-0 pt-4">
        {/* Metrics rail */}
        <aside className="flex flex-col">
          <div className="border-b border-[#F2D3D8] bg-white px-4 py-2 text-base font-semibold">Tdy</div>
          {RAIL_METRICS.map(({ key, label }) => {
            const headline = RAIL_HEADLINES[key];
            return (
              <div key={key} className="flex flex-col gap-1 border-b border-[#F2D3D8] bg-white px-4 py-3">
                <span className="text-xs tracking-wide text-gray-400 uppercase">{label}</span>
                <span className="text-sm text-gray-500">{headline.percent}</span>
                <span className="text-sm text-gray-500">{headline.currency}</span>
                <span className="text-sm text-gray-500 tabular-nums">{headline.count}</span>
                <span className="sr-only">{formatRowMetric(lastRow, key)}</span>
              </div>
            );
          })}
        </aside>

        {/* Chart panel */}
        <main className="px-4">
          <div className="mb-3 flex items-center justify-end rounded-lg border border-[#D9CBCA] bg-white px-3 py-1.5">
            <span aria-hidden="true" className="text-gray-500">
              ✎ ▾
            </span>
          </div>

          <section className="rounded-xl border border-[#D9CBCA] bg-white/40 p-4">
            <div className="h-[360px] w-full">
              <QuadChart
                areaData={mockQuadData.areaData}
                splineData={mockQuadData.splineData}
                lineData={mockQuadData.lineData}
                barData={mockQuadData.barData}
              />
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-[#D9CBCA] bg-white p-6">
            <h1 className="text-lg font-semibold">Quad Series Viz</h1>
            <p className="mt-1 max-w-prose text-sm text-gray-600">
              Four time-series — a yellow area (Cost), blue bars (CPA), a green spline (ROI confirmed) and a purple
              square-marked line (Conversions) — composed in a single responsive Recharts chart. Hover the chart to
              inspect a day: a faint crosshair appears and the tooltip reports the raw values for all four metrics.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
