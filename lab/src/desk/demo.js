// Desk Signal demo (/lab/desk): the head's console, four example trader screens with the signal
// orb, the answer grid and the signal log, all in this tab. The logic is src/desk/signal.js; this
// file draws it, plays the sounds and stands in for the relay (delivery after a short delay).

import { BOARD, ESCALATION, checkBoard, createDesk, send, mark, level, inbox, summary, logRows, logCsv, logWorkbook, signalOf, isOpen, status } from './signal.js';
import { startTour } from '../tour.js';

const PEOPLE = [
  { id: 'mara', name: 'Mara', location: 'London', tz: 'Europe/London', key: 'q' },
  { id: 'omar', name: 'Omar', location: 'London', tz: 'Europe/London', key: 'w' },
  { id: 'kenji', name: 'Kenji', location: 'Tokyo', tz: 'Asia/Tokyo', key: 'e' },
  { id: 'leyla', name: 'Leyla', location: 'Istanbul', tz: 'Europe/Istanbul', key: 'r' },
];
const GROUPS = [
  { to: 'all', name: 'Everyone', note: 'All locations', key: 'a' },
  { to: 'loc:London', name: 'London', note: '2 traders', key: 's' },
  { to: 'loc:Tokyo', name: 'Tokyo', note: '1 trader', key: 'd' },
  { to: 'loc:Istanbul', name: 'Istanbul', note: '1 trader', key: 'f' },
];
const LOG_SHOWN = 15;

const $ = s => document.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const now = () => Date.now();

let desk = createDesk({ board: BOARD, people: PEOPLE, escalation: ESCALATION });
let armed = null, last = null, editing = false;
const plans = new Map();     // item id → { seen, done } times for traders answering on their own
const rung = new Map();      // item id → last time its sound played
const openCard = new Set();  // person ids whose card is open

// ------------------------------------------------------------------ sound
let audio = null;
const TONES = [880, 740, 660, 587, 523, 494, 440, 392, 349];
function ring(sig, urgent) {
  if (!$('#ses').checked) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const f = TONES[desk.board.indexOf(sig)] ?? 440, t = audio.currentTime;
    (urgent ? [0, 0.18] : [0]).forEach((d, i) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine'; o.frequency.value = i ? f * 1.25 : f;
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.16, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.16);
      o.connect(g).connect(audio.destination); o.start(t + d); o.stop(t + d + 0.18);
    });
  } catch { /* no audio in this browser */ }
}

// ------------------------------------------------------------------ head console
function drawBoard() {
  const box = $('#sinyaller');
  box.replaceChildren();
  for (const s of desk.board) {
    const b = el(editing ? 'div' : 'button', 'd-sinyal');
    b.style.setProperty('--c', s.colour);
    b.dataset.sinyal = s.id;
    if (!editing) {
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(armed === s.id));
      b.append(el('kbd', '', s.key), el('i', 'd-nokta'), el('span', 'd-anlam', s.label));
      if (s.sticky) b.append(el('em', '', 'Rings until answered'));
      b.onclick = () => arm(armed === s.id ? null : s.id);
    } else {
      const label = el('input'); label.value = s.label; label.maxLength = 40; label.setAttribute('aria-label', `Meaning of signal ${s.key}`);
      const sticky = el('label', 'd-anahtar'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = s.sticky; sticky.append(cb, ' Rings until answered');
      const apply = () => {
        const board = desk.board.map(x => (x.id === s.id ? { ...x, label: label.value, sticky: cb.checked } : x));
        const problems = checkBoard(board);
        $('#pano-hata').hidden = !problems.length;
        $('#pano-hata').textContent = problems[0] ?? '';
        label.classList.toggle('hatali', !!problems.length);
        if (!problems.length) desk.board = board.map(x => ({ ...x, label: x.label.trim() }));
      };
      label.oninput = apply; cb.onchange = apply;
      b.append(el('kbd', '', s.key), el('i', 'd-nokta'), label, sticky);
    }
    box.append(b);
  }
}

function arm(id) {
  armed = id;
  const sig = id && signalOf(desk, id);
  $('#silahli').textContent = sig ? `${sig.label}: now pick who gets it.` : 'Pick a signal first.';
  $('#hedefler').classList.toggle('hazir', !!sig);
  $('#hedefler').style.setProperty('--c', sig?.colour ?? 'var(--border-2)');
  document.querySelectorAll('#sinyaller [role=radio]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.sinyal === id)));
}

function drawTargets() {
  const target = (box, to, key, name, note) => {
    const b = el('button', 'd-hedef'); b.type = 'button'; b.dataset.to = to;
    b.append(el('kbd', '', key.toUpperCase()), el('b', '', name), el('span', '', note));
    b.onclick = () => fire(to);
    box.append(b);
  };
  PEOPLE.forEach(p => target($('#kisiler'), p.id, p.key, p.name, p.location));
  GROUPS.forEach(g => target($('#gruplar'), g.to, g.key, g.name, g.note));
}

function fire(to, signal = armed) {
  if (!signal) {
    $('#silahli').textContent = 'Pick a signal first: click one or press 1 to 5.';
    $('#sinyaller').classList.remove('uyar'); void $('#sinyaller').offsetWidth; $('#sinyaller').classList.add('uyar');
    return;
  }
  const at = now();
  const items = send(desk, { signal, to, at });
  last = { signal, to };
  const sig = signalOf(desk, signal);
  // Stand-in for the relay: each screen receives the signal a moment later.
  items.forEach(x => setTimeout(() => { if (mark(desk, x.id, 'delivered', now())) { ring(sig, sig.sticky); rung.set(x.id, now()); tick(); } }, 60 + Math.random() * 90));
  const names = items.map(x => PEOPLE.find(p => p.id === x.person).name);
  $('#duyuru').textContent = `${sig.label} sent to ${names.join(', ')}.`;
  document.querySelectorAll(`.d-hedef[data-to="${CSS.escape(to)}"]`).forEach(b => { b.classList.remove('gitti'); void b.offsetWidth; b.classList.add('gitti'); });
  tick();
}

// ------------------------------------------------------------------ trader screens
const clock = tz => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date());

function drawScreens() {
  const box = $('#ekranlar');
  for (const p of PEOPLE) {
    const s = el('article', 'd-ekran'); s.dataset.kisi = p.id;
    s.setAttribute('aria-label', `${p.name}'s screen, ${p.location}`);
    const bar = el('div', 'd-ekran-bas');
    bar.append(el('b', '', p.name), el('span', '', p.location), el('time', 'd-saat', clock(p.tz)));
    // A stand-in for the trader's own apps: shapes only, no prices.
    const app = el('div', 'd-uygulama'); app.setAttribute('aria-hidden', 'true');
    for (let k = 0; k < 3; k++) { const w = el('div', 'd-pencere'); for (let j = 0; j < 4; j++) w.append(el('i')); app.append(w); }
    const orb = el('button', 'd-orb'); orb.type = 'button';
    orb.append(el('span', 'd-rozet'));
    orb.onclick = () => toggleCard(p.id);
    const card = el('div', 'd-kart'); card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', `Signal for ${p.name}`);
    s.append(bar, app, orb, card);
    box.append(s);
  }
}

function toggleCard(personId) {
  if (openCard.has(personId)) { openCard.delete(personId); tick(); return; }
  const top = inbox(desk, personId)[0];
  if (!top) return;
  openCard.add(personId);
  mark(desk, top.id, 'seen', now());
  tick();
  document.querySelector(`.d-ekran[data-kisi="${personId}"] .d-kart button`)?.focus({ preventScroll: true });
}

function done(personId) {
  const top = inbox(desk, personId)[0];
  if (top) mark(desk, top.id, 'done', now());
  const next = inbox(desk, personId)[0];
  if (next) mark(desk, next.id, 'seen', now());
  else { openCard.delete(personId); document.querySelector(`.d-ekran[data-kisi="${personId}"] .d-orb`)?.focus({ preventScroll: true }); }
  tick();
}

const ago = ms => (ms < 60_000 ? `${Math.max(0, Math.floor(ms / 1000))} s ago` : `${Math.floor(ms / 60_000)} min ago`);

function drawScreen(p, t) {
  const s = document.querySelector(`.d-ekran[data-kisi="${p.id}"]`);
  const list = inbox(desk, p.id).filter(x => x.times.delivered != null);
  const top = list[0], sig = top && signalOf(desk, top.signal), lv = top ? Math.max(...list.map(x => level(desk, x, t))) : 0;
  const orb = s.querySelector('.d-orb'), card = s.querySelector('.d-kart');
  s.classList.toggle('l2', lv === 2);
  orb.className = 'd-orb' + (top ? (top.times.seen == null ? ' acik' : ' goruldu') : '') + (lv ? ` l${lv}` : '');
  orb.style.setProperty('--c', sig?.colour ?? 'transparent');
  orb.querySelector('.d-rozet').textContent = list.length > 1 ? String(list.length) : '';
  orb.setAttribute('aria-label', top ? `${sig.label}, from the head of desk. ${list.length > 1 ? `${list.length} signals waiting. ` : ''}Open` : `No signals for ${p.name}`);
  s.querySelector('.d-saat').textContent = clock(p.tz);
  const show = !!top && openCard.has(p.id);
  card.hidden = !show;
  if (!show) { if (!top) openCard.delete(p.id); return; }
  const key = `${top.id}|${sig.label}|${list.length}|${Math.floor((t - top.times.sent) / 1000)}`;
  if (card.dataset.key === key) return;
  card.dataset.key = key;
  card.style.setProperty('--c', sig.colour);
  const head = el('p', 'd-kart-bas'); head.append(el('i', 'd-nokta'), el('b', '', sig.label));
  const meta = el('p', 'd-kart-alt', `From the head of desk · ${ago(t - top.times.sent)}`);
  const row = el('div', 'd-kart-eylem');
  const b = el('button', 'dugme', 'Done'); b.type = 'button'; b.onclick = () => done(p.id);
  row.append(b);
  if (list.length > 1) row.append(el('span', 'dipnot', `${list.length - 1} more waiting`));
  const hadFocus = card.contains(document.activeElement);
  card.replaceChildren(head, meta, row);
  if (hadFocus) b.focus({ preventScroll: true });
}

// ------------------------------------------------------------------ grid and log
const dur = ms => (ms == null ? '' : ms < 60_000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60_000)} min ${String(Math.round((ms % 60_000) / 1000)).padStart(2, '0')} s`);

function setRows(table, head, rows) {
  const key = JSON.stringify(rows.map(r => r.map(c => (c instanceof Node ? c.outerHTML : c))));
  if (table.dataset.key === key) return;
  table.dataset.key = key;
  const thead = el('thead'), tr = el('tr');
  head.forEach(h => tr.append(el('th', '', h)));
  thead.append(tr);
  const tbody = el('tbody');
  rows.forEach(r => { const row = el('tr'); if (r.cls) row.className = r.cls; r.forEach(c => { const td = el('td'); c instanceof Node ? td.append(c) : (td.textContent = c); row.append(td); }); tbody.append(row); });
  table.replaceChildren(thead, tbody);
}

const chip = (sig, text = sig.label) => { const c = el('span', 'd-cip'); c.style.setProperty('--c', sig.colour); c.append(el('i', 'd-nokta'), el('span', '', text)); return c; };
const pill = (text, cls) => el('span', `d-durum ${cls}`, text);

function drawGrid(t) {
  const rows = summary(desk, t).map(r => {
    const p = PEOPLE.find(x => x.id === r.person);
    const ringing = desk.items.some(x => x.person === r.person && isOpen(x) && x.times.seen == null && signalOf(desk, x.signal).sticky);
    const st = r.headTold ? pill('Not answering', 'kotu') : ringing ? pill('Ringing', 'uyari') : r.unseen ? pill('Not seen yet', 'notr') : r.open ? pill('Working on it', 'notr') : pill('Clear', 'iyi');
    const row = [r.name, r.location, clock(p.tz), String(r.open), String(r.unseen), dur(r.avgSeenMs) || '·', dur(r.avgDoneMs) || '·', st];
    if (r.headTold) row.cls = 'kotu';
    return row;
  });
  setRows($('#yanit'), ['Trader', 'Location', 'Local time', 'Waiting', 'Not seen', 'Avg time to see', 'Avg time to done', 'Status'], rows);
}

const STATUS_TEXT = { sent: 'Sent', delivered: 'Delivered', seen: 'Seen', done: 'Done', cancelled: 'Cancelled' };
const local = ms => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(ms));

function drawLog(t) {
  const n = desk.items.length;
  $('#kayit').hidden = !n; $('#kayit-bos').hidden = !!n;
  ['#csv-indir', '#xlsx-indir', '#temizle'].forEach(s => { $(s).disabled = !n; });
  if (!n) return;
  const items = [...desk.items].sort((a, b) => b.times.sent - a.times.sent).slice(0, LOG_SHOWN);
  const rows = items.map(x => {
    const sig = signalOf(desk, x.signal), p = PEOPLE.find(q => q.id === x.person), st = status(x);
    let action = '';
    if (isOpen(x)) { action = el('button', 'kucuk sil', 'Cancel'); action.type = 'button'; action.dataset.iptal = x.id; }
    const seen = x.times.seen == null ? '' : dur(x.times.seen - x.times.sent), fin = x.times.done == null ? '' : dur(x.times.done - x.times.sent);
    const row = [local(x.times.sent), chip(sig), `${p.name}, ${p.location}`, pill(STATUS_TEXT[st], st === 'done' ? 'iyi' : st === 'cancelled' ? 'notr' : level(desk, x, t) === 2 ? 'kotu' : 'uyari'), seen, fin, action];
    return row;
  });
  setRows($('#kayit'), ['Sent', 'Signal', 'To', 'Status', 'Seen after', 'Done after', ''], rows);
  const more = $('#kayit-daha') ?? (() => { const p = el('p', 'dipnot'); p.id = 'kayit-daha'; $('#kayit').closest('.tablo-kutu').after(p); return p; })();
  more.textContent = n > LOG_SHOWN ? `Showing the latest ${LOG_SHOWN} of ${n}. The downloads have every signal.` : '';
}

// ------------------------------------------------------------------ traders answering on their own
function autoAnswer(t) {
  if (!$('#oto').checked) return;
  for (const x of desk.items) {
    if (!isOpen(x) || x.times.delivered == null) continue;
    if (!plans.has(x.id)) {
      const urgent = signalOf(desk, x.signal).sticky;
      const seen = t + (urgent ? 1500 + Math.random() * 6000 : 3000 + Math.random() * 9000);
      plans.set(x.id, { seen, done: seen + 2500 + Math.random() * 9000 });
    }
    const plan = plans.get(x.id);
    if (x.times.seen == null && t >= plan.seen) mark(desk, x.id, 'seen', t);
    if (x.times.seen != null && t >= plan.done) mark(desk, x.id, 'done', t);
  }
}

// Urgent signals that nobody has seen ring again, faster once they have grown.
function ringAgain(t) {
  let best = null;
  for (const x of desk.items) {
    const sig = signalOf(desk, x.signal);
    if (!sig.sticky || !isOpen(x) || x.times.seen != null || x.times.delivered == null) continue;
    const every = level(desk, x, t) ? 1500 : 3000;
    if (t - (rung.get(x.id) ?? 0) >= every && (!best || desk.board.indexOf(sig) < desk.board.indexOf(signalOf(desk, best.signal)))) best = x;
  }
  if (best) { ring(signalOf(desk, best.signal), true); rung.set(best.id, t); }
}

function tick() {
  const t = now();
  autoAnswer(t);
  ringAgain(t);
  PEOPLE.forEach(p => drawScreen(p, t));
  drawGrid(t);
  drawLog(t);
}

// ------------------------------------------------------------------ downloads, keys, tour
function download(bytes, name, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = el('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const stamp = () => new Date().toISOString().slice(0, 10);

$('#csv-indir').onclick = () => download(logCsv(desk), `desk-signal-log-${stamp()}.csv`, 'text/csv');
$('#xlsx-indir').onclick = () => download(logWorkbook(desk), `desk-signal-log-${stamp()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
$('#temizle').onclick = () => { desk = createDesk({ board: desk.board, people: PEOPLE, escalation: ESCALATION }); plans.clear(); rung.clear(); openCard.clear(); last = null; tick(); };
$('#kayit').addEventListener('click', e => { const id = e.target.closest('[data-iptal]')?.dataset.iptal; if (id) { mark(desk, id, 'cancelled', now()); tick(); } });
$('#pano-duzenle').onclick = () => {
  editing = !editing;
  $('#pano-duzenle').textContent = editing ? 'Done editing' : 'Edit signals';
  $('#pano-duzenle').setAttribute('aria-pressed', String(editing));
  if (!editing) $('#pano-hata').hidden = true;
  drawBoard(); arm(armed);
};

document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.tour-panel')) return;
  const on = e.target instanceof Element ? e.target : document.body;
  if (on.closest('input, textarea, select')) return;
  const k = e.key.toLowerCase();
  const sig = desk.board.find(s => s.key === k);
  const target = PEOPLE.find(p => p.key === k)?.id ?? GROUPS.find(g => g.key === k)?.to;
  if (sig && !editing) { arm(sig.id); e.preventDefault(); }
  else if (target) { fire(target); e.preventDefault(); }
  else if (k === 'enter' && last && !on.closest('button, a')) { fire(last.to, last.signal); e.preventDefault(); }
  else if (k === 'escape') { arm(null); openCard.clear(); tick(); }
});

const TOUR = [
  { target: '#sinyaller', title: 'Your signal board', text: 'Each colour has one meaning your desk agrees on. Red and amber keep ringing until the trader answers. Edit the meanings to match your desk.' },
  { target: '#hedefler', title: 'Pick who gets it', text: 'One trader, one city or everyone. With the keyboard it is two keys: 2 then Q sends Call me to Mara.', before: () => arm('call') },
  { target: '.d-ekran[data-kisi="mara"]', title: 'On the trader\'s screen', text: 'The orb in the corner lights up in the signal colour. The trader clicks it, reads the meaning and presses Done.', before: () => { if (!desk.items.some(x => x.person === 'mara' && isOpen(x))) fire('mara', 'call'); } },
  { target: '#yanit-kart', title: 'Who has answered', text: 'Time to see and time to done for every trader. A red row means an urgent signal has waited 20 seconds unseen.' },
  { target: '#kayit-kart', title: 'Every signal is logged', text: 'Sent, delivered, seen and done, to the second, in UTC. Download the log as CSV or Excel for your records.' },
];
const tour = () => startTour(TOUR);
$('#tur-baslat').onclick = tour;

$('#esik-1').textContent = String(ESCALATION.growMs / 1000);
$('#esik-2').textContent = String(ESCALATION.notifyMs / 1000);
// ?scene=1 opens a desk mid-session (used for the product page pictures): one urgent signal
// waiting too long in Tokyo, one being read in London, the rest answered.
function scene() {
  const t = now(), at = (signal, to, ago) => send(desk, { signal, to, at: t - ago });
  const step = (items, delivered, seen, finished) => items.forEach(x => { mark(desk, x.id, 'delivered', x.times.sent + delivered); if (seen) mark(desk, x.id, 'seen', x.times.sent + seen); if (finished) mark(desk, x.id, 'done', x.times.sent + finished); });
  step(at('go', 'leyla', 95_000), 90, 3_400, 11_200);
  const london = at('client', 'loc:London', 61_000);
  step(london.slice(0, 1), 80, 2_100, 9_800);
  step(london.slice(1), 110, 6_300, 14_500);
  step(at('square', 'omar', 40_000), 70, 2_900, 0);
  step(at('risk', 'kenji', 34_000), 95, 0, 0);
  step(at('call', 'mara', 5_000), 85, 1_800, 0);
  openCard.add('mara');
  arm('call');
  $('#ses').checked = false;
}

drawBoard(); drawTargets(); drawScreens(); arm(null);
const params = new URLSearchParams(location.search);
if (params.get('scene') === '1') scene();
tick();
setInterval(tick, 250);
if (params.get('tour') === '1') setTimeout(tour, 400);
