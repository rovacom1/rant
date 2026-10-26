import { test } from 'node:test';
import assert from 'node:assert/strict';
import { viewFor } from '../src/engine/index.js';
import { started, act, actEv, give, strip, stripAll, own } from './helpers.js';

// Gündem etkisiz, herkes 1500 nakitle.
function calm(s) {
  Object.assign(s, { index: 100, mods: {}, groupMult: {}, salary: 200 });
  for (const pl of s.players) pl.cash = 1500;
  return s;
}
const fresh = () => calm(started(4, 42, { rules: { surpriz: false } }));
const st = (s, p) => s.players[p].stats;
const taksi = (s, p, steps) => act(s, p, { type: 'playCard', uid: give(s, p, 'taksi'), target: { steps } });

test('sayaçlar sıfırla başlar ve görünümde herkese gider', () => {
  const s = fresh();
  assert.deepEqual(st(s, 0), { kacak: 0, ihale: 0, dava: 0, gasp: 0, yikim: 0, kira: 0 });
  assert.deepEqual(viewFor(s, 1).players[0].stats, st(s, 0));
});

test('kaçak kat, ihbar ve zabıta yıkımı katı sayılır', () => {
  let s = fresh();
  own(s, 0, 24, 26);
  s = act(s, 0, { type: 'buildKacak', sq: 24 });
  s = act(s, 0, { type: 'buildKacak', sq: 26 });
  assert.equal(st(s, 0).kacak, 2);
  s.turn = { ...s.turn, p: 1, hamle: false };
  stripAll(s, 'itiraz');
  s = act(s, 1, { type: 'playCard', uid: give(s, 1, 'ihbar'), target: { player: 0 } });
  assert.equal(st(s, 1).yikim, 2, 'iki kat yıkıldı');
  s.props[24].kacak = 1;
  s.pending = { type: 'zabita', p: 2, options: [0] };
  s = act(s, 2, { type: 'zabitaTarget', target: 0 });
  assert.equal(st(s, 2).yikim, 1);
  assert.equal(st(s, 0).yikim, 0);
});

test('ihale yalnız mülkü alana sayılır', () => {
  let s = fresh();
  s = taksi(s, 0, 2);
  s = act(s, 0, { type: 'decline' });
  s = act(s, 1, { type: 'raise', amount: 40 });
  for (const p of [2, 3, 0]) s = act(s, p, { type: 'pass' });
  assert.equal(s.props[2].owner, 1);
  assert.deepEqual([0, 1, 2, 3].map((p) => st(s, p).ihale), [0, 1, 0, 0]);
});

test('davayı kazanan sayılır', () => {
  const s = fresh();
  stripAll(s, 'itiraz');
  const { state, events } = actEv(s, 0, { type: 'playCard', uid: give(s, 0, 'dava'), target: { player: 1 } });
  const ev = events.find((e) => e.type === 'dava');
  const win = ev.dice[0] > ev.dice[1] ? 0 : 1;
  assert.equal(st(state, win).dava, 1);
  assert.equal(st(state, 1 - win).dava, 0);
});

test('kamulaştırma ve takas sayılır, itirazla düşen sayılmaz', () => {
  let s = fresh();
  own(s, 1, 5);
  stripAll(s, 'itiraz');
  s = act(s, 0, { type: 'playCard', uid: give(s, 0, 'kamulastirma'), target: { sq: 5 } });
  assert.equal(st(s, 0).gasp, 1);

  s = fresh();
  own(s, 0, 1);
  own(s, 1, 6);
  stripAll(s, 'itiraz');
  s = act(s, 0, { type: 'playCard', uid: give(s, 0, 'takas'), target: { mine: 1, theirs: 6 } });
  assert.equal(s.props[6].owner, 0);
  assert.equal(st(s, 0).gasp, 1);

  s = fresh();
  own(s, 1, 5);
  stripAll(s, 'itiraz');
  const it = give(s, 1, 'itiraz');
  s = act(s, 0, { type: 'playCard', uid: give(s, 0, 'kamulastirma'), target: { sq: 5 } });
  s = act(s, 1, { type: 'react', uid: it });
  assert.equal(s.props[5].owner, 1);
  assert.equal(st(s, 0).gasp, 0);
});

test('kira alınan tutar toplanır; Dayın Çıktı ile sayılmaz', () => {
  let s = fresh();
  own(s, 1, 5);
  stripAll(s, 'dayi');
  s.players[1].kiraZammi = true;
  s = taksi(s, 0, 5);
  assert.equal(st(s, 1).kira, 10, 'zamlı kira');

  s = fresh();
  own(s, 1, 5);
  const dayi = give(s, 0, 'dayi');
  s = taksi(s, 0, 5);
  s = act(s, 0, { type: 'react', uid: dayi });
  assert.equal(st(s, 1).kira, 0);
});

test('eski kayıtta stats yoksa sayaç çökmeden açılır', () => {
  let s = fresh();
  own(s, 0, 24);
  for (const pl of s.players) delete pl.stats;
  strip(s, 0, 'itiraz');
  s = act(s, 0, { type: 'buildKacak', sq: 24 });
  assert.deepEqual(st(s, 0), { kacak: 1, ihale: 0, dava: 0, gasp: 0, yikim: 0, kira: 0 });
});
