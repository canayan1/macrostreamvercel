// Desk Signal, live desk (/lab/desk-live). One page, three views chosen by the #fragment:
//   (none)            start a desk or join one
//   #head=<channel>   the head's console; the desk code and head key come from this browser's storage
//   #join=<invite>    a trader's screen; the invite carries the desk code and the head's public key
// The desk state is rebuilt from relay records (live.js); this file draws it, plays the sounds,
// shows notifications and keeps the always-on-top orb window.

import { ESCALATION, checkBoard, recipients, signalOf, level, inbox, summary, isOpen, status, logCsv, logWorkbook } from './signal.js';
import { newCode, deskKeys, newHeadKey, sealEvent, openRecord, inviteOf, parseInvite } from './kasa.js';
import { emptyLive, apply, nextItemId, targets, logDesk } from './live.js';
import { post, fetchAfter, online, listen } from './relay.js';
import { decode, controlId, toPercent, takeover, learn, padLights } from './midi.js';
import { FIELDS, cleanPolicy, effective as limitsFor, changes, changeText, describe } from './limits.js';

const $ = s => document.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');

// ------------------------------------------------------------------ storage (this browser only)
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full or blocked: the relay still has the records */ } },
};
const HEADS = 'deskSignal.heads';
const memberKey = ch => `deskSignal.member.${ch}`;
const logKey = ch => `deskSignal.log.${ch}`;
const KEEP_LOCAL = 3000;

// ------------------------------------------------------------------ sound
let audio = null;
const TONES = [880, 740, 660, 587, 523, 494, 440, 392, 349];
const soundOn = () => (S.role === 'head' ? $('#ses') : $('#trader-ses')).checked;
function unlockAudio() {
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch { /* no audio */ }
  $('#ses-uyari').hidden = true;
}
function tone(freq, urgent) {
  if (!soundOn() || !audio || audio.state !== 'running') return;
  const t = audio.currentTime;
  (urgent ? [0, 0.18] : [0]).forEach((d, i) => {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine'; o.frequency.value = i ? freq * 1.25 : freq;
    g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.2, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.16);
    o.connect(g).connect(audio.destination); o.start(t + d); o.stop(t + d + 0.18);
  });
}
const ring = (sig, urgent) => tone(TONES[S.live.desk.board.indexOf(sig)] ?? 440, urgent);
document.addEventListener('pointerdown', unlockAudio);
document.addEventListener('keydown', unlockAudio);

function notify(title, body, { tag, sticky, onclick } = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body, tag, requireInteraction: !!sticky, renotify: true });
    n.onclick = () => { window.focus(); onclick?.(); n.close(); };
  } catch { /* some browsers only notify from a service worker */ }
}

// ------------------------------------------------------------------ session and records
const S = { role: null, channel: '', keys: null, publicKey: '', privateJwk: null, member: null, live: emptyLive(), records: [], status: 'connecting', booting: true, onlineMap: {} };

async function openAll(recs) {
  let changed = false;
  for (const rec of recs) {
    if (!(rec?.q > S.live.last)) continue;
    const opened = await openRecord(S.keys, S.publicKey, rec);
    if (opened) changed = apply(S.live, opened) || changed;
    else S.live.last = rec.q; // not for this desk key: skip it
    S.records.push(rec);
  }
  return changed;
}

let chain = Promise.resolve();
function ingest(recs) {
  chain = chain.then(async () => {
    let list = recs.filter(r => r.q > S.live.last).sort((a, b) => a.q - b.q);
    if (!list.length) return;
    if (list[0].q > S.live.last + 1) {
      // A gap: fetch what the stream missed, then apply everything in order.
      try { const r = await fetchAfter(S.channel, S.live.last); const have = new Set(list.map(x => x.q)); list = [...list, ...r.records.filter(x => !have.has(x.q))].sort((a, b) => a.q - b.q); } catch { /* apply what we have */ }
    }
    const changed = await openAll(list);
    store.set(logKey(S.channel), S.records.slice(-KEEP_LOCAL));
    if (changed) afterChange();
  }).catch(() => {});
  return chain;
}

async function send(payload, signed) {
  return post(S.channel, await sealEvent(S.keys, payload, signed ? S.privateJwk : null));
}

async function boot() {
  S.keys = await deskKeys(S.code);
  S.channel = S.keys.channel;
  S.records = [];
  await openAll(store.get(logKey(S.channel), []));
  try {
    const r = await fetchAfter(S.channel, S.live.last);
    if (r.last < S.live.last) {
      // The relay forgot this desk (30 quiet days): start again from what it has.
      S.live = emptyLive(); S.records = [];
      await openAll((await fetchAfter(S.channel, 0)).records);
    } else await openAll(r.records);
    store.set(logKey(S.channel), S.records.slice(-KEEP_LOCAL));
  } catch (e) { showError(e.message); }
  S.booting = false;
  listen(S.channel, { after: () => S.live.last, onRecords: ingest, onStatus: st => { S.status = st; drawStatus(); } });
  const ping = async () => { try { S.onlineMap = (await online(S.channel, S.member?.id ?? '')).online; if (S.role === 'trader') traderChanged(); } catch { /* next time */ } };
  ping(); setInterval(ping, S.role === 'head' ? 15_000 : 30_000);
  afterChange();
}

function drawStatus() {
  const box = $('#baglanti'); box.hidden = false;
  const txt = { live: 'Live', connecting: 'Reconnecting', polling: 'Live (slower link)' }[S.status] ?? 'Connecting';
  box.dataset.durum = S.status;
  box.querySelector('span').textContent = txt;
}

function showError(msg) {
  const box = S.role === 'head' ? $('#gonder-hata') : $('#trader-hata');
  box.hidden = !msg; box.textContent = msg ?? '';
}

function afterChange() { if (S.role === 'head') headChanged(); else traderChanged(); tick(); }

// ------------------------------------------------------------------ start view
function startView() {
  $('#baslangic').hidden = false;
  const heads = store.get(HEADS, {});
  const list = Object.entries(heads);
  $('#masalarim').hidden = !list.length;
  $('#masa-liste').replaceChildren(...list.map(([ch, h]) => { const li = el('li'); const a = el('a', '', h.name || 'Desk'); a.href = `/lab/desk-live#head=${ch}`; li.append(a); return li; }));
  $('#kur').onsubmit = async e => {
    e.preventDefault();
    const name = $('#kur-ad').value.trim();
    if (!name) return;
    const code = newCode(), head = await newHeadKey(), keys = await deskKeys(code);
    store.set(HEADS, { ...store.get(HEADS, {}), [keys.channel]: { code, publicKey: head.publicKey, privateJwk: head.privateJwk, name, created: Date.now() } });
    try { await post(keys.channel, await sealEvent(keys, { t: 'board', name, board: emptyLive().desk.board, escalation: ESCALATION }, head.privateJwk)); }
    catch (err) { $('#kur-hata').hidden = false; $('#kur-hata').textContent = err.message; return; }
    location.hash = `head=${keys.channel}`;
  };
  $('#katil').onsubmit = e => {
    e.preventDefault();
    const raw = $('#katil-baglanti').value.trim();
    const inv = raw.includes('join=') ? raw.slice(raw.indexOf('join=') + 5) : raw;
    try { parseInvite(inv); location.hash = `join=${inv}`; }
    catch (err) { $('#katil-hata').hidden = false; $('#katil-hata').textContent = err.message; }
  };
  $('#yedek-ac').onchange = async e => {
    try {
      const b = JSON.parse(await e.target.files[0].text());
      if (b.kind !== 'kalibre-desk-signal-head') throw new Error();
      parseInvite(inviteOf(b.code, b.publicKey));
      const keys = await deskKeys(b.code);
      store.set(HEADS, { ...store.get(HEADS, {}), [keys.channel]: { code: b.code, publicKey: b.publicKey, privateJwk: b.privateJwk, name: b.name, created: Date.now() } });
      location.hash = `head=${keys.channel}`;
    } catch { $('#kur-hata').hidden = false; $('#kur-hata').textContent = 'This file is not a Desk Signal head key backup.'; }
  };
}

// ------------------------------------------------------------------ head view
let armed = null, last = null, editing = false, draft = null;
const told = new Set();

function headView(channel) {
  const h = store.get(HEADS, {})[channel];
  if (!h) { $('#baslangic').hidden = false; startView(); $('#kur-hata').hidden = false; $('#kur-hata').textContent = 'This browser does not hold the head key for that desk. Open it in the browser that started it, or open a head key backup.'; return; }
  S.role = 'head'; S.code = h.code; S.publicKey = h.publicKey; S.privateJwk = h.privateJwk; S.member = { id: '' };
  $('#sef').hidden = false;
  $('#sef-masa').textContent = h.name;
  document.title = `${h.name} · Desk Signal`;
  const link = `${location.origin}/lab/desk-live#join=${inviteOf(h.code, h.publicKey)}`;
  $('#davet-baglanti').value = link;
  $('#davet-ac').onclick = () => { $('#davet').hidden = false; $('#davet-baglanti').select(); };
  $('#davet-kapat').onclick = () => { $('#davet').hidden = true; };
  $('#davet-kopyala').onclick = async () => {
    try { await navigator.clipboard.writeText(link); } catch { $('#davet-baglanti').select(); document.execCommand?.('copy'); }
    $('#davet-kopyala').textContent = 'Copied';
    setTimeout(() => { $('#davet-kopyala').textContent = 'Copy link'; }, 1500);
  };
  $('#anahtar-indir').onclick = () => download(JSON.stringify({ kind: 'kalibre-desk-signal-head', name: h.name, code: h.code, publicKey: h.publicKey, privateJwk: h.privateJwk }, null, 1), `desk-signal-head-key-${slug(h.name)}.json`, 'application/json');
  $('#esik-1').textContent = String(ESCALATION.growMs / 1000);
  $('#esik-2').textContent = String(ESCALATION.notifyMs / 1000);
  $('#pano-duzenle').onclick = toggleEdit;
  $('#csv-indir').onclick = () => download(logCsv(logDesk(S.live)), `desk-signal-log-${slug(S.live.name)}-${today()}.csv`, 'text/csv');
  $('#xlsx-indir').onclick = () => download(logWorkbook(logDesk(S.live), { title: `${S.live.name} signal log` }), `desk-signal-log-${slug(S.live.name)}-${today()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  $('#kayit').addEventListener('click', e => { const id = e.target.closest('[data-iptal]')?.dataset.iptal; if (id) send({ t: 'cancel', item: id }, true).catch(err => showError(err.message)); });
  $('#yanit').addEventListener('click', e => {
    const id = e.target.closest('[data-cikar]')?.dataset.cikar;
    const p = S.live.desk.people.find(x => x.id === id);
    if (p && confirm(`Take ${p.name} off the desk? Their open signals are cancelled and their invite stops working for them.`)) send({ t: 'remove', id }, true).catch(err => showError(err.message));
  });
  document.addEventListener('keydown', headKeys);
  mixerView();
  if ('Notification' in window && Notification.permission === 'default') document.addEventListener('pointerdown', () => Notification.requestPermission().catch(() => {}), { once: true });
  boot().then(() => { if (!S.live.name) send({ t: 'board', name: h.name, board: S.live.desk.board, escalation: ESCALATION }, true).catch(() => {}); });
}

function headChanged() {
  if (S.live.name) { $('#sef-masa').textContent = S.live.name; }
  if (!editing) drawBoard();
  drawTargets();
  drawMixer();
}

function drawBoard() {
  const box = $('#sinyaller');
  const board = editing ? draft : S.live.desk.board;
  const key = JSON.stringify([editing, board, armed]);
  if (box.dataset.key === key && !editing) return;
  box.dataset.key = key;
  box.replaceChildren();
  board.forEach((s, i) => {
    const b = el(editing ? 'div' : 'button', 'd-sinyal');
    b.style.setProperty('--c', s.colour);
    b.dataset.sinyal = s.id;
    if (!editing) {
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(armed === s.id));
      b.append(el('kbd', '', s.key), el('i', 'd-nokta'), el('span', 'd-anlam', s.label));
      if (s.sticky) b.append(el('em', '', 'Rings until answered'));
      b.onclick = () => arm(armed === s.id ? null : s.id);
    } else {
      const label = el('input'); label.value = s.label; label.maxLength = 40; label.setAttribute('aria-label', `Meaning of signal ${s.key}`);
      const sticky = el('label', 'd-anahtar'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = s.sticky; sticky.append(cb, ' Rings until answered');
      label.oninput = () => { draft[i] = { ...draft[i], label: label.value }; checkDraft(); };
      cb.onchange = () => { draft[i] = { ...draft[i], sticky: cb.checked }; checkDraft(); };
      b.append(el('kbd', '', s.key), el('i', 'd-nokta'), label, sticky);
    }
    box.append(b);
  });
}
function checkDraft() {
  const p = checkBoard(draft);
  $('#pano-hata').hidden = !p.length; $('#pano-hata').textContent = p[0] ?? '';
  return !p.length;
}
async function toggleEdit() {
  if (editing) {
    if (!checkDraft()) return;
    const changed = JSON.stringify(draft) !== JSON.stringify(S.live.desk.board);
    editing = false;
    if (changed) await send({ t: 'board', name: S.live.name, board: draft.map(s => ({ ...s, label: s.label.trim() })), escalation: S.live.desk.escalation }, true).catch(err => showError(err.message));
  } else { editing = true; draft = S.live.desk.board.map(s => ({ ...s })); arm(null); }
  $('#pano-duzenle').textContent = editing ? 'Save signals' : 'Edit signals';
  $('#pano-duzenle').setAttribute('aria-pressed', String(editing));
  $('#sinyaller').dataset.key = '';
  drawBoard();
}

function arm(id) {
  armed = id;
  const sig = id && signalOf(S.live.desk, id);
  $('#silahli').textContent = sig ? `${sig.label}: now pick who gets it.` : 'Pick a signal first.';
  $('#hedefler').classList.toggle('hazir', !!sig);
  $('#hedefler').style.setProperty('--c', sig?.colour ?? 'var(--border-2)');
  document.querySelectorAll('#sinyaller [role=radio]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.sinyal === id)));
}

function drawTargets() {
  const t = targets(S.live);
  const key = JSON.stringify(t);
  if ($('#kisiler').dataset.key === key) return;
  $('#kisiler').dataset.key = key;
  const tile = (to, k, name, note) => {
    const b = el('button', 'd-hedef'); b.type = 'button'; b.dataset.to = to;
    b.append(el('kbd', '', (k || '·').toUpperCase()), el('b', '', name), el('span', '', note));
    b.onclick = () => fire(to);
    return b;
  };
  $('#kisiler').replaceChildren(...t.people.map(p => tile(p.id, p.key, p.name, p.location)));
  $('#gruplar').replaceChildren(...(t.people.length ? t.groups.map(g => tile(g.to, g.key, g.name, g.note)) : []));
  $('#kimse-yok').hidden = !!t.people.length;
}

async function fire(to, signal = armed) {
  if (!signal) {
    $('#silahli').textContent = 'Pick a signal first: click one or press its number.';
    $('#sinyaller').classList.remove('uyar'); void $('#sinyaller').offsetWidth; $('#sinyaller').classList.add('uyar');
    return;
  }
  let people;
  try { people = recipients(S.live.desk, to); } catch (e) { return showError(e.message); }
  if (!people.length) return;
  const items = people.map((person, k) => ({ id: nextItemId(S.live, k), person }));
  last = { signal, to };
  document.querySelectorAll(`.d-hedef[data-to="${CSS.escape(to)}"]`).forEach(b => { b.classList.remove('gitti'); void b.offsetWidth; b.classList.add('gitti'); });
  try { await send({ t: 'send', signal, items }, true); showError(null); }
  catch (e) { showError(`Not sent: ${e.message}`); return; }
  const sig = signalOf(S.live.desk, signal);
  $('#duyuru').textContent = `${sig.label} sent to ${people.map(id => S.live.desk.people.find(p => p.id === id)?.name).join(', ')}.`;
}

function headKeys(e) {
  if (e.metaKey || e.ctrlKey || e.altKey || editing) return;
  const on = e.target instanceof Element ? e.target : document.body;
  if (on.closest('input, textarea, select')) return;
  const k = e.key.toLowerCase();
  const t = targets(S.live);
  const sig = S.live.desk.board.find(s => s.key === k);
  const target = t.people.find(p => p.key === k)?.id ?? (t.people.length ? t.groups.find(g => g.key === k)?.to : null);
  if (sig) { arm(sig.id); e.preventDefault(); }
  else if (target) { fire(target); e.preventDefault(); }
  else if (k === 'enter' && last && !on.closest('button, a')) { fire(last.to, last.signal); e.preventDefault(); }
  else if (k === 'escape') arm(null);
}

const dur = ms => (ms == null ? '' : ms < 60_000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60_000)} min ${String(Math.round((ms % 60_000) / 1000)).padStart(2, '0')} s`);
const pill = (text, cls) => el('span', `d-durum ${cls}`, text);
const chip = sig => { const c = el('span', 'd-cip'); c.style.setProperty('--c', sig.colour); c.append(el('i', 'd-nokta'), el('span', '', sig.label)); return c; };
const clock = ms => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(ms));

function setRows(table, head, rows) {
  const key = JSON.stringify(rows.map(r => [r.cls, ...r.map(c => (c instanceof Node ? c.outerHTML : c))]));
  if (table.dataset.key === key) return;
  table.dataset.key = key;
  const thead = el('thead'), tr = el('tr');
  head.forEach(h => tr.append(el('th', '', h)));
  thead.append(tr);
  const tbody = el('tbody');
  rows.forEach(r => { const row = el('tr'); if (r.cls) row.className = r.cls; r.forEach(c => { const td = el('td'); c instanceof Node ? td.append(c) : (td.textContent = c); row.append(td); }); tbody.append(row); });
  table.replaceChildren(thead, tbody);
}

function onlineText(id, t) {
  const seen = S.onlineMap[id];
  if (seen == null) return pill('Offline', 'notr');
  const ago = t - seen;
  return ago < 75_000 ? pill('Online', 'iyi') : pill(`${Math.round(ago / 60_000)} min ago`, 'notr');
}

function guardCell(id, t) {
  const n = S.live.hits.filter(h => h.person === id && h.ts >= dayStart()).length;
  if (!guardOn(id, t)) return n ? pill(`${n} ${n === 1 ? 'hit' : 'hits'} today`, 'uyari') : pill('Not linked', 'notr');
  return pill(n ? `On, ${n} ${n === 1 ? 'hit' : 'hits'} today` : 'On', n ? 'uyari' : 'iyi');
}

function drawGrid(t) {
  const d = S.live.desk;
  const rows = summary(d, t).map(r => {
    const ringing = d.items.some(x => x.person === r.person && isOpen(x) && x.times.seen == null && signalOf(d, x.signal)?.sticky);
    const st = r.headTold ? pill('Not answering', 'kotu') : ringing ? pill('Ringing', 'uyari') : r.unseen ? pill('Not seen yet', 'notr') : r.open ? pill('Working on it', 'notr') : pill('Clear', 'iyi');
    const out = el('button', 'kucuk sil', 'Remove'); out.type = 'button'; out.dataset.cikar = r.person;
    const row = [r.name, r.location, onlineText(r.person, t), S.live.policyAt ? lotText(limitsFor(S.live.policy, r.person)) : '·', guardCell(r.person, t), String(r.open), String(r.unseen), dur(r.avgSeenMs) || '·', dur(r.avgDoneMs) || '·', st, out];
    if (r.headTold) row.cls = 'kotu';
    return row;
  });
  setRows($('#yanit'), ['Trader', 'Location', 'Connected', 'Limit', 'Rule Guard', 'Waiting', 'Not seen', 'Avg time to see', 'Avg time to done', 'Status', ''], rows);
}

const STATUS_TEXT = { sent: 'Sent', delivered: 'Delivered', seen: 'Seen', done: 'Done', cancelled: 'Cancelled' };
const LOG_SHOWN = 20;
function drawLog(t) {
  const d = logDesk(S.live), n = d.items.length;
  $('#kayit').hidden = !n; $('#kayit-bos').hidden = !!n;
  ['#csv-indir', '#xlsx-indir'].forEach(s => { $(s).disabled = !n; });
  if (!n) return;
  const rows = [...d.items].sort((a, b) => b.times.sent - a.times.sent).slice(0, LOG_SHOWN).map(x => {
    const sig = signalOf(d, x.signal) ?? { label: x.signal, colour: '#888888' }, p = d.people.find(q => q.id === x.person), st = status(x);
    let action = '';
    if (isOpen(x)) { action = el('button', 'kucuk sil', 'Cancel'); action.type = 'button'; action.dataset.iptal = x.id; }
    return [clock(x.times.sent), chip(sig), p ? `${p.name}, ${p.location}` : 'Former trader', pill(STATUS_TEXT[st], st === 'done' ? 'iyi' : st === 'cancelled' ? 'notr' : level(d, x, t) === 2 ? 'kotu' : 'uyari'),
      x.times.seen == null ? '' : dur(x.times.seen - x.times.sent), x.times.done == null ? '' : dur(x.times.done - x.times.sent), action];
  });
  setRows($('#kayit'), ['Sent', 'Signal', 'To', 'Status', 'Seen after', 'Done after', ''], rows);
  const more = $('#kayit-daha') ?? (() => { const p = el('p', 'dipnot'); p.id = 'kayit-daha'; $('#kayit').closest('.tablo-kutu').after(p); return p; })();
  more.textContent = n > LOG_SHOWN ? `Showing the latest ${LOG_SHOWN} of ${n}. The downloads have every signal.` : '';
}

// The head hears a low tone the moment an urgent signal has gone unseen too long.
function headEscalation(t) {
  const d = S.live.desk;
  for (const x of d.items) {
    if (told.has(x.id) || level(d, x, t) !== 2) continue;
    told.add(x.id);
    if (S.booting) continue;
    const p = d.people.find(q => q.id === x.person), sig = signalOf(d, x.signal);
    tone(330, true);
    notify(`${p?.name ?? 'A trader'} has not answered`, `${sig.label}, sent ${Math.round((t - x.times.sent) / 1000)} s ago.`, { tag: `told-${x.id}` });
  }
}


// ------------------------------------------------------------------ Rule Guard (presence id, hits)
// Rule Guard shows up on the relay's presence list under SHA-256("kalibre-desk/guard:" + trader id), first 8 bytes.
const guardIds = new Map();
function guardIdOf(id) {
  if (!guardIds.has(id)) {
    guardIds.set(id, null);
    crypto.subtle.digest('SHA-256', new TextEncoder().encode('kalibre-desk/guard:' + id)).then(h => guardIds.set(id, Array.from(new Uint8Array(h).slice(0, 8), b => b.toString(16).padStart(2, '0')).join('')));
  }
  return guardIds.get(id);
}
const guardOn = (id, t) => { const g = guardIdOf(id), seen = g && S.onlineMap[g]; return seen != null && t - seen < 150_000; };
const dayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const heardHits = new Set();

function drawHits(t) {
  const hits = S.live.hits, d = S.live.desk;
  $('#vuruslar').hidden = !hits.length;
  const rows = hits.slice(-10).reverse().map(h => {
    const p = logDesk(S.live).people.find(x => x.id === h.person);
    const li = el('li');
    li.append(el('span', 'dipnot', `${clock(h.ts)} `), el('b', '', p?.name ?? 'Former trader'), document.createTextNode(`, ${h.symbol}${h.lot != null ? ` ${h.lot} lots` : ''}: ${h.rule}. `), el('span', h.action === 'closed' ? 'kapandi' : '', h.action === 'closed' ? 'Rule Guard closed it.' : 'Rule Guard warned.'));
    return li;
  });
  const key = String(hits.at(-1)?.q ?? 0);
  if ($('#vurus-liste').dataset.key !== key) { $('#vurus-liste').dataset.key = key; $('#vurus-liste').replaceChildren(...rows); }
  for (const h of hits) {
    if (heardHits.has(h.q)) continue;
    heardHits.add(h.q);
    if (S.booting || t - h.ts > 60_000) continue;
    const p = d.people.find(x => x.id === h.person);
    tone(330, true);
    notify(`${p?.name ?? 'A trader'} broke a desk rule`, `${h.symbol}: ${h.rule}. ${h.action === 'closed' ? 'Rule Guard closed it.' : 'Rule Guard warned.'}`, { tag: `hit-${h.q}` });
  }
}

// ------------------------------------------------------------------ desk risk mixer (head)
// The draft is what the faders show; it goes to the desk only on Send limits (or at once for No new trades).
let mix = null;           // draft policy
let touched = false;      // the head has moved something since the last send
const PADS = { normal: 100, half: 50, defensive: 25, freeze: 0 };
const same = (a, b) => JSON.stringify(cleanPolicy(a)) === JSON.stringify(cleanPolicy(b));
const dirty = () => !!mix && touched && !same(mix, S.live.policy);
const lotText = l => (l.blocked ? 'No new trades' : l.maxLot != null ? `${l.maxLot} lots` : 'No lot cap');

function mixerView() {
  $('#risk-gonder').onclick = () => sendLimits();
  $('#risk-geri').onclick = () => { touched = false; mix = null; drawMixer(true); };
  $('#pedler').addEventListener('click', e => { const b = e.target.closest('[data-ped]'); if (b) pad(b.dataset.ped); });
  $('#taban').addEventListener('input', e => {
    const f = FIELDS.find(x => x.id === e.target.dataset.alan);
    if (!f) return;
    touched = true;
    if (f.bool) mix.base[f.id] = e.target.checked;
    else { const v = e.target.value === '' ? null : Number(e.target.value); mix.base[f.id] = v; }
    drawMixer();
  });
  $('#kanallar').addEventListener('input', e => { const id = e.target.dataset.kanal; if (id) setFader(id, Number(e.target.value)); });
  $('#midi-ac').onclick = midiOpen;
  // In learn mode a click on a strip or pad picks what the next control you move will drive.
  $('#risk-kart').addEventListener('click', e => {
    if (!midi.learning) return;
    const strip = e.target.closest('[data-strip]'), padBtn = e.target.closest('[data-ped]');
    if (!strip && !padBtn) return;
    e.preventDefault(); e.stopPropagation();
    midi.pick = padBtn ? `pad:${padBtn.dataset.ped}` : stripTarget(strip.dataset.strip);
    drawMidi();
  }, true);
}

// Also called by the MIDI controller (midi.js) with a 0-100 value.
function setFader(id, value) {
  if (!mix) return;
  touched = true;
  const v = Math.max(0, Math.min(100, Math.round(value)));
  if (id === 'master') mix.master = v; else mix.risk[id] = v;
  const input = document.querySelector(`#kanallar [data-kanal="${CSS.escape(id)}"]`);
  if (input && Number(input.value) !== v) input.value = String(v);
  drawMixer();
}

function pad(name) {
  if (!(name in PADS) || !mix) return;
  touched = true;
  mix.master = PADS[name];
  drawMixer(true);
  if (name === 'freeze') sendLimits();
}

function drawMixer(rebuild) {
  if (!S.live || S.role !== 'head') return;
  // Until the head moves something, the faders follow what the desk has (records arriving, another tab).
  if (!touched && (!mix || !same(mix, S.live.policy))) { mix = structuredClone(S.live.policy); rebuild = true; }
  const t = targets(S.live), draft = cleanPolicy(mix), sent = S.live.policy;
  // Base limit inputs: built once, values kept in step with the draft.
  if (!$('#taban').children.length || rebuild) {
    $('#taban').replaceChildren(...FIELDS.map(f => {
      const l = el('label', f.bool ? 'd-anahtar' : '');
      const i = el('input'); i.dataset.alan = f.id;
      if (f.bool) { i.type = 'checkbox'; i.checked = !!mix.base[f.id]; l.append(i, document.createTextNode(f.label)); }
      else { i.type = 'number'; i.min = f.min; i.max = f.max; i.step = f.step; i.placeholder = 'Off'; i.value = mix.base[f.id] ?? ''; l.append(document.createTextNode(f.label + (f.unit ? ` (${f.unit})` : '')), i); }
      return l;
    }));
  }
  // Channel strips: one per trader plus the master.
  const key = JSON.stringify([t.people.map(p => [p.id, p.name, p.location]), rebuild ? Math.random() : 0]);
  if ($('#kanallar').dataset.key !== key) {
    $('#kanallar').dataset.key = key;
    const strip = (id, name, sub, value, master) => {
      const c = el('div', 'dl-kanal' + (master ? ' dl-kanal-master' : '')); c.dataset.strip = id;
      const f = el('input', 'dl-fader'); f.type = 'range'; f.min = '0'; f.max = '100'; f.step = '5'; f.value = String(value); f.dataset.kanal = id;
      f.setAttribute('aria-label', `${name} risk`);
      c.append(el('span', 'dl-kanal-ad', name), el('span', 'dl-kanal-yer', sub), f, el('span', 'dl-kanal-deger'), el('span', 'dl-kanal-lot'), el('span', 'dl-kanal-ogren'));
      return c;
    };
    $('#kanallar').replaceChildren(...t.people.map(p => strip(p.id, p.name, p.location, mix.risk[p.id] ?? 100)), strip('master', 'Master', 'Whole desk', mix.master, true));
  }
  for (const c of document.querySelectorAll('#kanallar .dl-kanal')) {
    const id = c.dataset.strip, input = c.querySelector('input');
    const v = id === 'master' ? mix.master : (mix.risk[id] ?? 100);
    if (document.activeElement !== input) input.value = String(v);
    input.setAttribute('aria-valuetext', `${v} percent`);
    c.querySelector('.dl-kanal-deger').textContent = `${v}%`;
    if (id === 'master') {
      c.querySelector('.dl-kanal-lot').textContent = v === 0 ? 'No new trades' : v < 50 ? 'Defensive' : v < 100 ? 'Reduced' : 'Normal';
      c.classList.toggle('degisti', draft.master !== sent.master);
      c.classList.toggle('durdu', v === 0);
    } else {
      const now = limitsFor(draft, id), before = limitsFor(sent, id);
      c.querySelector('.dl-kanal-lot').textContent = lotText(now) + (now.dailyLossPct != null && !now.blocked ? `, ${now.dailyLossPct}% a day` : '');
      c.classList.toggle('degisti', changes(before, now).length > 0);
      c.classList.toggle('durdu', now.blocked);
    }
  }
  document.querySelectorAll('#pedler [data-ped]').forEach(b => b.setAttribute('aria-pressed', String(PADS[b.dataset.ped] === mix.master)));
  midiLights(Object.keys(PADS).find(k => PADS[k] === mix.master) ?? '');
  drawMidiLabels();
  const n = t.people.filter(p => changes(limitsFor(sent, p.id), limitsFor(draft, p.id)).length).length;
  const d = dirty();
  $('#risk-gonder').disabled = !d; $('#risk-geri').disabled = !d;
  $('#risk-gonder').textContent = d && n ? `Send limits to ${n} ${n === 1 ? 'trader' : 'traders'}` : 'Send limits';
  $('#risk-durum').textContent = d ? (n ? `${n} ${n === 1 ? 'trader' : 'traders'} will get new limits.` : 'Changes waiting to be sent.')
    : S.live.policyAt ? `Limits sent at ${clock(S.live.policyAt)}.` : 'No limits sent yet.';
}


// ------------------------------------------------------------------ MIDI controller (head)
const MIDI_KEY = 'deskSignal.midi';
const midi = { access: null, learning: false, pick: null, maps: store.get(MIDI_KEY, {}), soft: new Map(), lit: null };
const stripTarget = id => (id === 'master' ? 'master' : `trader:${targets(S.live).people.findIndex(p => p.id === id) + 1}`);
const inputs = () => (midi.access ? [...midi.access.inputs.values()] : []);
const controlName = id => { const [k, ch, n] = id.split(':'); return `${k === 'cc' ? 'CC' : 'Note'} ${n}${ch !== '0' ? ` ch ${Number(ch) + 1}` : ''}`; };

async function midiOpen() {
  $('#midi').hidden = false;
  if (!navigator.requestMIDIAccess) { midiPanel('Controllers work in Chrome and Edge on a computer. The faders on screen do the same job.'); return; }
  try {
    midi.access ??= await navigator.requestMIDIAccess({ sysex: false });
    midi.access.onstatechange = () => { hook(); drawMidi(); };
    hook(); drawMidi();
  } catch { midiPanel('The browser did not allow MIDI. Allow it in the site settings and try again.'); }
}

function hook() { for (const i of inputs()) i.onmidimessage = e => onMidi(i.name || 'Controller', e.data); }

function onMidi(device, data) {
  const m = decode(data);
  if (!m || m.kind === 'off') return;
  const id = controlId(m);
  if (midi.learning && midi.pick) {
    midi.maps[device] = learn(midi.maps[device], id, midi.pick);
    store.set(MIDI_KEY, midi.maps);
    midi.soft.delete(`${device}|${id}`);
    midi.pick = null; drawMidi(); drawMidiLabels();
    return;
  }
  const target = midi.maps[device]?.[id];
  if (!target || !mix) return;
  if (target.startsWith('pad:')) { if (m.kind === 'on' || m.value > 63) pad(target.slice(4)); return; }
  const person = target === 'master' ? 'master' : targets(S.live).people[Number(target.split(':')[1]) - 1]?.id;
  if (!person) return;
  const v = toPercent(m.value), current = person === 'master' ? mix.master : (mix.risk[person] ?? 100);
  const k = `${device}|${id}`, r = takeover(midi.soft.get(k), current, v);
  midi.soft.set(k, r.state);
  if (r.apply) setFader(person, v);
}

function midiLights(pressed) {
  if (!midi.access || midi.lit === pressed) return;
  midi.lit = pressed;
  for (const o of midi.access.outputs.values()) for (const msg of padLights(midi.maps[o.name] ?? {}, pressed)) { try { o.send(msg); } catch { /* unplugged */ } }
}

function midiPanel(text, buttons = []) {
  const p = el('p', '', text), row = el('div', 'satir-dugme');
  row.append(...buttons);
  $('#midi').replaceChildren(p, ...(buttons.length ? [row] : []));
}

function drawMidi() {
  const list = inputs();
  $('#midi-ac').setAttribute('aria-pressed', String(!!midi.access));
  $('#midi-ac').textContent = midi.access ? (list.length ? `Controller: ${list[0].name}${list.length > 1 ? ` +${list.length - 1}` : ''}` : 'Controller: none plugged in') : 'Connect a controller';
  const b = (text, fn, cls = 'kucuk') => { const x = el('button', cls, text); x.type = 'button'; x.onclick = fn; return x; };
  const mapped = list.reduce((n, i) => n + Object.keys(midi.maps[i.name] ?? {}).length, 0);
  const learnBtn = b(midi.learning ? 'Finish mapping' : 'Map controls', () => { midi.learning = !midi.learning; midi.pick = null; drawMidi(); });
  const forget = b('Clear mapping', () => { for (const i of list) delete midi.maps[i.name]; store.set(MIDI_KEY, midi.maps); midi.soft.clear(); drawMidi(); drawMidiLabels(); });
  forget.disabled = !mapped;
  const hide = b('Close', () => { $('#midi').hidden = true; midi.learning = false; midi.pick = null; drawMidiLabels(); });
  if (!list.length) midiPanel('Plug in a MIDI controller: any fader box, DJ controller or pad grid works. It appears here.', [hide]);
  else if (midi.learning) midiPanel(midi.pick ? `Now move the fader, knob or pad for ${midi.pick === 'master' ? 'the master' : midi.pick.startsWith('pad:') ? `the ${[...document.querySelectorAll('#pedler [data-ped]')].find(b => b.dataset.ped === midi.pick.slice(4))?.textContent ?? ''} pad` : `trader ${midi.pick.split(':')[1]}`}.` : 'Click a fader strip or a pad, then move the control that should drive it.', [learnBtn]);
  else midiPanel(mapped ? `${mapped} ${mapped === 1 ? 'control' : 'controls'} mapped. A fader takes over once it passes the level on screen, so picking it up never jumps anyone's risk. Limits still go out only when you send them; No new trades goes at once.` : 'Map your controls once: this browser remembers them for this controller.', [learnBtn, forget, hide]);
  drawMidiLabels();
}

function drawMidiLabels() {
  const names = {};
  for (const i of inputs()) for (const [id, t] of Object.entries(midi.maps[i.name] ?? {})) names[t] = controlName(id);
  document.querySelectorAll('#kanallar [data-strip]').forEach(c => {
    const t = stripTarget(c.dataset.strip);
    c.querySelector('.dl-kanal-ogren').textContent = names[t] ?? '';
    c.classList.toggle('ogreniyor', midi.learning && midi.pick === t);
  });
  document.querySelectorAll('#pedler [data-ped]').forEach(x => {
    const t = `pad:${x.dataset.ped}`;
    x.title = names[t] ? `Mapped to ${names[t]}` : '';
    x.classList.toggle('ogreniyor', midi.learning && midi.pick === t);
  });
}

async function sendLimits() {
  if (!mix) return;
  const draft = cleanPolicy(mix), sent = S.live.policy;
  const items = [];
  for (const p of S.live.desk.people) {
    const ch = changes(limitsFor(sent, p.id), limitsFor(draft, p.id));
    if (ch.length) items.push({ id: nextItemId(S.live, items.length), person: p.id, note: changeText(ch) });
  }
  const box = $('#risk-hata');
  try { await send({ t: 'policy', policy: draft, items }, true); box.hidden = true; touched = false; }
  catch (e) { box.hidden = false; box.textContent = `Not sent: ${e.message}`; return; }
  $('#duyuru').textContent = items.length ? `New limits sent to ${items.length} ${items.length === 1 ? 'trader' : 'traders'}.` : 'Limits sent.';
}

// ------------------------------------------------------------------ trader view
const pending = new Map(); // item id → state this browser has posted and is waiting to see back
const known = new Set();   // item ids this browser has already rung for
const rung = new Map();
let pipWin = null;

function traderView(inviteText) {
  let inv;
  try { inv = parseInvite(inviteText); } catch (e) { startView(); $('#katil-hata').hidden = false; $('#katil-hata').textContent = e.message; return; }
  S.role = 'trader'; S.code = inv.code; S.publicKey = inv.publicKey;
  deskKeys(inv.code).then(keys => {
    const saved = store.get(memberKey(keys.channel), null);
    if (saved) { S.member = saved; startTrader(); unlockHint(); }
    else askName(keys.channel, null);
  });
}

function askName(channel, current) {
  $('#trader').hidden = true; $('#kimlik').hidden = false;
  $('#kimlik-masa').textContent = S.live.name || 'the desk';
  if (current) { $('#kimlik-ad').value = current.name; $('#kimlik-yer').value = current.location; }
  $('#kimlik-ad').focus();
  $('#kimlik-form').onsubmit = e => {
    e.preventDefault();
    unlockAudio();
    const name = $('#kimlik-ad').value.trim(), location = $('#kimlik-yer').value.trim() || 'Desk';
    if (!name) return;
    const first = !S.member;
    S.member = { id: current?.id ?? randomId(), name, location };
    store.set(memberKey(channel), S.member);
    $('#kimlik').hidden = true;
    if (first) startTrader(); else { $('#trader').hidden = false; announce(); drawTraderName(); }
  };
}

function unlockHint() { if (!audio || audio.state !== 'running') $('#ses-uyari').hidden = false; }
const announce = () => send({ t: 'join', id: S.member.id, name: S.member.name, location: S.member.location }).catch(err => showError(err.message));
const drawTraderName = () => { $('#trader-ad').textContent = `${S.member.name}, ${S.member.location}`; };

function startTrader() {
  $('#trader').hidden = false;
  drawTraderName();
  $('#orb').onclick = () => { focusTop(); };
  $('#tamam').onclick = act;
  $('#ad-degistir').onclick = () => askName(S.channel, S.member);
  $('#ses-dene').onclick = () => { unlockAudio(); tone(660, true); };
  const canNotify = 'Notification' in window;
  $('#bildirim').hidden = !canNotify || Notification.permission === 'granted';
  $('#bildirim').onclick = async () => { await Notification.requestPermission().catch(() => {}); $('#bildirim').hidden = Notification.permission === 'granted'; };
  const canPip = 'documentPictureInPicture' in window;
  $('#pip').hidden = !canPip;
  $('#pip-not').hidden = !canPip;
  $('#pip').onclick = openPip;
  $('#guard-baglanti').value = `${S.code}.${S.publicKey}.${S.member.id}`;
  $('#guard-kopyala').onclick = async () => {
    try { await navigator.clipboard.writeText($('#guard-baglanti').value); } catch { $('#guard-baglanti').select(); document.execCommand?.('copy'); }
    $('#guard-kopyala').textContent = 'Copied';
    setTimeout(() => { $('#guard-kopyala').textContent = 'Copy link'; }, 1500);
  };
  boot().then(() => {
    // Join again on every start: cheap, and it keeps the name on desks older than the relay's memory.
    if (S.live.removed.has(S.member.id)) showError('The head of desk has taken you off this desk.');
    else announce();
    setInterval(() => { if (!S.live.removed.has(S.member.id)) announce(); }, 10 * 60_000);
  });
}

const effective = x => {
  const p = pending.get(x.id);
  if (!p) return x;
  const times = { ...x.times };
  if (p === 'seen' || p === 'done') times.seen ??= Date.now();
  if (p === 'done') times.done ??= Date.now();
  return { ...x, times };
};
const myOpen = () => inbox(S.live.desk, S.member.id).map(effective).filter(isOpen);

function postMark(item, state) {
  if (pending.get(item) === state || pending.get(item) === 'done') return;
  pending.set(item, state);
  send({ t: 'mark', item, state, by: S.member.id }).catch(err => { pending.delete(item); showError(`Not sent: ${err.message}`); });
  tick();
}

function traderChanged() {
  const d = S.live.desk;
  for (const [id, st] of pending) { const x = d.items.find(i => i.id === id); if (!x || !isOpen(x) || x.times[st] != null) pending.delete(id); }
  for (const x of inbox(d, S.member.id)) {
    if (x.times.delivered == null && !pending.has(x.id)) { pending.set(x.id, 'delivered'); send({ t: 'mark', item: x.id, state: 'delivered', by: S.member.id }).catch(() => pending.delete(x.id)); }
    if (!known.has(x.id)) {
      known.add(x.id);
      const sig = signalOf(d, x.signal);
      ring(sig, sig.sticky); rung.set(x.id, Date.now());
      notify(sig.label, x.note || 'From the head of desk', { tag: x.id, sticky: sig.sticky, onclick: () => postMark(x.id, 'seen') });
    }
  }
  $('#trader-masa').textContent = S.live.name || 'Desk';
  const mine = limitsFor(S.live.policy, S.member.id), lines = S.live.policyAt ? describe(mine) : [];
  $('#sinirlarim-liste').replaceChildren(...lines.map(x => el('li', '', x)));
  $('#sinirlarim').classList.toggle('durdu', !!S.live.policyAt && mine.blocked);
  const on = guardOn(S.member.id, Date.now());
  $('#guard-bagla').dataset.on = String(on);
  $('#guard-durum').textContent = on ? (S.live.policyAt ? 'Rule Guard is keeping these limits in MT5' : 'Rule Guard is linked to the desk') : 'Keep these limits in MT5 with Rule Guard';
  $('#sinirlarim-not').textContent = !S.live.policyAt ? 'Your head of desk has not set limits yet.' : lines.length ? `Set at ${clock(S.live.policyAt)}.` : 'No limits on your trading right now.';
  document.title = `${S.live.name || 'Desk'} · Desk Signal`;
}

function focusTop() { const top = myOpen()[0]; if (top && top.times.seen == null) postMark(top.id, 'seen'); }
function act() {
  const top = myOpen()[0];
  if (!top) return;
  postMark(top.id, top.times.seen == null ? 'seen' : 'done');
}

function drawTrader(doc, t) {
  const d = S.live.desk, list = myOpen(), top = list[0], sig = top && signalOf(d, top.signal);
  const lv = top ? Math.max(...list.map(x => level(d, x, t))) : 0;
  const orb = doc.getElementById('orb');
  orb.className = 'd-orb dl-orb' + (top ? (top.times.seen == null ? ' acik' : ' goruldu') : '') + (lv ? ` l${lv}` : '');
  orb.style.setProperty('--c', sig?.colour ?? 'transparent');
  orb.querySelector('.d-rozet').textContent = list.length > 1 ? String(list.length) : '';
  orb.setAttribute('aria-label', top ? `${sig.label}. ${list.length > 1 ? `${list.length} signals waiting.` : ''}` : 'No signals');
  doc.getElementById('sinyal').style.setProperty('--c', sig?.colour ?? 'var(--border-2)');
  doc.getElementById('sinyal-ad').textContent = top ? sig.label : 'All clear';
  const sub = doc.getElementById('sinyal-alt');
  if (top && top.signal === 'limits') sub.textContent = top.note || 'Your head of desk changed your limits.';
  else if (top) sub.textContent = `From the head of desk, ${Math.max(0, Math.round((t - top.times.sent) / 1000))} s ago${list.length > 1 ? `. ${list.length - 1} more waiting` : ''}`;
  else sub.textContent = 'Signals from your head of desk appear here.';
  doc.getElementById('sinyal-eylem').hidden = !top;
  const b = doc.getElementById('tamam');
  b.textContent = top && top.times.seen == null ? 'Seen' : 'Done';
  return { top, sig };
}

function ringAgain(t) {
  const d = S.live.desk;
  const top = myOpen().find(x => x.times.seen == null && signalOf(d, x.signal)?.sticky);
  if (!top) return;
  const every = level(d, top, t) ? 1500 : 3000;
  if (t - (rung.get(top.id) ?? 0) >= every) { ring(signalOf(d, top.signal), true); rung.set(top.id, t); }
}

async function openPip() {
  if (pipWin) { pipWin.focus?.(); return; }
  try {
    pipWin = await window.documentPictureInPicture.requestWindow({ width: 240, height: 200 });
    const doc = pipWin.document;
    for (const href of ['stil.css', 'desk.css']) { const l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = new URL(href, document.baseURI).href; doc.head.append(l); }
    doc.body.className = 'desk dl dl-pip';
    doc.body.innerHTML = '<button type="button" class="d-orb dl-orb" id="orb"><span class="d-rozet"></span></button><div class="dl-sinyal" id="sinyal"><p class="dl-sinyal-ad" id="sinyal-ad"></p><p class="dipnot" id="sinyal-alt"></p><div id="sinyal-eylem"><button type="button" class="dugme" id="tamam">Done</button></div></div>';
    doc.getElementById('orb').onclick = focusTop;
    doc.getElementById('tamam').onclick = act;
    pipWin.addEventListener('pagehide', () => { pipWin = null; $('#pip').textContent = 'Keep the orb on top'; });
    $('#pip').textContent = 'Orb is on top';
  } catch { pipWin = null; }
}

// ------------------------------------------------------------------ the clock
let flash = false;
function tick() {
  const t = Date.now();
  if (S.role === 'head') { drawGrid(t); drawLog(t); drawHits(t); headEscalation(t); }
  if (S.role === 'trader' && S.member && !$('#trader').hidden) {
    const { top, sig } = drawTrader(document, t);
    if (pipWin) drawTrader(pipWin.document, t);
    ringAgain(t);
    flash = !flash;
    const unseen = top && top.times.seen == null;
    document.title = unseen && flash ? `● ${sig.label}` : `${S.live.name || 'Desk'} · Desk Signal`;
  }
}
setInterval(tick, 250);

// ------------------------------------------------------------------ helpers and routing
function download(data, name, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = el('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const slug = s => String(s || 'desk').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'desk';
const today = () => new Date().toISOString().slice(0, 10);

const hash = new URLSearchParams(location.hash.slice(1));
window.addEventListener('hashchange', () => location.reload());
if (hash.get('head')) headView(hash.get('head'));
else if (hash.get('join')) traderView(hash.get('join'));
else startView();
