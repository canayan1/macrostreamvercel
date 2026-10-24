// Kapanmış işlemlerden hesap özeti. Saf hesap: DOM yok, dil yok; etiketler panom.js'te.
// Girdi: islemCoz sonucu ({ islemler, bakiyeHareketleri }). Zamanlar sunucu saatidir.
//
// Bakiye eğrisi: bakiye hareketleri ve kapanışlar zaman sırasında toplanır. Gerçekleşmiş azami
// düşüş yalnız işlem sonuçlarıyla ölçülür: para yatırmak bir düşüşü "toparlamaz", para çekmek
// düşüş sayılmaz. Yüzde, tepe anındaki bakiyeye (hareketler dahil) göre verilir.

const GUN = 86400;

// Sunucu saatindeki unix saniyeyi yyyy-mm-dd gün anahtarına çevirir (saat dilimine bağlı değil).
export const gunAnahtari = sn => new Date(sn * 1000).toISOString().slice(0, 10);

export function hesapOzeti(h) {
  const islemler = [...(h?.islemler ?? [])].sort((a, b) => a.kapanisZamani - b.kapanisZamani);
  const hareketler = [...(h?.bakiyeHareketleri ?? [])].sort((a, b) => a.zaman - b.zaman);

  const kazananlar = islemler.filter(i => i.kar > 0);
  const kaybedenler = islemler.filter(i => i.kar < 0);
  const topla = d => d.reduce((t, i) => t + i.kar, 0);
  const net = topla(islemler);
  const brutKar = topla(kazananlar);
  const brutKayip = -topla(kaybedenler);
  const karFaktoru = brutKayip > 0 ? brutKar / brutKayip : (brutKar > 0 ? Infinity : null);

  // Olaylar zaman sırasında: hareketler ve kapanışlar. Aynı anda ise hareket önce gelir.
  const olaylar = [
    ...hareketler.map(x => ({ zaman: x.zaman, tutar: x.tutar, islem: false })),
    ...islemler.map(x => ({ zaman: x.kapanisZamani, tutar: x.kar, islem: true })),
  ].sort((a, b) => a.zaman - b.zaman || (a.islem ? 1 : 0) - (b.islem ? 1 : 0));

  let bakiye = 0, kumulatif = 0, tepe = 0, tepeBakiye = 0, azamiDusus = 0, azamiDususYuzde = 0;
  const egri = [];
  for (const o of olaylar) {
    bakiye += o.tutar;
    if (o.islem) {
      kumulatif += o.tutar;
      if (kumulatif >= tepe) { tepe = kumulatif; tepeBakiye = bakiye; }
      const dusus = tepe - kumulatif;
      if (dusus > azamiDusus) {
        azamiDusus = dusus;
        azamiDususYuzde = tepeBakiye > 0 ? dusus / tepeBakiye : 0;
      }
    }
    egri.push({ zaman: o.zaman, bakiye: Math.round(bakiye * 100) / 100, kumulatif: Math.round(kumulatif * 100) / 100 });
  }

  const sembolBazinda = {};
  for (const i of islemler) {
    const s = (sembolBazinda[i.sembol] ??= { sembol: i.sembol, adet: 0, kazanan: 0, net: 0, lot: 0 });
    s.adet++; if (i.kar > 0) s.kazanan++; s.net += i.kar; s.lot += i.lot;
  }
  const gunBazinda = {};
  for (const i of islemler) {
    const g = (gunBazinda[gunAnahtari(i.kapanisZamani)] ??= { adet: 0, net: 0 });
    g.adet++; g.net += i.kar;
  }
  const gunler = Object.entries(gunBazinda).map(([gun, v]) => ({ gun, ...v })).sort((a, b) => a.gun.localeCompare(b.gun));
  const enIyiGun = gunler.reduce((e, g) => (!e || g.net > e.net ? g : e), null);
  const enKotuGun = gunler.reduce((e, g) => (!e || g.net < e.net ? g : e), null);

  const ortSure = islemler.length ? islemler.reduce((t, i) => t + (i.kapanisZamani - i.acilisZamani), 0) / islemler.length : null;

  return {
    adet: islemler.length,
    net,
    kazanan: kazananlar.length,
    kaybeden: kaybedenler.length,
    kazanmaOrani: islemler.length ? kazananlar.length / islemler.length : null,
    karFaktoru,
    brutKar, brutKayip,
    ortKazanc: kazananlar.length ? brutKar / kazananlar.length : null,
    ortKayip: kaybedenler.length ? brutKayip / kaybedenler.length : null,
    enBuyukKazanc: kazananlar.length ? Math.max(...kazananlar.map(i => i.kar)) : null,
    enBuyukKayip: kaybedenler.length ? Math.min(...kaybedenler.map(i => i.kar)) : null,
    azamiDusus, azamiDususYuzde,
    yatirilan: hareketler.filter(x => x.tutar > 0).reduce((t, x) => t + x.tutar, 0),
    cekilen: -hareketler.filter(x => x.tutar < 0).reduce((t, x) => t + x.tutar, 0),
    sonBakiye: Math.round(bakiye * 100) / 100,
    ortSureSn: ortSure,
    sembolBazinda: Object.values(sembolBazinda).sort((a, b) => b.net - a.net),
    gunBazinda: gunler,
    enIyiGun, enKotuGun,
    egri,
    ilkZaman: olaylar.length ? olaylar[0].zaman : null,
    sonZaman: olaylar.length ? olaylar[olaylar.length - 1].zaman : null,
  };
}

// Son `gunSayisi` günün gün anahtarları (takvim şeridi için), bugün dahil, eskiden yeniye.
export function sonGunler(simdiSn, gunSayisi = 42) {
  const out = [];
  for (let i = gunSayisi - 1; i >= 0; i--) out.push(gunAnahtari(simdiSn - i * GUN));
  return out;
}
