import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paceOf, PACE } from '../src/net/host.js';
import { COINS, FLIGHT_GAP, MAX_FLIGHTS } from '../src/ui/coins.js';
import { addSample, clockOffset, rushFor, MAX_RUSH } from '../src/ui/sync.js';

// boardfx.js ses modülünü yükler; o da sayfaya dinleyici bağlar. Zaman çizelgelerini okumak için boş sayfa yeter.
globalThis.window ??= { addEventListener() {}, matchMedia: () => ({ matches: false }) };
globalThis.document ??= { addEventListener() {}, hidden: true };
const { T, CALL } = await import('../src/ui/boardfx.js');
const { SHAKE, FREEZE, BIG_TAIL } = await import('../src/ui/fx.js');
const { LAND } = await import('../src/ui/sprite.js');

// Her efektin istemcide normal hızda ne kadar sürdüğü (ms), gameview.js present ve boardfx.js çizelgelerine göre.
// Ev sahibi bir sonraki hamleyi paceOf kadar bekler; efekt ondan uzun sürerse ekranlar arası fark birikir.
// Dayı balonu ve uçan "+120" sayıları okuma etiketidir, sonraki duruma engel olmaz; bütçeye girmez.
const money = (n) => Array.from({ length: n }, () => ({ type: 'money', amount: 600 }));
const coinsMs = (c) => (c.max - 1) * c.gap + T.flight; // bir uçuşun bütün jetonları
const flights = (n) => (Math.min(n, MAX_FLIGHTS) - 1) * FLIGHT_GAP + Math.max(coinsMs(COINS.small), coinsMs(COINS.medium));
// Büyük kira: ilk jeton konunca donma ve sarsıntı; sağanağın son jetonu donma kadar geç konar.
const bigRent = Math.max(T.flight * LAND + BIG_TAIL, coinsMs(COINS.big) + FREEZE);
const own = T.own.ms + T.set.ms; // mülk ve tamamlanan setin parıltısı
const EFFECTS = [
  ['zar', [{ type: 'dice' }], PACE.dice],
  ['yürüyüş (7 kare)', [{ type: 'move', path: [1, 2, 3, 4, 5, 6, 7] }], PACE.step * 7 + Math.round(PACE.step * 0.8)],
  ['dava düellosu', [{ type: 'dava' }], PACE.dice + PACE.card],
  ['sürpriz', [{ type: 'surpriz' }], PACE.surpriz],
  ['rakibin kartı', [{ type: 'card' }], PACE.card],
  ['itirazla düşen kart', [{ type: 'card' }, { type: 'log' }], PACE.card],
  ['haber', [{ type: 'gundem' }], PACE.news],
  ['haber ve özet', [{ type: 'summary' }, { type: 'gundem' }], PACE.newsSum],
  ['tur başı', [{ type: 'turn' }], T.turn.ms],
  ['kat dikme', [{ type: 'build' }], T.build.ms],
  ['mülk alma ve set', [{ type: 'own' }], own],
  ['ihale: Satıldı', [{ type: 'auction', winner: 0 }], 2 * CALL.beat + CALL.lead + CALL.hold],
  ['ihale: şerit ve set', [{ type: 'auction', winner: 0 }], Math.max(0, 2 * CALL.beat + CALL.lead - T.own.draw) + own],
  ['pazarlık anlaşması', [{ type: 'tradeDone' }], Math.max(PACE.card, own)],
  ['yıkım', [{ type: 'demolish' }], Math.max(T.demolish.ms, T.demolish.burst + BIG_TAIL) + FREEZE],
  ['iflas', [{ type: 'iflas' }], Math.max(T.iflas.ms + FREEZE, T.iflas.fall + BIG_TAIL)],
  ['büyük kira (donma, sarsıntı)', money(1), bigRent],
  ...[1, 2, 3, 6, 8].map((n) => [`${n} para hareketi`, money(n), flights(n)]),
];

for (const [name, events, ms] of EFFECTS) {
  test(`efekt bütçeye sığar: ${name}`, () => {
    assert.ok(ms <= paceOf(events), `${name}: ${ms} ms > paceOf ${paceOf(events)} ms`);
  });
}

test('donma kısa, büyük an sarsıntıyla birlikte', () => {
  assert.ok(FREEZE <= 120, 'donma en çok 120 ms');
  assert.equal(BIG_TAIL, FREEZE + SHAKE.ms);
});

test('jeton uçuşu ev sahibinde ve tahtada aynı süre', () => {
  assert.equal(PACE.flight, T.flight);
  assert.ok(PACE.roll <= PACE.dice, 'zar dönüşü atış bütçesinin içinde');
});

test('saat farkı en kısa gidiş-dönüşlü ölçümden, mesaj alt sınırıyla', () => {
  const s = [];
  addSample(s, 1000, 6400, 1600); // gidiş-dönüş 600: fark 6400 + 300 - 1600 = 5100
  addSample(s, 2000, 7090, 2200); // gidiş-dönüş 200: fark 7090 + 100 - 2200 = 4990
  assert.equal(clockOffset(s), 7090 + 100 - 2200);
  assert.equal(clockOffset(s, 5000), 5000, 'mesaj gönderildiğinden önce gelemez');
  assert.equal(clockOffset([], 120), 120);
  assert.equal(clockOffset([]), 0);
  for (let i = 0; i < 20; i++) addSample(s, i, i, i + 900);
  assert.ok(s.length <= 8, 'eski ölçümler düşer');
});

test('geç kalan kalan sürede yetişir, en çok 2 kat', () => {
  assert.equal(rushFor(0, 3000), 1);
  assert.equal(rushFor(-50, 3000), 1);
  assert.equal(rushFor(100, 0), 1, 'efektsiz durum beklemez');
  assert.equal(rushFor(1000, 3000), 1.5);
  assert.equal(rushFor(2900, 3000), MAX_RUSH);
  assert.equal(rushFor(9000, 3000), MAX_RUSH);
});
