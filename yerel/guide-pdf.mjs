// Prints every guide page (/guides/<key>) to static/guides/kalibre-<key>-guide.pdf with the page's print styles.
// Needs the local site server: node yerel/site-sunucu.mjs 8793, then: node yerel/guide-pdf.mjs [base]
import { chromium } from 'playwright-core';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.argv[2] ?? 'http://localhost:8793').replace(/\/$/, '');
const KOK = new URL('../', import.meta.url).pathname;
const keys = readdirSync(join(KOK, 'guides')).filter(k => existsSync(join(KOK, 'guides', k, 'index.html')));
const chrome = (() => {
  for (const c of [join(homedir(), 'Library/Caches/ms-playwright'), join(homedir(), '.cache/ms-playwright')]) {
    if (!existsSync(c)) continue;
    for (const d of readdirSync(c).filter(d => /^chromium-\d+$/.test(d)).sort().reverse())
      for (const p of ['chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-linux/chrome'])
        if (existsSync(join(c, d, p))) return join(c, d, p);
  }
})();
mkdirSync(join(KOK, 'static', 'guides'), { recursive: true });
const browser = await chromium.launch({ executablePath: chrome });
const page = await browser.newPage();
for (const k of keys) {
  await page.goto(`${BASE}/guides/${k}`, { waitUntil: 'networkidle' });
  // Site chrome added by scripts (beta strip, cookie notice) is not part of the guide.
  await page.evaluate(() => {
    for (const el of [...document.body.querySelectorAll('body > *')]) {
      if (el.querySelector('.guide') || el.matches('script, style, link')) continue;
      const pos = getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky' || /products are in beta|cookies for visit statistics/i.test(el.textContent ?? '')) el.remove();
    }
  });
  await page.emulateMedia({ media: 'print' });
  const out = join(KOK, 'static', 'guides', `kalibre-${k}-guide.pdf`);
  await page.pdf({ path: out, format: 'A4', printBackground: false, displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="font:8px Helvetica,Arial;color:#777;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>kalibremarkets.com/guides/${k}</span><span class="pageNumber"></span></div>`,
    margin: { top: '14mm', bottom: '16mm', left: '0', right: '0' } });
  console.log('written', out.replace(KOK, ''));
}
await browser.close();
