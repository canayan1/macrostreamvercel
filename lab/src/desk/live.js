// Desk Signal, live desk: rebuilds the desk from the relay's opened records. Every browser on the
// desk replays the same records in the same order, so the head and each trader agree on who got
// what and when. Times are the relay's clock (record ts), never a browser's.
//
// Events (payload.t):
//   board   head  { name, board, escalation }      the desk name and its signals
//   join    any   { id, name, location }           a trader joins or updates their name
//   remove  head  { id }                           takes a trader off the desk, closes their signals
//   send    head  { signal, items: [{ id, person }] }
//   mark    any   { item, state }                  delivered | seen | done, only by the item's trader
//   cancel  head  { item }
//
// Head events count only when the head's signature checks out (record.head, from kasa.js).

import { BOARD, ESCALATION, checkBoard, createDesk, signalOf, mark, isOpen } from './signal.js';

export const LIMITS = { people: 50, name: 40, location: 30, items: 100 };
const ID = /^[0-9a-f]{16}$/;
const ITEM = /^s[0-9]{1,9}$/;
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, n);

export function emptyLive() {
  return { name: '', desk: createDesk({ board: BOARD, people: [], escalation: ESCALATION }), last: 0, removed: new Set(), former: [] };
}

// Applies one opened record. Returns true when it changed something.
export function apply(live, { q, ts, ev, head }) {
  if (!Number.isInteger(q) || q <= live.last || !Number.isFinite(ts)) return false;
  live.last = q;
  const d = live.desk;
  switch (ev.t) {
    case 'board': {
      if (!head || checkBoard(ev.board).length) return false;
      d.board = ev.board.map(s => ({ id: String(s.id), key: String(s.key), label: clean(s.label, 40), colour: s.colour, sticky: !!s.sticky }));
      if (ev.escalation && ev.escalation.growMs > 0 && ev.escalation.notifyMs >= ev.escalation.growMs) d.escalation = { growMs: ev.escalation.growMs, notifyMs: ev.escalation.notifyMs };
      live.name = clean(ev.name, LIMITS.name) || live.name;
      return true;
    }
    case 'join': {
      if (!ID.test(ev.id ?? '') || live.removed.has(ev.id)) return false;
      const name = clean(ev.name, LIMITS.name), location = clean(ev.location, LIMITS.location);
      if (!name) return false;
      const p = d.people.find(x => x.id === ev.id);
      if (p) { const changed = p.name !== name || p.location !== location; Object.assign(p, { name, location }); return changed; }
      if (d.people.length >= LIMITS.people) return false;
      d.people.push({ id: ev.id, name, location: location || 'Desk', joined: ts });
      return true;
    }
    case 'remove': {
      if (!head || !ID.test(ev.id ?? '')) return false;
      live.removed.add(ev.id);
      live.former.push(...d.people.filter(p => p.id === ev.id));
      d.people = d.people.filter(p => p.id !== ev.id);
      d.items.filter(x => x.person === ev.id && isOpen(x)).forEach(x => mark(d, x.id, 'cancelled', ts));
      return true;
    }
    case 'send': {
      if (!head || !signalOf(d, ev.signal) || !Array.isArray(ev.items) || ev.items.length > LIMITS.items) return false;
      let added = false;
      for (const it of ev.items) {
        if (!ITEM.test(it?.id ?? '') || !ID.test(it.person ?? '') || d.items.some(x => x.id === it.id)) continue;
        d.items.push({ id: it.id, signal: ev.signal, person: it.person, from: 'Head of desk', times: { sent: ts } });
        added = true;
      }
      return added;
    }
    case 'mark': {
      const item = d.items.find(x => x.id === ev.item);
      if (!item || ev.by !== item.person || !['delivered', 'seen', 'done'].includes(ev.state)) return false;
      return mark(d, item.id, ev.state, ts);
    }
    case 'cancel': {
      if (!head) return false;
      return mark(d, ev.item, 'cancelled', ts);
    }
    default: return false;
  }
}

// The desk as the audit log should see it: traders taken off the desk keep their names.
export const logDesk = live => ({ ...live.desk, people: [...live.desk.people, ...live.former] });

// The next signal id the head can use: one past the highest seen.
export const nextItemId = (live, k = 0) => `s${live.desk.items.reduce((m, x) => Math.max(m, Number(x.id.slice(1)) || 0), 0) + 1 + k}`;

// Keys for the head's console: the first ten traders get Q to P, locations get S to L, A is everyone.
const PERSON_KEYS = 'qwertyuiop', GROUP_KEYS = 'sdfghjkl';
export function targets(live) {
  const people = [...live.desk.people].sort((a, b) => a.joined - b.joined).map((p, i) => ({ ...p, key: PERSON_KEYS[i] ?? '' }));
  const locs = [...new Set(people.map(p => p.location))].sort();
  const groups = [{ to: 'all', name: 'Everyone', note: `${people.length} ${people.length === 1 ? 'trader' : 'traders'}`, key: 'a' }];
  locs.forEach((l, i) => { const n = people.filter(p => p.location === l).length; groups.push({ to: `loc:${l}`, name: l, note: `${n} ${n === 1 ? 'trader' : 'traders'}`, key: GROUP_KEYS[i] ?? '' }); });
  return { people, groups };
}
