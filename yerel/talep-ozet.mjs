// Talep testi özeti (docs/TALEP-TESTI.md). Upstash'teki sayaç ve form kayıtlarını okur.
//
// Kullanım (site kökünden; Upstash bilgileri ortamda olmalı, örn. `vercel env pull .env.talep`
// ile alıp `set -a; . ./.env.talep; set +a`. Dosyayı işin bitince sil, repoya ekleme):
//   node yerel/talep-ozet.mjs                     huni: sayfa/varyant, sayfa/kaynak, gün
//   node yerel/talep-ozet.mjs --csv talep.csv     ayrıca form kayıtlarını CSV'ye yazar (e-postalar dahil)
//   node yerel/talep-ozet.mjs --baslangic 2026-10-27   bu günden önceki sayaçları saymaz
//
// Hiçbir şey yazmaz ya da silmez; yalnız okur.

import { writeFileSync } from 'node:fs';
import { redisBilgisi } from '../api/_lib/depo.ts';
import { sayacCoz, huniOzetle, kayitlarCsv } from '../api/_lib/talep.ts';

const arg = (ad) => { const i = process.argv.indexOf(ad); return i > 0 ? process.argv[i + 1] : undefined; };
const r = redisBilgisi();
if (!r) {
  console.error('Upstash bilgisi yok. UPSTASH_REDIS_REST_URL/TOKEN ya da Vercel önekli KV_REST_API_URL/TOKEN gerekli.');
  process.exit(1);
}

async function komut(...c) {
  const y = await fetch(r.url, { method: 'POST', headers: { Authorization: `Bearer ${r.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
  if (!y.ok) throw new Error(`upstash ${y.status}`);
  return (await y.json()).result;
}

async function anahtarlar(desen) {
  const hepsi = [];
  let imlec = '0';
  do {
    const [sonraki, parca] = await komut('SCAN', imlec, 'MATCH', desen, 'COUNT', 1000);
    hepsi.push(...parca);
    imlec = String(sonraki);
  } while (imlec !== '0');
  return [...new Set(hepsi)];
}

async function degerler(liste) {
  const out = [];
  for (let i = 0; i < liste.length; i += 200) out.push(...await komut('MGET', ...liste.slice(i, i + 200)));
  return out;
}

const yuzde = (x) => x === null ? '-' : (100 * x).toFixed(1) + '%';
function tablo(baslik, satirlar) {
  console.log(`\n${baslik}`);
  const bas = ['', 'görüntüleme', 'fiyat tık', 'form', 'fiyat tık %', 'dönüşüm %'];
  const veri = satirlar.map(s => [s.anahtar, s.goruntuleme, s.fiyatTik, s.form, yuzde(s.fiyatOrani), yuzde(s.donusum)].map(String));
  const gen = bas.map((b, i) => Math.max(b.length, ...veri.map(v => v[i].length)));
  const yaz = (v) => console.log(v.map((x, i) => i ? x.padStart(gen[i]) : x.padEnd(gen[i])).join('  '));
  yaz(bas);
  veri.forEach(yaz);
}

const baslangic = arg('--baslangic');
const sk = await anahtarlar('talep:sayac:*');
const sayaclar = (await degerler(sk)).map((v, i) => sayacCoz(sk[i], v)).filter(s => s && (!baslangic || s.gun >= baslangic));

const kk = await anahtarlar('talep:kayit:*');
const kayitlar = (await degerler(kk)).map(v => { try { return JSON.parse(v); } catch { return null; } }).filter(Boolean)
  .filter(k => !baslangic || String(k.zaman).slice(0, 10) >= baslangic);

console.log(`Sayaç anahtarı: ${sayaclar.length}, form kaydı (tekil e-posta/sayfa): ${kayitlar.length}`);
tablo('Sayfa ve fiyat varyantı', huniOzetle(sayaclar, s => `${s.sayfa} ${s.varyant === 'a' ? 'A ($19)' : 'B ($29)'}`));
tablo('Sayfa ve kaynak (?ref=)', huniOzetle(sayaclar, s => `${s.sayfa} ${s.kaynak}`));
tablo('Sayfa ve dil', huniOzetle(sayaclar, s => `${s.sayfa} ${s.dil}`));
tablo('Gün', huniOzetle(sayaclar, s => s.gun));

const say = (alan, sayfa) => {
  const t = {};
  for (const k of kayitlar.filter(k => k.sayfa === sayfa)) { const v = k.cevaplar?.[alan]; if (v) t[v] = (t[v] ?? 0) + 1; }
  return Object.entries(t).sort((a, b) => b[1] - a[1]).map(([v, n]) => `${v}: ${n}`).join(', ') || '-';
};
console.log('\nAnket (seçmeli sorular)');
console.log(`  rule-guard firma: ${say('firma', 'rule-guard')}`);
console.log(`  rule-guard son 12 ayda sınav: ${say('sinav', 'rule-guard')}`);
console.log(`  mt5-analytics platform: ${say('platform', 'mt5-analytics')}`);
console.log(`  mt5-analytics şu an kullanılan: ${say('simdi', 'mt5-analytics')}`);
console.log(`  treasury kurum: ${say('kurum', 'treasury')}`);
console.log(`  treasury masa büyüklüğü: ${say('masa', 'treasury')}`);

const csv = arg('--csv');
if (csv) {
  writeFileSync(csv, kayitlarCsv(kayitlar));
  console.log(`\n${kayitlar.length} kayıt yazıldı: ${csv} (e-posta içerir; paylaşma, iş bitince sil)`);
}
