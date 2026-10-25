// Denge raporu: node tools/sim.js [oyun sayısı] [oyuncu sayısı]
import { playBotGame } from './simlib.js';
import { HEDEF } from '../src/engine/index.js';

const games = Number(process.argv[2] || 200);
const players = Number(process.argv[3] || 5);
const t0 = Date.now();

const winsBySeat = Array(players).fill(0);
const totals = [];
const spread = [];
let hedefTried = 0;
let hedefOk = 0;
const hedefStats = {};
const agg = { actions: 0, trades: 0, tradesAccepted: 0, kacak: 0, builds: 0, auctions: 0, konkordato: 0, rentTotal: 0, rentCount: 0, cards: {} };
const rentMaxes = [];
const endCash = [];

for (let g = 0; g < games; g++) {
  const { state, counts } = playBotGame(1000 + g, players);
  const { ranking, scores } = state.results;
  winsBySeat[ranking[0]]++;
  const sorted = scores.map((x) => x.total).sort((a, b) => b - a);
  totals.push(...sorted);
  spread.push(sorted[0] - sorted[sorted.length - 1]);
  for (const sc of scores) {
    const h = state.players[sc.p].hedef;
    hedefTried++;
    hedefStats[h] = hedefStats[h] || { n: 0, ok: 0 };
    hedefStats[h].n++;
    if (sc.hedefOk) {
      hedefOk++;
      hedefStats[h].ok++;
    }
  }
  for (const k of Object.keys(agg)) if (k !== 'cards') agg[k] += counts[k];
  rentMaxes.push(counts.rentMax);
  endCash.push(...scores.map((x) => x.nakit));
  for (const [c, n] of Object.entries(counts.cards)) agg.cards[c] = (agg.cards[c] || 0) + n;
}

const avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
const per = (n) => (n / games).toFixed(1);
console.log(`RANT denge raporu: ${games} oyun, ${players} bot, ${((Date.now() - t0) / 1000).toFixed(1)} sn`);
console.log(`Ortalama hamle/oyun: ${per(agg.actions)}`);
console.log(`Kazanma (oturma sırasına göre): ${winsBySeat.map((w, i) => `${i + 1}. ${Math.round((100 * w) / games)}%`).join('  ')}`);
console.log(`Ortalama puan: ${avg(totals)}  | Birinci-sonuncu farkı ort.: ${avg(spread)}`);
console.log(`Oyun başına: yasal kat ${per(agg.builds)}, kaçak kat ${per(agg.kacak)}, ihale ${per(agg.auctions)}, pazarlık ${per(agg.trades)} (kabul ${per(agg.tradesAccepted)}), konkordato ${per(agg.konkordato)}`);
console.log(`Kira: oyun başına ${per(agg.rentCount)} ödeme, ortalama ${Math.round(agg.rentTotal / agg.rentCount)}, oyundaki en büyük kira ort. ${avg(rentMaxes)} | Sondaki nakit ort. ${avg(endCash)}, en düşük %10: ${endCash.sort((a, b) => a - b)[Math.floor(endCash.length / 10)]}`);
console.log(`Hedef tutturma: %${Math.round((100 * hedefOk) / hedefTried)}`);
console.log(
  '  ' +
    Object.entries(hedefStats)
      .sort((a, b) => b[1].ok / b[1].n - a[1].ok / a[1].n)
      .map(([h, v]) => `${HEDEF[h].name} %${Math.round((100 * v.ok) / v.n)} (${v.n})`)
      .join(', '),
);
console.log(`Kart kullanımı/oyun: ${Object.entries(agg.cards).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${per(n)}`).join(', ')}`);
