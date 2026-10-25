// Kalibre Lab · güvenlik yardımcıları.
// 1) kacis: HTML metnine ya da tırnaklı bir özniteliğe giren HER dinamik değer bundan geçer.
// 2) stratejiyiTemizle: dışarıdan gelen strateji JSON'u (içe aktarılan dosya, yerel taslak)
//    forma çizilmeden önce temizlenir. Anahtarlar data-yol özniteliklerine ve seçicilere girdiği
//    için yalnız şemadaki biçimde (küçük harf, rakam, _) anahtarlar kalır; sayı beklenen alanlarda
//    sayı olmayan değerler atılır; serbest metin yalnız 'ad' ve 'aciklama' alanlarında kalır
//    (onlar da çizilirken kaçışlanır). Temizlikten sonra doğrulama (dogrula) yine çalışır ve
//    eksik kalan alanları kullanıcıya hata olarak gösterir.

import { OPERATORLER } from './dogrula.js';

const HARITA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
export const kacis = v => String(v ?? '').replace(/[&<>"'`]/g, c => HARITA[c]);

const ANAHTAR_DESENI = /^[a-z][a-z0-9_]{0,31}$/;
const AD_DESENI = /^[a-z][a-z0-9_]{0,23}$/; // dogrula.js ile aynı: gösterge adları
const DEGER_DESENI = /^[A-Za-z0-9_.\-]{0,64}$/;
const METIN_ALANLARI = new Set(['ad', 'aciklama']);
const METIN_SINIRI = { ad: 60, aciklama: 500 };
// Şemada yalnız sayı alan alanlar (gösterge parametreleri, risk, filtre, çıkış).
export const SAYISAL_ALANLAR = new Set([
  'kalibre', 'periyot', 'sapma', 'hizli', 'yavas', 'sinyal', 'lambda', 'pencere', 'yenile',
  'carpan', 'deger', 'max_bar', 'islem_basi_yuzde', 'max_acik_pozisyon', 'max_spread_puan',
  'gunluk_max_kayip_yuzde', 'alt_carpan', 'ust_carpan', 'bas', 'bit', 'once_dk', 'sonra_dk',
]);
const EN_DERIN = 8;
const EN_COK_OGE = 64;

// Dönüş: { strateji, atilanlar } ; atilanlar temizlikte düşen yolların listesi (en çok 20).
export function stratejiyiTemizle(girdi) {
  const atilanlar = [];
  const at = yol => { if (atilanlar.length < 20) atilanlar.push(yol || '(kök)'); };
  const temizle = (v, anahtar, yol, derinlik, ebeveyn = '') => {
    // gostergeler altındaki anahtarlar alan değil gösterge adıdır (ör. 'hizli' adlı bir EMA).
    const adMi = ebeveyn === 'gostergeler' && derinlik === 2;
    if (derinlik > EN_DERIN) { at(yol); return undefined; }
    if (!adMi && SAYISAL_ALANLAR.has(anahtar)) {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      at(yol); return undefined;
    }
    if (typeof v === 'number') return Number.isFinite(v) ? v : (at(yol), undefined);
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      if (derinlik === 1 && METIN_ALANLARI.has(anahtar)) return v.slice(0, METIN_SINIRI[anahtar]);
      if (anahtar === 'op') return OPERATORLER.includes(v) ? v : (at(yol), undefined);
      return DEGER_DESENI.test(v) ? v : (at(yol), undefined);
    }
    if (Array.isArray(v)) {
      const d = [];
      v.slice(0, EN_COK_OGE).forEach((x, i) => {
        const t = temizle(x, '', `${yol}.${i}`, derinlik + 1, anahtar);
        if (t !== undefined) d.push(t);
      });
      if (v.length > EN_COK_OGE) at(`${yol}.${EN_COK_OGE}`);
      return d;
    }
    if (v !== null && typeof v === 'object') {
      const n = {};
      for (const [k, x] of Object.entries(v).slice(0, EN_COK_OGE)) {
        const ky = yol ? `${yol}.${k}` : k;
        if (!(anahtar === 'gostergeler' && derinlik === 1 ? AD_DESENI : ANAHTAR_DESENI).test(k)) { at(yol ? `${yol}.?` : '?'); continue; }
        const t = temizle(x, k, ky, derinlik + 1, anahtar);
        if (t !== undefined) n[k] = t;
      }
      return n;
    }
    if (v !== null) at(yol);
    return undefined;
  };
  if (girdi === null || typeof girdi !== 'object' || Array.isArray(girdi)) return { strateji: null, atilanlar: ['(kök)'] };
  return { strateji: temizle(girdi, '', '', 0), atilanlar };
}
