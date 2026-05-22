// Model client'ları. Hepsi OpenAI-compatible API (Gemini hariç).
// Free tier limitleri içinde kalır.

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function openaiCompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens = 400
): Promise<string> {
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`${endpoint} failed: ${resp.status} ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  return sanitize(data.choices?.[0]?.message?.content || '');
}

// Reasoning/thinking modellerinin <think>...</think> bloklarını ve
// markdown formatlamayı (kalın, başlık) temizle. UI düz metin gösteriyor.
function sanitize(text: string): string {
  let t = text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<\|begin_of_thought\|>[\s\S]*?<\|end_of_thought\|>/g, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '')
    // Markdown bold/italic: **text** → text, *text* → text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Heading hashes at line start
    .replace(/^#+\s*/gm, '')
    // Bullet markers at line start
    .replace(/^[-•·]\s+/gm, '')
    // Double newlines → single, ardından trim
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return t;
}

// Gemini 2.0 Flash — Google AI Studio
export async function gemini(messages: ChatMessage[], maxTokens = 400): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  // Convert OpenAI-style messages to Gemini contents
  const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  const body: any = { contents, generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 } };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg }] };

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Gemini failed: ${resp.status} ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  return sanitize(data.candidates?.[0]?.content?.parts?.[0]?.text || '');
}

// Groq — Llama 3.3 70B
export async function groqLlama(messages: ChatMessage[], maxTokens = 400): Promise<string> {
  return openaiCompatible(
    'https://api.groq.com/openai/v1/chat/completions',
    process.env.GROQ_API_KEY!,
    'llama-3.3-70b-versatile',
    messages,
    maxTokens
  );
}

// Groq — Llama 3.1 8B Instant (küçük, hızlı, ucuz roller için)
export async function groqSmall(messages: ChatMessage[], maxTokens = 400): Promise<string> {
  return openaiCompatible(
    'https://api.groq.com/openai/v1/chat/completions',
    process.env.GROQ_API_KEY!,
    'llama-3.1-8b-instant',
    messages,
    maxTokens
  );
}

// Groq — Llama 4 Scout (yaratıcı/iyimser yorum için)
export async function groqGptOss(messages: ChatMessage[], maxTokens = 400): Promise<string> {
  return openaiCompatible(
    'https://api.groq.com/openai/v1/chat/completions',
    process.env.GROQ_API_KEY!,
    'meta-llama/llama-4-scout-17b-16e-instruct',
    messages,
    maxTokens
  );
}

// Groq — Qwen 3 32B (bilgi yoğun/tarihsel için, /no_think modunda)
export async function groqQwen(messages: ChatMessage[], maxTokens = 400): Promise<string> {
  // Qwen3'e düşünmeyi atla diye direktif gönder
  const patched = messages.map((m, i) =>
    i === 0 && m.role === 'system' ? { ...m, content: m.content + '\n\n/no_think' } : m
  );
  return openaiCompatible(
    'https://api.groq.com/openai/v1/chat/completions',
    process.env.GROQ_API_KEY!,
    'qwen/qwen3-32b',
    patched,
    maxTokens
  );
}

// Cerebras — yedek/diversity için (şu an kullanılmıyor, 429 fazla)
export async function cerebrasLlama(messages: ChatMessage[], maxTokens = 400): Promise<string> {
  return openaiCompatible(
    'https://api.cerebras.ai/v1/chat/completions',
    process.env.CEREBRAS_API_KEY!,
    'llama3.1-8b',
    messages,
    maxTokens
  );
}
export async function cerebrasQwen(messages: ChatMessage[], maxTokens = 400): Promise<string> {
  return cerebrasLlama(messages, maxTokens);
}

// Mistral — Mistral Small
export async function mistralSmall(messages: ChatMessage[], maxTokens = 400): Promise<string> {
  return openaiCompatible(
    'https://api.mistral.ai/v1/chat/completions',
    process.env.MISTRAL_API_KEY!,
    'mistral-small-latest',
    messages,
    maxTokens
  );
}
