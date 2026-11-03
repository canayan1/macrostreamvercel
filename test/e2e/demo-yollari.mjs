// End-to-end check of every path a prospect takes from a mailing link, against the live site by default.
// Runs the real pages in a real Chromium: demo request form, Trade Analytics sample → account review,
// FX Blotter sample → desk report → sealed share link opened in a second browser, backtest sample, and a
// live desk (head and trader in two separate browsers, one signal sent, seen and done).
//
//   node test/e2e/demo-yollari.mjs                      against https://kalibremarkets.com
//   BASE=http://localhost:8793 node test/e2e/demo-yollari.mjs
//   HEADED=1 ...                                        watch it
//
// Leaves nothing behind on the live site: the demo form is submitted with the honeypot filled, which the
// endpoint answers with 204 and does not record; the live desk is a throwaway named "E2E check" whose
// events expire with the relay's retention. Needs playwright-core (devDependency) and a Chromium from a
// Playwright cache (PLAYWRIGHT_CHROMIUM to point at one explicitly).

import { chromium } from 'playwright-core';
import { readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.env.BASE ?? 'https://kalibremarkets.com').replace(/\/$/, '');
const HEADED = !!process.env.HEADED;
const T = 20000;

function chromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  const caches = [join(homedir(), 'Library/Caches/ms-playwright'), join(homedir(), '.cache/ms-playwright')];
  for (const c of caches) {
    if (!existsSync(c)) continue;
    const dirs = readdirSync(c).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)));
    for (const d of dirs) {
      for (const p of ['chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-linux/chrome']) {
        const full = join(c, d, p);
        if (existsSync(full)) return full;
      }
    }
  }
  return undefined; // playwright-core will then complain clearly
}

const results = [];
let browser;
async function step(name, fn) {
  const t0 = Date.now();
  try { await fn(); results.push({ name, ok: true, ms: Date.now() - t0 }); console.log(`ok   ${name} (${Date.now() - t0} ms)`); }
  catch (e) { results.push({ name, ok: false, ms: Date.now() - t0, error: e.message }); console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`); }
}
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const fresh = async () => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); page.setDefaultTimeout(T); return { ctx, page }; };
// Pages expose errors only in the console; collect them so a silent JS crash still fails the step.
const watch = page => { const errs = []; page.on('pageerror', e => errs.push(String(e.message ?? e))); return errs; };

browser = await chromium.launch({ headless: !HEADED, executablePath: chromiumPath() });
console.log(`Checking ${BASE}`);

await step('demo request form: product prefilled from the link, submit path answers without recording', async () => {
  const { ctx, page } = await fresh();
  const errs = watch(page);
  await page.goto(`${BASE}/request-a-demo?product=desk-signal&ref=e2e`);
  must((await page.inputValue('select[name=urun]')) === 'desk-signal', 'product not prefilled');
  await page.fill('#ee-eposta', 'e2e@kalibre.invalid');
  await page.selectOption('select[name=kurum]', 'banka');
  await page.selectOption('select[name=masa]', '2-5');
  await page.fill('input[name=sistem]', 'E2E check, please ignore');
  await page.check('#ee-onay');
  // Honeypot filled on purpose: the endpoint returns 204 and stores nothing.
  await page.evaluate(() => { document.querySelector('input[name=web]').value = 'bot'; });
  const [resp] = await Promise.all([page.waitForResponse(r => r.url().includes('/api/talep') && r.request().method() === 'POST'), page.click('.talep-kart button[type=submit]')]);
  must(resp.status() === 204, `expected 204 from /api/talep, got ${resp.status()}`);
  await page.waitForSelector('[data-mesaj].tamam', { state: 'visible' });
  must(errs.length === 0, `page errors: ${errs.join(' | ')}`);
  await ctx.close();
});

await step('Rule Guard download and every guide PDF are served from the site', async () => {
  const { ctx, page } = await fresh();
  await page.goto(`${BASE}/get-started`);
  const pdfs = await page.$$eval('a[href$="-guide.pdf"]', as => [...new Set(as.map(a => a.getAttribute('href')))]);
  must(pdfs.length >= 4, `only ${pdfs.length} guide PDFs linked`);
  for (const href of [...pdfs, '/static/downloads/KalibreRuleGuard.ex5']) {
    const r = await page.request.get(`${BASE}${href}`);
    const body = await r.body();
    must(r.status() === 200 && body.length > 10000, `${href}: ${r.status()} ${body.length} bytes`);
    if (href.endsWith('.pdf')) must(body.subarray(0, 4).toString() === '%PDF', `${href} is not a PDF`);
  }
  await page.goto(`${BASE}/rule-guard`);
  must(await page.locator('a[href="/static/downloads/KalibreRuleGuard.ex5"]').count() >= 2, 'download button missing on /rule-guard');
  await ctx.close();
});

await step('Trade Analytics sample → account review report', async () => {
  const { ctx, page } = await fresh();
  const errs = watch(page);
  await page.goto(`${BASE}/lab/analytics?file=templates/kalibre-trade-log-example.xlsx`);
  // The report opens in a new tab, as it does for a user.
  const [report] = await Promise.all([ctx.waitForEvent('page'), page.click('text=Open the report page')]);
  report.setDefaultTimeout(T);
  await report.waitForSelector('.r-kpi b');
  const kpi = await report.locator('.r-kpi b').count();
  must(kpi >= 6, `only ${kpi} KPI boxes`);
  must((await report.title()).includes('Account review'), `title: ${await report.title()}`);
  must(errs.length === 0, `page errors: ${errs.join(' | ')}`);
  await ctx.close();
});

let shareLink = null;
await step('FX Blotter sample → desk report → sealed share link', async () => {
  const { ctx, page } = await fresh();
  const errs = watch(page);
  await page.goto(`${BASE}/lab/blotter?file=samples/fx-blotter-sample.xlsx`);
  const [report] = await Promise.all([ctx.waitForEvent('page'), page.click('text=Open the report page')]);
  report.setDefaultTimeout(T);
  await report.waitForSelector('.r-kpi b');
  must((await report.title()).includes('FX desk report'), `title: ${await report.title()}`);
  const [resp] = await Promise.all([report.waitForResponse(r => r.url().includes('/api/rapor') && r.request().method() === 'POST'), report.click('text=Share a read-only link')]);
  must(resp.status() === 200, `/api/rapor ${resp.status()}`);
  await report.waitForFunction(() => /#[0-9a-f]{16,}\./.test(document.querySelector('.r-kopya input')?.value ?? ''));
  shareLink = await report.inputValue('.r-kopya input');
  must(errs.length === 0, `page errors: ${errs.join(' | ')}`);
  await ctx.close();
});

await step('share link opens read-only in a browser that never saw the file', async () => {
  must(shareLink, 'no share link from the previous step');
  const { ctx, page } = await fresh();
  const errs = watch(page);
  await page.goto(shareLink.replace(/^https?:\/\/[^/]+/, BASE));
  await page.waitForSelector('.r-kpi b');
  must((await page.title()).includes('FX desk report'), `title: ${await page.title()}`);
  must(!(await page.locator('text=Share a read-only link').first().isVisible().catch(() => false)), 'share button shown on a read-only report');
  must(errs.length === 0, `page errors: ${errs.join(' | ')}`);
  await ctx.close();
});

await step('backtest sample runs and shows statistics', async () => {
  const { ctx, page } = await fresh();
  const errs = watch(page);
  await page.goto(`${BASE}/lab?demo=1`);
  await page.waitForFunction(() => document.querySelectorAll('#istatistik b').length >= 4);
  const trades = await page.locator('#istatistik b').first().innerText();
  must(/\d/.test(trades), `no trade count: ${trades}`);
  must(errs.length === 0, `page errors: ${errs.join(' | ')}`);
  await ctx.close();
});

await step('live desk: head starts a desk, trader joins from the invite, one signal is seen and done', async () => {
  const head = await fresh(), trader = await fresh();
  const errs = [...watch(head.page), ...watch(trader.page)];
  await head.page.goto(`${BASE}/lab/desk-live`);
  await head.page.fill('#kur-ad', 'E2E check');
  await head.page.click('#kur button[type=submit]');
  await head.page.waitForURL(/#head=/);
  await head.page.waitForSelector('#sinyaller .d-sinyal');
  await head.page.click('#davet-ac');
  await head.page.waitForFunction(() => /#join=/.test(document.querySelector('#davet-baglanti')?.value ?? ''));
  const invite = await head.page.inputValue('#davet-baglanti');

  await trader.page.goto(invite.replace(/^https?:\/\/[^/]+/, BASE));
  await trader.page.waitForSelector('#kimlik-form', { state: 'visible' });
  await trader.page.fill('#kimlik-ad', 'E2E Trader');
  await trader.page.fill('#kimlik-yer', 'Test');
  await trader.page.click('#kimlik-form button[type=submit]');
  await trader.page.waitForSelector('#orb', { state: 'visible' });

  // The head sees the trader, arms the first signal and sends it to them.
  await head.page.waitForSelector('#kisiler .d-hedef', { timeout: T });
  await head.page.click('#sinyaller .d-sinyal >> nth=0');
  const t0 = Date.now();
  await head.page.click('#kisiler .d-hedef >> nth=0');
  try {
    await trader.page.waitForFunction(() => !document.querySelector('#sinyal-eylem')?.hidden && (document.querySelector('#sinyal-ad')?.textContent ?? '').trim() !== 'All clear');
  } catch (e) {
    const diag = await head.page.evaluate(() => ({ duyuru: document.querySelector('#duyuru')?.textContent, hata: document.querySelector('#gonder-hata')?.textContent, silahli: document.querySelector('#silahli')?.textContent, hedefler: document.querySelectorAll('#kisiler .d-hedef').length }));
    const tdiag = await trader.page.evaluate(() => ({ ad: document.querySelector('#sinyal-ad')?.textContent, hata: document.querySelector('#trader-hata')?.textContent, masa: document.querySelector('#trader-masa')?.textContent }));
    throw new Error(`signal never reached the trader. head=${JSON.stringify(diag)} trader=${JSON.stringify(tdiag)}`);
  }
  const latency = Date.now() - t0;
  await trader.page.click('#tamam'); // Seen
  await trader.page.waitForFunction(() => document.querySelector('#tamam')?.textContent === 'Done');
  await trader.page.click('#tamam'); // Done
  await trader.page.waitForFunction(() => document.querySelector('#sinyal-eylem')?.hidden === true);
  await head.page.waitForFunction(() => /Clear/.test(document.querySelector('#yanit')?.textContent ?? '') && !/Working on it|Not seen yet|Ringing/.test(document.querySelector('#yanit')?.textContent ?? ''), null, { timeout: T });
  console.log(`     send → trader screen ${latency} ms`);
  must(latency < 3000, `latency ${latency} ms`);
  must(errs.length === 0, `page errors: ${errs.join(' | ')}`);
  await head.ctx.close(); await trader.ctx.close();
});

await browser.close();
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) { for (const f of failed) console.log(`- ${f.name}: ${f.error}`); process.exit(1); }
