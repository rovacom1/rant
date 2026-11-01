// Geri bildirim kademeleri (tasks/mobil-kalite-plani.md 2). Her olay üç kademeden birine bağlanır; yeni olay kendine özel
// efekt yazmaz, kademesini seçer.
// - küçük (maaş, küçük para): az jeton, küçük tutar, kısa tık; titreşim yalnız ilgili oyuncuda 8 ms.
// - orta (kira, satın alma, kat, ihale): çok jeton, alanın piyonu sekip oturur, orta boy tutar; titreşim ilgiliye 15 ms.
// - büyük (büyük kira, iflas, yıkım, el koyma, konkordato, imar affı): darbe anında kısa donma (bütün canlandırmalar
//   FREEZE ms durur), müzik bir an kısılır, tahta sarsılır, herkeste titreşim dizisi; ortada büyük eğik tutar, dayı balonu.
// Hareket azaltma açıksa donma ve sarsıntı yok. Sarsıntı ve titreşim ses penceresinden kapanır (tarayıcıda saklanır).
// Yalnız transform ve opacity canlanır.
import { store } from './dom.js';
import { duck } from './sound.js';

export const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const FREEZE = 90; // ms, büyük anda donma (120'yi geçmez)
export const SHAKE = { ms: 420, px: 7, deg: 0.6 };
const BUZZ = { small: 8, medium: 15, big: [30, 40, 60] };

let shakeOn = store.get('shake', true);
let buzzOn = store.get('vibrate', true);
export const shakeEnabled = () => shakeOn;
export function setShake(on) {
  shakeOn = !!on;
  store.set('shake', shakeOn);
}

// Titreşim yalnız dokunmatik Android'de (navigator.vibrate); iPhone tarayıcısı desteklemez, masaüstünde titreyecek bir şey
// yok: orada anahtar da görünmez.
const iOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const canVibrate = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function' && !iOS() && matchMedia('(pointer: coarse)').matches;
export const vibrateEnabled = () => buzzOn;
export function setVibrate(on) {
  buzzOn = !!on;
  store.set('vibrate', buzzOn);
  if (buzzOn) buzz('medium'); // açınca bir kez titrer: çalıştığı hissedilsin
}
export function buzz(tier) {
  if (!buzzOn || !canVibrate() || document.hidden) return;
  try {
    navigator.vibrate(BUZZ[tier]);
  } catch {}
}

// Tahtanın görsel kabı sönerek sarsılır (yalnız transform; oyunun durumu ve piyonların yeri değişmez).
export function shake(board, k = 1) {
  if (!board || calm() || !shakeOn) return;
  const n = 8;
  const frames = [];
  for (let i = 0; i <= n; i++) {
    const a = (1 - i / n) ** 2 * k; // sert başlar, yumuşak biter
    const x = SHAKE.px * a * Math.sin(i * 2.1);
    const y = SHAKE.px * 0.6 * a * Math.sin(i * 2.9 + 1);
    frames.push({ transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${(SHAKE.deg * a * Math.sin(i * 1.7)).toFixed(3)}deg)` });
  }
  board.animate(frames, { duration: SHAKE.ms, easing: 'linear' });
}

// Donma (hit-stop): o an oynayan bütün canlandırmalar ms boyunca durur, sonra kaldıkları yerden sürer. Dokunuşlar
// kaybolmaz (girdi kapanmaz). Süre döner (hareket azaltmada 0).
export function freeze(ms = FREEZE) {
  if (calm()) return 0;
  const list = document.getAnimations().filter((a) => a.playState === 'running');
  for (const a of list) a.pause();
  setTimeout(() => {
    for (const a of list) if (a.playState === 'paused') a.play();
  }, ms);
  return ms;
}

// Büyük andan sonra donma ve sarsıntının kapladığı süre (ms): darbenin anı + bu, bütçeye sığmalı (test/pace.test.js).
export const BIG_TAIL = FREEZE + SHAKE.ms;

// Darbe anı: kademenin donma, sarsıntı ve titreşimi. me: olay bu oyuncuyu ilgilendiriyor (küçük ve orta yalnız ona titrer).
export function impact(tier, board, { me = false } = {}) {
  if (tier === 'big') {
    const f = freeze();
    duck(1.4);
    setTimeout(() => shake(board), f);
    buzz('big');
  } else if (me) buzz(tier);
}
