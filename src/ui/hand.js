// Elde kartlar: sağ sütunda, oyuncuların altında ızgara. Kart boyu sütunda kalan yere göre ayarlanır, tahtanın önüne geçmez.
// Üstüne gelince kart büyür; oynanabilir kart tahtaya sürüklenip bırakılınca oynanır, tıklayınca ayrıntısı açılır.
// Bileşen olayları belgeye 'rant:card' olarak yollar: { uid, how: 'click' | 'drop' }.
import { CARDS, cardId } from '../engine/index.js';
import { html, raw } from './dom.js';
import { ic } from './icons.js';
import { APP_VERSION } from '../version.js';

export const cardArt = (id) => `assets/kart/${id}.jpg?v=${APP_VERSION}`; // sürüm, yeni görselin önbellekten eskisiyle gelmesini önler
export const WHEN = { preroll: 'Zar atmadan önce', choose: 'Zar attıktan sonra', buy: 'Satın alırken' };

// Kartın kısa kuralı: elde kartın üstüne gelince (kart büyüyünce) resmin altında, adın altında belirir.
// En fazla RULE_MAX harf: kartın yazı alanında her boyda en fazla iki satır tutar (yazı boyu kart genişliğiyle ölçeklenir).
export const RULE_MAX = 28;
export const CARD_SHORT = {
  itiraz: 'Sana oynanan kartı iptal et',
  dayi: 'Bir kirayı ödeme',
  taksi: 'Zarsız 1 ile 12 kare git',
  kestirme: 'Zardan sonra tek zarla git',
  geriVites: 'Bu tur zar kadar geri git',
  kamulastirma: 'Rakip mülkünü bedeliyle al',
  takas: 'Mülkünü rakibinkiyle değiş',
  tedbir: 'Rakip mülkü 2 tur kira almaz',
  ihbar: 'Rakibin kaçakları yıkılır',
  kiraZammi: 'Alacağın ilk kira 2 katı',
  muteahhit: 'Mülküne bedava 1 kat',
  piyango: 'Bankadan 100 al',
  aidat: 'Herkes sana 30 öder',
  dava: 'Zar at, kazanan 100 alır',
  pazarlik: 'Mülkü yarı fiyatına al',
};

// Kartın türü (çerçeve rengi). Motorun hamle/tepki ayrımı ayrıca kalır; Savunma kartları tepkidir.
export const CARD_GROUPS = {
  saldiri: { name: 'Saldırı', color: '#d8283c' },
  kazanc: { name: 'Kazanç', color: '#e9b10c' },
  savunma: { name: 'Savunma', color: '#14918a' },
  hareket: { name: 'Hareket', color: '#6a3fb0' },
};
export const CARD_GROUP = {
  kamulastirma: 'saldiri', takas: 'saldiri', tedbir: 'saldiri', ihbar: 'saldiri', dava: 'saldiri',
  kiraZammi: 'kazanc', muteahhit: 'kazanc', piyango: 'kazanc', aidat: 'kazanc', pazarlik: 'kazanc',
  itiraz: 'savunma', dayi: 'savunma',
  taksi: 'hareket', kestirme: 'hareket', geriVites: 'hareket',
};

// Başlık yazı tipinde (Rubik, kalın) bir yazının em cinsinden yaklaşık genişliği; ölçülen değerden biraz fazladır.
// CSS bunu --ne ile alır ve adı kutuya sığacak boyda yazar (bkz. styles/kart.css .k-name, .d-name).
const NARROW = /[iıIİjlJ ,.·']/;
const MID = /[frt\-]/;
const WIDE = /[mMwW]/;
export const emWidth = (s) =>
  Math.round([...String(s)].reduce((a, ch) => a + (NARROW.test(ch) ? 0.31 : MID.test(ch) ? 0.46 : WIDE.test(ch) ? 0.98 : ch === ch.toUpperCase() && ch !== ch.toLowerCase() ? 0.75 : 0.66), 0) * 100) / 100;

// Tek kartın yüzü: türünün renginde çerçeve, kare resim, altında sabit yükseklikte yazı alanı (tek satır ad, büyüyünce kısa kural).
// Köşedeki şimşek rozeti kartın şu an oynanabildiğini gösterir (CSS .hslot.playable). Yazı boyları kart genişliğine
// oranlıdır (CSS cqw), uzun adda --nl ile küçülür: sığma her boyda aynıdır.
export function cardFace(id, cls = '') {
  const c = CARDS[id];
  const g = CARD_GROUPS[CARD_GROUP[id]] || CARD_GROUPS.kazanc;
  const rule = CARD_SHORT[id] || c.text;
  return html`<div class="kart ${c.type} g-${CARD_GROUP[id] || 'kazanc'} ${cls}" style="--t:${g.color};--ne:${emWidth(c.name)}" aria-label="${c.name} kartı, ${g.name}: ${rule}">
    <div class="k-art" style="background-image:url(${cardArt(id)})"></div>
    <span class="k-now">${raw(ic('bolt'))}</span>
    <div class="k-txt"><div class="k-name">${c.name}</div><span class="k-rule">${rule}</span></div>
  </div>`;
}

const REDUCE = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
const still = () => !!REDUCE?.matches;
const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
// Kartın arka yüzü (dönerken görünür). Kartla aynı kutuda, ters çevrili durur.
const backFace = () => {
  const b = document.createElement('i');
  b.className = 'k-back';
  b.style.backgroundImage = `url(assets/kart/arka.jpg?v=${APP_VERSION})`;
  return b;
};

// Çekilen kart desteden dönerek eldeki yerine gelir. cardEl: eldeki .hslot (ya da içindeki .kart); from: destenin kutusu.
export function drawFx(cardEl, from) {
  const slot = cardEl?.closest('.hslot') || cardEl;
  if (!slot || !from || still()) return Promise.resolve();
  const r = slot.getBoundingClientRect();
  const a = center(from);
  const b = center(r);
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const s = Math.min(1.5, Math.max(0.3, from.width / r.width));
  const back = backFace();
  slot.appendChild(back);
  slot.classList.add('flying');
  const t = (x, y, sc, z, ry) => `perspective(800px) translate(${x}px, ${y}px) scale(${sc}) rotateZ(${z}deg) rotateY(${ry}deg)`;
  const anim = slot.animate(
    [
      { transform: t(dx, dy, s, -14, 180) },
      { transform: t(dx * 0.35, dy * 0.35 - 24, (s + 1.1) / 2, -5, 80), offset: 0.5 },
      { transform: t(0, 0, 1.06, 0, 0), offset: 0.85 },
      { transform: t(0, 0, 1, 0, 0) },
    ],
    { duration: 620, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
  );
  return anim.finished.catch(() => {}).finally(() => {
    back.remove();
    slot.classList.remove('flying');
  });
}

// Oynanan kart elden tahtanın ortasına uçar, havada döner ve masaya iner; kısa durup söner.
// cardEl: eldeki kart (.hslot ya da .kart, hala sayfada); to: inilecek alanın kutusu (ör. tahtanın ortası).
export function playFx(cardEl, to) {
  const k = cardEl?.classList.contains('kart') ? cardEl : cardEl?.querySelector('.kart');
  if (!k || !to) return Promise.resolve();
  const from = k.getBoundingClientRect();
  // Dış kutu yalnız söner; içteki kutu 3B döner (saydamlık 3B'yi düzleştirmesin diye ayrı).
  const ghost = document.createElement('div');
  ghost.className = 'kart-ghost';
  Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  ghost.style.setProperty('--gw', `${from.width}px`);
  const flip = document.createElement('div');
  flip.className = 'k-flip';
  flip.innerHTML = k.outerHTML;
  flip.firstElementChild.style.transform = 'none';
  flip.appendChild(backFace());
  ghost.appendChild(flip);
  document.body.appendChild(ghost);
  const done = () => ghost.remove();
  if (still()) return ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).finished.catch(() => {}).finally(done);
  const a = center(from);
  const b = center(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const s = Math.min(170, to.width * 0.3) / from.width;
  const t = (x, y, sc, ry) => `perspective(900px) translate(${x}px, ${y}px) scale(${sc}) rotateY(${ry}deg)`;
  flip.animate(
    [
      { transform: t(0, 0, 1, 0) },
      { transform: t(dx * 0.6, dy * 0.6 - 40, s * 1.15, 180), offset: 0.4 },
      { transform: t(dx, dy - 10, s * 1.08, 360), offset: 0.62 },
      { transform: t(dx, dy, s * 0.96, 360), offset: 0.7 },
      { transform: t(dx, dy, s, 360) },
    ],
    { duration: 1100, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' },
  );
  return ghost
    .animate([{ opacity: 1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1300 })
    .finished.catch(() => {})
    .finally(done);
}

const DRAG_START = 8; // px
const GAP = 8; // kartlar arası boşluk (CSS .hand-grid gap ile aynı)
const MAX_W = 128; // kartın en geniş hali
const ZOOM_W = 220; // üstüne gelince kartın genişliği
const RATIO = 1.42; // kart yüksekliği / genişliği (CSS .kart)
// Telefon düzenleri (CSS ile aynı eşikler, styles/main.css): dikeyde el yatay bir şeritte kayar, yatayda (alçak ekran)
// sağ sütunda dikey kayar. İkisinde de kart, kaydırılan yönün tersine sürüklenince oynanır (tarayıcı kaydırmayı yapar).
const SHORT = globalThis.matchMedia?.('(orientation: landscape) and (max-height: 520px)');
const PHONE = globalThis.matchMedia?.('(max-width: 760px) and (orientation: portrait), (max-width: 760px) and (min-height: 521px)');

// n kartı w x h alana en büyük boyda yerleştiren sütun sayısı ve kart genişliği.
// h yoksa (dar ekranda sütun içerik kadar uzar) yalnız genişliğe bakılır, kart 100 px'ten küçülmez.
// scroll: alçak ekranda kart en fazla h boyunda olur, sığmayan satırlar dikey kayar.
export function fitGrid(n, w, h, scroll = false) {
  if (!n) return { cols: 1, w: MAX_W };
  if (scroll) {
    const cw = Math.max(64, Math.min(MAX_W, h / RATIO));
    const cols = Math.max(1, Math.min(n, Math.floor((w + GAP) / (cw + GAP))));
    return { cols, w: Math.floor(Math.min(cw, (w - (cols - 1) * GAP) / cols)) };
  }
  if (!h) {
    const cols = Math.max(1, Math.min(n, Math.floor((w + GAP) / (100 + GAP))));
    return { cols, w: Math.floor(Math.min(MAX_W, (w - (cols - 1) * GAP) / cols)) };
  }
  // En büyük kart; eşitse daha az satır (ızgara dolu görünür), satır da eşitse daha az sütun (dengeli dizilir).
  let best = { cols: 1, rows: n, w: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const cw = Math.min(MAX_W, (w - (cols - 1) * GAP) / cols, (h - (rows - 1) * GAP) / rows / RATIO);
    if (cw > best.w + 0.5 || (cw > best.w - 0.5 && rows < best.rows)) best = { cols, rows, w: cw };
  }
  return { cols: best.cols, w: Math.floor(best.w) };
}

export class Hand {
  // el: kartların ızgarası; drop: üzerine bırakılınca kartın oynandığı alan (tahta);
  // deck (isteğe bağlı): deste; verilirse yeni çekilen kart oradan dönerek gelir (drawFx).
  constructor(el, drop, deck = null) {
    this.el = el;
    this.drop = drop;
    this.deck = deck;
    this.tilted = null;
    this.items = new Map(); // uid -> element
    this.order = [];
    this.drag = null;
    el.addEventListener('pointerdown', (e) => this.down(e));
    el.addEventListener('pointermove', (e) => this.tilt(e));
    el.addEventListener('pointerleave', () => this.untilt());
    // klavye: Enter ya da boşluk kartı açar (tıklama gibi)
    el.addEventListener('keydown', (e) => {
      const slot = (e.key === 'Enter' || e.key === ' ') && e.target.closest('.hslot');
      if (!slot) return;
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('rant:card', { detail: { uid: slot.dataset.uid, how: 'click' } }));
    });
    window.addEventListener('pointermove', (e) => this.move(e));
    window.addEventListener('pointerup', (e) => this.up(e));
    // Tarayıcı dokunuşu kaydırmaya çevirince: ne sürükleme ne tıklama.
    window.addEventListener('pointercancel', () => this.cancel());
    new ResizeObserver(() => this.layout()).observe(el);
    for (const q of [PHONE, SHORT]) q?.addEventListener('change', () => this.layout());
  }

  // uids: eldeki kartlar; state(uid) -> { playable, selected }; fresh: yeni gelenler (desteden dönerek gelir).
  render(uids, state, fresh = []) {
    for (const [uid, el] of this.items) {
      if (!uids.includes(uid)) {
        el.remove();
        this.items.delete(uid);
      }
    }
    uids.forEach((uid) => {
      let el = this.items.get(uid);
      if (!el) {
        el = document.createElement('div');
        el.className = 'hslot';
        el.dataset.uid = uid;
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.innerHTML = String(cardFace(cardId(uid)));
        this.items.set(uid, el);
        this.el.appendChild(el);
      }
      const st = state(uid);
      el.classList.toggle('playable', !!st.playable);
      el.classList.toggle('idle', !!st.idle);
      el.classList.toggle('selected', !!st.selected);
    });
    // Sıra yalnız değiştiyse yeniden dizilir; yerinden oynayan kartın parıltısı baştan başlar.
    if ([...this.el.children].some((c, i) => c.dataset.uid !== uids[i])) for (const uid of uids) this.el.appendChild(this.items.get(uid));
    this.order = uids;
    this.layout();
    if (this.deck) {
      const from = this.deck.getBoundingClientRect();
      for (const uid of fresh) if (this.items.has(uid)) drawFx(this.items.get(uid), from);
    }
  }

  // Fare kartın üstündeyken kart imlece doğru hafifçe eğilir, parıltı imleci izler (hareket azaltmada durur).
  tilt(e) {
    const slot = e.pointerType === 'mouse' && !this.drag?.moving && !still() ? e.target.closest('.hslot') : null;
    if (slot !== this.tilted) this.untilt();
    if (!slot) return;
    this.tilted = slot;
    const r = slot.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const k = slot.querySelector('.kart');
    k.style.setProperty('--ry', `${((x - 0.5) * 16).toFixed(1)}deg`);
    k.style.setProperty('--rx', `${((0.5 - y) * 12).toFixed(1)}deg`);
    k.style.setProperty('--mx', `${Math.round(x * 100)}%`);
    k.style.setProperty('--my', `${Math.round(y * 100)}%`);
  }

  untilt() {
    const k = this.tilted?.querySelector('.kart');
    if (k) for (const p of ['--rx', '--ry', '--mx', '--my']) k.style.removeProperty(p);
    this.tilted = null;
  }

  layout() {
    const n = this.order.length;
    const short = !!SHORT?.matches;
    // Alçak ekranda ızgaranın iç boşluğu düşülür; tek satır kart kaydırma çubuğu çıkarmasın.
    const { cols, w } = fitGrid(n, this.el.clientWidth - (short ? 4 : 0), PHONE?.matches && !short ? 0 : this.el.clientHeight - (short ? 6 : 0), short);
    this.el.style.setProperty('--cols', cols);
    this.el.style.setProperty('--hw', `${w}px`);
    this.el.style.setProperty('--zoom', Math.max(1, ZOOM_W / w).toFixed(3));
    const rows = Math.ceil(n / cols);
    // Büyüyen kart ızgaranın içine doğru açılır: kenardaki kart dışarı taşmaz.
    this.order.forEach((uid, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cols === 1 ? 'center' : col === 0 ? 'left' : col === cols - 1 ? 'right' : 'center';
      const y = rows > 1 && row === 0 ? 'top' : 'bottom';
      this.items.get(uid).style.transformOrigin = `${x} ${y}`;
    });
  }

  // Eldeki kartın öğesi (.hslot; playFx için), yoksa null.
  cardEl(uid) {
    return this.items.get(uid) || null;
  }

  overDrop(e) {
    const r = this.drop.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }

  down(e) {
    if (e.button !== 0) return;
    const el = e.target.closest('.hslot');
    if (!el) return;
    this.drag = { el, uid: el.dataset.uid, x0: e.clientX, y0: e.clientY, moving: false, moved: false };
  }

  move(e) {
    const d = this.drag;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moving) {
      if (Math.hypot(dx, dy) < DRAG_START) return;
      d.moved = true; // parmak kaydı: bırakınca kart açılmaz
      if (!d.el.classList.contains('playable')) return;
      d.moving = true;
      this.untilt();
      d.el.classList.add('dragging');
      document.body.classList.add('carddrag'); // tahtadaki kareler sürüklerken kalkmaz
    }
    d.el.style.setProperty('--dx', `${dx}px`);
    d.el.style.setProperty('--dy', `${dy}px`);
    d.el.classList.toggle('armed', this.overDrop(e));
  }

  up(e) {
    const d = this.cancel();
    if (!d) return;
    const armed = d.moving && this.overDrop(e);
    if (d.moved && !armed) return;
    document.dispatchEvent(new CustomEvent('rant:card', { detail: { uid: d.uid, how: armed ? 'drop' : 'click' } }));
  }

  // Sürüklemeyi bırakır, kartı yerine koyar; bırakılan sürüklemeyi döndürür.
  cancel() {
    const d = this.drag;
    if (!d) return null;
    this.drag = null;
    d.el.classList.remove('dragging', 'armed');
    document.body.classList.remove('carddrag');
    d.el.style.removeProperty('--dx');
    d.el.style.removeProperty('--dy');
    return d;
  }
}
