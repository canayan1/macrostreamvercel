// Home page hero image: a real FX Blotter screen inside a drawn laptop, rendered by headless Chrome.
// Local server first: node yerel/site-sunucu.mjs 8793. Usage: node yerel/hero-render.mjs <out dir>
// Writes screen-<lang>.png (the app viewport) and home-hero-<lang>.png (the composition, 2x).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const ROOT = 'http://localhost:8793';
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

try {
  ws = new WebSocket(await connect());
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.no(new Error(d.error.message)) : p.ok(d.result); } });
  await cdp('Page.enable'); await cdp('Runtime.enable');
  for (const lang of ['en', 'tr']) {
    // 1. The app screen: FX Blotter with the sample, summary and P&L table in view.
    await viewport(1440, 900);
    const file = lang === 'tr' ? 'samples/fx-blotter-ornek.xlsx' : 'samples/fx-blotter-sample.xlsx';
    await cdp('Page.navigate', { url: `${ROOT}/lab/blotter?lang=${lang}&file=${file}` });
    await wait(4500);
    await evaluate("document.fonts.ready.then(() => 1)");
    await evaluate("(() => { document.documentElement.style.scrollBehavior = 'auto'; const b = document.querySelector('#sentetik-bant'); if (b) b.remove(); const e = document.querySelector('#ozet-kart'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 78); return 1; })()");
    await wait(500);
    const screen = `${OUT}/screen-${lang}.png`;
    await capture(screen);
    // 2. The composition.
    const html = readFileSync(new URL('./hero/hero.html', import.meta.url), 'utf8').replaceAll('SCREEN_SRC', 'data:image/png;base64,' + readFileSync(screen).toString('base64'));
    writeFileSync(`${OUT}/hero-${lang}.html`, html);
    await viewport(1440, 900);
    await cdp('Page.navigate', { url: `file://${OUT}/hero-${lang}.html` });
    await wait(1500);
    const box = await evaluate("(() => { const r = document.querySelector('.scene').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; })()");
    await capture(`${OUT}/home-hero-${lang}.png`, box);
  }
} finally { ws?.close(); chrome.kill(); }
