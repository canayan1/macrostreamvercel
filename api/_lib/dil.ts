// Uçların kullanıcıya gösterilen mesajları kaynakta Türkçe yazılır ve burada İngilizceye çevrilir.
// Varsayılan dil İngilizcedir (site küresel pazara İngilizce çıkar); ?dil=tr ya da gövdede dil:'tr'
// gelirse Türkçe kalır. Çevirisi olmayan mesaj Türkçe kalır (testler bunu yakalar).
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const EN: Record<string, string> = {
  'Ödeme henüz açılmadı.': 'Payments are not open yet.',
  'Devam etmek için hizmet şartlarını onaylamalısın.': 'To continue, please accept the Terms of Service.',
  'Devam etmek için cayma hakkına ilişkin onay kutusunu işaretlemelisin.': 'To continue, please tick the box about the right of withdrawal.',
  'Ödeme sayfası açılamadı. Biraz sonra yeniden dene.': 'Checkout could not be opened. Please try again shortly.',
  'Ödeme henüz tamamlanmamış görünüyor. Birkaç saniye sonra sayfayı yenile.': 'The payment does not look complete yet. Reload the page in a few seconds.',
  'Ödeme bilgisi alınamadı. Biraz sonra yeniden dene.': 'Payment details could not be retrieved. Please try again shortly.',
  'oturum hatalı': 'invalid session',
  'Lisans anahtarı hatalı.': 'The license key is invalid.',
  'Bu anahtara bağlı bir abonelik bulunamadı.': 'No subscription was found for this key.',
  'Bu bir kapalı beta lisansı; yönetilecek bir ödeme ya da abonelik yok. Süre uzatma için bize yaz.': 'This is a closed beta license. There is no payment or subscription to manage. Email us to extend it.',
  'Abonelik sayfası açılamadı. Biraz sonra yeniden dene.': 'The subscription page could not be opened. Please try again shortly.',
  'İndirme henüz açılmadı.': 'Downloads are not open yet.',
  'İndirme geçici olarak kullanılamıyor.': 'Downloads are temporarily unavailable.',
  'Bilinmeyen eklenti.': 'Unknown add-on.',
  'Çok sık deneme. Bir dakika sonra yeniden dene.': 'Too many attempts. Try again in a minute.',
  'Lisans anahtarı bulunamadı.': 'License key not found.',
  'Aboneliğin sona ermiş. Eklentileri indirmek için aboneliğini yenile.': 'Your subscription has ended. Renew it to download the add-ons.',
  'Eklenti dosyası henüz yüklenmedi. Biraz sonra yeniden dene ya da bize yaz.': 'The add-on file has not been uploaded yet. Try again shortly or write to us.',
  'Bilinmeyen ürün.': 'Unknown product.',
  'Bu lisans bu eklentiyi kapsamıyor. Davetli beta lisansı yalnız Kalibre Köprü\'yü kapsar; Kalibre Motor için tam abonelik gerekir.': 'This license does not cover this add-on. An invited beta license covers Kalibre Bridge only. Kalibre Engine needs a full subscription.',
  'Hesap numarası okunamadı.': 'The account number could not be read.',
  'Lisans anahtarı hatalı. kalibremarkets.com/tr/account sayfasından kopyalayın.': 'The license key is invalid. Copy it from kalibremarkets.com/account.',
  'Çok sık deneme. Bir dakika sonra yeniden deneyin.': 'Too many attempts. Try again in a minute.',
  'Lisans sunucusu yapılandırılmamış.': 'The license server is not configured.',
  'Lisans sunucusu geçici olarak kullanılamıyor.': 'The license server is temporarily unavailable.',
  'Yalnız GET.': 'GET only.',
  'yalnız GET': 'GET only',
  'yalnız POST': 'POST only',
  'Hesaplar henüz açılmadı.': 'Accounts are not available yet.',
  'Oturum doğrulanamadı. Biraz sonra yeniden dene.': 'We could not verify your session. Please try again shortly.',
  'Ödeme için önce giriş yap.': 'Please sign in to subscribe.',
  'Bu hesapta zaten etkin bir abonelik var. Hesabım sayfasından yönetebilirsin.': 'This account already has an active subscription. You can manage it on your Account page.',
};

export function cevir(metin: string, dil: string): string {
  if (dil !== 'en') return metin;
  const m = metin.match(/^Bu anahtar en çok (\d+) MT5 hesabında kullanılabilir\. Değiştirmek için bize yazın\.$/);
  if (m) return `This key can be used on at most ${m[1]} MT5 accounts. Write to us to change them.`;
  return EN[metin] ?? metin;
}

export function istekDili(req: VercelRequest): 'tr' | 'en' {
  const q = String(req.query?.dil ?? '');
  if (q === 'tr' || q === 'en') return q;
  let g: any = req.body;
  if (typeof g === 'string') { try { g = JSON.parse(g); } catch { g = null; } }
  return g && typeof g === 'object' && g.dil === 'tr' ? 'tr' : 'en';
}

// res.json ({ hata }) ve düz metin res.send yanıtlarını istek diline çevirir.
export function dilUygula(req: VercelRequest, res: VercelResponse): 'tr' | 'en' {
  const dil = istekDili(req);
  if (dil === 'tr') return dil;
  const json = res.json.bind(res), send = res.send.bind(res);
  res.json = ((o: any) => json(o && typeof o.hata === 'string' ? { ...o, hata: cevir(o.hata, dil) } : o)) as any;
  res.send = ((b: any) => send(typeof b === 'string' && !b.startsWith('v1|') ? cevir(b, dil) : b)) as any;
  return dil;
}
