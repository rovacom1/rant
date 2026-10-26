import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAWN, laneTop, pawnXs } from '../src/ui/slots.js';

test('piyonlar karenin ustunde durur, alt sirada seridin altinda', () => {
  assert.equal(laneTop('b', 76), 11);
  assert.equal(laneTop('t', 76), 2);
  assert.equal(laneTop('c', 76), 2);
  assert.equal(Math.round(76 * PAWN), 36, '76 px karede piyon 36 px');
});

test('ayni karedeki piyonlar yan yana dizilir, kareden tasmaz, ortalidir', () => {
  const cw = 101;
  const s = 36;
  assert.deepEqual(pawnXs(1, cw, s), [33]);
  for (let n = 2; n <= 6; n++) {
    const xs = pawnXs(n, cw, s);
    assert.equal(xs.length, n);
    for (let k = 1; k < n; k++) assert.ok(xs[k] > xs[k - 1]);
    assert.ok(xs[0] >= 3 && xs[n - 1] + s <= cw - 3, `${n} piyon kareye sigmali`);
    assert.ok(Math.abs(xs[0] + xs[n - 1] + s - cw) <= 1, 'ortali');
  }
});
