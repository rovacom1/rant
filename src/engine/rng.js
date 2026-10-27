// Tohumlu rastgele sayı üreteci (mulberry32). Durum oyun state'inde tutulur ki
// oyun her yerde aynı şekilde yeniden oynatılabilsin.

export function nextRandom(seed) {
  const s = (seed + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { seed: s, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
}

function rand(state) {
  const r = nextRandom(state.rng);
  state.rng = r.seed;
  return r.value;
}

export const randInt = (state, n) => Math.floor(rand(state) * n);
export const rollDie = (state) => 1 + randInt(state, 6);

export function shuffle(state, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(state, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function randomSeed() {
  return (Math.random() * 4294967296) >>> 0;
}
