// Elde kartlar: sağ sütunda, oyuncuların altında ızgara; dikey telefonda alttan sayfada yelpaze. Kart boyu kalan yere göre
// ayarlanır, tahtanın önüne geçmez. Üstüne gelince kart büyür; oynanabilir kart kaldırılıp tahtaya bırakılınca oynanır
// (sürüklerken geçerli hedefler parlar, hedefin üstüne bırakılan kart o hedefle oynar), tıklayınca ayrıntısı açılır.
// Bileşen olayları belgeye 'rant:card' olarak yollar: { uid, how: 'click' | 'drop' }; bırakılan hedefi aim bilir.
import { CARDS, cardId } from '../engine/index.js';
import { html, raw } from './dom.js';
import { ic } from './icons.js';
import { APP_VERSION } from '../version.js';
import { cardShort } from './modetext.js';

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
  const rule = cardShort(id) || CARD_SHORT[id] || c.text;
  return html`<div class="kart ${c.type} g-${CARD_GROUP[id] || 'kazanc'} ${cls}" style="--t:${g.color};--ne:${emWidth(c.name)}" aria-label="${c.name} kartı, ${g.name}: ${rule}">
    <div class="k-art" style="background-image:url(${cardArt(id)})"></div>
    <span class="k-now">${raw(ic('bolt'))}</span>
    <div class="k-txt"><div class="k-name">${c.name}</div><span class="k-rule">${rule}</span></div>
  </div>`;
}

const REDUCE = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
const still = () => !!REDUCE?.matches;
const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
// Kartın döndürülmemiş kutusu (yelpazede kart eğik durur; çevreleyen kutu kartı büyük gösterir).
const boxOf = (k) => {
  const r = k.getBoundingClientRect();
  const w = k.offsetWidth || r.width;
  const h = k.offsetHeight || r.height;
  const c = center(r);
  return { left: c.x - w / 2, top: c.y - h / 2, width: w, height: h };
};
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

// El kapalıyken (telefonda alttan sayfa) çekilen kart desteden (from) dönerek çıkar, bir an yüzünü gösterir ve elin
// düğmesine (to) küçülerek girer.
export function drawToFx(id, from, to) {
  if (!from || !to || !to.width || still()) return Promise.resolve();
  const w = 72;
  const a = center(from);
  const b = center(to);
  const ghost = document.createElement('div');
  ghost.className = 'kart-ghost';
  Object.assign(ghost.style, { left: `${a.x - w / 2}px`, top: `${a.y - w * 0.7}px`, width: `${w}px`, height: `${w * 1.4}px` });
  ghost.style.setProperty('--gw', `${w}px`);
  const flip = document.createElement('div');
  flip.className = 'k-flip';
  flip.innerHTML = String(cardFace(id));
  flip.appendChild(backFace());
  ghost.appendChild(flip);
  document.body.appendChild(ghost);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = (x, y, sc, z, ry) => `perspective(800px) translate(${x}px, ${y}px) scale(${sc}) rotateZ(${z}deg) rotateY(${ry}deg)`;
  return flip
    .animate(
      [
        { transform: t(0, 0, 0.6, -14, 180) },
        { transform: t(0, -30, 1.25, -4, 0), offset: 0.4 },
        { transform: t(0, -30, 1.25, 0, 0), offset: 0.62 },
        { transform: t(dx, dy, 0.45, 10, 0) },
      ],
      { duration: 900, easing: 'cubic-bezier(0.45, 0, 0.3, 1)', fill: 'forwards' },
    )
    .finished.catch(() => {})
    .finally(() => ghost.remove());
}

// Oynanan kart elden tahtanın ortasına uçar, havada döner ve masaya iner; kısa durup söner.
// cardEl: eldeki kart (.hslot ya da .kart, hala sayfada); to: inilecek alanın kutusu (ör. tahtanın ortası); at: kartın
// kalktığı kutu (verilmezse kartın kendi yeri; kart bırakıldığı yerden ya da el kapalıyken elin düğmesinden kalkar).
export function playFx(cardEl, to, at = null) {
  const k = cardEl?.classList.contains('kart') ? cardEl : cardEl?.querySelector('.kart');
  if (!k || !to) return Promise.resolve();
  const from = at || boxOf(k);
  if (!from.width) return Promise.resolve();
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
const FAN_W = 96; // dikey telefonda yelpazedeki kart
const RATIO = 1.42; // kart yüksekliği / genişliği (CSS .kart)
// Telefon düzenleri: dikeyde (body.tel, phone.js TEL) el alttan sayfada yelpaze olur, kart her yöne kaldırılır. Yatayda
// (alçak ekran) sağ sütunda dikey kayar; kart kaydırılan yönün tersine sürüklenince oynanır (tarayıcı kaydırmayı yapar).
// Kayan ya da eğik dizilen kart kesilmesin diye sürüklenen kartın sayfaya sabit bir kopyası parmağı izler.
const SHORT = globalThis.matchMedia?.('(orientation: landscape) and (max-height: 520px)');
const fanned = () => typeof document !== 'undefined' && document.body.classList.contains('tel');

// Yelpaze: n kartın yatay kayması, düşüşü ve eğimi (kart genişliği w, kutu genişliği width). Ortadaki kart en yüksekte,
// kenardaki kart en fazla FAN_DROP px aşağıda ve en çok 15 derece eğik; kartlar kutudan taşmaz.
export const FAN_DROP = 22;
export function fanLayout(n, w, width) {
  const half = (n - 1) / 2;
  const step = n > 1 ? Math.min(w * 0.72, (width - w) / (n - 1)) : 0;
  const deg = n > 1 ? Math.min(7, 30 / (n - 1)) : 0;
  const k = half ? Math.min(4, FAN_DROP / (half * half)) : 0;
  return Array.from({ length: n }, (_, i) => {
    const m = i - half;
    return { x: Math.round(m * step), y: Math.round(m * m * k), r: +(m * deg).toFixed(1) };
  });
}
// Yelpazedeki kartın genişliği: kalabalık elde küçülür ki her kartın görünen şeridi parmakla tutulabilsin.
export const fanWidth = (n, width) => Math.floor(Math.min(FAN_W, width / 3.4, width / (1 + 0.42 * Math.max(0, n - 1))));

// n kartı w x h alana en büyük boyda yerleştiren sütun sayısı ve kart genişliği.
// h yoksa (el gizliyken) yalnız genişliğe bakılır, kart 100 px'ten küçülmez.
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

// Sürüklenen kartın sayfaya sabit kopyası (kayan ya da eğik elde kart kesilmesin); asıl kart yerinde solar.
function ghostOf(slot) {
  const k = slot.querySelector('.kart');
  const r = boxOf(k);
  const g = document.createElement('div');
  g.className = 'kart-drag';
  Object.assign(g.style, { left: `${r.left}px`, top: `${r.top}px` });
  g.style.setProperty('--w', `${r.width}px`);
  g.innerHTML = k.outerHTML;
  document.body.appendChild(g);
  slot.classList.add('ghosted');
  return g;
}

export class Hand {
  // el: kartların ızgarası; drop: üzerine bırakılınca kartın oynandığı alan (tahta);
  // deck (isteğe bağlı): deste; verilirse yeni çekilen kart oradan dönerek gelir (drawFx).
  // aim (isteğe bağlı): sürüklemede hedefler { start(uid), over(x, y) -> hedefin üstünde mi, end() }.
  // hidden(uid) (isteğe bağlı): el görünmezken (telefonda sayfa kapalı) çekilen kart için.
  constructor(el, drop, deck = null, { aim = null, hidden = null } = {}) {
    this.el = el;
    this.drop = drop;
    this.deck = deck;
    this.aim = aim;
    this.hidden = hidden;
    this.dropAt = null; // son bırakılan kart ve yeri: oynanınca kart oradan kalkar
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
    SHORT?.addEventListener('change', () => this.layout());
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
      el.classList.toggle('lift', !!st.lift);
      el.classList.toggle('selected', !!st.selected);
    });
    // Sıra yalnız değiştiyse yeniden dizilir; yerinden oynayan kartın parıltısı baştan başlar.
    if ([...this.el.children].some((c, i) => c.dataset.uid !== uids[i])) for (const uid of uids) this.el.appendChild(this.items.get(uid));
    this.order = uids;
    this.layout();
    if (this.deck) {
      const from = this.deck.getBoundingClientRect();
      const shown = this.el.offsetParent !== null && from.width > 0;
      for (const uid of fresh) if (this.items.has(uid)) (shown ? drawFx(this.items.get(uid), from) : this.hidden?.(uid));
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
    const fan = fanned();
    this.el.classList.toggle('fan', fan);
    if (fan) return this.layoutFan(n);
    for (const el of this.items.values()) {
      for (const p of ['--fx', '--fy', '--fr']) el.style.removeProperty(p);
      el.style.zIndex = '';
    }
    const short = !!SHORT?.matches;
    // Alçak ekranda ızgaranın iç boşluğu düşülür; tek satır kart kaydırma çubuğu çıkarmasın.
    const { cols, w } = fitGrid(n, this.el.clientWidth - (short ? 4 : 0), this.el.clientHeight - (short ? 6 : 0), short);
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

  // Dikey telefonda yelpaze: kartlar alttaki bir noktadan açılır, ortadaki en yüksekte; sağdaki kart üstte durur.
  layoutFan(n) {
    const width = (this.el.clientWidth || 360) - 28; // kenar kartın eğimi taşmasın
    const w = fanWidth(n, width);
    this.el.style.setProperty('--hw', `${w}px`);
    fanLayout(n, w, width).forEach((f, i) => {
      const el = this.items.get(this.order[i]);
      el.style.setProperty('--fx', `${f.x}px`);
      el.style.setProperty('--fy', `${f.y}px`);
      el.style.setProperty('--fr', `${f.r}deg`);
      el.style.transformOrigin = '';
      el.style.zIndex = String(i + 1);
    });
  }

  // Oynanan kartın kalkacağı kutu: az önce bırakıldıysa bırakıldığı yer, el görünüyorsa kendi yeri, yoksa null.
  fromRect(uid) {
    const d = this.dropAt;
    if (d && d.uid === uid && Date.now() - d.t < 4000) return d.rect;
    const el = this.items.get(uid);
    const k = el?.querySelector('.kart');
    return k && el.offsetParent !== null ? boxOf(k) : null;
  }

  // Eldeki kartın öğesi (.hslot; playFx için), yoksa null.
  cardEl(uid) {
    return this.items.get(uid) || null;
  }

  overDrop(e) {
    const r = this.drop.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }

  // Bırakılabilir mi: bir hedefin (kare, oyuncu) ya da tahtanın üstünde; hot: hedefin üstünde.
  armedAt(e) {
    const hot = !!this.aim?.over(e.clientX, e.clientY);
    return { armed: hot || this.overDrop(e), hot };
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
      Object.assign(d, { moving: true, rot: 0, lx: e.clientX });
      this.untilt();
      document.body.classList.add('carddrag'); // tahtadaki kareler sürüklerken kalkmaz
      const st = getComputedStyle(this.el);
      if (!this.el.classList.contains('fan') && st.overflowX === 'visible' && st.overflowY === 'visible') d.el.classList.add('dragging');
      else d.ghost = ghostOf(d.el);
      this.aim?.start(d.uid);
    }
    const { armed, hot } = this.armedAt(e);
    if (d.ghost) {
      // kaldırılan kart elin hızıyla hafifçe yana yatar; hedefin üstünde küçülüp oturmaya hazırlanır
      d.rot = still() ? 0 : Math.max(-14, Math.min(14, d.rot * 0.8 + (e.clientX - d.lx) * 0.5));
      d.lx = e.clientX;
      d.ghost.style.transform = `translate(${dx}px, ${dy}px) rotate(${d.rot.toFixed(1)}deg) scale(${hot ? 0.92 : 1.1})`;
      d.ghost.classList.toggle('armed', armed);
      return;
    }
    d.el.style.setProperty('--dx', `${dx}px`);
    d.el.style.setProperty('--dy', `${dy}px`);
    d.el.classList.toggle('armed', armed);
  }

  up(e) {
    const g = this.drag;
    const armed = !!g?.moving && this.armedAt(e).armed;
    if (armed) this.dropAt = { uid: g.uid, rect: boxOf((g.ghost || g.el).querySelector('.kart')), t: Date.now() };
    const d = this.cancel();
    if (!d) return;
    if (d.moved && !armed) return;
    document.dispatchEvent(new CustomEvent('rant:card', { detail: { uid: d.uid, how: armed ? 'drop' : 'click' } }));
  }

  // Sürüklemeyi bırakır, kartı yerine koyar; bırakılan sürüklemeyi döndürür.
  cancel() {
    const d = this.drag;
    if (!d) return null;
    this.drag = null;
    if (d.moving) this.aim?.end();
    d.ghost?.remove();
    d.el.classList.remove('dragging', 'armed', 'ghosted');
    document.body.classList.remove('carddrag');
    d.el.style.removeProperty('--dx');
    d.el.style.removeProperty('--dy');
    return d;
  }
}
