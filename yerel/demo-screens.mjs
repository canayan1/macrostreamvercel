// Screenshots of each product's result screen for the demo page (headless Chrome over CDP).
// Local server first: node yerel/site-sunucu.mjs 8793. Usage: node yerel/demo-screens.mjs <out dir>
// Writes <name>.png and <name>-tr.png at 2x; yerel/gorsel-uret.py style WebP is made afterwards.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const ROOT = process.env.ROOT ?? 'http://localhost:8793';
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${process.env.CHROME_PROFILE ?? OUT + '/.profile'}`, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));
let ws, seq = 0; const pending = new Map();
async function connect() {
  for (let k = 0; k < 40; k++) { try { const l = await (await fetch('http://127.0.0.1:9334/json')).json(); const p = l.find(x => x.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {} await wait(250); }
  throw new Error('no chrome');
}
const cdp = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((ok, no) => pending.set(id, { ok, no })); };
const evaluate = async expr => (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
async function load(url) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 3200, deviceScaleFactor: 2, mobile: false });
  await cdp('Page.navigate', { url });
  await wait(4500);
  await evaluate('document.fonts.ready.then(() => 1)');
  await evaluate("(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); return 1; })()");
  await wait(300);
}
// Captures the box from the top of the first selector to the bottom of the last one.
async function shot(name, selectors, pad = 16) {
  const box = await evaluate(`(() => { const els = ${JSON.stringify(selectors)}.map(s => document.querySelector(s)).filter(Boolean);
    const r = els.map(e => e.getBoundingClientRect()); const top = Math.min(...r.map(x => x.top)) + scrollY, bottom = Math.max(...r.map(x => x.bottom)) + scrollY;
    const left = Math.min(...r.map(x => x.left)), right = Math.max(...r.map(x => x.right)); return { x: left, y: top, w: right - left, h: bottom - top }; })()`);
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + 2 * pad, height: Math.min(box.h + 2 * pad, 2400), scale: 1 };
  const r = await cdp('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'));
  console.log('written', name, Math.round(clip.width), 'x', Math.round(clip.height));
}
const SHOTS = [
  { url: '/lab/analytics?file=templates/kalibre-trade-log-example.xlsx', shots: [['analytics-overview', ['#ozet-kart']], ['analytics-segments', ['#icgoru-kart']]] },
  { url: '/lab/blotter?file=samples/fx-blotter-sample.xlsx', trUrl: '/lab/blotter?file=samples/fx-blotter-ornek.xlsx', shots: [['blotter-summary', ['#ozet-kart']], ['blotter-reconciliation', ['#mutabakat-kart']]] },
  { url: '/lab/?demo=1', shots: [['lab-backtest', ['#calistirma', '#grafik', '#istatistik', '#egri']]] },
];
try {
  ws = new WebSocket(await connect());
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.no(new Error(d.error.message)) : p.ok(d.result); } });
  await cdp('Page.enable'); await cdp('Runtime.enable');
  for (const lang of ['en', 'tr']) {
    for (const s of SHOTS) {
      const path = lang === 'tr' ? (s.trUrl ?? s.url) : s.url;
      await load(`${ROOT}${path}${path.includes('?') ? '&' : '?'}lang=${lang}`);
      for (const [name, sel] of s.shots) await shot(lang === 'tr' ? `${name}-tr` : name, sel);
    }
  }
} finally { ws?.close(); chrome.kill(); }
