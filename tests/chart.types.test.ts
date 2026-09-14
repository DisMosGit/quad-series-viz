import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildChartRows,
  getSharedDomain,
  getSeriesExtent,
  normalizeSeries,
  ROI_SPAN,
} from '../src/types/chart.types.ts';
import type { SeriesPoint } from '../src/types/chart.types.ts';

const point = (date: string, value: number): SeriesPoint => ({ date, value });

test('buildChartRows merges the four series per date', () => {
  const rows = buildChartRows({
    areaData: [point('01.06.2026', 10), point('02.06.2026', 20)],
    barData: [point('01.06.2026', 1), point('02.06.2026', 2)],
    splineData: [point('01.06.2026', 100), point('02.06.2026', 200)],
    lineData: [point('01.06.2026', 7), point('02.06.2026', 8)],
  });

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { date: '01.06.2026', cost: 10, cpa: 1, roiConfirmed: 100, conversions: 7 });
  assert.deepEqual(rows[1], { date: '02.06.2026', cost: 20, cpa: 2, roiConfirmed: 200, conversions: 8 });
});

test('buildChartRows keeps differing dates and fills gaps with null', () => {
  const rows = buildChartRows({
    areaData: [point('01.06.2026', 10)],
    barData: [point('02.06.2026', 2)],
    splineData: [point('01.06.2026', 100)],
    lineData: [point('01.06.2026', 7)],
  });

  assert.deepEqual(
    rows.map((row) => row.date),
    ['01.06.2026', '02.06.2026'],
  );
  const second = rows[1];
  assert.ok(second);
  assert.equal(second.cost, null);
  assert.equal(second.cpa, 2);
});

test('buildChartRows handles empty input', () => {
  assert.deepEqual(buildChartRows({ areaData: [], barData: [], splineData: [], lineData: [] }), []);
});

test('getSharedDomain anchors to the ROI extrema using ROI_SPAN', () => {
  const rows = buildChartRows({
    areaData: [point('01.06.2026', 10), point('02.06.2026', 20)],
    barData: [point('01.06.2026', 1), point('02.06.2026', 5)],
    splineData: [point('01.06.2026', 160), point('02.06.2026', 185)],
    lineData: [point('01.06.2026', 7), point('02.06.2026', 8)],
  });

  const [low, high] = getSharedDomain(rows);
  assert.equal(low, 160);
  assert.ok(Math.abs(high - (160 + 25 / ROI_SPAN)) < 1e-9);
});

test('getSharedDomain falls back to all series when ROI is flat', () => {
  const rows = buildChartRows({
    areaData: [point('01.06.2026', 10), point('02.06.2026', 40)],
    barData: [point('01.06.2026', 5), point('02.06.2026', 9)],
    splineData: [point('01.06.2026', 12), point('02.06.2026', 12)],
    lineData: [point('01.06.2026', 7), point('02.06.2026', 8)],
  });

  // Fallback: the domain spans every series — cpa's 5 up to cost's 40.
  const [low, high] = getSharedDomain(rows);
  assert.equal(low, 5);
  assert.equal(high, 40);
});

test('getSharedDomain pads a single flat series so the domain is never empty', () => {
  const rows = buildChartRows({
    areaData: [point('01.06.2026', 42), point('02.06.2026', 42)],
    barData: [],
    splineData: [],
    lineData: [],
  });

  const [low, high] = getSharedDomain(rows);
  assert.ok(low < 42);
  assert.ok(high > 42);
});

test('normalizeSeries maps the series extremes onto the domain', () => {
  const rows = buildChartRows({
    areaData: [point('01.06.2026', 10), point('02.06.2026', 20), point('03.06.2026', 30)],
    barData: [point('01.06.2026', 1), point('02.06.2026', 2), point('03.06.2026', 3)],
    splineData: [point('01.06.2026', 100), point('02.06.2026', 150), point('03.06.2026', 200)],
    lineData: [point('01.06.2026', 1), point('02.06.2026', 1), point('03.06.2026', 1)],
  });

  const domain: [number, number] = [0, 100];
  assert.deepEqual(normalizeSeries(rows, 'cost', domain), [0, 50, 100]);
  assert.deepEqual(normalizeSeries(rows, 'roiConfirmed', domain), [0, 50, 100]);
  // Flat series collapse onto the middle of the domain instead of dividing by zero.
  assert.deepEqual(normalizeSeries(rows, 'conversions', domain), [50, 50, 50]);
});

test('getSeriesExtent ignores nulls and returns null for empty input', () => {
  assert.equal(getSeriesExtent([], 'cost'), null);
  assert.deepEqual(
    getSeriesExtent([{ date: 'x', cost: null }, { date: 'y', cost: 4 }, { date: 'z', cost: -2 }], 'cost'),
    { min: -2, max: 4 },
  );
});
