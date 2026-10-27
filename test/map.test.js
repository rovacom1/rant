import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, GROUPS, PLAYER_COLORS } from '../src/engine/index.js';
import { CITY_XY, VB, bldSrc, bldAnchor, letterbox } from '../src/ui/map.js';

test('her mulkun haritada bir ili var, noktalar haritanin icinde', () => {
  const props = BOARD.map((q, i) => (q.kind === 'prop' ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(Object.keys(CITY_XY).map(Number).sort((a, b) => a - b), props);
  for (const q of props) {
    const [x, y] = CITY_XY[q];
    assert.ok(x > 0 && x < VB.w && y > 0 && y < VB.h, BOARD[q].name);
    const a = bldAnchor(q);
    assert.ok(a.x > 0 && a.x < VB.w && a.y > 0 && a.y < VB.h && a.k > 0.5 && a.k <= 1);
  }
});

test('bina resmi: L=0 yok, kacakta k{L-1}, affedilen kacak resmiyle kalir', () => {
  const ps = (kat, kacak, affed) => ({ owner: 0, kat, kacak, ipotek: false, tedbir: 0, ...(affed ? { affed } : {}) });
  assert.equal(bldSrc('konya', ps(0, 0)), null);
  assert.equal(bldSrc('konya', ps(2, 0)), 'assets/bina/konya/2.png');
  assert.equal(bldSrc('konya', ps(0, 1)), 'assets/bina/konya/k0.png', 'yalniz gecekondu');
  assert.equal(bldSrc('konya', ps(3, 1)), 'assets/bina/konya/k3.png');
  assert.equal(bldSrc('konya', ps(2, 0, true)), 'assets/bina/konya/k1.png', 'imar affi: gorunus degismez');
  assert.equal(bldSrc(undefined, ps(1, 0)), null, 'ulasimda bina yok');
});

test('harita kutuya oranini bozmadan sigar, ortalanir', () => {
  for (const [w, h] of [[736, 554], [400, 400], [1220, 840], [300, 90]]) {
    const r = letterbox(w, h);
    assert.ok(Math.abs(r.w / r.h - VB.w / VB.h) < 1e-9, 'oran ayni');
    assert.ok(r.w <= w + 1e-9 && r.h <= h + 1e-9, 'tasmaz');
    assert.ok(Math.abs(r.x * 2 + r.w - w) < 1e-9 && Math.abs(r.y * 2 + r.h - h) < 1e-9, 'ortali');
    assert.ok(Math.abs(r.w - w) < 1e-9 || Math.abs(r.h - h) < 1e-9, 'bir kenar dolu');
  }
});

test('set ve oyuncu renkleri plandaki gibi', () => {
  assert.deepEqual(Object.values(GROUPS).map((g) => g.color), ['#5e3a1e', '#6cc4ee', '#22a35a', '#f5c518', '#f0761a', '#c47ad8', '#d8283c', '#1b2f7a']);
  assert.deepEqual(PLAYER_COLORS, ['#009c9c', '#e81c8c', '#a6e000', '#4a3aff', '#2b2f38', '#ffffff']);
  assert.equal(BOARD[33].name, 'İstanbul Anadolu');
  assert.equal(BOARD[35].name, 'İstanbul Avrupa');
});
