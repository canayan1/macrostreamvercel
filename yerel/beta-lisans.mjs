// Kapalı beta lisans yönetimi (yalnız yerelde çalışır; yerel/ yayına gitmez).
// Upstash bilgileri ortamda olmalı: `vercel env pull .env.local` ve ardından
//   node --env-file=.env.local yerel/beta-lisans.mjs <komut> [seçenekler]
//
// Komutlar:
//   olustur --eposta ad@ornek.com [--gun 60] [--not "kısa not"]
//   listele
//   uzat --anahtar KLM-... --gun 30
//   iptal --anahtar KLM-...
//   bagla --anahtar KLM-... (--kullanici <uuid> | --hesap <e-posta>)
//     Lisansı bir Kalibre hesabına bağlar. --hesap için SUPABASE_URL, SUPABASE_ANON_KEY ve
//     SUPABASE_SERVICE_ROLE_KEY ortamda olmalı (e-posta profiles tablosunda aranır).
//   olustur komutu da --kullanici ya da --hesap alırsa yeni lisansı hemen bağlar.

import { depoSec } from '../api/_lib/depo.ts';
import { betaOlustur, betaListele, betaUzat, betaIptal } from './beta-lisans-cekirdek.mjs';
import { lisansBagla } from '../api/_lib/hesap.ts';
import { servisIstemci, supabaseAyar, uuidMi } from '../api/_lib/supabase.ts';

// --kullanici <uuid> ya da --hesap <e-posta> → Supabase kullanıcı kimliği
async function kullaniciBul(secenek) {
  if (secenek.kullanici) {
    if (!uuidMi(secenek.kullanici)) throw new Error('--kullanici bir uuid olmalı');
    return secenek.kullanici;
  }
  if (!secenek.hesap) return null;
  const servis = servisIstemci(supabaseAyar());
  if (!servis) throw new Error('--hesap için SUPABASE_URL, SUPABASE_ANON_KEY ve SUPABASE_SERVICE_ROLE_KEY gerekli');
  const l = await servis.sec('profiles', `select=id&email=ilike.${encodeURIComponent(String(secenek.hesap).trim())}&limit=2`);
  if (!l?.length) throw new Error(`bu e-postayla hesap yok: ${secenek.hesap} (önce siteye giriş yapmalı)`);
  if (l.length > 1) throw new Error('bu e-postayla birden çok hesap var; --kullanici ile kimliği ver');
  return l[0].id;
}
async function bagla(anahtar, uid) {
  const r = await lisansBagla(depo, anahtar, uid);
  if (r.durum !== 200) throw new Error(r.hata);
  console.log(`${anahtar}  hesaba bağlandı: ${uid}`);
}


const [komut, ...arg] = process.argv.slice(2);
const secenek = {};
for (let i = 0; i < arg.length; i++) if (arg[i].startsWith('--')) secenek[arg[i].slice(2)] = arg[i + 1];
const tarih = sn => new Date(sn * 1000).toISOString().slice(0, 10);

const depo = depoSec();
if (!depo) {
  console.error('Depo yok: UPSTASH_REDIS_REST_URL ve UPSTASH_REDIS_REST_TOKEN (ya da KV_REST_API_*) gerekli.');
  process.exit(1);
}
try {
  if (komut === 'olustur') {
    const uid = await kullaniciBul(secenek); // önce: hesap yoksa lisans açılmadan dur
    const k = await betaOlustur(depo, { eposta: secenek.eposta, gun: Number(secenek.gun ?? 60), not: secenek.not ?? '' });
    console.log(`${k.anahtar}  ${k.eposta}  bitiş ${tarih(k.bitis)}`);
    if (uid) await bagla(k.anahtar, uid);
  } else if (komut === 'bagla') {
    const uid = await kullaniciBul(secenek);
    if (!uid || !secenek.anahtar) throw new Error('kullanım: bagla --anahtar K (--kullanici U | --hesap E)');
    await bagla(secenek.anahtar, uid);
  } else if (komut === 'listele') {
    const liste = await betaListele(depo);
    if (!liste.length) console.log('beta lisansı yok');
    for (const k of liste) console.log(`${k.anahtar}  ${k.durum.padEnd(8)}  bitiş ${tarih(k.bitis)}  hesap ${k.hesaplar.length}  ürün ${(k.urunler ?? ['hepsi']).join(',')}  ${k.eposta}${k.not ? '  (' + k.not + ')' : ''}`);
  } else if (komut === 'uzat') {
    const k = await betaUzat(depo, secenek.anahtar, Number(secenek.gun));
    console.log(`${k.anahtar}  yeni bitiş ${tarih(k.bitis)}`);
  } else if (komut === 'iptal') {
    const k = await betaIptal(depo, secenek.anahtar);
    console.log(`${k.anahtar}  iptal edildi`);
  } else {
    console.error('kullanım: olustur --eposta E [--gun 60] [--not N] [--kullanici U | --hesap E] | bagla --anahtar K (--kullanici U | --hesap E) | listele | uzat --anahtar K --gun N | iptal --anahtar K');
    process.exit(1);
  }
} catch (e) {
  console.error('hata:', e.message);
  process.exit(1);
}
