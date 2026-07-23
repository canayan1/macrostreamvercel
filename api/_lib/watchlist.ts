// BIST 30 takip listesi — haber taraması için sembol + arama sorgusu.
// Sorgular Google News RSS'e gider; tırnaklı ad + bağlam kelimesi gürültüyü azaltır.
// Kaynak: New project/src/stocks/universe.py (BIST_30)

export type WatchEntry = {
  sym: string;   // ASELS
  name: string;  // Aselsan
  q: string;     // Google News arama sorgusu
};

function entry(sym: string, name: string, q?: string): WatchEntry {
  return { sym, name, q: q ?? `"${name}"` };
}

// Genel/kısa adlarda bağlam ekle (hisse OR borsa) — isim çakışmasını filtreler.
export const WATCHLIST: WatchEntry[] = [
  entry('AKBNK', 'Akbank'),
  entry('ARCLK', 'Arçelik'),
  entry('ASELS', 'Aselsan'),
  entry('BIMAS', 'BİM Mağazalar', '"BİM" (hisse OR mağaza OR bilanço)'),
  entry('DOHOL', 'Doğan Holding'),
  entry('EKGYO', 'Emlak Konut GYO', '"Emlak Konut"'),
  entry('ENKAI', 'Enka İnşaat', '"Enka"'),
  entry('EREGL', 'Ereğli Demir Çelik', '"Erdemir" OR "Ereğli Demir"'),
  entry('FROTO', 'Ford Otosan'),
  entry('GARAN', 'Garanti BBVA'),
  entry('HEKTS', 'Hektaş'),
  entry('ISCTR', 'İş Bankası', '"İş Bankası" (hisse OR borsa OR bilanço)'),
  entry('KCHOL', 'Koç Holding'),
  entry('KOZAL', 'Koza Altın'),
  entry('KOZAA', 'Koza Anadolu Metal', '"Koza Anadolu"'),
  entry('KRDMD', 'Kardemir'),
  entry('MGROS', 'Migros'),
  entry('ODAS', 'Odaş Elektrik', '"Odaş"'),
  entry('PETKM', 'Petkim'),
  entry('PGSUS', 'Pegasus', '"Pegasus" (hisse OR havayolu OR borsa)'),
  entry('SAHOL', 'Sabancı Holding'),
  entry('SASA', 'Sasa Polyester', '"Sasa" (hisse OR polyester OR borsa)'),
  entry('SISE', 'Şişe Cam', '"Şişecam" OR "Şişe Cam"'),
  entry('TAVHL', 'TAV Havalimanları', '"TAV"'),
  entry('TCELL', 'Turkcell'),
  entry('THYAO', 'Türk Hava Yolları', '"Türk Hava Yolları" OR "THY"'),
  entry('TOASO', 'Tofaş Oto', '"Tofaş"'),
  entry('TUPRS', 'Tüpraş'),
  entry('VAKBN', 'VakıfBank'),
  entry('YKBNK', 'Yapı Kredi', '"Yapı Kredi"'),
];
