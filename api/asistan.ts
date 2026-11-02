// Kalibre Asistan — siteyi tanıyan rehber chatbot (Gemini 2.0 Flash).
// Görevi: kullanıcıya sitenin bölümlerini ve nasıl yararlanacağını anlatmak.
// Yatırım tavsiyesi VERMEZ. İleride (faz 2) işlem günlüğüne göre davranışsal koçluk eklenecek.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { semaTemizle, soruTemizle, gorunumIstemi, gorunumCevabi } from './_lib/gorunum.ts';

export const config = { maxDuration: 30 };

type Msg = { role: 'user' | 'assistant'; content: string };

const MAX_MSGS = 12; // son N tur (token kontrolü)
const MAX_LEN = 1500; // tek mesaj karakter sınırı

// ── Site bilgi tabanı (sistem prompt'unun çekirdeği) ──
const SITE_GUIDE = `Sen "Kalibre Asistan"sın: kalibremarkets.com adlı Türkçe finansal okuryazarlık ve eğitim
sitesinin resmi rehber asistanısın. Görevin, ziyaretçiye sitenin hangi bölümlerden oluştuğunu,
ihtiyacına göre nereden başlaması gerektiğini ve içeriği nasıl en verimli kullanacağını anlatmak.

KİMLİK & TON:
- Türkçe, sade, samimi ama profesyonel konuş. Kısa ve net ol; gereksiz uzatma.
- Sıcak ve yardımsever bir rehbersin, satış elemanı değil.
- Emin olmadığın bir şeyi uydurma; "bundan emin değilim, İletişim sayfasından sorabilirsin" de.

KESİN KURALLAR:
- ASLA yatırım tavsiyesi verme. "Şunu al / sat", "şu yükselir / düşer", "şuraya yatır" DEME.
- Fiyat tahmini, getiri vaadi, portföy önerisi YAPMA. Bu site eğitim amaçlıdır.
- Birisi tavsiye isterse nazikçe reddet ve bunun yerine ilgili eğitim/araç bölümüne yönlendir.
- Site dışı konulara (genel sohbet, kodlama, ödev vb.) girme; kibarca siteyle ilgili konulara çek.
- Kişisel veri isteme. Kullanıcının verileri tarayıcısında kalır.

SİTE YAPISI (kullanıcıyı buralara yönlendirebilirsin):
- Sitede piyasa verisi, kotasyon, grafik ya da veri bülteni YOKTUR. Güncel fiyat veya veri sorulursa
  bunu söyle ve kullanıcıyı birincil kaynaklara (aracı kurumu, TCMB, TÜİK) yönlendir. Sayı uydurma.
- Kalibre Lab (/lab?dil=tr): ürünün kendisi. MetaTrader 5 için strateji laboratuvarı: kural dosyası kurulur,
  tarayıcıda hızlı prova yapılır (maliyetsiz, yaklaşık), son test MT5 Strategy Tester'da yapılır.
  Veri: SENTETİK örnek seri, kullanıcının yüklediği dosya ya da MT5'ten şifreli canlı köprü.
  Oynaklık laboratuvarı (/lab/oynaklik?dil=tr): EWMA, Yang-Zhang, GARCH.
- Kurulum (/tr/setup): köprü eklentisi, eşleştirme kodu, MT5'te WebRequest izni.
- Güvenlik (/tr/security): veri kullanıcının bilgisayarında şifrelenir; sunucu içeriği okuyamaz; anahtar
  (eşleştirme kodu) yalnız kullanıcıdadır. Eklenti işlem açmaz.
- Abonelik (/tr/pricing): hazırlanıyor, bekleme listesi var. Fiyat ve kapsam lansmanda kesinleşir.
- Eğitim (/egitim/): teknik analiz, risk yönetimi, makro göstergeler, psikoloji.
- Testler: Yatırımcı Önyargı Testi (/trading/onyargi-testi/), grafik okuma testi (/grafik-oku/),
  işlem kontrol listesi (/islem-kontrolu/), karar defteri (/defter/).
- Trade oyunu (/oyun/): sentetik fiyatla risksiz deneme.
- Hesaplayıcılar: Carry (/carry-hesaplayici/), Kur riski (/kur-riski-hesaplayici/). Değerleri kullanıcı girer.
- Ekonomi takvimi (/ekonomi-takvimi/): açıklama tarihleri.
- Metodoloji (/tr/methodology), Hakkında, Gizlilik (/tr/privacy), Hizmet Şartları (/tr/terms), İade ve İptal (/tr/refunds), Çerezler (/tr/cookies), Risk bildirimi (/tr/risk-disclosure), İletişim (/iletisim/).

İLKELER: (1) Yatırım tavsiyesi verilmez, (2) piyasa verisi yayınlanmaz; veri kullanıcınındır,
(3) yöntem açıktır, (4) getiri her zaman riskle (en büyük düşüş) birlikte okunur.

KULLANICI TİPİNE GÖRE YÖNLENDİRME:
- Acemi: Eğitim + Önyargı Testi + laboratuvarda SENTETİK örnek seri.
- Aktif yatırımcı / MT5 kullanıcısı: Kurulum + Kalibre Lab + risk yönetimi yazıları.
- Kurumsal sorular: Kalibre kurumsal hizmet sunmuyor; İletişim sayfasına yönlendir.

YANIT BİÇİMİ:
- 2-5 cümle hedefle. Gerekirse kısa madde listesi kullan.
- Yol gösterirken ilgili sayfa yolunu (örn. /egitim/ veya /trading/onyargi-testi/) düz metin olarak ver.
- Soru net değilse tek bir kısa netleştirme sorusu sor.`;

// Model adları değişir (2.0 Flash ve llama-3.3 kaldırıldı). Ad ortamdan gelir; 404'te sağlayıcının model
// listesinden uygun olan seçilir ve bu örnek ömrünce hatırlanır.
let geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
let groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const surum = (ad: string) => Number((/(\d+(?:\.\d+)?)/.exec(ad) ?? [])[1] ?? 0);

async function geminiModelBul(apiKey: string): Promise<string | null> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`);
  if (!r.ok) return null;
  const d: any = await r.json();
  const adlar: string[] = (d.models ?? [])
    .filter((m: any) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m: any) => String(m.name ?? '').replace(/^models\//, ''))
    .filter((n: string) => /flash/.test(n) && !/lite|preview|exp|image|tts|audio|live|thinking/.test(n));
  adlar.sort((a, b) => surum(b) - surum(a));
  return adlar[0] ?? null;
}

async function geminiChat(system: string, history: Msg[], maxTokens = 700, yeniden = true): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const body = {
    contents,
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.6, topP: 0.9 },
  };
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!resp.ok) {
    const t = await resp.text();
    if (resp.status === 404 && yeniden) {
      const yeni = await geminiModelBul(apiKey);
      if (yeni && yeni !== geminiModel) { console.warn(`[asistan] gemini model ${geminiModel} → ${yeni}`); geminiModel = yeni; return geminiChat(system, history, maxTokens, false); }
    }
    throw new Error(`gemini ${resp.status} (${geminiModel}): ${t.slice(0, 200)}`);
  }
  const data: any = await resp.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((p: any) => p.text || '')
    .join('')
    .trim();
  return text;
}

// Yedek sağlayıcı: Groq (OpenAI uyumlu). Gemini kotası dolunca devreye girer.
async function groqModelBul(apiKey: string): Promise<string | null> {
  const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!r.ok) return null;
  const d: any = await r.json();
  const adlar: string[] = (d.data ?? []).map((m: any) => String(m.id ?? '')).filter((n: string) => n && !/whisper|tts|guard|vision|embed/.test(n));
  const sira = [/llama.*(70b|versatile)/, /llama/, /gpt-oss/, /qwen|mixtral|gemma/];
  for (const re of sira) { const h = adlar.filter((n: string) => re.test(n)).sort((a, b) => surum(b) - surum(a)); if (h.length) return h[0]; }
  return adlar[0] ?? null;
}

async function groqChat(system: string, history: Msg[], maxTokens = 700, yeniden = true): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY missing');
  const messages = [{ role: 'system', content: system }, ...history];
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: groqModel, messages, max_tokens: maxTokens, temperature: 0.6 }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    if (resp.status === 404 && yeniden) {
      const yeni = await groqModelBul(apiKey);
      if (yeni && yeni !== groqModel) { console.warn(`[asistan] groq model ${groqModel} → ${yeni}`); groqModel = yeni; return groqChat(system, history, maxTokens, false); }
    }
    throw new Error(`groq ${resp.status} (${groqModel}): ${t.slice(0, 200)}`);
  }
  const data: any = await resp.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

// Birincil Gemini, hata/kota durumunda Groq'a düş.
async function chat(system: string, history: Msg[]): Promise<{ reply: string; provider: string }> {
  try {
    const reply = await geminiChat(system, history);
    if (reply) return { reply, provider: 'gemini' };
    throw new Error('gemini empty');
  } catch (e1: any) {
    console.warn('[asistan] gemini failed, groq fallback:', e1?.message || e1);
    try {
      const reply = await groqChat(system, history);
      return { reply, provider: 'groq' };
    } catch (e2: any) {
      throw new Error(`${e1?.message || e1} | ${e2?.message || e2}`);
    }
  }
}

function buildSystem(path?: string): string {
  const loc = path && typeof path === 'string' ? `\n\nKullanıcı şu an şu sayfada: ${path}` : '';
  return SITE_GUIDE + loc;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    // "Ask your data" (lab view builder): schema names + question in, a validated view recipe out. No data.
    if (body?.mod === 'gorunum') {
      const sema = semaTemizle(body.sema), soru = soruTemizle(body.soru);
      if (!sema || !soru) return res.status(400).json({ hata: 'girdi' });
      const { system, user } = gorunumIstemi(sema, soru);
      const { reply } = await chat(system, [{ role: 'user', content: user }]);
      const r = gorunumCevabi(reply, sema);
      if ('hata' in r) return res.status(422).json(r);
      return res.status(200).json({ tarif: r.tarif });
    }
    const { messages, context } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages required' });
    }
    const hist: Msg[] = messages
      .filter(
        (m: any) =>
          m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()
      )
      .slice(-MAX_MSGS)
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, MAX_LEN) }));
    if (!hist.length || hist[hist.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'last message must be from user' });
    }
    const { reply } = await chat(buildSystem(context?.path), hist);
    return res.status(200).json({ reply: reply || 'Bunu tam anlayamadım, başka türlü sorabilir misin?' });
  } catch (e: any) {
    const detail = e?.message || String(e);
    console.error('[asistan] error:', detail);
    if ((typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? '')).includes('"gorunum"')) return res.status(503).json({ hata: 'model', ...(req.query?.debug === '1' ? { _debug: detail } : {}) });
    const dbg = req.query?.debug === '1';
    // UX: 200 + nazik fallback (widget hata ekranı göstermesin)
    return res.status(200).json({
      reply: 'Şu an yanıt veremiyorum, birazdan tekrar dener misin? (Asistan geçici olarak meşgul.)',
      ...(dbg ? { _debug: detail, _hasKey: !!process.env.GEMINI_API_KEY } : {}),
    });
  }
}
