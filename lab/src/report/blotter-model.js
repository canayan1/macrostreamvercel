// End-of-day desk report model for FX Blotter Analytics: the plain data the report page draws
// (lab/report.html, src/report/goster.js). Built once in the creator's language, so a shared copy
// reads the same for whoever opens it; numbers stay numbers and are formatted with model.locale.
//
// blotterReportModel({ aktarim, an, mut, lang, source, inputs, example, localCcy, method, now }) → model
//   model = { v: 1, kind: 'fx-desk', lang, locale, title, subtitle: [...], day, kpis, sections, checks, notes, footer }
//   kpis:     [{ label, value, kind: 'pnl' | 'text', sub? }]
//   sections: [{ id, title, columns: [{ label, kind: 'text' | 'pnl' | 'int' | 'pct' | 'status' }], rows: [[...]], total?: [...], note? }]
//   checks:   [{ label, ok: true | false | null, detail }]

import { t } from '../dil.js';
import { TUR_AD, LIMIT_AD, LIMIT_DURUM, GEREKCE_AD } from '../blotter/etiketler.js';
import { grupla, KOVALAR } from '../blotter/analiz.js';

export const REPORT_VERSION = 1;
// localStorage key the analysis page writes and /lab/report#local reads.
export const LOCAL_KEY = 'kalibre-report-local';

export function blotterReportModel({ aktarim, an, mut, lang = 'en', source = '', inputs = '', example = false, localCcy = null, method = 'fifo', now = Date.now() }) {
  const L = (en, tr) => (lang === 'tr' ? tr : en);
  const T = an.toplam;
  const booked = an.katkilar.filter(k => ['gerceklesen', 'swap', 'ndf'].includes(k.tur));
  const sum = xs => xs.reduce((s, k) => s + (k.usd.toplam ?? 0), 0);
  const methodName = method === 'ortalama' ? L('average cost', 'ortalama maliyet') : 'FIFO';
  const passed = mut.filter(m => m.tamam !== false).length;

  const group = (dim, id, title, label = x => t(String(x.ad))) => {
    const g = grupla(an.katkilar, dim).sort((a, b) => b.toplam - a.toplam);
    return {
      id, title,
      columns: [{ label: title.replace(/^.*· /, ''), kind: 'text' }, { label: L('Items', 'Kalem'), kind: 'int' }, { label: L('Price', 'Fiyat'), kind: 'pnl' }, { label: L('Points and swap', 'Puan ve swap'), kind: 'pnl' },
        { label: L('Carry', 'Taşıma'), kind: 'pnl' }, { label: 'MTM', kind: 'pnl' }, { label: L('Total (USD)', 'Toplam (USD)'), kind: 'pnl' }],
      rows: g.map(x => [label(x), x.adet, x.fiyat + x.ayrimYok, x.puan, x.tasima, x.mtm, x.toplam]),
      total: [L('Total', 'Toplam'), T.adet, T.fiyat + T.ayrimYok, T.puan, T.tasima, T.mtm, T.toplam],
    };
  };
  const byPair = group('parite', 'pair', L('P&L by pair', 'Pariteye göre K/Z'));
  const byDealer = group('trader', 'dealer', L('P&L by dealer', "Trader'a göre K/Z"));
  const byType = group('tur', 'type', L('P&L by item type', 'Kalem türüne göre K/Z'), x => t(TUR_AD[x.ad] ?? x.ad));

  const posRows = an.pozisyon.satirlar.filter(p => Math.abs(p.tutar) >= 0.005).sort((a, b) => (b.usd ?? 0) - (a.usd ?? 0));
  const positions = {
    id: 'positions', title: L('Net open position by currency', 'Döviz bazında net açık pozisyon'),
    columns: [{ label: L('Currency', 'Döviz'), kind: 'text' }, { label: L('Net position', 'Net pozisyon'), kind: 'pnl' }, { label: L('USD equivalent', 'USD karşılığı'), kind: 'pnl' }],
    rows: posRows.map(p => [p.doviz, p.tutar, p.usd]),
    note: L('Shorthand net open position: {x} USD', 'Kısa yol net açık pozisyon: {x} USD').replace('{x}', Math.round(an.pozisyon.kisaYol).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB')),
  };
  const limits = {
    id: 'limits', title: L('Limits', 'Limitler'),
    columns: [{ label: L('Limit', 'Limit'), kind: 'text' }, { label: L('Limit (USD)', 'Limit (USD)'), kind: 'int' }, { label: L('Usage (USD)', 'Kullanım (USD)'), kind: 'int' }, { label: L('Usage', 'Kullanım'), kind: 'pct' }, { label: L('Status', 'Durum'), kind: 'status' }],
    rows: an.limitler.map(l => [t(LIMIT_AD[l.tur], { d: l.doviz ?? '', a: l.ad || t('masa'), k: l.kova ? t(l.kova) : '' }), l.usd, l.kullanim, l.oran, { text: t(LIMIT_DURUM[l.durum]), state: l.durum === 'asildi' ? 'bad' : l.durum === 'yakin' ? 'warn' : l.durum === 'icinde' ? 'good' : 'muted' }]),
    note: an.limitler.length ? '' : L('No limits were set for this analysis.', 'Bu analiz için limit girilmedi.'),
  };
  const ladder = {
    id: 'ladder', title: L('Value date ladder', 'Valör merdiveni'),
    columns: [{ label: L('Currency', 'Döviz'), kind: 'text' }, ...KOVALAR.map(k => ({ label: t(k), kind: 'pnl' }))],
    rows: an.merdiven.map(m => [m.doviz, ...KOVALAR.map(k => m.kovalar[k]?.tutar ?? 0)]),
  };
  const excluded = aktarim.atlanan.filter(a => a.gerekce !== 'baslik-oncesi' && a.gerekce !== 'toplam-satiri');
  const excludedSec = {
    id: 'excluded', title: L('Excluded rows', 'Dışlanan satırlar'),
    columns: [{ label: L('File row', 'Dosya satırı'), kind: 'int' }, { label: L('Reason', 'Gerekçe'), kind: 'text' }],
    rows: excluded.slice(0, 50).map(a => [a.satirNo, t(GEREKCE_AD[a.gerekce] ?? a.gerekce)]),
    note: excluded.length > 50 ? L(`First 50 of ${excluded.length}.`, `${excluded.length} satırın ilk 50'si.`) : excluded.length ? '' : L('No rows were excluded.', 'Dışlanan satır yok.'),
  };

  const day = lang === 'tr' ? an.tarih.split('-').reverse().join('.') : an.tarih;
  const localTotal = localCcy && an.cevir.yerel(T.toplam);
  return {
    v: REPORT_VERSION, kind: 'fx-desk', lang, locale: lang === 'tr' ? 'tr-TR' : 'en-GB',
    title: L('FX desk report', 'FX masa raporu'),
    subtitle: [example ? L('Example', 'Örnek') : null, source || null, `${L('analysis day', 'analiz günü')} ${day}`, `${methodName} · ${an.kz.traderBazli ? L('book × dealer × pair', 'portföy × trader × parite') : L('book × pair', 'portföy × parite')}`,
      L(`${aktarim.ozet.aktarilan} legs imported, ${aktarim.ozet.dislanan} excluded`, `${aktarim.ozet.aktarilan} bacak aktarıldı, ${aktarim.ozet.dislanan} dışlandı`)].filter(Boolean),
    day: an.tarih, createdAt: new Date(now).toISOString(), example: !!example,
    kpis: [
      { label: L('Total P&L', 'Toplam K/Z'), value: T.toplam, kind: 'pnl', sub: localTotal == null ? '' : `${Math.round(localTotal).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { signDisplay: 'always' })} ${localCcy}` },
      { label: L('Price P&L', 'Fiyat K/Z'), value: T.fiyat + T.ayrimYok, kind: 'pnl', sub: L('spot difference', 'spot farkı') },
      { label: L('Points and swap', 'Puan ve swap'), value: T.puan, kind: 'pnl', sub: L('forward points and rolls', 'vadeli puanı ve roll') },
      { label: L('Carry', 'Taşıma'), value: T.tasima, kind: 'pnl', sub: L('overnight', 'gecelik') },
      { label: 'MTM', value: T.mtm, kind: 'pnl', sub: L('open position, spot based', 'açık pozisyon, spot bazlı') },
      { label: L('Client margin', 'Müşteri marjı'), value: an.marjOzet.usd, kind: 'pnl', sub: L(`${an.marjOzet.kalem.length} items`, `${an.marjOzet.kalem.length} kalem`) },
      { label: L('Realized, value date passed', 'Gerçekleşen, valörü geçmiş'), value: sum(booked.filter(k => k.taninmis)), kind: 'pnl' },
      { label: L('Locked in, value date ahead', 'Kilitli, valörü gelmemiş'), value: sum(booked.filter(k => !k.taninmis)), kind: 'pnl' },
      { label: L('Reconciliation', 'Mutabakat'), value: `${passed} / ${mut.length}`, kind: 'text', sub: L('checks passed', 'kontrol geçti') },
    ],
    sections: [byPair, byDealer, byType, positions, limits, ladder, excludedSec],
    checks: mut.map(m => ({ label: t(m.ad), ok: m.tamam, detail: m.tamam === null ? L('not applicable', 'uygulanamadı') : '' })),
    notes: [inputs, an.eksikKur.length ? L(`Missing input, left out of the totals: ${an.eksikKur.length} item(s).`, `Eksik girdi, toplama katılmadı: ${an.eksikKur.length} kalem.`) : ''].filter(Boolean),
    footer: L('Prepared with Kalibre Markets Analytics from the desk\'s own blotter. Figures are the desk\'s input and calculation, not investment advice.', 'Kalibre Markets Analytics ile masanın kendi blotter\'ından hazırlandı. Rakamlar masanın girdisi ve hesabıdır, yatırım tavsiyesi değildir.'),
  };
}

// Sanity check for a model that came from a link: shape only, never trusted for anything else.
export function isReportModel(m) {
  return !!m && m.v === REPORT_VERSION && typeof m.title === 'string' && Array.isArray(m.kpis) && Array.isArray(m.sections) && Array.isArray(m.checks)
    && m.sections.every(s => Array.isArray(s.columns) && Array.isArray(s.rows));
}
