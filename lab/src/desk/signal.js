// Desk Signal core: the signal board, the life of each signal and the audit log. Plain functions
// over a plain desk object, with every time passed in (epoch ms), so the browser demo, the relay
// client and the tests run the same code.
//
// createDesk({ board, people, escalation }) → desk
// send(desk, { signal, to, at, from }) → items       to: 'all' | 'loc:<location>' | person id | array of those
// mark(desk, itemId, state, at) → true when the item moved   state: delivered | seen | done | cancelled
// level(desk, item, now) → 0 quiet, 1 grown (sticky, unseen past growMs), 2 head told (past notifyMs)
// inbox(desk, personId) → open items, highest priority first
// summary(desk, now) → one row per person: open, waiting on the head, average seen and done times
// logRows(desk) / logCsv(desk) / logWorkbook(desk) → the audit log

import { workbook } from '../report/xlsx-writer.js';
import { table } from '../report/layout.js';

// Board order is priority order: the first signal outranks the rest.
export const BOARD = [
  { id: 'risk', key: '1', label: 'Cut risk now', colour: '#ef4444', sticky: true },
  { id: 'call', key: '2', label: 'Call me', colour: '#ffa630', sticky: true },
  { id: 'go', key: '3', label: 'Go on the pending ticket', colour: '#4ade80', sticky: false },
  { id: 'client', key: '4', label: 'Check your client', colour: '#60a5fa', sticky: false },
  { id: 'square', key: '5', label: 'Square up before the close', colour: '#a78bfa', sticky: true },
];
export const ESCALATION = { growMs: 10_000, notifyMs: 20_000 };
export const LIMITS = { signals: 9, label: 40 };
const ORDER = ['sent', 'delivered', 'seen', 'done'];

// Returns a list of problems with a board; empty when it can be used.
export function checkBoard(board) {
  const out = [];
  if (!Array.isArray(board) || !board.length) return ['The board needs at least one signal.'];
  if (board.length > LIMITS.signals) out.push(`A board holds up to ${LIMITS.signals} signals.`);
  const ids = new Set(), keys = new Set();
  board.forEach((s, i) => {
    const n = `Signal ${i + 1}`;
    if (!s.id || ids.has(s.id)) out.push(`${n} needs its own id.`);
    if (!/^[1-9]$/.test(s.key ?? '') || keys.has(s.key)) out.push(`${n} needs its own key from 1 to 9.`);
    const label = String(s.label ?? '').trim();
    if (!label) out.push(`${n} needs a meaning.`);
    else if (label.length > LIMITS.label) out.push(`${n}: keep the meaning under ${LIMITS.label} characters.`);
    if (!/^#[0-9a-f]{6}$/i.test(s.colour ?? '')) out.push(`${n} needs a colour like #ffa630.`);
    ids.add(s.id); keys.add(s.key);
  });
  return out;
}

export function createDesk({ board = BOARD, people = [], escalation = ESCALATION } = {}) {
  const problems = checkBoard(board);
  if (problems.length) throw new Error(problems[0]);
  return { board: board.map(s => ({ ...s, label: s.label.trim() })), people: people.map(p => ({ ...p })), escalation: { ...escalation }, items: [], seq: 0 };
}

export const signalOf = (desk, id) => desk.board.find(s => s.id === id);
const rank = (desk, id) => desk.board.findIndex(s => s.id === id);

export function recipients(desk, to) {
  const ids = new Set();
  for (const t of [].concat(to)) {
    if (t === 'all') desk.people.forEach(p => ids.add(p.id));
    else if (typeof t === 'string' && t.startsWith('loc:')) desk.people.filter(p => p.location === t.slice(4)).forEach(p => ids.add(p.id));
    else if (desk.people.some(p => p.id === t)) ids.add(t);
    else throw new Error(`No one on the desk is called ${t}.`);
  }
  return [...ids];
}

export function send(desk, { signal, to, at, from = 'Head of desk' }) {
  if (!signalOf(desk, signal)) throw new Error(`The board has no signal ${signal}.`);
  if (!Number.isFinite(at)) throw new Error('A signal needs a send time.');
  return recipients(desk, to).map(person => {
    const item = { id: `s${++desk.seq}`, signal, person, from, times: { sent: at } };
    desk.items.push(item);
    return item;
  });
}

// Moves an item forward. Later states imply the earlier ones (seen implies delivered), times only
// fill in once, and nothing moves after done or cancelled.
export function mark(desk, itemId, state, at) {
  const item = desk.items.find(x => x.id === itemId);
  if (!item || !Number.isFinite(at)) return false;
  if (item.times.done != null || item.times.cancelled != null) return false;
  if (state === 'cancelled') { item.times.cancelled = Math.max(at, item.times.sent); return true; }
  const target = ORDER.indexOf(state);
  if (target < 1) return false;
  let moved = false;
  for (let k = 1; k <= target; k++) {
    const s = ORDER[k];
    if (item.times[s] == null) { item.times[s] = Math.max(at, item.times.sent); moved = true; }
  }
  return moved;
}

export const status = item => (item.times.cancelled != null ? 'cancelled' : ORDER.filter(s => item.times[s] != null).pop());
export const isOpen = item => item.times.done == null && item.times.cancelled == null;

export function level(desk, item, now) {
  const sig = signalOf(desk, item.signal);
  if (!sig?.sticky || !isOpen(item) || item.times.seen != null) return 0;
  const waited = now - item.times.sent;
  return waited >= desk.escalation.notifyMs ? 2 : waited >= desk.escalation.growMs ? 1 : 0;
}

export const inbox = (desk, personId) => desk.items
  .filter(x => x.person === personId && isOpen(x))
  .sort((a, b) => rank(desk, a.signal) - rank(desk, b.signal) || a.times.sent - b.times.sent);

const after = (item, state) => (item.times[state] == null ? null : item.times[state] - item.times.sent);
const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

export function summary(desk, now) {
  return desk.people.map(p => {
    const mine = desk.items.filter(x => x.person === p.id);
    const open = mine.filter(isOpen);
    return {
      person: p.id, name: p.name, location: p.location,
      open: open.length,
      unseen: open.filter(x => x.times.seen == null).length,
      headTold: open.filter(x => level(desk, x, now) === 2).length,
      avgSeenMs: mean(mine.map(x => after(x, 'seen')).filter(x => x != null)),
      avgDoneMs: mean(mine.map(x => after(x, 'done')).filter(x => x != null)),
    };
  });
}

// ------------------------------------------------------------------ audit log
const iso = t => (t == null ? '' : new Date(t).toISOString());
const secs = ms => (ms == null ? '' : Math.round(ms / 100) / 10);
export const LOG_COLUMNS = ['Signal ID', 'Key', 'Meaning', 'From', 'To', 'Location', 'Sent (UTC)', 'Delivered (UTC)', 'Seen (UTC)', 'Done (UTC)', 'Cancelled (UTC)', 'Seen after (s)', 'Done after (s)', 'Status'];

export function logRows(desk) {
  return [...desk.items].sort((a, b) => a.times.sent - b.times.sent || a.id.localeCompare(b.id, 'en', { numeric: true })).map(x => {
    const sig = signalOf(desk, x.signal), p = desk.people.find(q => q.id === x.person);
    return [x.id, sig.key, sig.label, x.from, p?.name ?? x.person, p?.location ?? '', iso(x.times.sent), iso(x.times.delivered), iso(x.times.seen), iso(x.times.done), iso(x.times.cancelled), secs(after(x, 'seen')), secs(after(x, 'done')), status(x)];
  });
}

const csvCell = v => { const s = String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const logCsv = desk => [LOG_COLUMNS, ...logRows(desk)].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

export function logWorkbook(desk, { title = 'Desk Signal log' } = {}) {
  const numeric = new Set(['Seen after (s)', 'Done after (s)']);
  const sheet = table({
    name: 'Signal log',
    columns: LOG_COLUMNS.map(h => ({ header: h, width: h.includes('UTC') ? 24 : h === 'Meaning' ? 28 : 12, numeric: numeric.has(h) })),
    rows: logRows(desk).map(r => r.map(v => (v === '' ? null : v))),
  });
  return workbook({ title, sheets: [sheet] });
}
