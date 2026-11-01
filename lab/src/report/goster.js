// Report page (/lab/report): draws a report model (src/report/blotter-model.js) as a printable
// document. Opened two ways:
//   #local            the model this browser just built (localStorage, written by the analysis page);
//                     the toolbar offers "Share a read-only link"
//   #<id>.<key>       a shared copy: the sealed envelope comes from /api/rapor and opens with the key
//                     in the fragment, which never reaches a server

import { isReportModel, LOCAL_KEY } from './blotter-model.js';
import { newKey, seal, open, linkOf, parseLink } from './muhur.js';

const $ = s => document.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

function formatters(locale) {
  const n0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const s0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0, signDisplay: 'exceptZero' });
  const p1 = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
  return {
    pnl: v => (v == null || !Number.isFinite(v) ? '–' : s0.format(Math.round(v) === 0 ? 0 : v)),
    int: v => (v == null || !Number.isFinite(v) ? '–' : n0.format(v)),
    pct: v => (v == null || !Number.isFinite(v) ? '–' : p1.format(v)),
  };
}
const sign = v => (v > 0.5 ? 'pozitif' : v < -0.5 ? 'negatif' : '');

export function render(root, m) {
  const f = formatters(m.locale);
  root.replaceChildren();
  const head = el('header', 'r-bas');
  const left = el('div');
  const h1 = el('h1', '', m.title);
  if (m.example) h1.append(el('span', 'r-ornek', m.lang === 'tr' ? 'ÖRNEK' : 'EXAMPLE'));
  const sub = el('p', 'r-alt'); m.subtitle.forEach(s => sub.append(el('span', '', s)));
  left.append(h1, sub);
  head.append(left, el('div', 'r-logo', 'KALIBRE // MARKETS'));
  root.append(head);

  const kpi = el('div', 'r-kpi');
  for (const k of m.kpis) {
    const d = el('div');
    d.append(el('span', '', k.label));
    const b = el('b', k.kind === 'pnl' ? sign(k.value) : '', k.kind === 'pnl' ? `${f.pnl(k.value)} USD` : String(k.value));
    d.append(b);
    if (k.sub) d.append(el('small', '', k.sub));
    kpi.append(d);
  }
  root.append(kpi);

  if (m.notes?.length) { const n = el('div', 'r-notlar'); m.notes.forEach(x => n.append(el('p', '', x))); root.append(n); }

  const checks = el('section', 'r-bolum');
  checks.append(el('h2', '', m.lang === 'tr' ? 'Mutabakat' : 'Reconciliation'));
  const ul = el('ul', 'r-kontrol');
  for (const c of m.checks) {
    const li = el('li', c.ok === true ? 'tamam' : c.ok === false ? 'hata' : 'bos');
    li.append(el('span', 'r-isaret', c.ok === true ? '✓' : c.ok === false ? '✗' : '–'));
    const t = el('span', '', c.label);
    if (c.detail) t.append(' ', el('small', '', c.detail));
    li.append(t); ul.append(li);
  }
  checks.append(ul); root.append(checks);

  for (const s of m.sections) {
    const sec = el('section', 'r-bolum'); sec.id = `r-${s.id}`;
    sec.append(el('h2', '', s.title));
    if (s.rows.length) {
      const table = el('table'), thead = el('thead'), tr = el('tr');
      s.columns.forEach(c => tr.append(el('th', c.kind === 'text' || c.kind === 'status' ? '' : 'sayi', c.label)));
      thead.append(tr); table.append(thead);
      const cell = (c, v) => {
        if (c.kind === 'status') { const td = el('td'); td.append(el('span', `r-durum-etiket ${v?.state ?? ''}`, v?.text ?? '')); return td; }
        if (c.kind === 'text') return el('td', '', String(v ?? ''));
        return el('td', `sayi ${c.kind === 'pnl' ? sign(v) : ''}`, f[c.kind](v));
      };
      const tbody = el('tbody');
      s.rows.forEach(r => { const row = el('tr'); r.forEach((v, i) => row.append(cell(s.columns[i], v))); tbody.append(row); });
      table.append(tbody);
      if (s.total) { const tfoot = el('tfoot'), row = el('tr'); s.total.forEach((v, i) => row.append(cell(s.columns[i], v))); tfoot.append(row); table.append(tfoot); }
      sec.append(table);
    }
    if (s.note) sec.append(el('p', 'r-not', s.note));
    root.append(sec);
  }

  const foot = el('footer', 'r-alt-bilgi');
  foot.append(el('span', '', m.footer), el('span', '', `${m.lang === 'tr' ? 'Oluşturulma' : 'Created'} ${new Date(m.createdAt).toLocaleString(m.locale, { dateStyle: 'medium', timeStyle: 'short' })}`));
  root.append(foot);
}

function status(text, bad = false) { const d = $('#durum'); d.hidden = !text; d.textContent = text ?? ''; d.style.color = bad ? '#b91c1c' : ''; }

async function share(model) {
  const box = $('#paylas-kutu'), err = $('#paylas-hata');
  box.hidden = false; err.hidden = true;
  if (box.dataset.link) { $('#paylas-baglanti').value = box.dataset.link; return; }
  $('#paylas-baglanti').value = 'Sealing…';
  try {
    const key = newKey();
    const env = await seal(model, key);
    const r = await fetch('/api/rapor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(env) });
    if (!r.ok) throw new Error(r.status === 429 ? 'Too many links in one hour. Try again later.' : r.status === 503 ? 'Sharing is not set up on this server.' : 'The relay did not answer.');
    const { id } = await r.json();
    const link = linkOf(location.origin, id, key);
    box.dataset.link = link;
    $('#paylas-baglanti').value = link;
    $('#paylas-baglanti').select();
  } catch (e) { $('#paylas-baglanti').value = ''; err.hidden = false; err.textContent = e.message; }
}

async function main() {
  $('#yazdir').onclick = () => window.print();
  $('#paylas-kopyala').onclick = async () => {
    const v = $('#paylas-baglanti').value;
    if (!v.startsWith('http')) return;
    try { await navigator.clipboard.writeText(v); } catch { $('#paylas-baglanti').select(); document.execCommand?.('copy'); }
    $('#paylas-kopyala').textContent = 'Copied';
    setTimeout(() => { $('#paylas-kopyala').textContent = 'Copy link'; }, 1500);
  };
  const frag = location.hash;
  let model = null;
  if (frag === '#local') {
    try { model = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? 'null'); } catch { model = null; }
    if (!isReportModel(model)) return status('No report is open in this browser. Open the analysis, then choose "Open the report page".', true);
    $('#paylas').hidden = false; $('#geri').hidden = false;
    $('#paylas').onclick = () => share(model);
  } else {
    const link = parseLink(frag);
    if (!link) return status('This link is incomplete. Ask the person who shared it for a new one.', true);
    let env;
    try {
      const r = await fetch(`/api/rapor?id=${link.id}`, { cache: 'no-store' });
      if (r.status === 404) return status('This report has expired or the link is wrong. Shared reports stay for 30 days.', true);
      if (!r.ok) return status('The relay did not answer. Try again in a moment.', true);
      env = await r.json();
    } catch { return status('The relay did not answer. Try again in a moment.', true); }
    model = await open(env, link.key);
    if (!isReportModel(model)) return status('This link does not open the report. Ask the person who shared it for a new one.', true);
  }
  render($('#rapor'), model);
  document.title = `${model.title}${model.day ? ' ' + model.day : ''} · Kalibre Markets`;
  document.documentElement.lang = model.lang === 'tr' ? 'tr' : 'en';
  $('#rapor').hidden = false;
  status(null);
}
main();
