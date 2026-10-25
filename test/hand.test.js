import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitGrid } from '../src/ui/hand.js';

test('el ızgarası: yer varken kartlar tam boy, satırlar dengeli', () => {
  assert.deepEqual(fitGrid(5, 460, 600), { cols: 3, w: 128 });
  assert.deepEqual(fitGrid(4, 460, 600), { cols: 2, w: 128 });
  assert.deepEqual(fitGrid(0, 460, 600), { cols: 1, w: 128 });
});

test('el ızgarası: dar yerde kart küçülür ama alana sığar', () => {
  assert.deepEqual(fitGrid(6, 460, 180), { cols: 6, w: 70 });
  for (let n = 1; n <= 7; n++) {
    for (const [w, h] of [[340, 120], [460, 180], [460, 290], [380, 500], [480, 800]]) {
      const g = fitGrid(n, w, h);
      const rows = Math.ceil(n / g.cols);
      assert.ok(g.cols * g.w + (g.cols - 1) * 8 <= w, `${n} kart ${w}x${h}: genişlik`);
      assert.ok(rows * g.w * 1.42 + (rows - 1) * 8 <= h + 1, `${n} kart ${w}x${h}: yükseklik`);
    }
  }
});

test('el ızgarası: dar ekranda yalnız genişliğe bakılır, kart 100 pikselden küçülmez', () => {
  assert.deepEqual(fitGrid(5, 800, 0), { cols: 5, w: 128 });
  assert.deepEqual(fitGrid(6, 340, 0), { cols: 3, w: 108 });
});
