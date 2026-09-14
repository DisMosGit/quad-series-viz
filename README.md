# Quad Series Viz

Four time-series sequences — an Area, a Spline, a Line and a Bar — composed into a single responsive Recharts chart, with a strict pastel aesthetic and a tooltip that always reports the real values.

![Quad Series Viz](./assets/screenshot.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-FDE047.svg?style=flat-square)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-16A34A.svg?style=flat-square)](./CONTRIBUTING.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D20.19-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

## ✨ Features

- **4-in-1 composed chart:** Area, Spline, Line and Bar rendered from a single
  `<ComposedChart>` so all four metrics share one hover index.
- **One axis, four scales:** the metrics differ by orders of magnitude (ROI
  ~161-186 vs. CPA ~0.5-5), so each series is rescaled into one shared domain —
  every curve keeps its own shape and full height.
- **Honest tooltip:** a custom white card with a colour-coded dot per series. It
  reads the untouched originals, so you always see the *raw* cost, CPA, ROI and
  conversions for the hovered date, never the rescaled axis numbers.
- **Pastel aesthetic:** soft pink canvas, yellow area fill, green spline, purple
  square-marked line and translucent blue bars.
- **Fully responsive:** the chart fills whatever sized box the parent supplies via
  `ResponsiveContainer` — width `100%`, height `100%`.
- **Gap-tolerant joining:** series that cover different dates are outer-joined by
  `date`; missing points become `null` gaps rather than broken paths or crashes.
- **TypeScript first:** strict mode, no `any`. Types, the `CHART_COLORS` palette
  and every pure data helper live in one module,
  [`src/types/chart.types.ts`](./src/types/chart.types.ts).
- **Deterministic demo data:** `src/data/mockData.ts` uses a seeded PRNG, so the
  demo page renders identically on every reload and in every snapshot.

## 🛠 Tech Stack

- **Framework:** React 19 + Vite 8
- **Language:** TypeScript 5.9 (strict)
- **Charting:** Recharts 3
- **Styling:** Tailwind CSS 4 (utility classes only — no CSS modules)

## 🚀 Getting Started

### Prerequisites

Node.js **>= 20.19** (required by Vite 8) and npm.

### Run the demo

```bash
git clone https://github.com/DisMosGit/quad-series-viz.git
cd quad-series-viz
npm install
npm run dev
```

Vite prints a local URL — open it to see the dashboard shell: a metrics rail, an
edit bar and the chart panel. Hover the chart to see the crosshair and tooltip.

### Build and test

```bash
npm run build   # tsc -b && vite build — the quality gate, must be error-free
npm test        # node:test suite for the pure data helpers
npm run preview # serve the production build from dist/
```

> `npm run build` and `npm test` are the **only** quality gates. There is no
> ESLint, no Prettier and no CI workflow by design; formatting is carried by
> [`.editorconfig`](./.editorconfig) and the style of the surrounding code.

## 📖 Usage

Import `QuadChart` and pass four arrays of `{ date, value }`. Each array becomes
one series; points are matched across series by `date`.

```tsx
import { QuadChart } from './components/QuadChart';

const areaData = [{ date: '12.06.2026', value: 44.36 } /* ... */];
const splineData = [{ date: '12.06.2026', value: 161.47 } /* ... */];
const lineData = [{ date: '12.06.2026', value: 36 } /* ... */];
const barData = [{ date: '12.06.2026', value: 1.23 } /* ... */];

export default function App() {
  return (
    // The parent owns the size: QuadChart defaults to height="100%".
    <div className="h-[360px] w-full">
      <QuadChart
        areaData={areaData}
        splineData={splineData}
        lineData={lineData}
        barData={barData}
      />
    </div>
  );
}
```

### Props

`QuadChartProps` is exported from
[`src/types/chart.types.ts`](./src/types/chart.types.ts).

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `areaData` | `{ date: string, value: number }[]` | ✅ | Yellow area — **Cost**. No stroke, filled to the axis floor. |
| `splineData` | `{ date: string, value: number }[]` | ✅ | Green monotone spline — **ROI confirmed**. Also anchors the shared domain. |
| `lineData` | `{ date: string, value: number }[]` | ✅ | Purple line with square markers — **Conversions**. |
| `barData` | `{ date: string, value: number }[]` | ✅ | Translucent blue bars — **CPA**. |
| `height` | `number \| string` | — | Height of the chart box. Defaults to `100%`, so the parent sizes it. A `minHeight` of 160px always applies. |
| `className` | `string` | — | Extra classes for the chart wrapper. |
| `showYAxis` | `boolean` | — | Opts the shared Y axis back in. Hidden by default. |

Every point is `{ date: string, value: number }`, where `date` is the join key
across all four series (`'12.06.2026'` in the demo).

### Data behaviour

- **Differing dates** are outer-joined in the order the series are scanned
  (cost, CPA, ROI, conversions). Missing points become `null`, which Recharts
  renders as a break in the path instead of a crash.
- **Differing series lengths** are allowed. In dev, the helpers log a
  `[QuadChart]` warning listing the per-series counts.
- **Duplicate dates** inside one series keep the first value and log a warning in
  dev.
- **Empty input** renders an empty chart frame; `getSharedDomain` falls back to
  `[0, 1]` so nothing throws.
- **Flat or missing ROI** makes the domain fall back to the extremes of all four
  series rather than producing a zero-height domain.

### How four different scales share one axis

The metrics have incompatible magnitudes (Cost ~30-120, CPA ~0.5-5,
ROI ~161-186, Conversions ~30-36), so each series is rescaled into a single
domain anchored to the ROI range (`ROI_SPAN` in `src/types/chart.types.ts`).
Every curve keeps its own shape and full height, matching the reference design.

Rescaled numbers go into the metric keys (`cost`, `cpa`, `roiConfirmed`,
`conversions`) — the values Recharts actually draws. The untouched originals stay
in `raw` on every row, and that is what `CustomTooltip` reads. So
`showYAxis` labels the shared *normalized* scale, while the tooltip always reports
real units.

## 🧪 Tests & Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b && vite build` — type-check plus production bundle |
| `npm run preview` | Serves the built `dist/` locally |
| `npm test` | `node --test tests/chart.types.test.ts` |

The suite covers `buildChartRows` (merging, gaps, empty input),
`getSharedDomain` (ROI anchoring, flat-ROI fallback, single-value padding),
`normalizeSeries` (extremes onto the domain, flat series collapse) and
`getSeriesExtent` (null handling).

## 📂 Project Structure

```text
quad-series-viz/
├── assets/
│   └── screenshot.png         # README image
├── src/
│   ├── components/
│   │   ├── QuadChart.tsx      # the composed chart component
│   │   └── CustomTooltip.tsx  # custom tooltip card
│   ├── types/
│   │   └── chart.types.ts     # types, CHART_COLORS palette, data helpers
│   ├── data/
│   │   └── mockData.ts        # deterministic 30-day demo data (seeded PRNG)
│   ├── App.tsx                # dashboard shell demo page
│   ├── main.tsx               # React entry point
│   └── index.css              # Tailwind imports
├── tests/
│   └── chart.types.test.ts    # node:test suite for the helpers
├── .editorconfig
├── index.html
└── vite.config.ts
```

## 🤝 Contributing

Contributions are welcome — bug reports, feature discussions and PRs alike.

- Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup, the PR checklist and the
  project conventions.
- Participation is covered by the
  [Code of Conduct](./CODE_OF_CONDUCT.md).
- Please **open an issue before changing the visuals**: the palette, the
  horizontal-only grid and the hidden axes are deliberate design decisions, and
  unsolicited restyling PRs will be sent back.
- Target the `main` branch, and make sure `npm run build` and `npm test` are green
  before opening the PR.

### Not included on purpose

There is no `.prettierrc`, no `.eslintrc`, no `format`/`lint` script and no CI
workflow. `npm run build` (strict TypeScript plus the Vite build) is the single
gate, and [`.editorconfig`](./.editorconfig) handles mechanical formatting. If you
think a linter is worth adding, open an issue to argue the case rather than
bundling it into an unrelated PR.

## 📝 License

Released under the [MIT License](./LICENSE). © 2026 DisMosGit.
