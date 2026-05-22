// Tartışma orkestratörü. 4 model paralel olarak ilk tezlerini üretir,
// sonra moderatör (Gemini) kapanış mesajı yazar.

import { gemini, groqLlama, groqSmall, groqGptOss, groqQwen, cerebrasLlama, cerebrasQwen, mistralSmall } from './models.js';
import { ROLES, type RoleKey } from './roles.js';
import type { NewsItem } from './rss.js';
import type { Message } from './blob.js';

function newsContext(item: NewsItem, category: string): string {
  return `Aşağıdaki haber ekonomi son dakika akışından geldi. Kategori: ${category}.

Başlık: ${item.title}
Açıklama: ${item.description}
Tarih: ${item.pubDate}

Kendi rolünün açısından ilk tezini yaz.`;
}

const MODEL_FUNCS: Record<string, (m: any[], t: number) => Promise<string>> = {
  gemini,
  groq: groqLlama,
  groq_small: groqSmall,
  groq_gptoss: groqGptOss,
  groq_qwen: groqQwen,
  cerebras: cerebrasLlama,
  cerebras_qwen: cerebrasQwen,
  mistral: mistralSmall,
};

async function callModel(key: RoleKey, content: string): Promise<string> {
  const role = ROLES[key];
  const messages = [
    { role: 'system' as const, content: role.system },
    { role: 'user' as const, content },
  ];
  const fn = MODEL_FUNCS[role.model];
  if (!fn) throw new Error('unknown model: ' + role.model);
  // Analist 90 token (~220 char), soru 80 token (sığacak)
  const maxTokens = role.role === 'analyst' ? 90 : 80;
  return fn(messages, maxTokens);
}

export async function runDebate(item: NewsItem, category: string): Promise<Message[]> {
  const ctx = newsContext(item, category);
  const messages: Message[] = [];
  const tsStart = Date.now();

  // Önce 3 soru sahibi paralel sorularını sorar
  const questionKeys: RoleKey[] = ['bear', 'historian', 'moderator'];
  const questionResults = await Promise.allSettled(questionKeys.map((k) => callModel(k, ctx)));

  questionResults.forEach((r, idx) => {
    const k = questionKeys[idx];
    const role = ROLES[k];
    let text: string;
    if (r.status === 'fulfilled' && r.value) {
      text = r.value;
    } else {
      // Hata olursa "Hmm..." göster, log'a gerçek hata
      const errDetail = r.status === 'rejected' ? String(r.reason).slice(0, 200) : 'empty response';
      console.warn(`[${role.name}] question failed:`, errDetail);
      text = 'Hmm...';
    }
    messages.push({
      role: k,
      name: role.name,
      icon: role.icon,
      text,
      ts: tsStart + idx * 10,
    });
  });

  // Sonra 2 analist sorulara + habere yanıt vererek uzun analizini yapar
  const questionDigest = messages
    .map((m) => `[${m.name}]: ${m.text}`)
    .join('\n');
  const analystContext = `${ctx}\n\nSohbet odasındaki üyeler şunları sordu:\n${questionDigest}\n\nKendi rolünden, uzunca bir analiz yaz. Sorulara doğrudan cevap verme zorunluluğun yok ama tonu sohbete uyumlu tut.`;

  const analystKeys: RoleKey[] = ['bull', 'quant'];
  const analystResults = await Promise.allSettled(
    analystKeys.map((k) => callModel(k, analystContext))
  );

  analystResults.forEach((r, idx) => {
    const k = analystKeys[idx];
    const role = ROLES[k];
    let text: string;
    if (r.status === 'fulfilled' && r.value) {
      text = r.value;
    } else {
      const errDetail = r.status === 'rejected' ? String(r.reason).slice(0, 200) : 'empty response';
      console.warn(`[${role.name}] analyst failed:`, errDetail);
      text = 'Hmm, şu an bir şey diyemiyorum.';
    }
    messages.push({
      role: k,
      name: role.name,
      icon: role.icon,
      text,
      ts: tsStart + 1000 + idx * 10,
    });
  });

  return messages;
}
