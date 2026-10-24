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
