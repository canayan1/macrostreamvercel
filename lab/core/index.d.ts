// Type declarations for @kalibre/core (hand-written; source is plain ESM JavaScript).

/** Bar: t = Unix seconds (bar open), a/y/d/k = open/high/low/close (bid), v = optional volume. */
export interface Mum { t: number; a: number; y: number; d: number; k: number; v?: number }

/** Strategy file (kalibre schema v1/v2). See docs/motor-kurallari.md and schema/strateji.schema.json. */
export type Strateji = Record<string, any>;

export interface Maliyet { spread?: number; kayma?: number; komisyonYuzde?: number }

export interface Enstruman {
  sozlesme?: number; tickBuyuklugu?: number; tickDegeri?: number; nokta?: number;
  lotAdimi?: number; minLot?: number; maxLot?: number;
  baz?: string; kote?: string; hesap?: string;
  donusum?: { t: number[]; k: number[] };
  komisyonLot?: number; swapLong?: number; swapShort?: number; ucluSwapGunu?: number;
  kaldirac?: number; teminatLot?: number; stopOut?: number;
}

export type DolumModeli = 'stop-once' | 'acilisa-yakin' | 'ohlc' | 'm1';

export interface ProvaAyar {
  baslangic?: number; maliyet?: Maliyet; girisBaslangic?: number; basamak?: number; miktarAdimi?: number;
  enstruman?: Enstruman; dolum?: DolumModeli; altMumlar?: Mum[];
}

export interface Islem {
  yon: 'long' | 'short'; girisI: number; giris: number; cikisI: number; cikis: number; neden: string;
  kar: number; r: number; komisyon: number; miktar: number; lot?: number; swap?: number;
}

export interface Istatistik {
  islem: number; kazanmaOrani: number; beklentiR: number; ortKazancR: number; ortKayipR: number;
  karFaktoru: number; getiriYuzde: number; maxDususYuzde: number; enUzunKayipSerisi: number;
}

export interface DolumRaporu { model: DolumModeli; belirsizMum: number; belirsizOran: number; altMumYok?: number }

export interface ProvaSonuc {
  islemler: Islem[]; ozkaynak: number[]; uyarilar: string[];
  maliyet: Required<Maliyet>; maliyetli: boolean; istatistik: Istatistik; dolum: DolumRaporu;
  enstruman?: { swapToplam: number; komisyonToplam: number; minLotAtlanan: number; teminatAtlanan: number; stopOut: number };
}

export interface Manifest {
  manifestVersion: 1; engineVersion: string; tur: string; seed: number | null;
  specHash: string; dataHash: string; configHash: string; resultId: string;
  bars: number; firstBar: number | null; lastBar: number | null;
}

export const MOTOR_SURUMU: string;
export function ceviriAyarla(fn: ((kaynak: string, degiskenler?: Record<string, unknown>) => string) | null): void;
export const ESIT_PAY: number;
export function fark(a: number, b: number): number;

export const MALIYETSIZ: Readonly<Required<Maliyet>>;
export const NOKTA: number;
export function maliyetVar(m?: Maliyet): boolean;
export function prova(s: Strateji, mumlar: Mum[], ayar?: ProvaAyar): ProvaSonuc;
export function istatistik(islemler: Islem[], ozkaynak: number[], baslangic: number): Istatistik;

export function calistir(s: Strateji, mumlar: Mum[], ayar?: ProvaAyar, secenek?: { seed?: number | null; ek?: unknown }): ProvaSonuc & { manifest: Manifest; resultId: string };
export function disaAktar(s: Strateji, ayar: ProvaAyar, sonuc: ProvaSonuc & { manifest: Manifest }): Record<string, unknown>;

export function kanonik(v: unknown): string;
export function sha256(girdi: string | Uint8Array): string;
export function veriOzeti(mumlar: Mum[]): string;
export function manifestOlustur(g: { strateji: Strateji; mumlar: Mum[]; ayar?: Record<string, unknown>; seed?: number | null; tur?: string; ek?: unknown }): Manifest;
export function kisaKimlik(id: string): string;
export function calistirmaPaketi(g: Record<string, unknown>): Record<string, unknown>;

export const ENSTRUMAN_VARSAYILAN: Readonly<Enstruman>;
export function enstrumanHazirla(e?: Enstruman | null): (Enstruman & { teminatVar: boolean }) | null;
export function kurFonksiyonu(e: Enstruman): (t: number, fiyat: number) => number;
export function lotYuvarla(ham: number, e: Enstruman): number;
export function teminat(e: Enstruman, lot: number, fiyat: number, kur: number): number;
export function tickDenetimi(e: Enstruman, fiyat: number, kur: number): { verilen: number; hesaplanan: number; oran: number } | null;

export const DOLUM_MODELLERI: DolumModeli[];
export function altMumAraliklari(mumlar: Mum[], altMumlar: Mum[]): [number, number][];
export function ilkVurus(model: DolumModeli, p: { yon: number; sl: number; tp: number }, m: Mum, sp: number, alt?: Mum[] | null): 'stop' | 'hedef' | null;

export function hesapla(gostergeler: Record<string, any>, mumlar: Mum[]): Record<string, Record<string, number[]>>;
export function sma(x: number[], p: number): number[];
export function ema(x: number[], p: number): number[];
export function rsi(k: number[], p: number): number[];
export function atr(m: Mum[], p: number): number[];
export function adx(m: Mum[], p: number): { ana: number[]; arti: number[]; eksi: number[] };
export function bb(k: number[], p: number, sapma: number): { orta: number[]; ust: number[]; alt: number[] };
export function macd(k: number[], hizli: number, yavas: number, sinyal: number): { ana: number[]; sinyal: number[] };
export function oran(seri: number[], n?: number): number[];
export function ewmaVol(k: number[], lambda?: number): number[];
export function garchVol(k: number[], s?: Record<string, unknown>): { ana: number[]; uzun: number[]; oran: number[] };
export const ORAN_PENCERE: number;

export function dogrula(s: Strateji): { yol: string; mesaj: string }[];
export function v2Ozellikleri(s: Strateji): string[];
export const ZAMAN_DILIMLERI: string[];
export const GOSTERGE_TIPLERI: string[];
export const OYNAKLIK: string[];
export const OPERATORLER: string[];
export const HATLAR: Record<string, string[]>;

export function parametreler(s: Strateji): any[];
export function ayarla(s: Strateji, yol: string, deger: number): Strateji;
export function degerler(a: { min: number; max: number; adim: number }): number[];
export function izgara(secilen: any[], s?: { sinir?: number; tohum?: number }): { ayarlar: number[][]; toplam: number; ornek: boolean };
export const OLCUTLER: Record<string, { deger: (i: any) => number; yon: number }>;
export function provaAralik(s: Strateji, mumlar: Mum[], bas: number, son: number, isinma?: number, maliyet?: Maliyet): ProvaSonuc & { mumlar: Mum[] };
export function propIhlali(ozkaynak: number[], mumlar: Mum[], k: { gunluk: number; azami: number; tur?: string }): { ihlal: boolean } & Record<string, unknown>;
export function deflatedSharpe(sharpeler: number[], en: Record<string, number>, N?: number): number | null;
export function tara(s: Strateji, mumlar: Mum[], secilen: any[], secenek?: Record<string, unknown>, ilerleme?: (i: number, n: number) => void): Promise<Record<string, any> & { manifest: Manifest; resultId: string }>;

export function beklenenEnBuyuk(N: number, varyans: number): number;
export function dsrCekirdek(g: { sr: number; T: number; carpiklik?: number; basiklik?: number; N: number; varyans: number }): Record<string, number> | null;
export function pboCscv(matris: number[][], s?: { S?: number; enCokKombinasyon?: number }): Record<string, any>;
export function pTek(sr: number, T: number): number;
export function duzeltilmisP(pler: number[], yontem: string, hedef?: number | null): number[] | number;
export function sharpeKirpma(sharpeler: number[], T: number, s?: { yontem?: string; hedef?: number | null }): Record<string, number> | null;
export function iskeletAnahtari(s: Strateji): string;
export function denemeSayaci(depo?: Storage | null): Record<string, (...a: any[]) => any>;

export function pencereler(T: number, s: { egitim: number; sinama: number; embargo?: number; tur?: 'kayan' | 'capali' }): { isBas: number; isSon: number; oosBas: number; oosSon: number }[];
export function yuruyenIleri(s: Strateji, mumlar: Mum[], secilen: any[], secenek?: Record<string, unknown>, ilerleme?: (i: number, n: number) => void): Promise<Record<string, any> & { manifest: Manifest; resultId: string }>;

export function phi(x: number): number;
export function phiTers(p: number): number;
export function rastgele(tohum: number): () => number;
export function uret(s?: { tohum?: number; rejim?: string; adet?: number; zamanDilimi?: string }): Mum[];
export const REJIMLER: Record<string, unknown>;
export function csvCoz(metin: string): { mumlar: Mum[]; atlanan: number };
export function parmakIzi(): { surum: string; parmakIzi: string; parcalar: Record<'temel' | 'oynaklik' | 'prova' | 'istatistik', string> };
