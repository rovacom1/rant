// Oyun sonu ekranındaki dayı: tek bir senaryo videosu döngüde oynar; saydamlığı videonun içinde hazırdır (alphavideo.js).
// Sonuç ekranı yeniden çizilse de video baştan başlamasın diye tuval kalıcı bir düğümdür ve yer tutucuya taşınır.
import { alphaCanvas } from './alphavideo.js';
import { APP_VERSION } from '../version.js';

let box, art, vid, clip = '', last = -1, ticking = false;

function draw() {
  art.draw(vid);
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
    art = alphaCanvas();
    vid = document.createElement('video');
    vid.muted = true;
    vid.playsInline = true;
    vid.loop = true;
    vid.preload = 'auto';
    vid.addEventListener('loadeddata', draw);
    box.append(art.canvas, vid);
  }
  if (box.parentNode !== slot) slot.append(box);
  if (clip !== name) {
    clip = name;
    last = -1;
    vid.src = `assets/sonu/${name}.mp4?v=${APP_VERSION}`; // sürüm: önbellekteki eski (maskesiz) video gelmesin
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  vid.play().catch(() => {});
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(tick);
  }
}
