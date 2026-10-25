// Laboratuvar taslağının Kalibre Markets hesabıyla eşitlenmesi (isteğe bağlı, önce yerel).
//
// Laboratuvar hesapsız tam çalışır: taslak her zaman localStorage'da durur ('kalibre-lab-taslak').
// Kullanıcı sitede giriş yapmışsa (window.KalibreAuth, /static/kalibre-auth.js) taslak birkaç saniye
// beklenip hesabına da yazılır (Supabase user_items, tür 'strateji'). Başka bir cihazda hesapta daha
// yeni bir taslak varsa sayfa üstte bunu söyler; kullanıcı isterse yükler, mevcut taslak sessizce
// değiştirilmez.
//
// Yalnız kural dosyası ve prova ayarları (gerçekçi maliyetler, dolum modeli; ekAl ile) gider: piyasa
// verisi, prova sonucu, eşleştirme kodu ya da aracı kurum anahtarları gitmez.

import { dil } from './dil.js';

export const KIMLIK_ANAHTARI = 'kalibre-lab-taslak-id';     // hesaptaki satırın kimliği
export const ZAMAN_ANAHTARI = 'kalibre-lab-taslak-zaman';   // yerel taslağın son değiştiği an (ms)

function yerelDepo() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function hesapSenkron({
  al,                         // () => güncel strateji nesnesi
  ekAl = () => null,          // () => payload'a eklenecek ek alanlar (ör. { prova }) ya da null
  teklif = () => {},          // (satir) => hesapta daha yeni taslak var; arayüz kullanıcıya sorar
  auth = () => globalThis.KalibreAuth,
  store = () => globalThis.KalibreStore,
  depo = yerelDepo(),
  gecikme = 2500,
  saat = () => Date.now(),
  zamanlayici = (f, ms) => setTimeout(f, ms),
  iptal = id => clearTimeout(id),
} = {}) {
  const oku = k => { try { return depo?.getItem(k) ?? null; } catch { return null; } };
  const yaz = (k, v) => { try { v == null ? depo?.removeItem(k) : depo?.setItem(k, String(v)); } catch { /* depo yok */ } };
  let bekleyen = null;
  let son = null; // en son hesaba yazılan içerik (aynı içeriği yeniden yazma)

  const girisli = () => { const a = auth(); return !!(a && a.enabled && a.user && a.user() && store()); };

  async function kaydet() {
    bekleyen = null;
    if (!girisli()) return null;
    const s = al();
    if (!s || typeof s !== 'object') return null;
    const ek = ekAl() ?? {};
    const metin = JSON.stringify({ s, ek });
    if (metin === son) return null;
    const satir = await store().save('strateji', String(s.ad ?? '').slice(0, 120), { ...ek, strateji: s, kaynak: 'lab' }, oku(KIMLIK_ANAHTARI) ?? undefined);
    son = metin;
    if (satir?.id && !String(satir.id).startsWith('loc-')) yaz(KIMLIK_ANAHTARI, satir.id);
    return satir;
  }

  // Her taslak değişiminde çağrılır (uygulama.js taslakYaz).
  function degisti() {
    yaz(ZAMAN_ANAHTARI, saat());
    if (!girisli()) return;
    if (bekleyen) iptal(bekleyen);
    bekleyen = zamanlayici(() => { kaydet().catch(() => {}); }, gecikme);
  }

  // Hesaptaki taslak yereldekinden yeniyse ve farklıysa teklif eder.
  async function denetle() {
    if (!girisli()) return null;
    const liste = await store().list('strateji');
    const kimlik = oku(KIMLIK_ANAHTARI);
    const bulut = (liste ?? []).filter(x => x && !String(x.id).startsWith('loc-') && x.payload?.strateji);
    const satir = (kimlik && bulut.find(x => x.id === kimlik)) || (!kimlik ? bulut[0] : null);
    if (!satir) return null;
    const yerelZaman = Number(oku(ZAMAN_ANAHTARI) ?? 0);
    const bulutZaman = Date.parse(satir.updated_at) || 0;
    if (JSON.stringify(satir.payload.strateji) === JSON.stringify(al())) { yaz(KIMLIK_ANAHTARI, satir.id); son = null; return null; }
    if (bulutZaman <= yerelZaman + 1000) return null; // yerel daha yeni: bir sonraki değişiklikte hesaba yazılır
    teklif(satir);
    return satir;
  }

  // Kullanıcı teklifi kabul ettiğinde: satırın kimliği bu cihazın taslağına bağlanır.
  function kabul(satir) {
    yaz(KIMLIK_ANAHTARI, satir.id);
    yaz(ZAMAN_ANAHTARI, Date.parse(satir.updated_at) || saat());
    son = null; // bir sonraki değişiklikte strateji ve ayarlar birlikte yazılır
  }

  async function baslat() {
    const a = auth();
    if (!a?.ready) return;
    await a.ready();
    let oncekiKullanici = a.user?.()?.id ?? null;
    a.onChange?.(u => {
      const yeni = u?.id ?? null;
      if (yeni && yeni !== oncekiKullanici) { son = null; denetle().then(r => { if (!r) degisti(); }).catch(() => {}); }
      oncekiKullanici = yeni;
    });
    const r = await denetle().catch(() => null);
    if (!r && girisli() && oku(KIMLIK_ANAHTARI) == null) degisti(); // ilk kez: mevcut taslak hesaba yazılsın
  }

  return { degisti, denetle, kabul, baslat, kaydet };
}

// Hesapta daha yeni taslak olduğunu söyleyen bant (laboratuvar sayfasının üstünde).
export function teklifBandi(satir, yukle, belge = globalThis.document) {
  if (!belge) return;
  belge.getElementById('hesap-teklif')?.remove();
  const en = dil === 'en';
  const zaman = new Date(satir.updated_at).toLocaleString(en ? 'en-GB' : 'tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
  const p = belge.createElement('p');
  p.id = 'hesap-teklif';
  p.className = 'ornek-uyari';
  p.setAttribute('role', 'status');
  p.append(en
    ? `Your account has a newer version of this draft (saved ${zaman}). `
    : `Hesabında bu taslağın daha yeni bir sürümü var (${zaman} kaydedildi). `);
  const ad = belge.createElement('b');
  ad.textContent = String(satir.name ?? '');
  p.append(ad, ' ');
  const evet = belge.createElement('button');
  evet.type = 'button'; evet.className = 'dugme';
  evet.textContent = en ? 'Load it' : 'Yükle';
  evet.onclick = () => { p.remove(); yukle(); };
  const hayir = belge.createElement('button');
  hayir.type = 'button'; hayir.className = 'dugme ikincil';
  hayir.textContent = en ? 'Keep this one' : 'Bunu tut';
  hayir.onclick = () => p.remove();
  p.append(evet, ' ', hayir);
  const yer = belge.querySelector('main');
  yer ? yer.before(p) : belge.body.prepend(p);
}
