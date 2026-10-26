// Tahta animasyonları (docs/TASARIM.md §11). Her biri kendi sesinin süresi kadar (ms) oynar.
// Efektler tahtanın içinde, piyonların altında (z 4) çizilir; kare büyümez, vurgu kenardadır.
// Hareket azaltma açıksa zıplama, halka, kenar çizgisi ve uçuş yok; parlama ve etiket kalır.
import { pawn } from './pawns.js';
import { ic } from './icons.js';

export const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LABEL_MS = 2400;

const boxOf = (el) => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
// Karenin içindeki bir parçanın (SVG simge de olabilir) tahtaya göre kutusu.
const inCell = (cell, el) => {
  const board = cell.offsetParent.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left - board.left, y: r.top - board.top, w: r.width, h: r.height };
};
const vertical = (cell) => cell.classList.contains('side-l') || cell.classList.contains('side-r');

// Tahtaya geçici bir katman ekler; ms sonra kaldırır.
function layer(board, cls, box, ms, inner = '') {
  const el = document.createElement('div');
  el.className = `fx ${cls}`;
  Object.assign(el.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
  el.innerHTML = inner;
  board.appendChild(el);
  setTimeout(() => el.remove(), ms + 60);
  return el;
}

// Karenin kenarında iki kez yanan çerçeve (sıra, maaş, yıkım).
function blink(board, cell, color, ms) {
  const el = layer(board, 'fx-edge', boxOf(cell), ms);
  el.style.setProperty('--c', color);
  el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0.15, offset: 0.35 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: ms, easing: 'ease-out' });
}

// Oyuncu renginde karenin kenarını bir tur dolanan çizgi.
function trace(board, cell, color, ms, delay = 0) {
  const b = boxOf(cell);
  const el = layer(board, 'fx-trace', b, ms + delay, `<svg viewBox="0 0 ${b.w} ${b.h}" aria-hidden="true"><rect x="2" y="2" width="${b.w - 4}" height="${b.h - 4}" rx="4" pathLength="100"/></svg>`);
  el.style.setProperty('--c', color);
  const r = el.querySelector('rect');
  r.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], { duration: ms * 0.7, delay, easing: 'ease-in-out', fill: 'both' });
  el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: ms, delay, fill: 'both' });
}

// Tur başı: piyon iki kez seker, 3 halka yayılır, karesi parlar; yanında piyon resmi ve ad.
export function turnFx(board, cell, token, pl, me, ms) {
  blink(board, cell, pl.color, ms);
  const tb = boxOf(token);
  if (!calm()) {
    for (let i = 0; i < 3; i++) {
      const r = layer(board, 'fx-ring', tb, ms);
      r.style.setProperty('--c', pl.color);
      r.animate([{ transform: 'scale(0.5)', opacity: 0.95 }, { transform: 'scale(2.6)', opacity: 0 }], { duration: ms * 0.7, delay: i * ms * 0.15, easing: 'ease-out', fill: 'both' });
    }
    token.firstElementChild?.animate(
      [{ transform: 'none' }, { transform: 'translateY(-34%) scale(1.18)', offset: 0.25 }, { transform: 'none', offset: 0.5 }, { transform: 'translateY(-14%) scale(1.08)', offset: 0.72 }, { transform: 'none' }],
      { duration: ms, easing: 'ease-out' },
    );
  }
  // Etiket tahtanın üst yarısında karenin altında, alt yarısında üstünde çıkar.
  const cb = boxOf(cell);
  const down = cb.y + cb.h / 2 < board.clientHeight / 2;
  const tag = layer(board, 'fx-tag', { x: 0, y: 0, w: 0, h: 0 }, LABEL_MS, `${pawn(pl.avatar, pl.color, 26)}<span></span>`);
  tag.lastElementChild.textContent = me ? 'Sıra sende!' : pl.name;
  tag.style.setProperty('--c', pl.color);
  Object.assign(tag.style, { width: '', height: '' });
  const w = tag.offsetWidth;
  const x = Math.max(6, Math.min(board.clientWidth - w - 6, tb.x + tb.w / 2 - w / 2));
  tag.style.left = `${x}px`;
  tag.style.top = down ? `${cb.y + cb.h + 6}px` : `${cb.y - tag.offsetHeight - 6}px`;
  const dy = down ? -10 : 10;
  tag.animate([{ opacity: 0, transform: `translateY(${dy}px) scale(0.9)` }, { opacity: 1, transform: 'none', offset: 0.08 }, { opacity: 1, transform: 'none', offset: 0.88 }, { opacity: 0, transform: `translateY(${-dy / 2}px)` }], { duration: LABEL_MS, easing: 'ease-out', fill: 'both' });
}

// Mülk alındı: kenar alıcının renginde dolanır, sonra şerit o renkle dolar (kare çizildikten sonra çağrılır).
export function ownFx(board, cell, color, ms) {
  if (!calm()) trace(board, cell, color, ms * 0.6);
  const strip = cell.querySelector('.strip');
  if (!strip) return;
  const v = vertical(cell);
  strip.style.transformOrigin = v ? '50% 0' : '0 50%';
  const from = v ? 'scaleY(0)' : 'scaleX(0)';
  strip.animate([{ transform: from }, { transform: 'none' }], { duration: ms * 0.4, delay: calm() ? 0 : ms * 0.6, easing: 'ease-out', fill: 'backwards' });
}

// Tam set: setin kareleri sırayla sahibinin renginde dolanır, sonra şeritlerde yıldız belirir.
export function setFx(board, setCells, color, ms) {
  const n = setCells.length;
  setCells.forEach((cell, k) => {
    if (!calm()) trace(board, cell, color, ms * 0.5, (k * ms * 0.25) / Math.max(1, n - 1));
    // scale/rotate ayrı özellikler: yıldızın konumlandıran transform'una dokunmaz.
    cell.querySelector('.fullstar')?.animate(
      [{ scale: 0, rotate: '-40deg' }, { scale: 1.6, rotate: '10deg', offset: 0.6 }, { scale: 1, rotate: '0deg' }],
      { duration: ms * 0.3, delay: ms * 0.7, easing: 'ease-out', fill: 'backwards' },
    );
  });
}

// Kat dikildi: ev (ya da kaçak koni) yukarıdan kat rozetine düşüp seker, rozet kabarır.
export function buildFx(board, cell, kacak, ms) {
  const floors = cell.querySelector('.floors');
  const icons = floors ? floors.querySelectorAll('.ic') : [];
  const target = kacak ? icons[icons.length - 1] : icons[0];
  if (!target) return;
  if (!calm()) {
    const el = layer(board, 'fx-drop', inCell(cell, target), ms, ic(kacak ? 'kacak' : 'house'));
    el.firstElementChild.style.fontSize = `${target.offsetHeight / 1.2}px`;
    el.animate(
      [{ transform: 'translateY(-110px) scale(1.6)', opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: 'scale(1.15, 0.85)', offset: 0.55 }, { transform: 'translateY(-10px) scale(1)', offset: 0.75 }, { transform: 'none', opacity: 1 }],
      { duration: ms, easing: 'ease-in', fill: 'both' },
    );
  }
  floors.animate([{ transform: 'none' }, { transform: 'scale(1.18)', offset: 0.7 }, { transform: 'none' }], { duration: ms, easing: 'ease-out' });
}

// Kaçak kat yıkıldı (kare güncellenmeden önce çağrılır): kenar kırmızı yanar, koni titreyip toza dönüşür.
export function demolishFx(board, cell, ms) {
  blink(board, cell, 'var(--neg)', ms);
  const icons = cell.querySelectorAll('.floors .ic');
  const cone = icons[icons.length - 1];
  if (!cone || calm()) return;
  const b = inCell(cell, cone);
  const el = layer(board, 'fx-drop', b, ms, ic('kacak'));
  el.firstElementChild.style.fontSize = `${b.h / 1.2}px`;
  el.animate(
    [{ transform: 'none' }, { transform: 'rotate(-14deg)', offset: 0.1 }, { transform: 'rotate(12deg)', offset: 0.18 }, { transform: 'rotate(-10deg)', offset: 0.26 }, { transform: 'rotate(8deg)', offset: 0.34 }, { transform: 'scale(1.15)', offset: 0.42 }, { transform: 'scale(1.5)', opacity: 0, offset: 0.52 }, { transform: 'scale(1.5)', opacity: 0 }],
    { duration: ms, fill: 'both' },
  );
  const dirs = [[-26, -14], [0, -24], [22, -12], [-22, 12], [4, 18], [20, 10]];
  for (const [dx, dy] of dirs) {
    const p = layer(board, 'fx-dust', { x: b.x + b.w / 2 - 5, y: b.y + b.h / 2 - 5, w: 10, h: 10 }, ms);
    p.animate([{ opacity: 0, transform: 'none' }, { opacity: 0.9, transform: `translate(${dx * 0.3}px, ${dy * 0.3}px) scale(0.8)` }, { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(2)` }], { duration: ms * 0.5, delay: ms * 0.45, easing: 'ease-out', fill: 'both' });
  }
}

// İflas (kare ve piyon güncellenmeden önce çağrılır): piyon sallanıp düşerek kaybolur, şeritler sırayla griye döner.
export function iflasFx(board, token, ownedCells, ms) {
  if (token && !calm()) {
    const g = layer(board, 'fx-ghost', boxOf(token), ms, token.innerHTML);
    g.animate(
      [{ transform: 'none', filter: 'none', opacity: 1 }, { transform: 'rotate(-8deg)', offset: 0.06 }, { transform: 'rotate(7deg)', offset: 0.12 }, { transform: 'rotate(-4deg)', filter: 'grayscale(0.4)', offset: 0.18 }, { transform: 'none', filter: 'grayscale(1)', opacity: 1, offset: 0.24 }, { transform: 'translateY(22px) rotate(24deg) scale(0.85)', filter: 'grayscale(1)', opacity: 0, offset: 0.5 }, { opacity: 0 }],
      { duration: ms, easing: 'ease-in', fill: 'both' },
    );
  }
  const n = ownedCells.length;
  ownedCells.forEach((cell, k) => {
    const strip = cell.querySelector('.strip');
    if (!strip) return;
    const cs = getComputedStyle(strip);
    const s = layer(board, 'fx-strip', inCell(cell, strip), ms);
    Object.assign(s.style, { background: cs.backgroundColor, boxShadow: cs.boxShadow, borderRadius: cs.borderRadius, transformOrigin: vertical(cell) ? '0 50%' : '50% 0' });
    const shrink = vertical(cell) ? 'scaleX(0.43)' : 'scaleY(0.43)';
    s.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: shrink }], { duration: ms * 0.2, delay: ms * 0.45 + (k * ms * 0.35) / Math.max(1, n - 1), easing: 'ease-in-out', fill: 'both' });
  });
}

// Maaş: Başlangıç köşesi altın renkte iki kez parlar.
export const shineFx = (board, cell, ms) => blink(board, cell, 'var(--gold)', ms);
