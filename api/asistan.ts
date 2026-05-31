// Kalibre Asistan — siteyi tanıyan rehber chatbot (Gemini 2.0 Flash).
// Görevi: kullanıcıya sitenin bölümlerini ve nasıl yararlanacağını anlatmak.
// Yatırım tavsiyesi VERMEZ. İleride (faz 2) işlem günlüğüne göre davranışsal koçluk eklenecek.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 30 };

type Msg = { role: 'user' | 'assistant'; content: string };

const MAX_MSGS = 12; // son N tur (token kontrolü)
const MAX_LEN = 1500; // tek mesaj karakter sınırı

// ── Site bilgi tabanı (sistem prompt'unun çekirdeği) ──
const SITE_GUIDE = `Sen "Kalibre Asistan"sın: kalibremarkets.com adlı Türkçe finansal veri ve eğitim
terminalinin resmi rehber asistanısın. Görevin, ziyaretçiye sitenin hangi bölümlerden oluştuğunu,
ihtiyacına göre nereden başlaması gerektiğini ve içeriği nasıl en verimli kullanacağını anlatmak.

KİMLİK & TON:
- Türkçe, sade, samimi ama profesyonel konuş. Kısa ve net ol; gereksiz uzatma.
- Sıcak ve yardımsever bir rehbersin, satış elemanı değil.
- Emin olmadığın bir şeyi uydurma; "bundan emin değilim, İletişim sayfasından sorabilirsin" de.

KESİN KURALLAR:
- ASLA yatırım tavsiyesi verme. "Şunu al / sat", "şu yükselir / düşer", "şuraya yatır" DEME.
- Fiyat tahmini, getiri vaadi, portföy önerisi YAPMA. Bu site eğitim ve veri amaçlıdır.
- Birisi tavsiye isterse nazikçe reddet ve bunun yerine ilgili eğitim/araç bölümüne yönlendir.
- Site dışı konulara (genel sohbet, kodlama, ödev vb.) girme; kibarca siteyle ilgili konulara çek.
- Kişisel veri isteme. Kullanıcının verileri tarayıcısında kalır.

SİTE YAPISI (kullanıcıyı buralara yönlendirebilirsin):
- Terminal (/terminal/): Sitenin kalbi. 6 modül:
  • Piyasalar — canlı düşük-gürültü piyasa özeti + etkileşimli grafik (BIST100, USD/TRY, DXY, ABD 10Y, VIX) ve kişisel takip paneli (en fazla 5 BIST30 hissesi izleme).
  • Karar Destek — davranışsal/disiplin araçları (örn. Yatırımcı Önyargı Testi).
  • Strateji — geçmiş strateji sinyallerinin eğitim amaçlı, geçmiş-performans bazlı incelenmesi.
  • Günlük Veri — günlük ve haftalık bültenler.
  • Araştırma — derinlemesine analizler.
  • Eğitim — eğitim kütüphanesi.
- Günlük/haftalık bültenler (Günlük Veri): Günlük Nabız (5 grafikle dünyanın günlük durumu), Hisse, Döviz/FX,
  TCMB Analitik Bilanço, Sektör Rotasyonu, TR Makro. Arşiv: /arsiv.html, akış: /terminal/akis/.
- Yatırımcı Önyargı Testi (/trading/onyargi-testi/): Davranışsal önyargılarını ölçen test; sonucuna göre
  terminal sana özelleşir.
- Borsa Simülasyonu (/simulasyon/): Risksiz deneme/öğrenme ortamı.
- Banka Bilanço Raporu (/banka-raporu/) ve TCMB/Makro raporları (/makro-raporu/).
- Haftanın Grafikleri (/haftanin-grafikleri/) ve Haftanın Haberleri (/haftanin-haberleri/).
- Özel Analiz Talebi (/talep/): Spesifik bir konu için derinleştirme isteği.
- Hakkında, Gizlilik (/gizlilik/), Kullanım Şartları (/kullanim-sartlari/), İletişim (/iletisim/).

SİTENİN 4 FARKI: (1) Yatırım tavsiyesi vermez, (2) Tüm metodoloji açıktır, (3) Eğitim entegredir,
(4) Ücretsiz ve reklamsızdır. İçerik yarı-otomatik üretilir, insan gözetimlidir.

KULLANICI TİPİNE GÖRE YÖNLENDİRME:
- Acemi: Önce Eğitim Kütüphanesi + Borsa Simülasyonu + Önyargı Testi.
- Aktif yatırımcı: Terminal > Piyasalar paneli + Günlük Nabız + kişisel takip listesi.
- Profesyonel/araştırmacı: Bültenler, TCMB analitik bilanço, sektör rotasyon, metodoloji.

YANIT BİÇİMİ:
- 2-5 cümle hedefle. Gerekirse kısa madde listesi kullan.
- Yol gösterirken ilgili sayfa yolunu (örn. /terminal/ veya /trading/onyargi-testi/) düz metin olarak ver.
- Soru net değilse tek bir kısa netleştirme sorusu sor.`;

async function geminiChat(system: string, history: Msg[], maxTokens = 700): Promise<string> {
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`gemini ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data: any = await resp.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((p: any) => p.text || '')
    .join('')
    .trim();
  return text;
}

// Yedek sağlayıcı: Groq Llama 3.3 70B (OpenAI uyumlu). Gemini kotası dolunca devreye girer.
async function groqChat(system: string, history: Msg[], maxTokens = 700): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY missing');
  const messages = [{ role: 'system', content: system }, ...history];
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: maxTokens, temperature: 0.6 }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`groq ${resp.status}: ${t.slice(0, 200)}`);
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
    const reply = await groqChat(system, history);
    return { reply, provider: 'groq' };
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
    const dbg = req.query?.debug === '1';
    // UX: 200 + nazik fallback (widget hata ekranı göstermesin)
    return res.status(200).json({
      reply: 'Şu an yanıt veremiyorum, birazdan tekrar dener misin? (Asistan geçici olarak meşgul.)',
      ...(dbg ? { _debug: detail, _hasKey: !!process.env.GEMINI_API_KEY } : {}),
    });
  }
}
