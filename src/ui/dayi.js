// Oyun sonu ekranındaki dayı: tek bir senaryo videosu döngüde oynar, krem zemini tuvalde silinir (giriş ekranındaki gibi).
// Sonuç ekranı yeniden çizilse de video baştan başlamasın diye tuval kalıcı bir düğümdür ve yer tutucuya taşınır.
import { keyCream } from './intro.js';

const N = 400;
let box, cx, vid, clip = '', last = -1, ticking = false;

function draw() {
  cx.clearRect(0, 0, N, N);
  cx.drawImage(vid, 0, 0, N, N);
  const img = cx.getImageData(0, 0, N, N);
  keyCream(img.data, N);
  cx.putImageData(img, 0, 0);
  last = vid.currentTime;
}

function tick() {
  if (!box.isConnected) return (ticking = false);
  if (vid.readyState >= 2 && vid.currentTime !== last) draw();
  requestAnimationFrame(tick);
}

// slot: .verdict-dayi yer tutucusu (yoksa durur); name: assets/sonu altındaki video adı.
export function mountDayi(slot, name) {
  if (!slot) {
    if (vid) vid.pause();
    return;
  }
  if (!box) {
    box = document.createElement('div');
    box.className = 'dayi';
    box.setAttribute('aria-hidden', 'true');
    const cv = document.createElement('canvas');
    cv.width = cv.height = N;
    cx = cv.getContext('2d', { willReadFrequently: true });
    vid = document.createElement('video');
    vid.muted = true;
    vid.playsInline = true;
    vid.loop = true;
    vid.preload = 'auto';
    vid.addEventListener('loadeddata', draw);
    box.append(cv, vid);
  }
  if (box.parentNode !== slot) slot.append(box);
  if (clip !== name) {
    clip = name;
    last = -1;
    vid.src = `assets/sonu/${name}.mp4`;
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  vid.play().catch(() => {});
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(tick);
  }
}
