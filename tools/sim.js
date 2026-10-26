// Denge raporu: node tools/sim.js [oyun sayısı] [oyuncu sayısı] [seviye]
// Seviye verilirse (kolay/zor) her oyunda bir bot o seviyede oynar (koltuğu oyundan oyuna döner), diğerleri normal.
// Seçenekler: --tur=N (tur sayısı), --hedef=N (değer hedefi), --iflas (son kalan modu).
import { playBotGame } from './simlib.js';

const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const [gamesArg, playersArg, level] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const games = Number(gamesArg || 200);
const players = Number(playersArg || 5);
const config = {};
if (flags.tur) config.maxRounds = Number(flags.tur);
if (flags.hedef) config.targetScore = Number(flags.hedef);
if ('iflas' in flags) config.iflas = true;
let levelWins = 0;
const t0 = Date.now();

const winsBySeat = Array(players).fill(0);
const totals = [];
const spread = [];
const agg = { actions: 0, trades: 0, tradesAccepted: 0, kacak: 0, builds: 0, auctions: 0, konkordato: 0, rentTotal: 0, rentCount: 0, drawn: 0, salary: 0, turns: 0, dupTurns: 0, setless: 0, cards: {} };
const rounds = [];
const rentMaxes = [];
const endCash = [];

for (let g = 0; g < games; g++) {
  const levels = level ? Object.assign([], { [g % players]: level }) : [];
  const { state, counts } = playBotGame(1000 + g, players, config, levels);
  rounds.push(state.round);
  const { ranking, scores } = state.results;
  winsBySeat[ranking[0]]++;
  if (level && ranking[0] === g % players) levelWins++;
  const sorted = scores.map((x) => x.total).sort((a, b) => b - a);
  totals.push(...sorted);
  spread.push(sorted[0] - sorted[sorted.length - 1]);
  for (const k of Object.keys(agg)) if (k !== 'cards') agg[k] += counts[k];
  rentMaxes.push(counts.rentMax);
  endCash.push(...scores.map((x) => x.nakit));
  for (const [c, n] of Object.entries(counts.cards)) agg.cards[c] = (agg.cards[c] || 0) + n;
}

const avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
const per = (n) => (n / games).toFixed(1);
console.log(`Rantçı Dayı denge raporu: ${games} oyun, ${players} bot, ${((Date.now() - t0) / 1000).toFixed(1)} sn`);
console.log(`Ortalama hamle/oyun: ${per(agg.actions)}`);
console.log(`Kazanma (oturma sırasına göre): ${winsBySeat.map((w, i) => `${i + 1}. ${Math.round((100 * w) / games)}%`).join('  ')}`);
if (level) console.log(`${level} bot kazanma: %${Math.round((100 * levelWins) / games)} (eşit şans %${Math.round(100 / players)})`);
console.log(`Ortalama puan: ${avg(totals)}  | Birinci-sonuncu farkı ort.: ${avg(spread)}`);
console.log(`Oyun başına: yasal kat ${per(agg.builds)}, kaçak kat ${per(agg.kacak)}, ihale ${per(agg.auctions)}, pazarlık ${per(agg.trades)} (kabul ${per(agg.tradesAccepted)}), konkordato ${per(agg.konkordato)}`);
console.log(`Kira: oyun başına ${per(agg.rentCount)} ödeme, ortalama ${Math.round(agg.rentTotal / agg.rentCount)}, oyundaki en büyük kira ort. ${avg(rentMaxes)} | Sondaki nakit ort. ${avg(endCash)}, en düşük %10: ${endCash.sort((a, b) => a - b)[Math.floor(endCash.length / 10)]}`);
console.log(`Tur ort. ${(rounds.reduce((a, b) => a + b, 0) / games).toFixed(1)} | Oyuncu başı çekilen kart ${(agg.drawn / games / players).toFixed(1)} | Elde aynı türden iki kart: sıraların %${Math.round((100 * agg.dupTurns) / agg.turns)} | Kira/maaş ${(agg.rentTotal / agg.salary).toFixed(2)} | Hiç seti olmayan oyuncu %${Math.round((100 * agg.setless) / games / players)}`);
console.log(`Kart kullanımı/oyun: ${Object.entries(agg.cards).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${per(n)}`).join(', ')}`);
