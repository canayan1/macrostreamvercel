// İşlem Analizi ekran görüntüleri: başsız Chrome + CDP. Yerel sunucu: node yerel/site-sunucu.mjs 8793. Kullanım: [DIL=tr] node yerel/ekran-cek-analiz.mjs <klasor>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const CIKTI = process.argv[2]; mkdirSync(CIKTI, { recursive: true });
const KOK = process.env.KOK ?? 'http://analiz.localhost:8793';
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9333', '--user-data-dir=' + (process.env.CHROME_PROFIL ?? '/tmp/kalibre-chrome-profil') + '', '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const bekle = ms => new Promise(r => setTimeout(r, ms));
let ws, sira = 0; const bekleyen = new Map();
async function bagla() {
  for (let k = 0; k < 40; k++) { try { const l = await (await fetch('http://127.0.0.1:9333/json')).json(); const p = l.find(x => x.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {} await bekle(250); }
  throw new Error('chrome yok');
}
function cdp(method, params = {}) { const id = ++sira; ws.send(JSON.stringify({ id, method, params })); return new Promise((ok, no) => bekleyen.set(id, { ok, no })); }
const degerlendir = async ifade => (await cdp('Runtime.evaluate', { expression: ifade, awaitPromise: true, returnByValue: true })).result.value;
async function sayfa(url, w, h, olcek) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: olcek, mobile: w < 600 });
  await cdp('Page.navigate', { url });
  await bekle(2500);
  await degerlendir('document.fonts.ready.then(() => 1)');
}
async function cek(ad, { secici, w, h, olcek = 2, ust = 0, yukseklik }) {
  const y = secici ? await degerlendir(`(() => { const e = document.querySelector(${JSON.stringify(secici)}); return e.getBoundingClientRect().top + scrollY; })()`) : 0;
  await degerlendir(`window.scrollTo(0, ${Math.max(0, y - ust)})`); await bekle(400);
  const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(`${CIKTI}/${ad}.png`, Buffer.from(r.data, 'base64'));
  console.log('yazildi', ad);
}
try {
  ws = new WebSocket(await bagla());
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && bekleyen.has(d.id)) { const b = bekleyen.get(d.id); bekleyen.delete(d.id); d.error ? b.no(new Error(d.error.message)) : b.ok(d.result); } });
  await cdp('Page.enable'); await cdp('Runtime.enable');
  const dil = process.env.DIL === 'tr' ? '&dil=tr' : '';
  const ek = process.env.DIL === 'tr' ? '-tr' : '';
  await sayfa(`${KOK}/lab/analiz.html?ornek=1${dil}`, 1440, 900, 2);
  await cek('genel-bakis' + ek, { secici: null, w: 1440, h: 900 });
  await cek('ozet' + ek, { secici: '#ozet-kart', ust: 76, w: 1440, h: 900 });
  await cek('icgoruler' + ek, { secici: '#icgoru-kart', ust: 76, w: 1440, h: 900 });
  await cek('prop-sinirlari' + ek, { secici: '#prop-kart', ust: 76, w: 1440, h: 900 });
  await degerlendir(`(() => { const s = document.querySelector('#g-boyut'); s.value = 'seans'; s.dispatchEvent(new Event('change')); return 1; })()`);
  await cek('kendi-gorunumun' + ek, { secici: '#gorunum-kart', ust: 76, w: 1440, h: 900 });
  await sayfa(`${KOK}/lab/analiz.html?ornek=1${dil}`, 390, 844, 2);
  await cek('mobil-ozet' + ek, { secici: '#ozet-kart', ust: 64, w: 390, h: 844 });
  await cek('mobil-icgoruler' + ek, { secici: '#icgoru-kart', ust: 64, w: 390, h: 844 });
} finally { ws?.close(); chrome.kill(); }
