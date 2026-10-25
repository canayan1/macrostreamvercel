#!/usr/bin/env node
// kalibre-core CLI.
//   kalibre-core run <strateji.json> <mumlar.csv|json> [--config ayar.json] [--trades] [--export cikti.json]
//   kalibre-core fingerprint
//   kalibre-core version
// run: JSON sonuç yazar (manifest, resultId, istatistik, dolum, uyarılar; --trades ile işlemler).
// Mum dosyası: CSV (lab ile aynı biçimler) ya da JSON (dizi ya da { mumlar: [...] }; alanlar t,a,y,d,k).

import { readFileSync, writeFileSync } from 'node:fs';
import { calistir, disaAktar, csvCoz, dogrula, parmakIzi, MOTOR_SURUMU } from '../src/index.js';

function kullanim(kod = 2) {
  process.stderr.write('usage: kalibre-core run <strategy.json> <bars.csv|bars.json> [--config config.json] [--trades] [--export run.json]\n       kalibre-core fingerprint\n       kalibre-core version\n');
  process.exit(kod);
}

function mumlariOku(yol) {
  const metin = readFileSync(yol, 'utf8');
  if (/\.json$/i.test(yol) || /^\s*[[{]/.test(metin)) {
    const j = JSON.parse(metin);
    const dizi = Array.isArray(j) ? j : j.mumlar ?? j.bars;
    if (!Array.isArray(dizi)) throw new Error('JSON bars: expected an array or { mumlar: [...] }');
    return dizi.map(m => ({ t: Number(m.t), a: Number(m.a ?? m.open), y: Number(m.y ?? m.high), d: Number(m.d ?? m.low), k: Number(m.k ?? m.close), ...(m.v !== undefined ? { v: Number(m.v) } : {}) }));
  }
  const r = csvCoz(metin);
  return r.mumlar ?? r;
}

const [komut, ...arg] = process.argv.slice(2);
try {
  if (komut === 'version' || komut === '--version') { process.stdout.write(`${MOTOR_SURUMU}\n`); process.exit(0); }
  if (komut === 'fingerprint') { process.stdout.write(`${JSON.stringify(parmakIzi(), null, 2)}\n`); process.exit(0); }
  if (komut !== 'run') kullanim();
  const konum = arg.filter(a => !a.startsWith('--'));
  const bayrak = n => { const i = arg.indexOf(n); return i >= 0 ? arg[i + 1] : undefined; };
  if (konum.length < 2) kullanim();
  // --config ve --export değerleri konumsal argüman sayılmasın.
  const [stratejiYolu, mumYolu] = konum.filter(a => a !== bayrak('--config') && a !== bayrak('--export'));
  const strateji = JSON.parse(readFileSync(stratejiYolu, 'utf8'));
  const hatalar = dogrula(strateji);
  if (hatalar.length) { process.stderr.write(`${JSON.stringify({ error: 'invalid strategy', issues: hatalar }, null, 2)}\n`); process.exit(1); }
  const mumlar = mumlariOku(mumYolu);
  const ayarYolu = bayrak('--config');
  const ayar = ayarYolu ? JSON.parse(readFileSync(ayarYolu, 'utf8')) : {};
  const sonuc = calistir(strateji, mumlar, ayar);
  const cikti = {
    resultId: sonuc.resultId, manifest: sonuc.manifest, summary: sonuc.istatistik, fill: sonuc.dolum,
    ...(sonuc.enstruman ? { instrument: sonuc.enstruman } : {}), warnings: sonuc.uyarilar,
    ...(arg.includes('--trades') ? { trades: sonuc.islemler } : {}),
  };
  const disa = bayrak('--export');
  if (disa) writeFileSync(disa, `${JSON.stringify(disaAktar(strateji, ayar, sonuc), null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(cikti, null, 2)}\n`);
} catch (e) {
  process.stderr.write(`kalibre-core: ${e.message}\n`);
  process.exit(1);
}
