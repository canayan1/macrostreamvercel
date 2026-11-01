// Trade tickets from email. Platform confirmations ("trade tickets") land in the mailbox as one
// message per deal. This module turns saved messages (.eml, .txt) or pasted text into a table
// (header row + one row per ticket) that the ordinary blotter importer reads, so column matching,
// value parsing and the analysis stay the same.
//
// Ticket text is read as "Label: value" lines (also "Label<tab>value" and two-cell HTML table rows).
// Several tickets in one text are split where the first label repeats. Nothing here knows a
// platform's layout; the labels are matched by the importer's dictionary (tespit.js SOZLUK), and
// unknown labels are matched by hand on screen.
//
// biletleriCoz(metin) → [{ alanlar: { label: value }, satirNo }]      one object per ticket
// biletTablosu(biletler) → [[labels…], [values…], …]                 rows for iceAktar
// epostaMetni(ham) → plain text of an .eml (text/plain part; else HTML stripped)

const VARLIK = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
const varlikCoz = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, k) => {
  if (k[0] === '#') { const n = k[1].toLowerCase() === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; }
  return VARLIK[k.toLowerCase()] ?? m;
});

// Quoted-printable and base64 bodies, as mail clients write them.
export function qpCoz(s) {
  return s.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
const b64Metin = (s, charset) => {
  try { const b = Uint8Array.from(atob(s.replace(/\s+/g, '')), c => c.charCodeAt(0)); return new TextDecoder(charset || 'utf-8').decode(b); } catch { return ''; }
};
const qpMetin = (s, charset) => {
  const bytes = Uint8Array.from(qpCoz(s), c => c.charCodeAt(0) & 0xff);
  try { return new TextDecoder(charset || 'utf-8').decode(bytes); } catch { return qpCoz(s); }
};

// HTML → text: table cells become "Label: value" lines, block tags become line breaks.
export function htmlMetni(h) {
  let s = h.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, tr) => {
    const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => varlikCoz(m[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()).filter(Boolean);
    return cells.length === 2 && !/:$/.test(cells[0]) ? `\n${cells[0]}: ${cells[1]}\n` : `\n${cells.join(': ')}\n`;
  });
  s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|tr)>/gi, '\n').replace(/<[^>]*>/g, ' ');
  return varlikCoz(s).replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Plain text of a saved message. Handles a single part, multipart/alternative and nested multipart.
export function epostaMetni(ham) {
  const parts = mimeParcalar(ham);
  const plain = parts.find(p => p.type.startsWith('text/plain'));
  if (plain) return plain.text;
  const html = parts.find(p => p.type.startsWith('text/html'));
  if (html) return htmlMetni(html.text);
  // Not MIME at all: treat as pasted text.
  return ham;
}

function mimeParcalar(ham) {
  const sep = ham.indexOf('\r\n\r\n') >= 0 ? '\r\n\r\n' : '\n\n';
  const i = ham.indexOf(sep);
  if (i < 0) return [{ type: 'text/plain', text: ham }];
  const head = ham.slice(0, i).replace(/\r?\n[ \t]+/g, ' '), body = ham.slice(i + sep.length);
  const hv = name => (head.match(new RegExp(`^${name}:\\s*(.*)$`, 'im')) ?? [])[1] ?? '';
  const ct = hv('Content-Type') || 'text/plain';
  const type = ct.split(';')[0].trim().toLowerCase();
  const charset = (ct.match(/charset="?([\w-]+)"?/i) ?? [])[1];
  const cte = hv('Content-Transfer-Encoding').trim().toLowerCase();
  if (type.startsWith('multipart/')) {
    const b = (ct.match(/boundary="?([^";]+)"?/i) ?? [])[1];
    if (!b) return [{ type: 'text/plain', text: body }];
    return body.split(`--${b}`).slice(1).filter(p => !p.startsWith('--')).flatMap(p => mimeParcalar(p.replace(/^\r?\n/, '')));
  }
  if (!head.match(/^content-type:|^mime-version:|^from:|^subject:/im)) return [{ type: 'text/plain', text: ham }];
  const text = cte === 'base64' ? b64Metin(body, charset) : cte === 'quoted-printable' ? qpMetin(body, charset) : body;
  return [{ type, text }];
}

const LABEL_RE = /^\s*([A-Za-zÀ-ž][\w .\/()%&'-]{1,40}?)\s*(?::|\t| {3,})\s*(.+?)\s*$/;

// Label: value lines → tickets. A new ticket starts where the first label seen appears again.
export function biletleriCoz(metin) {
  const lines = String(metin ?? '').replace(/\r/g, '').split('\n');
  const tickets = [];
  let cur = null, first = null;
  lines.forEach((line, i) => {
    const m = LABEL_RE.exec(line);
    if (!m) return;
    const label = m[1].trim(), value = m[2].trim();
    if (!value || /^(from|to|cc|subject|date|sent|received|message-id|content-type|mime-version)$/i.test(label)) return;
    if (!cur || (label === first && label in cur.alanlar)) { cur = { alanlar: {}, satirNo: i + 1 }; tickets.push(cur); first ??= label; }
    if (!(label in cur.alanlar)) cur.alanlar[label] = value;
  });
  return tickets.filter(t => Object.keys(t.alanlar).length >= 3);
}

export function biletTablosu(biletler) {
  const labels = [];
  for (const t of biletler) for (const k of Object.keys(t.alanlar)) if (!labels.includes(k)) labels.push(k);
  return [labels, ...biletler.map(t => labels.map(l => t.alanlar[l] ?? ''))];
}

// Files or pasted text → one table. Each file is one or more tickets; order is kept.
export function biletlerdenTablo(metinler) {
  const all = metinler.flatMap(m => biletleriCoz(epostaMetni(m)));
  return { satirlar: all.length ? biletTablosu(all) : [], bilet: all.length };
}
