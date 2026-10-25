import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOKEN, laneY, tokenSlots } from '../src/ui/slots.js';

test('taslar kare adini kapatmayan kenarda durur', () => {
  assert.equal(laneY('b', false), 0.85); // alt sira: serit ustte, taslar altta
  assert.equal(laneY('t', false), 0.15); // ust sira: serit altta, taslar ustte
  assert.equal(laneY('l', false), 0.85);
  assert.equal(laneY('c', true), 0.3); // resimli karede ad altta, taslar ustte
});

test('ayni karedeki taslar yan yana dizilir, kareden tasmaz', () => {
  assert.deepEqual(tokenSlots(1, 0.85), [{ x: 0.5, y: 0.85 }]);
  for (let n = 2; n <= 5; n++) {
    const s = tokenSlots(n, 0.85);
    assert.equal(s.length, n);
    for (let k = 1; k < n; k++) assert.ok(s[k].x > s[k - 1].x);
    assert.ok(s[0].x - TOKEN / 2 >= 0.019 && s[n - 1].x + TOKEN / 2 <= 0.981, `${n} tas kareye sigmali`);
    assert.ok(Math.abs(s[0].x + s[n - 1].x - 1) < 1e-9, 'ortali');
  }
  const two = tokenSlots(2, 0.85);
  assert.ok(two[1].x - two[0].x >= TOKEN, 'iki tas ust uste binmez');
});
