import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coinCount, coinFlights, coinsFor, moneyTier, arcPeak, MAX_FLIGHTS, FLIGHT_GAP } from '../src/ui/coins.js';
import { BIG_RENT } from '../src/ui/dayisay.js';

test('jeton sayisi tutarla artar, 1-6 arasinda kalir', () => {
  assert.equal(coinCount(10), 1);
  assert.equal(coinCount(100), 1);
  assert.equal(coinCount(101), 2);
  assert.equal(coinCount(350), 4);
  assert.equal(coinCount(5000), 6);
});

test('yalniz para olaylari ucar, sirayla ve sinirli sayida', () => {
  const money = (from, to, amount) => ({ type: 'money', from, to, amount });
  const evs = [{ type: 'move' }, money(0, 1, 250), money(2, null, 50), money(null, 3, 200), money(1, 1, 0)];
  assert.deepEqual(coinFlights(evs), [
    { from: 0, to: 1, amount: 250, tier: 'small', n: 3, delay: 0 },
    { from: 2, to: null, amount: 50, tier: 'small', n: 1, delay: FLIGHT_GAP },
    { from: null, to: 3, amount: 200, tier: 'small', n: 2, delay: 2 * FLIGHT_GAP },
  ]);
  const many = Array.from({ length: 10 }, () => money(0, 1, 10));
  assert.equal(coinFlights(many).length, MAX_FLIGHTS);
});

test('kademe: maas kucuk, kira orta, buyuk kira buyuk; jeton sayisi kademeyle ayrisir', () => {
  const maas = { type: 'money', from: null, to: 0, amount: 200, why: 'Maaş' };
  const kira = { type: 'money', from: 1, to: 0, amount: 120, why: 'Kira: Konya' };
  const buyuk = { ...kira, amount: BIG_RENT };
  assert.equal(moneyTier(maas), 'small');
  assert.equal(moneyTier(kira), 'medium');
  assert.equal(moneyTier(buyuk), 'big');
  assert.equal(moneyTier({ ...kira, from: null }), 'small', 'bankadan gelen kira degil');
  assert.ok(coinsFor('small', 5000) <= 3);
  assert.ok(coinsFor('medium', 10) >= 5 && coinsFor('medium', 5000) <= 8);
  assert.ok(coinsFor('big', BIG_RENT) > coinsFor('medium', 5000));
});

test('jeton yolu iki noktanin ustunden kavis cizer', () => {
  const p = arcPeak({ x: 0, y: 300 }, { x: 200, y: 250 });
  assert.equal(p.x, 100);
  assert.ok(p.y < 250 - 39);
  assert.equal(arcPeak({ x: 0, y: 100 }, { x: 10, y: 100 }).y, 60);
  assert.equal(arcPeak({ x: 0, y: 30 }, { x: 900, y: 300 }).y, 16); // ustteki koltuktan cikan jeton ekrandan tasmaz
});
