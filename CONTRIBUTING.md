# Contributing to Quad Series Viz

Thanks for taking the time to contribute. This document covers how to report bugs,
request features, and get a pull request merged.

By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Table of contents

- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [The quality gate](#the-quality-gate)
- [Reporting a bug](#reporting-a-bug)
- [Requesting a feature](#requesting-a-feature)
- [Submitting a pull request](#submitting-a-pull-request)
- [Project conventions](#project-conventions)
- [Commit messages](#commit-messages)

## Prerequisites

- **Node.js >= 20.19** (required by Vite 8)
- npm (the repo ships a `package-lock.json`; do not commit a different lockfile)

## Local setup

```bash
git clone https://github.com/DisMosGit/quad-series-viz.git
cd quad-series-viz
npm install
npm run dev
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server with HMR for the demo page |
| `npm run build` | `tsc -b && vite build` — type-check + production bundle |
| `npm run preview` | Serves the built `dist/` locally |
| `npm test` | `node:test` suite for the pure data helpers |

## The quality gate

**`npm run build` and `npm test` are the only gates.** There is intentionally no
ESLint, no Prettier, no CI workflow, and no separate `lint` script — do not add
them as part of an unrelated change.

The practical consequences for a PR:

- `npm run build` must exit 0 with **zero TypeScript errors**. The project is on
  TypeScript `strict`.
- `npm test` must stay green, and new pure helpers need a case in
  `tests/chart.types.test.ts`.
- Formatting is kept consistent by [`.editorconfig`](./.editorconfig) (2 spaces,
  LF, final newline, 140-column soft limit) plus the style already present in the
  surrounding code. Match the file you are editing.

## Reporting a bug

Open an issue and include:

1. **What happened** vs. **what you expected**.
2. A **minimal reproduction** — ideally the four data arrays you passed in, or a
   link to a sandbox. Most chart bugs are data-shape bugs, so this matters most.
3. Your **Node version** (`node --version`) and OS.
4. Any console output. The helpers emit dev-only `[QuadChart]` warnings for
   differing series lengths and duplicate dates — include those if present.

Before filing, please check the behaviour against
[`src/data/mockData.ts`](./src/data/mockData.ts): if it reproduces with the
deterministic demo data, say so. If it only reproduces with your data, include it.

## Requesting a feature

Open an issue describing **the problem first, the API second**:

- What are you trying to visualize that the current props cannot express?
- Your proposed prop name and type, and what the default should be.
- Whether it changes the rendering contract or the palette.

Changes to the **design system are out of scope for unsolicited PRs** — see
[Project conventions](#project-conventions). Discuss those in an issue first and
wait for a maintainer to confirm before writing code.

## Submitting a pull request

1. Fork the repo and branch off `main`
   (`git checkout -b fix/tooltip-null-gap`).
2. Keep the diff focused — one concern per PR. Formatting-only noise in unrelated
   files makes a PR hard to review and will be sent back.
3. Run `npm run build` and `npm test` locally before pushing.
4. Fill in the PR description: what changed, why, and how you verified it. Include
   a screenshot for any visible change.
5. Be responsive to review comments; push follow-up commits rather than force
   pushing over review history.

### PR checklist

- [ ] `npm run build` passes with zero errors.
- [ ] `npm test` passes; new pure helpers have tests.
- [ ] No `any` introduced.
- [ ] Types, palette entries, and pure data helpers still live in
      `src/types/chart.types.ts`.
- [ ] Styling uses Tailwind only (no CSS modules); palette colors use arbitrary
      values.
- [ ] The custom tooltip is still used — the default Recharts tooltip never ships.
- [ ] No vertical gridlines; `ResponsiveContainer` is still in place.
- [ ] `src/data/mockData.ts` is still deterministic (seeded PRNG, no `Math.random`)
      and mirrors any data-shape change.
- [ ] Docs updated if props, behavior, or commands changed.

## Project conventions

The visual design is deliberate and referenced from the original mock. Do not
change these without an explicit maintainer request in the issue thread:

| Element | Rule |
|---------|------|
| Canvas / shell / frame | `#FCE0E3` / `#E5F0FC` / `#D9CBCA` |
| Grid | Hairline **horizontal only**, never vertical; no axis or tick lines; `#9CA3AF` labels |
| Axes | X and Y hidden by default; `showYAxis` opts the Y axis back in |
| Area | `#FDE047` at 0.3 opacity, no stroke, `baseValue={domain[0]}` |
| Spline | `#16A34A`, 2.5px, `type="monotone"` |
| Line | `#9333EA`, 2px, square markers via the `dot`/`activeDot` render props |
| Bar | `#3B82F6` at 0.5 opacity, rounded top, `barSize={20}` |

Other standing rules:

- **Code, comments, and docs are written in English.**
- **Never `any`.** Types, the `CHART_COLORS` palette, and pure data helpers belong
  in `src/types/chart.types.ts`.
- The four series are joined by `date` via `buildChartRows`; differing or missing
  dates must become `null` gaps and must never throw.
- Rescaled values live in the metric keys (`cost`, `cpa`, `roiConfirmed`,
  `conversions`) while the originals stay in `raw`, which is what `CustomTooltip`
  reads. Never shadow or drop `raw`.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) with a lowercase
imperative summary:

```text
feat: add showYAxis opt-in for the normalized axis
fix: keep null gaps from breaking the spline path
docs: document the shared-domain rescaling
chore: bump recharts
```

Keep history additive — do not rewrite or force push over commits that have
already been reviewed.
