// Tek ipucu baloncuğu: [data-tip] kısa açıklama, [data-card] kart önizlemesi gösterir.
// Tarayıcının geç açılan title ipucunun yerine; fare üstüne gelir gelmez açılır.
import { esc } from './dom.js';
import { cardFace } from './hand.js';

let box = null;
let cur = null;
let timer = 0;

export function initTips() {
  if (box) return;
  box = document.createElement('div');
  box.className = 'tip';
  document.body.appendChild(box);
  document.addEventListener('pointerover', (e) => {
    const n = e.target.closest?.('[data-tip],[data-card]');
    if (n === cur) return;
    cur = n;
    clearTimeout(timer);
    if (!n) return hide();
    timer = setTimeout(() => show(n), 90);
  });
  document.addEventListener('pointerdown', hide, true);
  window.addEventListener('scroll', hide, true);
}

function hide() {
  clearTimeout(timer);
  cur = null;
  box?.classList.remove('on');
}

function show(n) {
  if (!n.isConnected) return hide();
  const card = n.dataset.card ? String(cardFace(n.dataset.card)) : '';
  const tip = n.dataset.tip ? `<div class="tt">${esc(n.dataset.tip)}</div>` : '';
  if (!card && !tip) return hide();
  box.innerHTML = card + tip;
  box.classList.toggle('has-card', !!card);
  const r = n.getBoundingClientRect();
  const w = box.offsetWidth;
  const h = box.offsetHeight;
  const above = r.top - h - 10 > 4;
  box.style.left = `${Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2))}px`;
  box.style.top = `${above ? r.top - h - 10 : Math.min(innerHeight - h - 6, r.bottom + 10)}px`;
  box.classList.add('on');
}
