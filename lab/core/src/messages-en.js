// English text of the engine's own messages. The engine writes messages from Turkish source
// templates (see ceviri.js); exported files must be English whatever the UI language, so
// englishMessage() turns an already-filled message back into English by matching its template.

export const MESSAGES_EN = {
  'Haber filtresi provada uygulanmaz (MT5 takvimi gerekir).': 'The news filter is not applied in a quick backtest (it needs the MT5 calendar).',
  'En yüksek spread filtresi provada uygulanmaz: spread sabit kabul edilir.': 'The maximum spread filter is not applied in a quick backtest: the spread is assumed constant.',
  'Spread provada sıfır kabul edilir.': 'The spread is assumed to be zero in a quick backtest.',
  'Verilen tick değeri ({v}) hesaplanandan ({h}) farklı; kâr sözleşme büyüklüğü ve kurla hesaplandı.': 'The given tick value ({v}) differs from the computed one ({h}); profit was computed from the contract size and the exchange rate.',
  '{n} girişte hesaplanan lot en küçük lotun altında kaldı; işlem açılmadı.': 'On {n} entries the computed lot was below the minimum lot, so no trade was opened.',
  '{n} girişte serbest teminat yetmedi; işlem açılmadı.': 'On {n} entries free margin was not enough, so no trade was opened.',
  'Teminat seviyesi {n} kez stop out sınırının altına indi.': 'Margin level fell below the stop-out level {n} times.',
};

const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = Object.entries(MESSAGES_EN).map(([tr, en]) => {
  const names = [];
  const re = new RegExp(`^${escape(tr).replace(/\\\{(\w+)\\\}/g, (m, n) => { names.push(n); return '(.+?)'; })}$`);
  return { re, names, en };
});

// Turkish engine message (template or filled) → English. English or unknown text is returned as is.
export function englishMessage(text) {
  if (typeof text !== 'string') return text;
  for (const { re, names, en } of PATTERNS) {
    const m = text.match(re);
    if (m) return en.replace(/\{(\w+)\}/g, (x, n) => (names.includes(n) ? m[names.indexOf(n) + 1] : x));
  }
  return text;
}
