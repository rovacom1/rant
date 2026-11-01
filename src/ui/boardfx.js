// Tahta animasyonları (docs/TASARIM.md §11). Her animasyonun sabit bir zaman çizelgesi (ms) var; vuruş sesleri
// (zıplama, konma, mühür, jeton...) çizelgedeki anlara denk çalar: sesin en yüksek yeri görüntüdeki darbeyle aynı ana
// gelir (sound.js play, hit). Efektler tahtanın içinde, piyonların altında (z 4); kare büyümez, vurgu kenardadır.
// Hareket azaltma açıksa zıplama, halka, kenar çizgisi ve uçuş yok; parlama, etiket ve sesler kalır.
// Kademeler, donma, sarsıntı ve titreşim fx.js'te; toz ve jeton resimleri sprite.js'te.
import { pawn } from './pawns.js';
import { play } from './sound.js';
import { calm, FREEZE } from './fx.js';
import { dust, puff } from './sprite.js';

const LABEL_MS = 2400;

// Zaman çizelgeleri (ms).
export const T = {
  turn: { ms: 1000, land1: 500, land2: 1000 },
  own: { ms: 1000, draw: 600, fill: 400 },
  set: { ms: 1200, draw: 300, spread: 400, star: 800, starMs: 300 },
  flight: 900, // jetonların uçuşu (kira, maaş)
  build: { ms: 800, impact: 440, bounce: 600 },
  demolish: { ms: 1300, shake: 450, shakeMs: 320, burst: 800 },
  iflas: { ms: 1710, fall: 430, strips: 900, stripsSpread: 600 }, // büyük an: fall'da FREEZE ms donar, sonrası o kadar kayar
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
    // Halkalar piyonun ayağından, yere yayılan elips olarak açılır.
    const foot = { x: tb.x - tb.w * 0.1, y: tb.y + tb.h * 0.75, w: tb.w * 1.2, h: tb.h * 0.5 };
    for (let i = 0; i < 3; i++) {
      const r = layer(board, 'fx-ring', foot, ms);
      r.style.setProperty('--c', pl.color);
      r.animate([{ transform: 'scale(0.5)', opacity: 0.95 }, { transform: 'scale(2.6)', opacity: 0 }], { duration: ms * 0.7, delay: i * ms * 0.15, easing: 'ease-out', fill: 'both' });
    }
    const up = (y, s) => ({ transform: `translateY(${y}%) scale(${s})`, easing: 'ease-in' });
    token.firstElementChild?.animate(
      [{ transform: 'none', easing: 'ease-out' }, up(-34, 1.18), { transform: 'none', offset: land1 / ms, easing: 'ease-out' }, up(-14, 1.08), { transform: 'none' }],
      { duration: ms },
    );
  }
  // Etiket tahtanın üst yarısında karenin ve piyonun altında, alt yarısında üstünde çıkar (piyon kareden ortaya taşar).
  const cb = boxOf(cell);
  const down = cb.y + cb.h / 2 < board.clientHeight / 2;
  const low = Math.max(cb.y + cb.h, tb.y + tb.h * 1.15);
  const high = Math.min(cb.y, tb.y - tb.h * 0.2);
  const tag = layer(board, 'fx-tag', { x: 0, y: 0, w: 0, h: 0 }, LABEL_MS, `${pawn(pl.avatar, pl.color, 26, '', true)}<span></span>`);
  tag.lastElementChild.textContent = me ? 'Sıra sende!' : pl.name;
  tag.style.setProperty('--c', pl.color);
  Object.assign(tag.style, { width: '', height: '' });
  const w = tag.offsetWidth;
  tag.style.left = `${Math.max(6, Math.min(board.clientWidth - w - 6, tb.x + tb.w / 2 - w / 2))}px`;
  tag.style.top = down ? `${low + 6}px` : `${high - tag.offsetHeight - 6}px`;
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
  // Şerit karenin dönen yüzünde hep yatay (yan sütunlarda yüzle birlikte döner).
  strip.style.transformOrigin = '0 50%';
  strip.animate([{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: fill, delay: draw, easing: 'ease-out', fill: 'backwards' });
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

// Karedeki bina resmi ve kopyası. Kopya resmin kutusunda (.bld) durur, piyonların altında kalır.
const bldImg = (cell) => {
  const img = cell.querySelector('.bld img');
  return img && !img.hidden && img.getAttribute('src') ? img : null;
};
const hideFor = (el, ms) => el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: ms });
const copyOf = (img, ms, src = img.getAttribute('src')) => layer(img.parentElement, 'fx-bld', boxOf(img), ms, `<img src="${src}" alt="">`);

// Kat dikildi (kare yeni duruma çizildikten sonra): yeni bina resmi yukarıdan düşer (düşüş sesi), 440. ms'de yere çarpıp
// ezilir (tok ses), seker ve 800. ms'de yine konar.
export function buildFx(board, cell) {
  const { ms, impact, bounce } = T.build;
  const img = bldImg(cell);
  if (!img) return;
  from('slide', 0, { vol: 0.7 });
  hit('thud', impact);
  hit('tap', ms, { vol: 0.5, rate: 1.2 });
  if (calm()) return;
  const at = (t) => t / ms;
  hideFor(img, ms);
  copyOf(img, ms).animate(
    [
      { transform: 'translateY(-70%) scale(1.12)', opacity: 0, easing: 'ease-in' },
      { opacity: 1, offset: 0.12 },
      { transform: 'scale(1.14, 0.84)', offset: at(impact), easing: 'ease-out' },
      { transform: 'translateY(-9%) scale(1)', offset: at(bounce), easing: 'ease-in' },
      { transform: 'none', opacity: 1 },
    ],
    { duration: ms, fill: 'both' },
  );
  const b = boxOf(img);
  puff(img.parentElement, b.x + b.w / 2, b.y + b.h + 2, b.w * 0.9, impact - 20);
}

// Bina resmi seviyesi L iken binanın tepesi kutunun üstünden yüzde kaç aşağıda (resimler aynı kutuda kırpılı: 1 kat %40, 4 kat %0).
const roofAt = (L) => (L <= 0 ? 100 : Math.max(0, 40 - (40 / 3) * (L - 1)));

// Kaçak kat yıkıldı (kare güncellenmeden önce çağrılır): zabıta düdüğüyle kenar kırmızı yanar, binanın kaçak tepesi 450. ms'den
// titrer (tıkırtı), 800. ms'de toza dönüşür (puf); bir an yıkıntı görünür, sonra kalan bina.
export function demolishFx(board, cell, sound = true) {
  const { ms, shake, shakeMs, burst } = T.demolish;
  blink(board, cell, 'var(--neg)', ms);
  if (sound) {
    from('whistle', 0);
    from('rattle', shake);
    hit('poof', burst);
  }
  const img = bldImg(cell);
  if (!img || calm()) return;
  const src = img.getAttribute('src');
  const m = /\/k(\d)\.png$/.exec(src);
  const L = m ? Number(m[1]) + 1 : 1;
  const cut = roofAt(L - 1); // kalan binanın tepesi; üstü yıkılan kaçak kat
  const b = boxOf(img);
  const at = (t) => t / ms;
  hideFor(img, ms);
  const base = copyOf(img, ms);
  base.firstElementChild.style.clipPath = `inset(${cut}% 0 0 0)`;
  base.animate([{ opacity: 1 }, { opacity: 1, offset: at(burst) }, { opacity: 0, offset: at(burst + 60) }, { opacity: 0 }], { duration: ms, fill: 'both' });
  const top = copyOf(img, ms);
  top.firstElementChild.style.clipPath = `inset(0 0 ${100 - cut}% 0)`;
  top.style.transformOrigin = `50% ${cut}%`;
  const wig = (k, deg) => ({ transform: `rotate(${deg}deg)`, offset: at(shake + (k * shakeMs) / 4) });
  top.animate(
    [{ transform: 'none' }, { transform: 'none', offset: at(shake) }, wig(0.5, -6), wig(1.5, 5), wig(2.5, -4), wig(3.5, 3), { transform: 'scale(1.06)', offset: at(burst - 30) }, { transform: 'scale(1.3)', opacity: 0, offset: at(burst + 80) }, { transform: 'scale(1.3)', opacity: 0 }],
    { duration: ms, fill: 'both' },
  );
  const ruin = copyOf(img, ms, src.replace(/[^/]+\.png$/, 'yikik.png'));
  ruin.animate([{ opacity: 0 }, { opacity: 0, offset: at(burst - 20) }, { opacity: 1, offset: at(burst + 60) }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: ms, fill: 'both' });
  // Kaçak tepenin yerinde toz bulutu kabarır (sekiz karelik şerit), yıkıntıyı bir an örter.
  dust(img.parentElement, b.x + b.w / 2, b.y + (b.h * cut) / 100 + b.h * 0.12, b.w * 0.95, burst - 40, ms - burst);
}

// İflas (kare ve piyon güncellenmeden önce çağrılır): piyon sallanır (sallanma sesi), 430. ms'de renksizleşip düşer
// (hüzünlü trombon), 900. ms'den sonra mülklerinin şeritleri sırayla griye döner (her birinde çıt). Düşüş büyük an:
// tahta orada FREEZE ms donar (fx.impact), şeritlerin çıtları da o kadar sonra çalar.
export function iflasFx(board, token, ownedCells) {
  const { ms, fall, strips, stripsSpread } = T.iflas;
  const late = calm() ? 0 : FREEZE;
  from('wobble', 0);
  from('sad', fall);
  const at = (t) => t / ms;
  if (token && !calm()) {
    const g = layer(board, 'fx-ghost tk', boxOf(token), ms, token.innerHTML);
    for (const k of ['--s', '--pc']) g.style.setProperty(k, token.style.getPropertyValue(k));
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
    hit('click', when + late);
    const cs = getComputedStyle(strip);
    const s = layer(board, 'fx-strip', inCell(cell, strip), ms);
    Object.assign(s.style, { background: cs.backgroundColor, boxShadow: cs.boxShadow, borderRadius: cs.borderRadius, transformOrigin: vertical(cell) ? '0 50%' : '50% 0' });
    s.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: vertical(cell) ? 'scaleX(0.43)' : 'scaleY(0.43)' }], { duration: 160, delay: when, easing: 'ease-in', fill: 'both' });
  });
}

// Jetonların sesleri, kademeye göre (fx.js). landAt(i): i. jetonun konduğu an (ms). Küçükte (maaş) fırlatma yok, en
// çok üç kısık jeton; maaşta Başlangıç köşesi altın renkte parlar, kasa zili ilk parlamada. Ortada fırlatma ve her
// jetona bir ses. Büyükte ilk jeton tok bir vuruş ve kasa ziliyle düşer, sağanağın her üç jetonundan biri çınlar.
export function coinSounds({ n, landAt, tier, board, startCell, flight = T.flight }) {
  if (startCell) {
    blink(board, startCell, 'var(--gold)', flight);
    hit('ding', flight * 0.15);
  }
  const rates = [1, 1.06, 0.95, 1.1, 0.92, 1.03];
  if (tier !== 'small') from('toss', 0);
  if (tier === 'big') {
    hit('thud', landAt(0));
    hit('ding', landAt(0));
  }
  for (let i = 0; i < n; i++) {
    if (tier === 'big' && i % 3 && i !== n - 1) continue;
    hit('clink', landAt(i), { rate: rates[i % rates.length], vol: tier === 'small' ? 0.55 : i ? 0.75 : 1 });
  }
}

// Açık artırma bitti: teklif penceresi yerinde "Gidiyor... gidiyor... Satıldı!" der (say ile); iki tok vuruş, üçüncüsünde
// mühür ve satış sesi. Sözü pencereye yazmak çağıranın işi. Her sözde tokmak bir kez iner (assets/ihale/tokmak-vurus.webp);
// bloğa değdiği an sözün başından lead ms sonra, ses o ana çalar. hold: "Satıldı!"dan sonra pencerenin açık kaldığı süre.
export const CALL = { beat: 450, lead: 240, hold: 1500, words: ['Gidiyor...', 'gidiyor...', 'Satıldı!'] };
export function auctionFx(say) {
  const { beat, lead, words } = CALL;
  words.forEach((w, i) => {
    setTimeout(() => say(w, i === words.length - 1), i * beat);
    if (i < 2) hit('thud', lead + i * beat, { vol: 0.8 });
  });
  hit('stamp', lead + 2 * beat);
  from('sold', lead + 2 * beat);
}
