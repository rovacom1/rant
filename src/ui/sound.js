// Ses: assets/ses altındaki kayıtlar WebAudio ile çalınır. Müzik: menü ve lobide lobi parçası, oyunda iki parça
// sırayla, son turda gerilimli parça; parçalar yumuşak geçişle birbirine bağlanır.
// Müzik ve efektlerin ayrı ses düzeyi ve aç/kapa ayarı var (tarayıcıda saklanır).
// Dosya yüklenemezse çok kısık, yumuşak sentez seslere düşülür.
import { store } from './dom.js';

const FILE = {
  dice: 'zar', step: 'adim', coin: 'para', pay: 'odeme', card: 'kart', turn: 'sira', news: 'gundem', itiraz: 'tokmak',
  build: 'insaat', crash: 'yikim', win: 'zafer', sold: 'artirma', tick: 'sayac', error: 'adim',
  // Tahta animasyonlarının vuruş sesleri (boardfx.js): her biri animasyonun bir anına denk çalar.
  hop: 'fx/zipla', tap: 'fx/tak', bell: 'fx/zil', sweep: 'fx/suzulme', stamp: 'fx/muhur', chime: 'fx/nota', sparkle: 'fx/parilti',
  toss: 'fx/firlat', clink: 'fx/jeton', ding: 'fx/kasa', slide: 'fx/dusus', thud: 'fx/tok', whistle: 'fx/duduk', rattle: 'fx/tikirti',
  poof: 'fx/puf', wobble: 'fx/sallanma', sad: 'fx/huzun', click: 'fx/cit',
};
const LEVEL = { step: 0.3, error: 0.45, pay: 0.7, card: 0.8, tick: 0.5, tap: 0.6, click: 0.5, sweep: 0.7, rattle: 0.8 };
// Her sesin en fazla çalma süresi (sn); sonunda yumuşak kapanır. Daha kısa sesler duyulan uzunlukları kadar çalar.
const MAX_LEN = { step: 0.28, card: 1.1, coin: 1.4, pay: 1.2, dice: 1.6, turn: 1.6, itiraz: 1.3, build: 1.3, sold: 1.8, crash: 1.8, news: 2.6, win: 3.6, error: 0.3, tick: 0.9 };
const TARGET_RMS = 0.11;
const XFADE = 3; // müzik döngüsünde geçiş süresi (sn)

const cfg = { music: 0.35, sfx: 0.75, musicOn: true, sfxOn: true, ...store.get('audio', {}) };
let ctx = null;
let sfxGain = null;
let musicGain = null;
const buffers = {};
let current = null;
let loopTimer = null;

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    sfxGain = ctx.createGain();
    musicGain = ctx.createGain();
    sfxGain.connect(ctx.destination);
    musicGain.connect(ctx.destination);
    applyVolumes();
    load();
  }
  // iPhone arkadan dönünce bağlamı 'interrupted' bırakır; sayfa arkadayken kasten susturulmuşsa açılmaz.
  if (ctx.state !== 'running' && !document.hidden) ctx.resume();
  return ctx;
}

async function fetchBuf(name) {
  const r = await fetch(`assets/ses/${name}.mp3`);
  if (!r.ok) throw new Error(name);
  return ctx.decodeAudioData(await r.arrayBuffer());
}

// Baştaki sessizliği atlar, sonundaki sessiz kuyruğu (len: duyulan uzunluk) ve en yüksek vuruşun yerini (attack)
// ölçer, sesi ortak bir düzeye getirir.
function prep(buf) {
  const d = buf.getChannelData(0);
  let start = 0;
  while (start < d.length && Math.abs(d[start]) < 0.008) start++;
  const end = Math.min(d.length, start + buf.sampleRate * 1.5);
  let sum = 0;
  let n = 0;
  let peak = 0.01;
  let peakAt = start;
  for (let i = start; i < end; i += 4) {
    sum += d[i] * d[i];
    if (Math.abs(d[i]) > peak) {
      peak = Math.abs(d[i]);
      peakAt = i;
    }
    n++;
  }
  const rms = Math.sqrt(sum / Math.max(1, n)) || TARGET_RMS;
  let last = d.length - 1;
  while (last > start && Math.abs(d[last]) < peak * 0.02) last--;
  // Ortalama düzeye çek ama tepe değeri 0.9'u geçmesin (cızırtı olmasın).
  const sr = buf.sampleRate;
  return { buf, offset: start / sr, len: Math.max(0.1, (last - start) / sr), attack: (peakAt - start) / sr, gain: Math.min(3, Math.max(0.15, Math.min(TARGET_RMS / rms, 0.9 / peak))) };
}

function load() {
  for (const f of new Set(Object.values(FILE))) {
    fetchBuf(f)
      .then((b) => (buffers[f] = prep(b)))
      .catch(() => {});
  }
}

function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  sfxGain.gain.setTargetAtTime(cfg.sfxOn ? cfg.sfx : 0, t, 0.05);
  musicGain.gain.setTargetAtTime(cfg.musicOn ? cfg.music * 0.55 : 0, t, 0.15);
}

function synth(name) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const f = { coin: 1320, turn: 784, win: 1047, error: 220 }[name] || 600;
  o.type = 'sine';
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  o.connect(g).connect(sfxGain);
  o.start(t);
  o.stop(t + 0.3);
}

// Sesin çalacağı süre (sn): duyulan uzunluğu, en fazla MAX_LEN; ses yüklenmediyse fallback.
function sfxLen(name, fallback = 1) {
  const b = buffers[FILE[name]];
  const cap = MAX_LEN[name] ?? Infinity;
  return b ? Math.min(cap, b.len) : Math.min(cap, fallback);
}

// sec: canlandırmanın süresi (sn); verilirse ses o sürede yumuşakça biter.
// o.at: kaç sn sonra; o.hit: sesin en yüksek vuruşu tam o ana denk gelsin; o.rate: hız ve perde; o.vol: düzey çarpanı.
export function play(name, sec, o = {}) {
  if (!cfg.sfxOn || !cfg.sfx) return;
  const a = ac();
  if (!a) return;
  try {
    const b = buffers[FILE[name]];
    if (!b) return synth(name);
    const src = a.createBufferSource();
    src.buffer = b.buf;
    const g = a.createGain();
    const rate = o.rate || 1;
    src.playbackRate.value = rate;
    const vol = b.gain * (LEVEL[name] ?? 1) * (o.vol ?? 1);
    const len = Math.min(sec || sfxLen(name), b.buf.duration - b.offset) / rate;
    const t = a.currentTime + Math.max(0, (o.at || 0) - (o.hit ? b.attack / rate : 0));
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + Math.max(0, len - Math.min(0.12, len * 0.3)));
    g.gain.linearRampToValueAtTime(0, t + len);
    src.connect(g).connect(sfxGain);
    src.start(t, b.offset);
    src.stop(t + len + 0.02);
  } catch {}
}

// ---- müzik ----

// Ortama göre çalan parçalar; oyunda liste sırayla döner.
const PLAYLIST = { lobby: ['lobi'], game: ['oyun2', 'oyun1'], final: ['sontur'] };
const tracks = {};
let mode = null; // null: müzik yok
let turn = 0;

function track(name) {
  if (!tracks[name]) tracks[name] = fetchBuf(name).catch(() => null);
  return tracks[name];
}

async function startLoop(fadeIn) {
  if (!ctx || !mode) return;
  const list = PLAYLIST[mode];
  const want = mode;
  const buf = await track(list[turn % list.length]);
  if (!buf || mode !== want || !cfg.musicOn || current) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  const now = ctx.currentTime;
  const dur = buf.duration;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(1, now + (fadeIn ? XFADE : 2));
  g.gain.setValueAtTime(1, now + dur - XFADE);
  g.gain.linearRampToValueAtTime(0, now + dur);
  src.connect(g).connect(musicGain);
  src.start(now);
  current = { src, g };
  clearTimeout(loopTimer);
  loopTimer = setTimeout(() => {
    current = null;
    turn++;
    if (mode && cfg.musicOn) startLoop(true);
  }, Math.max(1, dur - XFADE) * 1000);
}

function stopLoop() {
  clearTimeout(loopTimer);
  if (current && ctx) {
    const { src, g } = current;
    const t = ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0, t + 0.8);
    src.stop(t + 0.9);
  }
  current = null;
}

// m: 'lobby' | 'game' | 'final' | null. Aynı ortam yeniden istenirse çalan parça sürer.
export function setMusic(m) {
  if (m === mode) return;
  mode = m;
  turn = 0;
  stopLoop();
  if (m && cfg.musicOn && ac()) startLoop(true);
}

// ---- ayarlar ----

export const getAudio = () => ({ ...cfg });
export const isMuted = () => !(cfg.musicOn && cfg.music) && !(cfg.sfxOn && cfg.sfx);

export function setAudio(patch) {
  const wasMusic = cfg.musicOn;
  Object.assign(cfg, patch);
  store.set('audio', cfg);
  applyVolumes();
  if (!mode) return;
  if (cfg.musicOn && !wasMusic && ac()) startLoop(true);
  if (!cfg.musicOn && wasMusic) stopLoop();
}

// Tıklamada ses bağlamını aç (tarayıcı kuralı; iPhone telefon görüşmesinden sonra da ister); bekleyen müzik o zaman başlar.
window.addEventListener('pointerdown', () => ac() && mode && !current && cfg.musicOn && startLoop(true));

// Telefonda sayfa arkaya geçince (ekran kilidi, başka uygulama) ses susar, cepte müzik çalmaz; dönünce müzik yumuşakça girer.
document.addEventListener('visibilitychange', () => {
  if (!ctx || !matchMedia('(hover: none)').matches) return;
  if (document.hidden) {
    stopLoop();
    ctx.suspend();
  } else {
    ctx.resume();
    if (mode && cfg.musicOn) startLoop(true);
  }
});
