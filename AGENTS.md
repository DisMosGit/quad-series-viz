# AGENTS.md

## Project
React 19 + TS 5.9 (strict) + Vite 8 + Tailwind 4 + Recharts 3. `QuadChart` composes 4 time-series (Area, Spline, Line, Bar) in one chart with a strict pastel aesthetic.

## Commands
`npm run dev` (Vite) · `npm run build` (`tsc -b && vite build`) · `npm test` (`node:test`).
**Build is the only quality gate — no CI, no ESLint/Prettier.** Node >= 20.19.

## Rules
- Code, comments, docs in English.
- Tailwind only, no CSS modules; arbitrary values for palette colors.
- Never `any`. Types, palette (`CHART_COLORS`) and pure data helpers live in `src/types/chart.types.ts`.

## Design system — do not change without an explicit user request
- Canvas pink `#FCE0E3`; shell top bar `#E5F0FC`; chart frame `#D9CBCA`.
- Grid: hairline horizontal only. Never vertical. No axis/tick lines; gray `#9CA3AF` labels.
- **X and Y axes are hidden**; `showYAxis` opts the Y axis back in.
- Area `#FDE047` @ 0.3, no stroke, `baseValue={domain[0]}`. Spline `#16A34A` 2.5px monotone. Line `#9333EA` 2px with square markers. Bar `#3B82F6` @ 0.5, rounded top, `barSize={20}`.
- Tooltip: white, `rounded-xl`, `shadow-xl`, dot per series. Crosshair: faint purple vertical.

## Invariants
1. `<ComposedChart>` inside `<ResponsiveContainer width="100%" height="100%">`; the parent supplies a sized box.
2. Props `areaData`/`splineData`/`lineData`/`barData` are `{ date, value }[]`. Chart keys are `cost`, `cpa`, `roiConfirmed`, `conversions` — **not** `value`.
3. Series are joined by `date` via `buildChartRows`; differing/missing dates become `null` gaps and must not throw.
4. Scales differ by orders of magnitude (ROI ~161-186 vs CPA ~0.5-5), so each series is rescaled into one domain anchored by `ROI_SPAN`.
5. Rescaled values go in the metric keys; originals stay in `raw`, which is what `CustomTooltip` reads. Never shadow or drop `raw`.
6. Recharts 3 dropped `<Line symbol="square">`; squares come from the `dot`/`activeDot` render props (`DotItemDotProps` / `ActiveDotProps`).
7. z-order: `<Bar>`, `<Area>`, then both `<Line>`s.
8. `mockData.ts` stays deterministic (seeded PRNG, no `Math.random`) and mirrors any data-shape change.

## Pitfalls
- Never ship the default Recharts tooltip — always the custom one.
- No bright/solid colors, no vertical grid, never remove `ResponsiveContainer`.
- The repo has no commits yet; state the intended commit when proposing git work.
