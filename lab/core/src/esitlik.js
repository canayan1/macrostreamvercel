// Karşılaştırmada eşitlik payı: |a − b| ≤ ESIT_PAY × max(1, |a|, |b|) ise iki değer eşit sayılır.
// Neden: matematikte eşit iki ortalama (ör. SMA20 = SMA50) farklı toplama sırasıyla 1e-15 kadar
// ayrışır ve kesişme bir mum erken ya da geç görünür (aşama C, GBPUSD H1). MQL5 Motor
// (Kalibre/Strateji.mqh) aynı payı kullanır; böylece iki motor eşitlikte aynı kararı verir.
export const ESIT_PAY = 1e-10;
export function fark(a, b) {
  const d = a - b;
  return Math.abs(d) <= ESIT_PAY * Math.max(1, Math.abs(a), Math.abs(b)) ? 0 : d;
}
