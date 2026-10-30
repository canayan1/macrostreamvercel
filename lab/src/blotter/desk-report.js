// Desk report workbook for FX Blotter Analytics: a dashboard sheet (KPI tiles and four native Excel
// charts) followed by the data sheets the charts read from. Runs in the browser (download button on
// /lab/blotter) and in Node (araclar/ornek-dosya-uret.mjs writes the sample result files with it), so
// the file a desk downloads and the published sample are built by the same code.
//
// deskReport({ aktarim, an, mut, lang, source, inputs, example, localCcy, method }) → { bytes: Uint8Array, summary }
//   aktarim, an, mut: results of iceAktar, blotterAnaliz and mutabakat
//   source: input file name shown in the subtitle; inputs: one line describing rates and limits used
//   example: true for the published sample (subtitle starts with "Example")

import { workbook } from '../report/xlsx-writer.js';
import { dashboard, table, signColors } from '../report/layout.js';
import { t } from '../dil.js';
import { TUR_AD, LIMIT_AD, LIMIT_DURUM, GEREKCE_AD } from './etiketler.js';
import { grupla, KOVALAR } from './analiz.js';

export function deskReport({ aktarim, an, mut, lang = 'en', source = '', inputs = '', example = false, localCcy = 'TRY', method = 'fifo' }) {
  const L = (en, tr) => (lang === 'tr' ? tr : en);
  const T = an.toplam;
  const booked = an.katkilar.filter(k => ['gerceklesen', 'swap', 'ndf'].includes(k.tur));
  const usdCol = (header, style = 'pnl') => ({ header, width: 16, style, numeric: true });

  // Data sheets the charts read from.
  const pnlSheet = (dim, name) => {
    const g = grupla(an.katkilar, dim).sort((a, b) => b.toplam - a.toplam);
    const label = x => t(dim === 'tur' ? TUR_AD[x.ad] ?? x.ad : String(x.ad));
    const sheet = table({
      name,
      columns: [{ header: L('Group', 'Grup'), width: 24 }, { header: L('Items', 'Kalem'), width: 9, style: 'int', numeric: true },
        usdCol(L('Price P&L (USD)', 'Fiyat K/Z (USD)')), usdCol(L('Points and swap (USD)', 'Puan ve swap (USD)')), usdCol(L('Carry (USD)', 'Taşıma (USD)')),
        usdCol(L('MTM (USD)', 'MTM (USD)')), usdCol(L('Total P&L (USD)', 'Toplam K/Z (USD)'))],
      rows: g.map(x => [label(x), x.adet, x.fiyat + x.ayrimYok, x.puan, x.tasima, x.mtm, x.toplam]),
      total: [L('Total', 'Toplam'), T.adet, T.fiyat + T.ayrimYok, T.puan, T.tasima, T.mtm, T.toplam],
    });
    return { sheet, cats: g.map(label), vals: g.map(x => x.toplam) };
  };
  const byPair = pnlSheet('parite', L('P&L by pair', 'Pariteye göre K-Z'));
  const byBook = pnlSheet('portfoy', L('P&L by book', 'Portföye göre K-Z'));
  const byDealer = pnlSheet('trader', L('P&L by dealer', "Trader'a göre K-Z"));
  const byType = pnlSheet('tur', L('P&L by item type', 'Kalem türüne göre K-Z'));

  const parts = [[L('Price (spot)', 'Fiyat (spot)'), T.fiyat + T.ayrimYok], [L('Points and swap', 'Puan ve swap'), T.puan], [L('Carry', 'Taşıma'), T.tasima], [L('MTM', 'MTM'), T.mtm]];
  const summary = table({
    name: L('Summary', 'Özet'),
    columns: [{ header: L('Component', 'Bileşen'), width: 30 }, usdCol('USD'), usdCol(localCcy ?? L('Local', 'Yerel'))],
    rows: parts.map(([k, v]) => [k, v, an.cevir.yerel(v)]),
    total: [L('Total P&L', 'Toplam K/Z'), T.toplam, an.cevir.yerel(T.toplam)],
  });
  const facts = [
    [L('Realized, value date passed', 'Gerçekleşen, valörü geçmiş'), booked.filter(k => k.taninmis).reduce((s, k) => s + (k.usd.toplam ?? 0), 0)],
    [L('Locked in, value date ahead', 'Kilitli, valörü gelmemiş'), booked.filter(k => !k.taninmis).reduce((s, k) => s + (k.usd.toplam ?? 0), 0)],
    [L('Client margin', 'Müşteri marjı'), an.marjOzet.usd],
    [L('Net open position, shorthand (USD)', 'Net açık pozisyon, kısa yol (USD)'), an.pozisyon.kisaYol],
  ];
  summary.rows.push([], [{ v: L('Other figures (USD)', 'Diğer rakamlar (USD)'), s: 'section' }], ...facts.map(([k, v]) => [{ v: k, s: 'label' }, { v, s: 'pnl' }]));

  const posRows = an.pozisyon.satirlar.filter(p => p.tutar !== 0).sort((a, b) => b.usd - a.usd);
  const positions = table({
    name: L('Positions', 'Pozisyon'),
    columns: [{ header: L('Currency', 'Döviz'), width: 12 }, { header: L('Net position', 'Net pozisyon'), width: 20, style: 'pnl', numeric: true }, usdCol(L('USD equivalent', 'USD karşılığı'))],
    rows: posRows.map(p => [p.doviz, p.tutar, p.usd]),
  });
  const ladder = table({
    name: L('Value-date ladder', 'Valör merdiveni'),
    columns: [{ header: L('Currency', 'Döviz'), width: 11 }, ...KOVALAR.map(k => ({ header: t(k), width: 14, style: 'pnl', numeric: true }))],
    rows: an.merdiven.map(m => [m.doviz, ...KOVALAR.map(k => m.kovalar[k]?.tutar ?? 0)]),
  });
  const limits = table({
    name: L('Limits', 'Limitler'),
    columns: [{ header: L('Limit', 'Limit'), width: 34 }, { header: L('Limit (USD)', 'Limit (USD)'), width: 16, style: 'int', numeric: true },
      { header: L('Usage (USD)', 'Kullanım (USD)'), width: 16, style: 'int', numeric: true }, { header: L('Usage', 'Kullanım'), width: 10, style: 'pct', numeric: true }, { header: L('Status', 'Durum'), width: 12 }],
    rows: an.limitler.map(l => [t(LIMIT_AD[l.tur], { d: l.doviz ?? '', a: l.ad || t('masa'), k: l.kova ? t(l.kova) : '' }), l.usd, l.kullanim, l.oran, { v: t(LIMIT_DURUM[l.durum]), s: l.durum === 'asildi' ? 'bad' : l.durum === 'yakin' ? 'muted' : 'good' }]),
  });
  const recon = table({
    name: L('Reconciliation', 'Mutabakat'),
    columns: [{ header: L('Check', 'Kontrol'), width: 50 }, { header: L('Result', 'Sonuç'), width: 14 }],
    rows: mut.map(m => [t(m.ad), m.tamam === false ? { v: L('Failed', 'Başarısız'), s: 'bad' } : m.tamam === true ? { v: L('Passed', 'Geçti'), s: 'good' } : { v: L('Not applicable', 'Uygulanmaz'), s: 'muted' }]),
  });
  const excluded = table({
    name: L('Excluded rows', 'Dışlanan satırlar'),
    columns: [{ header: L('File row', 'Dosya satırı'), width: 11, style: 'int', numeric: true }, { header: L('Reason', 'Gerekçe'), width: 44 }],
    rows: aktarim.atlanan.map(a => [a.satirNo, t(GEREKCE_AD[a.gerekce] ?? a.gerekce)]),
  });

  const passed = mut.filter(m => m.tamam !== false).length;
  const bar = (title, src, type = 'bar') => ({ type, title, series: [{ name: title, cat: { sheet: src.sheet.name, ref: src.sheet.range(0) }, val: { sheet: src.sheet.name, ref: src.sheet.range(src.valCol ?? 6) }, cats: src.cats, vals: src.vals, pointColors: signColors(src.vals) }] });
  const day = lang === 'tr' ? an.tarih.split('-').reverse().join('.') : an.tarih;
  const methodName = method === 'ortalama' ? L('average cost', 'ortalama maliyet') : 'FIFO';
  const head = [example ? L('Example', 'Örnek') : null, source || null, `${L('analysis day', 'analiz günü')} ${day}`, `${methodName}, ${L('book × pair', 'portföy × parite')}`,
    L(`${aktarim.ozet.aktarilan} legs imported, ${aktarim.ozet.dislanan} excluded`, `${aktarim.ozet.aktarilan} bacak aktarıldı, ${aktarim.ozet.dislanan} dışlandı`)].filter(Boolean);
  const dash = dashboard({
    name: L('Dashboard', 'Pano'),
    title: 'FX Blotter Analytics',
    subtitle: head.join(' · '),
    kpis: [
      { label: L('Total P&L (USD)', 'Toplam K/Z (USD)'), value: T.toplam, style: 'kpiPnl' },
      { label: L('Price P&L (USD)', 'Fiyat K/Z (USD)'), value: T.fiyat + T.ayrimYok, style: 'kpiPnl' },
      { label: L('Points and swap (USD)', 'Puan ve swap (USD)'), value: T.puan, style: 'kpiPnl' },
      { label: L('Carry (USD)', 'Taşıma (USD)'), value: T.tasima, style: 'kpiPnl' },
      { label: L('MTM, open position (USD)', 'MTM, açık pozisyon (USD)'), value: T.mtm, style: 'kpiPnl' },
      { label: L('Reconciliation checks', 'Mutabakat kontrolleri'), value: `${passed} / ${mut.length}`, style: 'kpiText' },
    ],
    charts: [
      bar(L('Total P&L by pair (USD)', 'Pariteye göre toplam K/Z (USD)'), byPair),
      bar(L('P&L by component (USD)', 'Bileşene göre K/Z (USD)'), { sheet: summary, valCol: 1, cats: parts.map(p => p[0]), vals: parts.map(p => p[1]) }, 'column'),
      bar(L('Total P&L by dealer (USD)', "Trader'a göre toplam K/Z (USD)"), byDealer),
      bar(L('Net position by currency (USD equivalent)', 'Döviz bazında net pozisyon (USD karşılığı)'), { sheet: positions, valCol: 2, cats: posRows.map(p => p.doviz), vals: posRows.map(p => p.usd) }),
    ],
    notes: inputs ? [inputs] : [],
  });
  const sheets = [dash, summary, byPair.sheet, byBook.sheet, byDealer.sheet, byType.sheet, positions, ladder, limits, recon, excluded];
  const title = example ? L('FX Blotter Analytics result (example)', 'FX Blotter Analizi sonucu (örnek)') : L('FX Blotter Analytics desk report', 'FX Blotter Analizi masa raporu');
  return {
    bytes: workbook({ title, sheets }),
    summary: { legs: aktarim.ozet.aktarilan, excludedRows: aktarim.ozet.dislanan, totalUsd: Math.round(T.toplam), priceUsd: Math.round(T.fiyat + T.ayrimYok), pointsUsd: Math.round(T.puan), carryUsd: Math.round(T.tasima), mtmUsd: Math.round(T.mtm), checks: mut.length, checksPassed: passed },
  };
}
