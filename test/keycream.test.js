import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyCream } from '../tools/keycream.js';

// Krem zemin üstünde lacivert çizgili küçük bir sahne: küçük kapalı krem (göz akı) ve büyük kapalı krem (tespih halkası içi).
const N = 60;
const CREAM = [243, 236, 200];
const NAVY = [27, 34, 51];
function scene() {
  const p = new Uint8ClampedArray(N * N * 4);
  const set = (x, y, c) => p.set([...c, 255], (y * N + x) * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) set(x, y, CREAM);
  const box = (x0, y0, x1, y1) => {
    for (let x = x0; x <= x1; x++) set(x, y0, NAVY), set(x, y1, NAVY);
    for (let y = y0; y <= y1; y++) set(x0, y, NAVY), set(x1, y, NAVY);
  };
  box(10, 10, 14, 14); // içi 3x3 krem: göz akı
  box(30, 30, 55, 55); // içi 24x24 krem: halka içi
  set(20, 20, [220, 215, 180]); // zemine yakın çizgi kenarı
  return p;
}
const alpha = (p, x, y) => p[(y * N + x) * 4 + 3];

test('kenara degen krem zemin silinir, cizgi kalir', () => {
  const p = scene();
  keyCream(p, N, 20);
  assert.equal(alpha(p, 0, 0), 0);
  assert.equal(alpha(p, 25, 5), 0);
  assert.equal(alpha(p, 10, 10), 255, 'lacivert cizgi');
});

test('kucuk kapali krem (goz aki) kalir, buyuk kapali krem silinir', () => {
  const p = scene();
  keyCream(p, N, 20);
  assert.equal(alpha(p, 12, 12), 255, 'goz aki');
  assert.equal(alpha(p, 42, 42), 0, 'halka ici');
});

test('zemine yakin kenar pikseli yari saydam olur', () => {
  const p = scene();
  keyCream(p, N, 20);
  const a = alpha(p, 20, 20);
  assert.ok(a > 0 && a < 255, `alfa ${a}`);
});
