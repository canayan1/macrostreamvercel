// Çekirdeğin mesaj çevirisi. Çekirdek DOM'a ve arayüz sözlüğüne bağımlı değildir: mesajlar Türkçe
// kaynak metinle yazılır, {ad} değişkenleri doldurulur. Uygulama (lab) kendi çevirmenini
// ceviriAyarla(fn) ile bağlar; fn(kaynak, degiskenler) çevrilmiş metni döner.
// Core message translation. The core has no DOM or UI-dictionary dependency: messages are
// written as Turkish source strings with {name} placeholders. The host app plugs in its own
// translator with ceviriAyarla(fn).

const doldur = (s, d) => (d ? s.replace(/\{(\w+)\}/g, (m, k) => (k in d ? String(d[k]) : m)) : s);
let cevirmen = doldur;

export function ceviriAyarla(fn) { cevirmen = typeof fn === 'function' ? fn : doldur; }
export function t(kaynak, degiskenler) { return cevirmen(kaynak, degiskenler); }
