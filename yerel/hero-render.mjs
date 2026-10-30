// Page hero images from real product screens, rendered by headless Chrome.
//   laptop: one app screen inside a drawn laptop (yerel/hero/hero.html)
//   suite:  three app screens as overlapping windows (yerel/hero/suite.html)
// Local server first: node yerel/site-sunucu.mjs 8793.
// Usage: node yerel/hero-render.mjs <out dir> [target,target]
// Writes <name>-<lang>.png (2x) for each target; screens are kept as screen-<id>-<lang>.png.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const ROOT = 'http://localhost:8793';
const SCREENS = {
  blotter: { url: lang => `/lab/blotter?lang=${lang}&file=samples/${lang === 'tr' ? 'fx-blotter-ornek' : 'fx-blotter-sample'}.xlsx`, top: '#ozet-kart' },
  'blotter-pnl': { url: lang => `/lab/blotter?lang=${lang}&file=samples/${lang === 'tr' ? 'fx-blotter-ornek' : 'fx-blotter-sample'}.xlsx`, top: '#kz-kart' },
  analytics: { url: lang => `/lab/analytics?lang=${lang}&file=templates/kalibre-trade-log-example.xlsx`, top: '#ozet-kart' },
  lab: { url: lang => `/lab/?lang=${lang}&demo=1`, top: '#prova-kart', wait: 6000 },
};
const TARGETS = [
  { name: 'home', kind: 'laptop', screen: 'blotter' },
  { name: 'fx-blotter', kind: 'laptop', screen: 'blotter-pnl' },
  { name: 'trade-analytics', kind: 'laptop', screen: 'analytics' },
  { name: 'kalibre-lab', kind: 'laptop', screen: 'lab' },
  { name: 'suite', kind: 'suite', screens: ['analytics', 'blotter', 'lab'] },
];

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9335', `--user-data-dir=${OUT}/.profile`, '--hide-scrollbars', '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));
let ws, seq = 0; const pending = new Map();
async function connect() {
  for (let k = 0; k < 40; k++) { try { const l = await (await fetch('http://127.0.0.1:9335/json')).json(); const p = l.find(x => x.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {} await wait(250); }
  throw new Error('no chrome');
}
const cdp = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((ok, no) => pending.set(id, { ok, no })); };
const evaluate = async expr => (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
const viewport = (width, height, scale = 2) => cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
const capture = async (file, clip) => { const r = await cdp('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(file, Buffer.from(r.data, 'base64')); console.log('written', file); };
const dataUri = file => 'data:image/png;base64,' + readFileSync(file).toString('base64');

async function screen(id, lang) {
  const s = SCREENS[id];
  await viewport(1440, 900);
  await cdp('Page.navigate', { url: ROOT + s.url(lang) });
  await wait(s.wait ?? 4500);
  await evaluate('document.fonts.ready.then(() => 1)');
  await evaluate(`(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('#sentetik-bant')?.remove();
    const e = document.querySelector(${JSON.stringify(s.top)}); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 78); return 1; })()`);
  await wait(600);
  const file = `${OUT}/screen-${id}-${lang}.png`;
  await capture(file);
  return file;
}

async function compose(template, replacements, file) {
  let html = readFileSync(new URL(`./hero/${template}`, import.meta.url), 'utf8');
  for (const [k, v] of Object.entries(replacements)) html = html.replaceAll(k, v);
  const page = `${OUT}/${file}.html`;
  writeFileSync(page, html);
  await viewport(1440, 900);
  await cdp('Page.navigate', { url: `file://${page}` });
  await wait(1500);
  const box = await evaluate("(() => { const r = document.querySelector('.scene').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; })()");
  await capture(`${OUT}/${file}.png`, box);
}

try {
  ws = new WebSocket(await connect());
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.no(new Error(d.error.message)) : p.ok(d.result); } });
  await cdp('Page.enable'); await cdp('Runtime.enable');
  const only = process.argv[3] ? new Set(process.argv[3].split(',')) : null;
  for (const lang of ['en', 'tr']) {
    const shots = {};
    for (const t of TARGETS) {
      if (only && !only.has(t.name)) continue;
      for (const id of t.screens ?? [t.screen]) shots[id] ??= await screen(id, lang);
      if (t.kind === 'laptop') await compose('hero.html', { SCREEN_SRC: dataUri(shots[t.screen]) }, `${t.name}-${lang}`);
      else await compose('suite.html', Object.fromEntries(t.screens.map((id, i) => [`SCREEN_${i + 1}`, dataUri(shots[id])])), `${t.name}-${lang}`);
    }
  }
} finally { ws?.close(); chrome.kill(); }
