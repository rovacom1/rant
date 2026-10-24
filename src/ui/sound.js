// Sesler WebAudio ile anında üretilir; dosya yok.
import { store } from './dom.js';

let ctx = null;
let muted = store.get('muted', false);

const ac = () => {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

function tone(freq, dur, { type = 'sine', vol = 0.15, at = 0, slide = 0 } = {}) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, { vol = 0.12, at = 0, freq = 1800 } = {}) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}

const SOUNDS = {
  dice: () => {
    for (let i = 0; i < 5; i++) noise(0.05, { at: i * 0.07, freq: 2500 + i * 300, vol: 0.18 });
  },
  step: () => tone(520, 0.05, { type: 'triangle', vol: 0.05 }),
  coin: () => {
    tone(988, 0.08, { type: 'square', vol: 0.05 });
    tone(1319, 0.18, { type: 'square', vol: 0.05, at: 0.07 });
  },
  pay: () => tone(440, 0.22, { type: 'triangle', vol: 0.09, slide: 0.6 }),
  card: () => noise(0.12, { freq: 4000, vol: 0.1 }),
  turn: () => {
    tone(659, 0.18, { vol: 0.12 });
    tone(880, 0.3, { vol: 0.12, at: 0.14 });
  },
  news: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, { type: 'triangle', vol: 0.1, at: i * 0.09 }));
  },
  itiraz: () => {
    tone(160, 0.35, { type: 'sawtooth', vol: 0.09 });
    tone(150, 0.35, { type: 'square', vol: 0.05, at: 0.05 });
  },
  build: () => {
    tone(300, 0.06, { type: 'square', vol: 0.06 });
    tone(300, 0.06, { type: 'square', vol: 0.06, at: 0.12 });
  },
  crash: () => noise(0.5, { freq: 400, vol: 0.25 }),
  win: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.12, at: i * 0.12 }));
  },
  chat: () => tone(1200, 0.06, { vol: 0.05 }),
  error: () => tone(220, 0.15, { type: 'square', vol: 0.06 }),
};

export function play(name) {
  if (muted) return;
  try {
    SOUNDS[name]?.();
  } catch {}
}

export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  store.set('muted', muted);
  return muted;
}

// İlk tıklamada ses bağlamını aç (tarayıcı kuralı).
window.addEventListener('pointerdown', () => ac(), { once: true });
