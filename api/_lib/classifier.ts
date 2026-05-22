// Gemini ile haberin "makro/sektörel/politik" mi yoksa "şirket-özel" mi
// olduğunu hızlıca sınıflandır. Sadece makro/sektörel/politik geçer.

import { groqLlama } from './models.js';
import type { NewsItem } from './rss.js';

export type Classification = {
  accepted: boolean;
  category: 'makro' | 'sektorel' | 'jeopolitik' | 'emtia' | 'sirket' | 'onemsiz';
  reason: string;
};

const CLASSIFIER_PROMPT = `Sen bir ekonomi haber sınıflandırıcısısın. Verilen haberi şu kategorilerden BİRİNE koy:

- makro: Faiz, enflasyon, GSYİH, işsizlik, bütçe, merkez bankası kararları, ekonomik veri açıklamaları
- sektorel: Bir sektör genelini etkileyen haber (bankacılık, enerji, perakende vs.)
- jeopolitik: Tarife, savaş, yaptırım, ticaret anlaşması, iki ülke arası ekonomik ilişki
- emtia: Petrol, altın, doğalgaz, tahıl fiyatları
- sirket: Tek bir şirkete dair haber (kâr, yönetici, halka arz, sermaye artırımı, üretim)
- onemsiz: Magazin, etkinlik, ödül, röportaj, fuar

ŞİRKET-ÖZEL haberler reddedilir. Diğer hepsi kabul edilir.

Çıktın TAM OLARAK şu JSON formatında olmalı, başka hiçbir şey yazma:
{"category":"makro","accepted":true,"reason":"kısa gerekçe"}

Haber:
Başlık: {{TITLE}}
Açıklama: {{DESC}}`;

export async function classify(item: NewsItem): Promise<Classification> {
  const prompt = CLASSIFIER_PROMPT.replace('{{TITLE}}', item.title).replace(
    '{{DESC}}',
    item.description.slice(0, 400)
  );
  let raw = '';
  try {
    raw = await groqLlama([{ role: 'user', content: prompt }], 150);
  } catch (e) {
    return { accepted: false, category: 'onemsiz', reason: `classifier error: ${e}` };
  }
  // Extract JSON
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { accepted: false, category: 'onemsiz', reason: 'no json' };
  try {
    const obj = JSON.parse(m[0]);
    const cat = obj.category as Classification['category'];
    const accepted = cat !== 'sirket' && cat !== 'onemsiz';
    return { accepted, category: cat, reason: obj.reason || '' };
  } catch {
    return { accepted: false, category: 'onemsiz', reason: 'json parse fail' };
  }
}
