// Ekranlar arası eşzamanlama (tasks/mobil-kalite-plani.md 1). Ev sahibi her durumu, kendi saatiyle "at" anında
// oynatılsın diye yollar (net/host.js LEAD). İstemci saat farkını ölçer, o ana kadar bekler; geç kaldıysa kalan
// efektleri hızlandırır, çok geride kaldıysa son duruma atlar. DOM yok, saf yardımcılar.

export const MAX_RUSH = 2; // geç kalan ekran en çok bu kat hızlı oynar
export const PILE = 3; // bu kadar durum birikirse aradakiler oynatılmaz, son duruma geçilir
const KEEP = 8; // son kaç saat ölçümü tutulur

// Saat ölçümü: istemci c anında sordu, ev sahibi h dedi, cevap now anında geldi. Yol iki yönde eşit sayılır.
export function addSample(samples, c, h, now) {
  const rtt = Math.max(0, now - c);
  samples.push({ rtt, off: h + rtt / 2 - now });
  if (samples.length > KEEP) samples.shift();
}

// Ev sahibinin saati ile bu cihazınki arasındaki fark (ms): gidiş-dönüşü en kısa ölçüm en güvenilirdir. lb, son durum
// mesajından alt sınır (gönderildiği an - geldiği an; gecikme eksi olamaz). Ölçüm yoksa alt sınır kullanılır.
export function clockOffset(samples, lb = -Infinity) {
  const best = samples.reduce((a, s) => (!a || s.rtt < a.rtt ? s : a), null);
  const off = best ? Math.max(best.off, lb) : lb;
  return Number.isFinite(off) ? Math.round(off) : 0;
}

// late ms geç başlayan ekran, budget ms'lik efektleri kalan sürede bitirmek için kaç kat hızlı oynar (1..MAX_RUSH).
export function rushFor(late, budget) {
  if (late <= 0 || budget <= 0) return 1;
  return Math.min(MAX_RUSH, budget / Math.max(1, budget - late));
}
