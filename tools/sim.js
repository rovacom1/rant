// Denge raporu: node tools/sim.js [oyun sayısı] [oyuncu sayısı] [seviye] [oyun türü]
// Seviye verilirse (kolay/zor) her oyunda bir bot o seviyede oynar (koltuğu oyundan oyuna döner), diğerleri normal.
// Oyun türü: klasik (varsayılan) ya da mahalle, örnek: node tools/sim.js 200 5 mahalle.
// Seçenekler: --tur=N (tur sayısı), --hedef=N (değer hedefi), --iflas (son kalan modu).
import { playBotGame } from './simlib.js';
import { GAME_MODES, MAHALLE } from '../src/engine/index.js';

const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const mode = positional.find((a) => GAME_MODES.includes(a)) || 'klasik';
const [gamesArg, playersArg, level] = positional.filter((a) => !GAME_MODES.includes(a));
const games = Number(gamesArg || 200);
const players = Number(playersArg || 5);
const config = mode === 'klasik' ? {} : { mode };
// Sayı denemesi: --mahalle=rent:2,torpilEvery:6 Mahalle sayılarını (data.js MAHALLE) bu çalıştırma için değiştirir.
if (flags.mahalle) for (const kv of flags.mahalle.split(',')) MAHALLE[kv.split(':')[0]] = Number(kv.split(':')[1]);
if (flags.tur) config.maxRounds = Number(flags.tur);
if (flags.hedef) config.targetScore = Number(flags.hedef);
if ('iflas' in flags) config.iflas = true;
let levelWins = 0;
const t0 = Date.now();

const winsBySeat = Array(players).fill(0);
const totals = [];
const spread = [];
const agg = { actions: 0, trades: 0, tradesAccepted: 0, kacak: 0, builds: 0, auctions: 0, konkordato: 0, rentTotal: 0, rentCount: 0, drawn: 0, salary: 0, turns: 0, dupTurns: 0, setless: 0, gecekondu: 0, park: 0, avm: 0, torpil: 0, tahliye: 0, avmPay: 0, cards: {} };
const used = { gecekondu: 0, park: 0, avm: 0 }; // en az bir kez kullanılan oyun sayısı
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
  for (const k of Object.keys(used)) if (counts[k]) used[k]++;
  for (const [c, n] of Object.entries(counts.cards)) agg.cards[c] = (agg.cards[c] || 0) + n;
}

const avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
const per = (n) => (n / games).toFixed(1);
console.log(`Rantçı Dayı denge raporu${mode === 'klasik' ? '' : ` (${mode})`}: ${games} oyun, ${players} bot, ${((Date.now() - t0) / 1000).toFixed(1)} sn`);
console.log(`Ortalama hamle/oyun: ${per(agg.actions)}`);
console.log(`Kazanma (oturma sırasına göre): ${winsBySeat.map((w, i) => `${i + 1}. ${Math.round((100 * w) / games)}%`).join('  ')}`);
if (level) console.log(`${level} bot kazanma: %${Math.round((100 * levelWins) / games)} (eşit şans %${Math.round(100 / players)})`);
console.log(`Ortalama puan: ${avg(totals)}  | Birinci-sonuncu farkı ort.: ${avg(spread)}`);
console.log(`Oyun başına: yasal kat ${per(agg.builds)}, kaçak kat ${per(agg.kacak)}, ihale ${per(agg.auctions)}, pazarlık ${per(agg.trades)} (kabul ${per(agg.tradesAccepted)}), konkordato ${per(agg.konkordato)}`);
console.log(`Kira: oyun başına ${per(agg.rentCount)} ödeme, ortalama ${Math.round(agg.rentTotal / agg.rentCount)}, oyundaki en büyük kira ort. ${avg(rentMaxes)} | Sondaki nakit ort. ${avg(endCash)}, en düşük %10: ${endCash.sort((a, b) => a - b)[Math.floor(endCash.length / 10)]}`);
console.log(`Tur ort. ${(rounds.reduce((a, b) => a + b, 0) / games).toFixed(1)} | Oyuncu başı çekilen kart ${(agg.drawn / games / players).toFixed(1)} | Elde aynı türden iki kart: sıraların %${Math.round((100 * agg.dupTurns) / agg.turns)} | Kira/maaş ${(agg.rentTotal / agg.salary).toFixed(2)} | Hiç seti olmayan oyuncu %${Math.round((100 * agg.setless) / games / players)}`);
console.log(`Kart kullanımı/oyun: ${Object.entries(agg.cards).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${per(n)}`).join(', ')}`);
if (mode === 'mahalle') {
  const pct = (n) => `%${Math.round((100 * n) / games)}`;
  console.log(`Mahalle/oyun: gecekondu ${per(agg.gecekondu)} (tahliye ${per(agg.tahliye)}), park ${per(agg.park)}, AVM ${per(agg.avm)} (pay ${per(agg.avmPay)}), torpil ${per(agg.torpil)} | Kullanılan oyun: gecekondu ${pct(used.gecekondu)}, park ${pct(used.park)}, AVM ${pct(used.avm)}`);
}
