// Account review model for Trade Analytics: the plain data the report page draws (same shape as
// blotter-model.js, kind 'account-review'). Built once in the creator's language; numbers stay
// numbers and are formatted with model.locale; P&L carries the account currency.
//
// accountReportModel({ hesap, motor, lang, source, utcFark, prop, now }) → model
//   motor: analizMotoru(hesap, ...)      prop: { ad, s } from propDegerlendir, or null

import { t } from '../dil.js';
import { BOYUTLAR } from '../analiz/hesap.js';
import { REPORT_VERSION } from './blotter-model.js';

const BOYUT_AD = Object.fromEntries(BOYUTLAR.map(b => [b.id, b.ad]));

export function accountReportModel({ hesap, motor, lang = 'en', source = '', utcFark = 0, prop = null, now = Date.now() }) {
  const L = (en, tr) => (lang === 'tr' ? tr : en);
  const locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
  const o = motor.ozet();
  const cur = hesap.para || '';
  const n = (x, b = 2) => (typeof x === 'number' && Number.isFinite(x) ? x.toLocaleString(locale, { minimumFractionDigits: b, maximumFractionDigits: b }) : '–');
  const pct = (x, b = 1) => (typeof x === 'number' && Number.isFinite(x) ? (lang === 'tr' ? `%${n(x * 100, b)}` : `${n(x * 100, b)}%`) : '–');
  const money = (x, b = 2) => (typeof x === 'number' && Number.isFinite(x) ? `${x > 0 ? '+' : x < 0 ? '−' : ''}${n(Math.abs(x), b)} ${cur}`.trim() : '–');
  const day = iso => (lang === 'tr' ? iso.split('-').reverse().join('.') : iso);
  const date = sn => (sn ? day(new Date(sn * 1000).toISOString().slice(0, 10)) : '–');
  const ratio = x => (x === Infinity ? '∞' : n(x, 2));

  const breakdown = (dim, id) => {
    const rows = motor.grupla(dim);
    return {
      id, title: t(BOYUT_AD[dim]),
      columns: [{ label: t(BOYUT_AD[dim]), kind: 'text' }, { label: L('Trades', 'İşlem'), kind: 'int' }, { label: L(`Net (${cur})`, `Net (${cur})`), kind: 'pnl' }, { label: L('Win rate', 'Kazanma oranı'), kind: 'pct' }, { label: L('Per trade', 'İşlem başı'), kind: 'pnl' }, { label: L('Profit factor', 'Kâr faktörü'), kind: 'text' }],
      rows: rows.map(s => [t(s.etiket), s.adet, s.net, s.kazanmaOrani, s.beklenti, ratio(s.karFaktoru)]),
    };
  };
  const ic = motor.icgoruler({ enAz: 20 });
  const segRows = list => list.map(a => [t(BOYUT_AD[a.boyut]), t(a.etiket), a.adet, a.net, a.kazanmaOrani, a.belirsiz ? L('may be chance', 'rastlantı olabilir') : '']);
  const segments = {
    id: 'segments', title: L('Where you make and lose money', 'Nerede kazanıp nerede kaybettiğin'),
    columns: [{ label: L('Dimension', 'Boyut'), kind: 'text' }, { label: L('Segment', 'Dilim'), kind: 'text' }, { label: L('Trades', 'İşlem'), kind: 'int' }, { label: L(`Net (${cur})`, `Net (${cur})`), kind: 'pnl' }, { label: L('Win rate', 'Kazanma oranı'), kind: 'pct' }, { label: L('Note', 'Not'), kind: 'text' }],
    rows: ic.yeterliVeri ? [...segRows(ic.kaybettiren), ...segRows(ic.kazandiran)] : [],
    note: ic.yeterliVeri
      ? L(`Segments with at least ${ic.enAz} trades, ranked by their effect on the result. Segments overlap. This describes the past; it is not advice.`, `En az ${ic.enAz} işlemli dilimler, sonuca etkisine göre sıralı. Dilimler örtüşür. Geçmişi betimler, öneri değildir.`)
      : L(`Segments are listed once they have ${ic.enAz} trades; this account has ${motor.islemler.length}.`, `Dilimler ${ic.enAz} işlemden sonra listelenir; bu hesapta ${motor.islemler.length} işlem var.`),
  };
  const sections = [segments, breakdown('sembol', 'symbol'), breakdown('gun', 'weekday'), breakdown('seans', 'session'), breakdown('oncekiSonuc', 'previous')];
  if (prop?.s) {
    const s = prop.s;
    const DURUM = { gunluk: L('Daily limit breached', 'Günlük sınır aşıldı'), azami: L('Max limit breached', 'Azami sınır aşıldı'), ikisi: L('Both limits breached', 'İki sınır da aşıldı') };
    const floor = v => (v === -Infinity || v == null ? null : v);
    sections.push({
      id: 'prop', title: L(`Prop firm limits: ${prop.ad}`, `Prop firması sınırları: ${prop.ad}`),
      columns: [{ label: L('Day', 'Gün'), kind: 'text' }, { label: L('Start of day', 'Gün başı'), kind: 'int' }, { label: L('Daily floor', 'Günlük taban'), kind: 'int' }, { label: L('Max floor', 'Azami taban'), kind: 'int' }, { label: L('Lowest balance', 'En düşük bakiye'), kind: 'int' }, { label: L('Room to the floor', 'Tabana mesafe'), kind: 'pnl' }, { label: L('Status', 'Durum'), kind: 'status' }],
      rows: [...s.gunler].sort((x, y) => x.mesafe - y.mesafe).slice(0, 10).map(g => [day(g.gun), g.gunBasi, floor(g.gunlukTaban), floor(g.azamiTaban), g.enDusuk, g.mesafe,
        g.ihlal ? { text: DURUM[g.ihlal], state: 'bad' } : g.mesafeYuzde < 0.01 ? { text: L('Close to the floor', 'Tabana yakın'), state: 'warn' } : { text: L('Within limits', 'Sınır içinde'), state: 'good' }]),
      note: L(`Starting capital ${n(s.baslangic, 0)} ${cur}. ${s.ihlalSayisi} day(s) over a limit. The ten days closest to the floor are listed.`, `Başlangıç sermayesi ${n(s.baslangic, 0)} ${cur}. Sınırı aşan gün: ${s.ihlalSayisi}. Tabana en yakın on gün listelendi.`),
    });
  }
  const curve = o.egri.length > 2 ? sample(o.egri, 160).map(e => [e.zaman, Math.round(e.bakiye * 100) / 100]) : [];
  return {
    v: REPORT_VERSION, kind: 'account-review', lang, locale, currency: cur,
    title: L('Account review', 'Hesap incelemesi'),
    subtitle: [hesap.kaynak === 'ornek' ? L('Example', 'Örnek') : null, source || null, `${date(o.ilk)} - ${date(o.son)}`, L(`${o.adet} trades, ${o.sembolSayisi} symbols, ${o.gunSayisi} trading days`, `${o.adet} işlem, ${o.sembolSayisi} sembol, ${o.gunSayisi} işlem günü`), L(`server time UTC${utcFark >= 0 ? '+' : '−'}${Math.abs(utcFark)}`, `sunucu saati UTC${utcFark >= 0 ? '+' : '−'}${Math.abs(utcFark)}`)].filter(Boolean),
    day: o.son ? new Date(o.son * 1000).toISOString().slice(0, 10) : '', createdAt: new Date(now).toISOString(), example: hesap.kaynak === 'ornek',
    kpis: [
      { label: L('Net P&L', 'Net kâr/zarar'), value: o.net, kind: 'pnl', sub: hesap.baslangicBakiye ? L(`${pct(o.net / hesap.baslangicBakiye)} of starting balance`, `başlangıca göre ${pct(o.net / hesap.baslangicBakiye)}`) : '' },
      { label: L('Win rate', 'Kazanma oranı'), value: pct(o.kazanmaOrani), kind: 'text', sub: L(`${o.adet} trades`, `${o.adet} işlem`) },
      { label: L('Profit factor', 'Kâr faktörü'), value: ratio(o.karFaktoru), kind: 'text', sub: L(`${money(o.beklenti)} per trade`, `işlem başı ${money(o.beklenti)}`) },
      { label: L('Max drawdown', 'Azami düşüş'), value: `${n(o.azamiDusus, 0)} ${cur}`, kind: 'text', sub: o.azamiDususYuzde != null ? L(`${pct(o.azamiDususYuzde)} from peak`, `tepeden ${pct(o.azamiDususYuzde)}`) : '' },
      { label: L('Average win', 'Ortalama kazanç'), value: o.ortKazanc, kind: 'pnl' },
      { label: L('Average loss', 'Ortalama kayıp'), value: o.ortKayip, kind: 'pnl' },
      { label: L('Commission and swap', 'Komisyon ve swap'), value: o.komisyon + o.swap, kind: 'pnl' },
      { label: L('Best day', 'En iyi gün'), value: o.enIyiGun ? `${day(o.enIyiGun.gun)} ${money(o.enIyiGun.net)}` : '–', kind: 'text' },
      { label: L('Worst day', 'En kötü gün'), value: o.enKotuGun ? `${day(o.enKotuGun.gun)} ${money(o.enKotuGun.net)}` : '–', kind: 'text' },
    ],
    curve, curveLabel: L('Balance from closed trades', 'Kapanan işlemlerle bakiye'),
    sections,
    checks: [],
    notes: [],
    footer: L('Prepared with Kalibre Markets Analytics from the account\'s own history report. Figures describe past trades and are not investment advice.', 'Kalibre Markets Analytics ile hesabın kendi geçmiş raporundan hazırlandı. Rakamlar geçmiş işlemleri betimler, yatırım tavsiyesi değildir.'),
  };
}

function sample(xs, max) {
  if (xs.length <= max) return xs;
  const step = (xs.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => xs[Math.round(i * step)]);
}
