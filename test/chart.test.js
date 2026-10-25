import { test } from 'node:test';
import assert from 'node:assert/strict';
import { worthLines } from '../src/ui/chart.js';

test('net deger cizgisi: her oyuncuya bir cizgi, tur basina bir nokta', () => {
  const c = worthLines([[1500, 1500], [1800, 1200], [2000, 900]], 100, 50, 0);
  assert.equal(c.lines.length, 2);
  assert.equal(c.rounds, 2);
  assert.equal(c.hi, 2000);
  assert.equal(c.lo, 0);
  assert.equal(c.lines[0], '0,12.5 50,5 100,0');
  assert.equal(c.zero, 50);
});

test('eksi deger sifir cizgisinin altina iner, tek nokta grafik cizmez', () => {
  const c = worthLines([[100, 100], [-100, 300]], 100, 40, 0);
  assert.equal(c.lo, -100);
  assert.equal(c.zero, 30);
  assert.equal(c.lines[0].split(' ')[1], '100,40');
  assert.equal(worthLines([[1500, 1500]], 100, 40), null);
  assert.equal(worthLines(undefined, 100, 40), null);
});
