// Demo request notification. When a form is submitted, the founder gets one email through Resend
// (https://resend.com/docs/api-reference/emails/send-email). Nothing here is required: without
// RESEND_API_KEY the function returns false and the record in the store is the only copy.
//
// Env (entered by the founder in Vercel, never in the repo):
//   RESEND_API_KEY           Resend key
//   TALEP_BILDIRIM_KIME      recipient (the founder's inbox)
//   TALEP_BILDIRIM_KIMDEN    sender; default is Resend's test sender, which can only reach the
//                            account owner's own address, so it needs no domain verification.

export type TalepKaydi = {
  eposta: string; sayfa: string; kaynak: string; dil: string;
  cevaplar: Record<string, string>; zaman: string;
};

const kacis = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export function bildirimMetni(k: TalepKaydi): { konu: string; html: string; metin: string } {
  const satirlar = Object.entries(k.cevaplar).map(([a, v]) => [a, v] as const);
  const konu = `Kalibre: ${k.sayfa === 'demo' ? 'demo request' : 'form'} from ${k.eposta}`;
  const metin = [`Page: ${k.sayfa}`, `Email: ${k.eposta}`, `Source: ${k.kaynak}`, `Language: ${k.dil}`, `Time: ${k.zaman}`, '', ...satirlar.map(([a, v]) => `${a}: ${v}`)].join('\n');
  const html = `<p><b>Page:</b> ${kacis(k.sayfa)}<br><b>Email:</b> ${kacis(k.eposta)}<br><b>Source:</b> ${kacis(k.kaynak)}<br><b>Language:</b> ${kacis(k.dil)}<br><b>Time:</b> ${kacis(k.zaman)}</p>`
    + (satirlar.length ? `<table>${satirlar.map(([a, v]) => `<tr><td><b>${kacis(a)}</b></td><td>${kacis(v)}</td></tr>`).join('')}</table>` : '');
  return { konu, html, metin };
}

export async function demoBildir(
  k: TalepKaydi,
  env: Record<string, string | undefined> = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  const anahtar = env.RESEND_API_KEY, kime = env.TALEP_BILDIRIM_KIME;
  if (!anahtar || !kime) return false;
  const kimden = env.TALEP_BILDIRIM_KIMDEN || 'Kalibre Markets <onboarding@resend.dev>';
  const { konu, html, metin } = bildirimMetni(k);
  try {
    const y = await fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${anahtar}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: kimden, to: [kime], reply_to: k.eposta, subject: konu, html, text: metin }),
    });
    return y.ok;
  } catch {
    return false;
  }
}
