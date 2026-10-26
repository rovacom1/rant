// Tahta animasyonları (docs/TASARIM.md §11). Her animasyonun sabit bir zaman çizelgesi (ms) var; vuruş sesleri
// (zıplama, konma, mühür, jeton...) çizelgedeki anlara denk çalar: sesin en yüksek yeri görüntüdeki darbeyle aynı ana
// gelir (sound.js play, hit). Efektler tahtanın içinde, piyonların altında (z 4); kare büyümez, vurgu kenardadır.
// Hareket azaltma açıksa zıplama, halka, kenar çizgisi ve uçuş yok; parlama, etiket ve sesler kalır.
import { pawn } from './pawns.js';
import { ic } from './icons.js';
import { play } from './sound.js';

export const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LABEL_MS = 2400;

// Zaman çizelgeleri (ms).
export const T = {
  turn: { ms: 1000, land1: 500, land2: 1000 },
  own: { ms: 1000, draw: 600, fill: 400 },
  set: { ms: 1200, draw: 300, spread: 400, star: 800, starMs: 300 },
  flight: 900, // jetonların uçuşu (kira, maaş)
  build: { ms: 800, impact: 440, bounce: 600 },
  demolish: { ms: 1300, shake: 450, shakeMs: 320, burst: 800 },
  iflas: { ms: 1800, fall: 430, strips: 900, stripsSpread: 700 },
};

// Darbe sesi: sesin en yüksek anı ms sonraya denk gelir. Sürekli ses (süzülme, düşüş, düdük...): ms sonra başlar.
const hit = (name, ms, o = {}) => play(name, undefined, { at: ms / 1000, hit: true, ...o });
const from = (name, ms, o = {}) => play(name, undefined, { at: ms / 1000, ...o });

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

// Karenin kenarında iki kez yanan çerçeve; en parlak anları ms'nin %15'i ve %55'i.
function blink(board, cell, color, ms) {
  const el = layer(board, 'fx-edge', boxOf(cell), ms);
  el.style.setProperty('--c', color);
  el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0.15, offset: 0.35 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: ms, easing: 'ease-out' });
}

// Oyuncu renginde karenin kenarını draw ms'de bir tur dolanan çizgi; sonra fade ms'de söner.
function trace(board, cell, color, delay, draw, fade = 150) {
  const b = boxOf(cell);
  const el = layer(board, 'fx-trace', b, delay + draw + fade, `<svg viewBox="0 0 ${b.w} ${b.h}" aria-hidden="true"><rect x="2" y="2" width="${b.w - 4}" height="${b.h - 4}" rx="4" pathLength="100"/></svg>`);
  el.style.setProperty('--c', color);
  el.querySelector('rect').animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], { duration: draw, delay, easing: 'ease-in-out', fill: 'both' });
  el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fade, delay: delay + draw, fill: 'both' });
}

// Tur başı: piyon zıplar (zıplama sesi), 500. ms'de konar, küçük bir sekişle 1000. ms'de yine konar (konma sesleri).
// 3 halka yayılır, karesi parlar; kendi sıranda zil de çalar. Yanında piyon resmi ve ad.
export function turnFx(board, cell, token, pl, me) {
  const { ms, land1, land2 } = T.turn;
  blink(board, cell, pl.color, ms);
  const tb = boxOf(token);
  from('hop', 0);
  hit('tap', land1);
  hit('tap', land2, { vol: 0.6, rate: 1.15 });
  if (me) from('bell', 0);
  if (!calm()) {
    for (let i = 0; i < 3; i++) {
      const r = layer(board, 'fx-ring', tb, ms);
      r.style.setProperty('--c', pl.color);
      r.animate([{ transform: 'scale(0.5)', opacity: 0.95 }, { transform: 'scale(2.6)', opacity: 0 }], { duration: ms * 0.7, delay: i * ms * 0.15, easing: 'ease-out', fill: 'both' });
    }
    const up = (y, s) => ({ transform: `translateY(${y}%) scale(${s})`, easing: 'ease-in' });
    token.firstElementChild?.animate(
      [{ transform: 'none', easing: 'ease-out' }, up(-34, 1.18), { transform: 'none', offset: land1 / ms, easing: 'ease-out' }, up(-14, 1.08), { transform: 'none' }],
      { duration: ms },
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
  tag.style.left = `${Math.max(6, Math.min(board.clientWidth - w - 6, tb.x + tb.w / 2 - w / 2))}px`;
  tag.style.top = down ? `${cb.y + cb.h + 6}px` : `${cb.y - tag.offsetHeight - 6}px`;
  const dy = down ? -10 : 10;
  tag.animate([{ opacity: 0, transform: `translateY(${dy}px) scale(0.9)` }, { opacity: 1, transform: 'none', offset: 0.08 }, { opacity: 1, transform: 'none', offset: 0.88 }, { opacity: 0, transform: `translateY(${-dy / 2}px)` }], { duration: LABEL_MS, easing: 'ease-out', fill: 'both' });
}

// Mülk alındı: kenar alıcının renginde dolanır (süzülme sesi), 600. ms'de mühür vurulur ve şerit o renkle dolar.
// sound: false ise (ihale, pazarlık) kendi sesleri zaten çalıyor.
export function ownFx(board, cell, color, sound = true) {
  const { draw, fill } = T.own;
  if (sound) {
    from('sweep', 0);
    hit('stamp', draw);
  }
  if (!calm()) trace(board, cell, color, 0, draw);
  const strip = cell.querySelector('.strip');
  if (!strip) return;
  const v = vertical(cell);
  strip.style.transformOrigin = v ? '50% 0' : '0 50%';
  strip.animate([{ transform: v ? 'scaleY(0)' : 'scaleX(0)' }, { transform: 'none' }], { duration: fill, delay: draw, easing: 'ease-out', fill: 'backwards' });
}

// Tam set: setin kareleri sırayla sahibinin renginde dolanır; her kare tamamlanınca bir nota (giderek tizleşir),
// sonunda şeritlerde yıldızlar parlar (parıltı sesi yıldızların en büyük anında).
export function setFx(board, setCells, color, sound = true) {
  const { draw, spread, star, starMs } = T.set;
  const n = setCells.length;
  const rates = [1, 1.26, 1.5, 2];
  setCells.forEach((cell, k) => {
    const at = n > 1 ? (k * spread) / (n - 1) : 0;
    if (!calm()) trace(board, cell, color, at, draw);
    if (sound) hit('chime', at + draw, { rate: rates[Math.round((k * (rates.length - 2)) / Math.max(1, n - 1))] });
    // scale/rotate ayrı özellikler: yıldızın konumlandıran transform'una dokunmaz.
    cell.querySelector('.fullstar')?.animate(
      [{ scale: 0, rotate: '-40deg' }, { scale: 1.6, rotate: '10deg', offset: 0.5 }, { scale: 1, rotate: '0deg' }],
      { duration: starMs, delay: star, easing: 'ease-out', fill: 'backwards' },
    );
  });
  if (sound) hit('sparkle', star + starMs / 2);
}

// Kat dikildi: ev (ya da kaçak koni) yukarıdan düşer (düşüş sesi), 440. ms'de rozete çarpar (tok ses, rozet kabarır),
// seker ve 800. ms'de yine konar.
export function buildFx(board, cell, kacak) {
  const { ms, impact, bounce } = T.build;
  const floors = cell.querySelector('.floors');
  const icons = floors ? floors.querySelectorAll('.ic') : [];
  const target = kacak ? icons[icons.length - 1] : icons[0];
  if (!target) return;
  from('slide', 0, { vol: 0.7 });
  hit('thud', impact);
  hit('tap', ms, { vol: 0.5, rate: 1.2 });
  const at = (t) => t / ms;
  if (!calm()) {
    const el = layer(board, 'fx-drop', inCell(cell, target), ms, ic(kacak ? 'kacak' : 'house'));
    el.firstElementChild.style.fontSize = `${target.offsetHeight / 1.2}px`;
    el.animate(
      [
        { transform: 'translateY(-110px) scale(1.6)', opacity: 0, easing: 'ease-in' },
        { opacity: 1, offset: 0.12 },
        { transform: 'scale(1.15, 0.85)', offset: at(impact), easing: 'ease-out' },
        { transform: 'translateY(-10px) scale(1)', offset: at(bounce), easing: 'ease-in' },
        { transform: 'none', opacity: 1 },
      ],
      { duration: ms, fill: 'both' },
    );
  }
  floors.animate([{ transform: 'none' }, { transform: 'none', offset: at(impact) }, { transform: 'scale(1.18)', offset: at(impact + 80) }, { transform: 'none' }], { duration: ms, easing: 'ease-out' });
}

// Kaçak kat yıkıldı (kare güncellenmeden önce çağrılır): zabıta düdüğüyle kenar kırmızı yanar, koni 450. ms'den
// titrer (tıkırtı), 800. ms'de patlayıp toza dönüşür (puf).
export function demolishFx(board, cell, sound = true) {
  const { ms, shake, shakeMs, burst } = T.demolish;
  blink(board, cell, 'var(--neg)', ms);
  if (sound) {
    from('whistle', 0);
    from('rattle', shake);
    hit('poof', burst);
  }
  const icons = cell.querySelectorAll('.floors .ic');
  const cone = icons[icons.length - 1];
  if (!cone || calm()) return;
  const b = inCell(cell, cone);
  const el = layer(board, 'fx-drop', b, ms, ic('kacak'));
  el.firstElementChild.style.fontSize = `${b.h / 1.2}px`;
  const at = (t) => t / ms;
  const wig = (k, deg) => ({ transform: `rotate(${deg}deg)`, offset: at(shake + (k * shakeMs) / 4) });
  el.animate(
    [{ transform: 'none' }, { transform: 'none', offset: at(shake) }, wig(0.5, -14), wig(1.5, 12), wig(2.5, -10), wig(3.5, 8), { transform: 'scale(1.15)', offset: at(burst - 30) }, { transform: 'scale(1.5)', opacity: 0, offset: at(burst + 80) }, { transform: 'scale(1.5)', opacity: 0 }],
    { duration: ms, fill: 'both' },
  );
  const dirs = [[-26, -14], [0, -24], [22, -12], [-22, 12], [4, 18], [20, 10]];
  for (const [dx, dy] of dirs) {
    const p = layer(board, 'fx-dust', { x: b.x + b.w / 2 - 5, y: b.y + b.h / 2 - 5, w: 10, h: 10 }, ms);
    p.animate([{ opacity: 0, transform: 'none' }, { opacity: 0.9, transform: `translate(${dx * 0.3}px, ${dy * 0.3}px) scale(0.8)` }, { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(2)` }], { duration: ms - burst, delay: burst, easing: 'ease-out', fill: 'both' });
  }
}

// İflas (kare ve piyon güncellenmeden önce çağrılır): piyon sallanır (sallanma sesi), 430. ms'de renksizleşip düşer
// (hüzünlü trombon), 900. ms'den sonra mülklerinin şeritleri sırayla griye döner (her birinde çıt).
export function iflasFx(board, token, ownedCells) {
  const { ms, fall, strips, stripsSpread } = T.iflas;
  from('wobble', 0);
  from('sad', fall);
  const at = (t) => t / ms;
  if (token && !calm()) {
    const g = layer(board, 'fx-ghost', boxOf(token), ms, token.innerHTML);
    g.animate(
      [
        { transform: 'none', filter: 'none', opacity: 1 },
        { transform: 'rotate(-8deg)', offset: at(fall * 0.25) },
        { transform: 'rotate(7deg)', offset: at(fall * 0.5) },
        { transform: 'rotate(-4deg)', filter: 'grayscale(0.4)', offset: at(fall * 0.75) },
        { transform: 'none', filter: 'grayscale(1)', opacity: 1, offset: at(fall), easing: 'ease-in' },
        { transform: 'translateY(22px) rotate(24deg) scale(0.85)', filter: 'grayscale(1)', opacity: 0, offset: at(strips) },
        { opacity: 0 },
      ],
      { duration: ms, fill: 'both' },
    );
  }
  const n = ownedCells.length;
  ownedCells.forEach((cell, k) => {
    const strip = cell.querySelector('.strip');
    if (!strip) return;
    const when = strips + (n > 1 ? (k * stripsSpread) / (n - 1) : 0);
    hit('click', when);
    const cs = getComputedStyle(strip);
    const s = layer(board, 'fx-strip', inCell(cell, strip), ms);
    Object.assign(s.style, { background: cs.backgroundColor, boxShadow: cs.boxShadow, borderRadius: cs.borderRadius, transformOrigin: vertical(cell) ? '0 50%' : '50% 0' });
    s.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: vertical(cell) ? 'scaleX(0.43)' : 'scaleY(0.43)' }], { duration: 160, delay: when, easing: 'ease-in', fill: 'both' });
  });
}

// Jetonlar a'dan b'ye uçarken: kalkışta fırlatma sesi, her jeton konduğunda bir jeton sesi (perdesi hafif değişir).
// landAt(i): i. jetonun konduğu an (ms). Maaşta Başlangıç köşesi altın renkte parlar, kasa zili ilk parlamada.
export function coinSounds(n, landAt, salary, board, startCell) {
  if (salary) {
    blink(board, startCell, 'var(--gold)', T.flight);
    hit('ding', T.flight * 0.15);
  }
  from('toss', 0);
  const rates = [1, 1.06, 0.95, 1.1, 0.92, 1.03];
  for (let i = 0; i < n; i++) hit('clink', landAt(i), { rate: rates[i % rates.length], vol: i ? 0.75 : 1 });
}
