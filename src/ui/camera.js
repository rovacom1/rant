// Kamera: yalnız dikey telefonda (body.tel; masaüstü ve yatay telefon düz tahtayı görür). Tahta düzlemi eğik durur
// (perspective + rotateX, TILT ve PERSP); piyon, bina, simge ve adlar düzlemde dik durur (styles/telefon.css --stand).
// Kamera tahtayı yalnız translate ve scale özellikleriyle kaydırır ve yakınlaştırır (CSS geçişi, yalnız birleştiricide);
// sarsıntı (fx.js) transform'a eklenir, ikisi çakışmaz. Kipler ("Hissiyat kılavuzu", tasks/mobil-kalite-plani.md 6):
//   masa   bütün tahta (karar öncesi, tur başı)
//   izle   yürüyen piyonu 1,7 kat yakından, bir kare önünden izler
//   takip  sıra başkasındayken (izleyici) zar atıldıktan sonra onun karesine hafifçe (1,15 kat) yaklaşır; atmadan önce masa
//   odak   bir kareye yaklaşır; kare alttan sayfanın üstünde kalan alanın ortasında durur
//   hedef  bütün tahta alttan sayfanın üstündeki alana sığar (geçerli hedefler parlar, ötekiler kararır: board .picking)
// Kamera hiçbir şeyi beklemez, hiçbir canlandırma onu beklemez: ev sahibinin süre bütçesini (net/host.js PACE) uzatmaz.
// Hareket azaltmada kamera kıpırdamaz (masa). Tahtayı tahta görünümü sözleşmesiyle tanır (boardview.js): Mahalle arazisi
// de aynı kamerayı kullanır. win: tahtanın penceresi (kırpan kutu, .boardcam); tahta onun içinde mutlak konumda.

export const TILT = 30; // derece; telefon.css --stand = 1 / cos(TILT) buradan yazılır
export const PERSP = 1300; // px
export const ZOOM = { izle: 1.7, odak: 1.6, takip: 1.15 };
const MS = 420; // kip geçişi
const rad = (d) => (d * Math.PI) / 180;

// Düz tahtada merkeze göre (x, y) noktası eğilince ekranda merkeze göre nereye düşer; k: o satırın perspektif ölçeği.
export function project(x, y, tilt = TILT, persp = PERSP) {
  const r = rad(tilt);
  const k = persp / (persp - y * Math.sin(r));
  return { x: x * k, y: y * Math.cos(r) * k, k };
}

// Eğik tahtanın düz kutusu: slot { x, y, w, h } içine sığan en geniş tahta. Yakın (alt) kenar en geniştir, slotun
// genişliğine oturur; boy oranı amin..amax arasında, yer kaldıkça tahta boyuna uzar (eğik tahta kısa görünür).
// Döner { w, h, x, y }: düz kutunun slotun içindeki yeri (eğilince slotun ortasına oturur).
export function fitTilt(slot, { tilt = TILT, persp = PERSP, amin = 1, amax = 1.4 } = {}) {
  const sn = Math.sin(rad(tilt));
  const span = (w, a) => project(0, (a * w) / 2, tilt, persp).y - project(0, (-a * w) / 2, tilt, persp).y;
  const widest = (a) => (slot.w * persp) / (persp + (slot.w * a * sn) / 2); // yakın kenarı slot genişliğinde
  const search = (ok, lo, hi) => {
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (ok(m)) lo = m;
      else hi = m;
    }
    return lo;
  };
  let a = amax;
  let w = widest(a);
  if (span(w, a) > slot.h) {
    if (span(widest(amin), amin) <= slot.h) {
      a = search((m) => span(widest(m), m) <= slot.h, amin, amax);
      w = widest(a);
    } else {
      a = amin;
      w = search((m) => span(m, amin) <= slot.h, 0, widest(amin));
    }
  }
  const h = a * w;
  const top = project(0, -h / 2, tilt, persp).y;
  const spare = slot.h - span(w, a);
  return { w, h, x: slot.x + (slot.w - w) / 2, y: slot.y + spare / 2 - top - h / 2 };
}

// Düz tahtanın merkezine göre ekrandaki (eğik) y'nin düz tahtadaki karşılığı (project'in tersi, yalnız y).
const unproject = (y, tilt = TILT, persp = PERSP) => (y * persp) / (Math.cos(rad(tilt)) * persp + y * Math.sin(rad(tilt)));

// Pencerenin kenarına bırakılan pay (fit ile aynı): üstte piyon başları, altta ince bir çizgi.
const PAD_T = 8;
const PAD_B = 4;

// Yakınlaşan tahta pencereyi doldurur: tahtanın merkezi (bx, by) ekranda, s kat. Tahta görünen alandan büyükse kenarı
// içeri kaçmaz (üstte ve altta yalnız fit kadar pay); yatayda alttaki görünen sıranın (en geniş görünen sıra) iki ucu
// pencerenin dışında kalır. Sığıyorsa ortalanır: içinde boş masa kalmaz. Döner { x, y, s } (tahtanın kendi yerine göre).
export function place(box, s, bx, by, view) {
  const t = s * project(0, -box.h / 2).y; // tahtanın üst ve alt kenarı, merkezine göre
  const u = s * project(0, box.h / 2).y;
  const room = view.bottom - view.top;
  if (u - t + PAD_T + PAD_B > room) by = Math.min(view.top + PAD_T - t, Math.max(view.bottom - PAD_B - u, by));
  else by = view.top + (room - (u - t)) / 2 - t;
  const yb = Math.min(box.h / 2, unproject((view.bottom - by) / s)); // pencerenin altındaki sıra (düz, merkeze göre)
  const half = (s * box.w * project(0, yb).k) / 2;
  bx = half * 2 > view.w ? Math.min(half, Math.max(view.w - half, bx)) : view.w / 2;
  return { x: bx - (box.x + box.w / 2), y: by - (box.y + box.h / 2), s };
}

// Kameranın duruşu: düz tahtadaki p noktası, s kat yakınlaşınca pencerede at noktasına gelsin (place'in sınırları içinde).
// box: tahtanın penceredeki düz kutusu; view: görünen alan { w, top, bottom } (pencerede px).
export function pose(box, p, s, at, view) {
  const q = project(p.x - box.w / 2, p.y - box.h / 2);
  return place(box, s, at.x - s * q.x, at.y - s * q.y, view);
}

const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Camera {
  constructor(view, win) {
    this.view = view;
    this.win = win;
    this.on = false;
    this.box = null;
    this.want = { mode: 'masa' };
    this.key = '';
    new ResizeObserver(() => this.on && this.fit()).observe(win);
  }

  // Telefon düzenine girince eğer, çıkınca düz tahtaya döner (bütün stiller kalkar).
  enable(on) {
    this.on = on;
    const st = this.view.el.style;
    if (!on) {
      for (const k of ['transform', 'translate', 'scale', 'transition', '--stand']) st.removeProperty(k);
      for (const k of ['--bw', '--bh', '--bx', '--by']) this.win.style.removeProperty(k);
      this.box = null;
      this.key = '';
      return;
    }
    st.transform = `perspective(${PERSP}px) rotateX(${TILT}deg)`;
    st.setProperty('--stand', (1 / Math.cos(rad(TILT))).toFixed(4));
    this.fit();
  }

  // Tahtayı pencereye oturtur: üstte piyon başları için küçük pay, yanlarda kenar boşluğu.
  fit() {
    const W = this.win.clientWidth;
    const H = this.win.clientHeight;
    if (!W || !H) return;
    const f = fitTilt({ x: 6, y: 8, w: W - 12, h: H - 12 }, this.view.aspect);
    this.box = f;
    const ws = this.win.style;
    ws.setProperty('--bw', `${f.w.toFixed(1)}px`);
    ws.setProperty('--bh', `${f.h.toFixed(1)}px`);
    ws.setProperty('--bx', `${f.x.toFixed(1)}px`);
    ws.setProperty('--by', `${f.y.toFixed(1)}px`);
    this.key = '';
    this.set(this.want, 0);
  }

  masa() {
    this.set({ mode: 'masa' });
  }

  // cover: alttan açılan sayfanın üst kenarı (ekranda px); tahta onun üstüne sığar. squares: yalnız bu kareler
  // (gidilebilecek kareler) sığsın, gerekirse yaklaşarak; verilmezse bütün tahta.
  hedef(cover, squares = null) {
    this.set({ mode: 'hedef', cover: Math.round(cover), squares: squares && [...squares].sort((a, b) => a - b) });
  }

  odak(sq, cover) {
    this.set({ mode: 'odak', sq, cover: Math.round(cover) });
  }

  // Yürüyüşte her adımda bir kare öndeki noktaya döner (ms: adımın süresi; geçiş biraz uzun, kamera arkadan yetişir).
  izle(sq, ms = MS) {
    this.set({ mode: 'izle', sq }, Math.max(260, ms * 1.6), 'cubic-bezier(.3,.6,.4,1)');
  }

  // İzleyici (sıra başkasında): sıradakinin durduğu kareye hafifçe yaklaşır; tahtanın çoğu görünür kalır.
  takip(sq) {
    this.set({ mode: 'takip', sq });
  }

  set(want, ms = MS, ease = 'cubic-bezier(.65,0,.35,1)') {
    this.want = want;
    if (!this.on || !this.box) return;
    const p = calm() ? { x: 0, y: 0, s: 1 } : this.pose(want);
    const key = `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.s.toFixed(3)}`;
    if (key === this.key) return;
    this.key = key;
    const st = this.view.el.style;
    // geçiş süresi tahtanın kendi (kalıtılmayan) özelliğinde: değişken (--x) olsaydı her adımda bütün karelerin stili
    // yeniden hesaplanırdı
    const d = calm() ? 0 : ms;
    st.transition = `translate ${d}ms ${ease}, scale ${d}ms ${ease}`;
    st.translate = `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
    st.scale = p.s.toFixed(3);
  }

  pose(want) {
    const box = this.box;
    const W = this.win.clientWidth;
    const H = this.win.clientHeight;
    const top = this.win.getBoundingClientRect().top;
    const bottom = want.cover === undefined ? H : Math.min(H, want.cover - top);
    const view = { w: W, top: 0, bottom };
    if (want.mode === 'izle' || want.mode === 'takip') return pose(box, this.view.focus(want.sq), ZOOM[want.mode], { x: W / 2, y: H * 0.5 }, { w: W, top: 0, bottom: H });
    if (want.mode === 'odak') {
      const room = Math.max(40, bottom - 8);
      const b = this.view.box(want.sq);
      const cell = Math.max(b.w, b.h) * project(0, b.y - box.h / 2).k;
      const s = Math.min(ZOOM.odak, Math.max(1, room / (cell * 3.4)));
      return pose(box, this.view.focus(want.sq), s, { x: W / 2, y: 8 + room * 0.5 }, view);
    }
    if (want.mode === 'hedef' && want.squares?.length) {
      // karelerin eğik kutusu (dört köşesi) sayfanın üstündeki alana sığar; en çok odak kadar yaklaşılır
      const pts = want.squares.flatMap((q) => {
        const b = this.view.box(q);
        return [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].map(([x, y]) => project(x - box.w / 2, y - box.h / 2));
      });
      const xs = pts.map((q) => q.x);
      const ys = pts.map((q) => q.y);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      const room = Math.max(40, bottom - 16);
      const s = Math.max(0.5, Math.min(ZOOM.odak, (W - 24) / (x1 - x0), room / (y1 - y0 + 24)));
      const mid = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }; // eğik düzlemde, tahtanın merkezine göre
      return place(box, s, W / 2 - s * mid.x, 8 + room / 2 - s * mid.y, view);
    }
    if (want.mode === 'hedef' && bottom < H - 4) {
      // tahtanın eğik boyu (düz kutunun üst ve alt kenarı) sayfanın üstündeki alana sığar
      const t = project(0, -box.h / 2).y;
      const u = project(0, box.h / 2).y;
      const s = Math.min(1, (bottom - 12) / (u - t));
      const cy = box.y + box.h / 2;
      return { x: 0, y: 6 + (bottom - 6) / 2 - s * (t + u) / 2 - cy, s };
    }
    return { x: 0, y: 0, s: 1 };
  }
}
