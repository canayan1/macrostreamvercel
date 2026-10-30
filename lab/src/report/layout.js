// Layout helpers for the sample result workbooks, in the spirit of a Tableau dashboard: one
// overview sheet first (title, KPI tiles, a 2 x 2 grid of charts), then tidy data sheets that the
// charts read from (header row, number formats, totals, filters, frozen header).

import { absRange, cellRef, PALETTE } from './xlsx-writer.js';

const TILE_COLS = 2;          // each KPI tile spans two columns
const FIRST_COL = 1;          // column A is a narrow margin
const CHART_ROWS = 17;

// Dashboard sheet. kpis: [{ label, value, style }] (up to 6); charts: up to 4 chart specs without
// positions; notes: lines of small text under the charts.
export function dashboard({ name, title, subtitle, kpis, charts, notes = [] }) {
  const width = FIRST_COL + 6 * TILE_COLS;
  const rows = Array.from({ length: 8 }, () => Array(width).fill(null));
  rows[0][FIRST_COL] = { v: title, s: 'title' };
  rows[1][FIRST_COL] = { v: subtitle, s: 'subtitle' };
  const merges = [];
  kpis.slice(0, 6).forEach((k, i) => {
    const c = FIRST_COL + i * TILE_COLS;
    for (let j = 0; j < TILE_COLS; j++) {
      rows[3][c + j] = { v: j ? null : k.label, s: 'kpiLabel' };
      rows[4][c + j] = { v: j ? null : k.value, s: k.style ?? 'kpiValue' };
    }
    merges.push(`${cellRef(c, 3)}:${cellRef(c + TILE_COLS - 1, 3)}`, `${cellRef(c, 4)}:${cellRef(c + TILE_COLS - 1, 4)}`);
  });
  const top = 6, half = FIRST_COL + 3 * TILE_COLS;
  const placed = charts.slice(0, 4).map((ch, i) => {
    const row = top + Math.floor(i / 2) * (CHART_ROWS + 1);
    const col = i % 2 ? half : FIRST_COL;
    return { ...ch, from: [col, row], to: [col + 3 * TILE_COLS, row + CHART_ROWS] };
  });
  const notesRow = top + Math.ceil(Math.min(4, charts.length) / 2) * (CHART_ROWS + 1);
  while (rows.length < notesRow + notes.length + 1) rows.push(Array(width).fill(null));
  notes.forEach((n, i) => {
    rows[notesRow + i][FIRST_COL] = { v: n, s: 'note' };
    merges.push(`${cellRef(FIRST_COL, notesRow + i)}:${cellRef(width - 1, notesRow + i)}`);
  });
  return {
    name, rows, merges, charts: placed, grid: false, tab: PALETTE.blue,
    cols: [2, ...Array(6 * TILE_COLS).fill(11.5)],
    heights: { 0: 28, 1: 16, 3: 18, 4: 30 },
  };
}

// Data sheet. columns: [{ header, width, style, numeric }]; rows: arrays of raw values (strings,
// numbers or { date }); total: optional array for a totals row (null cells left blank).
export function table({ name, columns, rows, total = null, title = null }) {
  const offset = title ? 2 : 0;
  const out = [];
  if (title) out.push([{ v: title, s: 'section' }], []);
  out.push(columns.map(c => ({ v: c.header, s: c.numeric ? 'headerNum' : 'header' })));
  for (const r of rows) out.push(r.map((v, i) => (v && typeof v === 'object' && !('date' in v) ? v : { ...(v && typeof v === 'object' ? v : { v }), s: columns[i]?.style })));
  if (total) out.push(total.map((v, i) => ({ v: v ?? '', s: i === 0 ? 'totalText' : totalStyle(columns[i]?.style) })));
  const last = offset + rows.length;
  return {
    // Column width leaves room for the header text and its filter button.
    name, rows: out, cols: columns.map(c => Math.max(c.width ?? 14, Math.ceil(String(c.header).length * 1.05) + 5)), freeze: { rows: offset + 1 }, tab: 'C7CDD6',
    filter: rows.length ? `${cellRef(0, offset)}:${cellRef(columns.length - 1, last)}` : undefined,
    heights: { [offset]: 30 },
    // helpers for charts: column ranges of the data rows (header excluded, totals excluded)
    range: col => absRange(col, offset + 1, col, last),
  };
}

const totalStyle = s => ({ pnl: 'totalPnl', pnl2: 'totalPnl2', int: 'totalInt', money: 'totalPnl2' }[s] ?? 'totalText');

// Bar colours by sign, the way Tableau shows diverging measures.
export const signColors = values => values.map(v => (v < 0 ? PALETTE.red : PALETTE.blue));
