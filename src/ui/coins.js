// Para animasyonu için saf yardımcılar: hangi para olayı kaç jetonla, ne zaman uçar.
export const MAX_FLIGHTS = 6;
export const FLIGHT_GAP = 260; // ms, art arda uçuşlar arası
export const COIN_GAP = 70; // ms, bir uçuştaki jetonlar arası

// Tutar büyüdükçe jeton artar: 1-100 ₺ tek jeton, 500 ₺ ve üstü 6 jeton.
export function coinCount(amount) {
  return Math.max(1, Math.min(6, Math.ceil(amount / 100)));
}

// Para olaylarından uçuş listesi (from/to null ise banka, yani tahtanın ortası).
export function coinFlights(events) {
  return events
    .filter((e) => e.type === 'money' && e.amount > 0 && (e.from !== null || e.to !== null))
    .slice(0, MAX_FLIGHTS)
    .map((e, i) => ({ from: e.from, to: e.to, amount: e.amount, n: coinCount(e.amount), delay: i * FLIGHT_GAP }));
}

// İki nokta arasında yukarı kavisli yolun tepe noktası (mesafeyle orantılı, en az 40 px; ekranın üstünden taşmaz).
export function arcPeak(a, b, top = 16) {
  const lift = Math.max(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.3);
  return { x: (a.x + b.x) / 2, y: Math.max(top, Math.min(a.y, b.y) - lift) };
}
