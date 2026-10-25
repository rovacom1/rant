import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playBotGame } from '../tools/simlib.js';

// Her oyuncu sayısı için birçok tam bot oyunu: hiçbir adımda kural ihlali ya da takılma olmamalı.
for (const n of [2, 3, 4, 5, 6]) {
  test(`${n} botla 25 tam oyun tutarlı biter`, () => {
    for (let g = 0; g < 25; g++) {
      const { state } = playBotGame(n * 1000 + g, n);
      assert.equal(state.phase, 'over');
      assert.equal(state.results.ranking.length, n);
    }
  });
}

test('kısa ve uzun oyun seçenekleri', () => {
  for (const maxRounds of [10, 20]) {
    const { state } = playBotGame(77, 4, { maxRounds });
    assert.equal(state.round, maxRounds);
  }
});

test('masa ayarları kapalıyken de oyunlar tutarlı biter', () => {
  const rules = { ihale: false, surpriz: false, gundem: false };
  for (let g = 0; g < 15; g++) {
    const { state } = playBotGame(500 + g, 4, { rules });
    assert.equal(state.phase, 'over');
    assert.equal(state.gundem, null);
  }
  const { state } = playBotGame(9, 5, { rules: { ihale: false } });
  assert.equal(state.phase, 'over');
});

test('değer hedefiyle oyunlar tutarlı biter', () => {
  for (let g = 0; g < 10; g++) {
    const { state } = playBotGame(800 + g, 5, { targetScore: 3500 });
    assert.equal(state.phase, 'over');
    assert.ok(state.finalRound === state.round || state.round === 30);
  }
});

test('kolay ve zor botlarla karışık masalar tutarlı biter', () => {
  for (let g = 0; g < 10; g++) {
    const { state } = playBotGame(900 + g, 5, {}, ['zor', 'kolay', 'normal', 'zor', 'kolay']);
    assert.equal(state.phase, 'over');
  }
  const { state } = playBotGame(42, 4, { botLevel: 'zor' });
  assert.equal(state.phase, 'over');
});
