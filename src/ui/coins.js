// Para animasyonu için saf yardımcılar: hangi para olayı hangi kademede (fx.js), kaç jetonla, ne zaman uçar.
import { BIG_RENT } from './dayisay.js';

export const MAX_FLIGHTS = 6;
export const FLIGHT_GAP = 260; // ms, art arda uçuşlar arası
export const COIN_GAP = 70; // ms, bir uçuştaki jetonlar arası (küçük kademe)

// Kademe başına jeton: aralık (ms), boy çarpanı, tepe noktasında yayılma (px). Büyük kirada jetonlar sağanak gibi açılır.
export const COINS = {
  small: { max: 3, gap: COIN_GAP, size: 0.85, spread: 0 },
  medium: { max: 8, gap: 60, size: 1, spread: 0 },
  big: { max: 18, gap: 16, size: 1.2, spread: 26 },
};

// Tutar büyüdükçe jeton artar: 1-100 ₺ tek jeton, 500 ₺ ve üstü 6 jeton.
export function coinCount(amount) {
  return Math.max(1, Math.min(6, Math.ceil(amount / 100)));
}

// Para olayının kademesi: iki oyuncu arasındaki kira orta, en az BIG_RENT'lik kira büyük; maaş ve öteki para küçük.
export function moneyTier(e) {
  if (/^Kira/.test(e.why || '') && e.from !== null && e.to !== null) return e.amount >= BIG_RENT ? 'big' : 'medium';
  return 'small';
}

// Kademe ve tutara göre jeton sayısı: küçük 1-3, orta 5-8, büyük 18.
export function coinsFor(tier, amount) {
  if (tier === 'big') return COINS.big.max;
  if (tier === 'medium') return Math.min(COINS.medium.max, 4 + coinCount(amount));
  return Math.min(COINS.small.max, coinCount(amount));
}

// Para olaylarından uçuş listesi (from/to null ise banka, yani tahtanın ortası).
export function coinFlights(events) {
  return events
    .filter((e) => e.type === 'money' && e.amount > 0 && (e.from !== null || e.to !== null))
    .slice(0, MAX_FLIGHTS)
    .map((e, i) => {
      const tier = moneyTier(e);
      return { from: e.from, to: e.to, amount: e.amount, tier, n: coinsFor(tier, e.amount), delay: i * FLIGHT_GAP };
    });
}

// İki nokta arasında yukarı kavisli yolun tepe noktası (mesafeyle orantılı, en az 40 px; ekranın üstünden taşmaz).
export function arcPeak(a, b, top = 16) {
  const lift = Math.max(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.3);
  return { x: (a.x + b.x) / 2, y: Math.max(top, Math.min(a.y, b.y) - lift) };
}
