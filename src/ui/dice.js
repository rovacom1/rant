// Zarlar ("Savruk", docs: tasks/yenilikler-plani.md 9). Atış önce görünmeden simüle edilir (dicesim.js), üstte kalan
// yüz bulunur ve motorun verdiği sayı o yüze yazılır; sonra kayıt oynatılır. Oynatılan zar sonunda asla çevrilmez.
// Zarlara yukarıdan, hafif önden bakılır (geçerli değer üst yüz). Ses oynatmayla aynı anda başlar ve biter.
// Sıra sendeyken zarlar tepside bekler (ready); basılı tutunca ele alınır, imleci izler, bırakınca o yöne ve o hızla
// savrulur (en az bir atış hızıyla). Eldeki zarın yüzleri değişmesin diye sonucu o yüzlerle veren atış aranır (simulateTo).
import { simulate, simulateTo, labelingFor, timeline, frameAt, qmat, qaxis, qmul, qn, NORM } from './dicesim.js';
import { play } from './sound.js';
import { PACE } from '../net/host.js';

const TILT = (30 * Math.PI) / 180; // zar.css .zar-zemin rotateX
const PERSP = 16; // zar.css .zar-tepsi perspective (zar boyu cinsinden)
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const SLOTS = Object.keys(NORM);
const calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const pips = (v) => Array.from({ length: 9 }, (_, i) => `<i${PIPS[v].includes(i) ? ' class="on"' : ''}></i>`).join('');
const dieHTML = () =>
  `<div class="zar-golge"></div><div class="zar">${SLOTS.map((s) => `<div class="zf zf-${s}"></div>`).join('')}<b class="zc zc-x"></b><b class="zc zc-y"></b><b class="zc zc-z"></b></div>`;

export class Dice {
  // n: zar sayısı (oyun zarı 2, dava düellosunda her oyuncunun kendi tek zarı).
  constructor(el, n = 2) {
    this.el = el;
    this.n = n;
    el.innerHTML = `<div class="zar-tepsi"><div class="zar-zemin">${Array.from({ length: n }, dieHTML).join('')}</div>${n > 1 ? '<span class="zar-toplam"></span>' : ''}</div>`;
    this.dice = [...el.querySelectorAll('.zar')].map((w) => ({ w, sh: w.previousElementSibling, faces: SLOTS.map((s) => w.querySelector(`.zf-${s}`)) }));
    this.sum = el.querySelector('.zar-toplam');
    this.values = null;
    this.run = 0; // her atış/gösterim yeni bir sayı alır; eski oynatma kendini durdurur
    this.held = null; // elde tutulan zarlar: { labs, qs, ps, target, samples, released }
  }

  // Ekrandaki nokta (clientX/Y) -> tepsi düzlemindeki nokta (px). Düzlem rotateX(TILT) ile yatık, perspektifli bakılır.
  planeXY(cx, cy) {
    const r = this.el.getBoundingClientRect();
    const W = this.el.clientWidth;
    const H = this.el.clientHeight;
    const P = this.size() * PERSP;
    const A = cy - r.top - H / 2;
    const B = H * 0.6 - H / 2;
    const u = (P * (A - B)) / (P * Math.cos(TILT) + A * Math.sin(TILT));
    const x = W / 2 + ((cx - r.left - W / 2) * (P - u * Math.sin(TILT))) / P;
    return [x, H * 0.6 + u];
  }

  // Sıra sendeyken zarlar tepsinin ortasında bekler; tutulmaya hazır.
  ready() {
    if (this.held) return;
    this.el.classList.add('ready');
    if (this.values === 'ready') return this.el.classList.remove('off');
    this.show([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
    this.values = 'ready';
    this.sum?.classList.remove('on');
  }

  // Basılı tutunca zarlar ele alınır ve imleci izler (tepsinin içinde kalır), elde hafifçe sallanır.
  hold(cx, cy) {
    const run = ++this.run;
    this.el.classList.remove('off');
    this.sum?.classList.remove('on', 'glow');
    const R = this.size() / 2;
    const labs = this.dice.map((_, i) => {
      const L = labelingFor('a', 1 + Math.floor(Math.random() * 6));
      this.label(i, L);
      return L;
    });
    const h = { labs, qs: labs.map(() => qn([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5])), samples: [], released: false };
    h.target = this.clampHold(this.planeXY(cx, cy), R);
    h.cur = [...h.target];
    this.held = h;
    this.values = null;
    this.el.classList.add('holding');
    play('tap', 0.2);
    const spin = this.dice.map(() => qn([1, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12]));
    const frame = () => {
      if (run !== this.run || this.held !== h) return;
      h.cur = h.cur.map((v, m) => v + (h.target[m] - v) * 0.45);
      // Elde aralarında hiç değmeyecek kadar boşluk (köşesi dönük iki küp en çok 2√3 R): bırakınca sıçramasınlar.
      h.ps = this.dice.map((_, i) => [h.cur[0] + (i ? 1 : -1) * R * 1.8, h.cur[1] + (i ? 0.2 : -0.2) * R]);
      h.qs = h.qs.map((q, i) => qn(qmul(spin[i], q)));
      h.ps.forEach((p, i) => this.draw(i, { p: [p[0], p[1], R * 2.4 + Math.sin(performance.now() / 70 + i) * R * 0.08], q: h.qs[i] }, R));
      requestAnimationFrame(frame);
    };
    this.move(cx, cy);
    frame();
  }

  clampHold([x, y], R) {
    const W = this.el.clientWidth;
    const H = this.el.clientHeight;
    return [Math.min(W - R * 2.9, Math.max(R * 2.9, x)), Math.min(H - R * 1.3, Math.max(R * 1.3, y))];
  }

  move(cx, cy) {
    const h = this.held;
    if (!h || h.released) return;
    const p = this.planeXY(cx, cy);
    h.target = this.clampHold(p, this.size() / 2);
    const now = performance.now();
    h.samples.push([now, ...p]);
    while (h.samples.length > 2 && now - h.samples[0][0] > 100) h.samples.shift();
  }

  // Bırakınca el hızı (son 0,1 sn) atış olarak saklanır; zarlar sonucu bekleyip elden o yöne savrulur.
  release(cx, cy) {
    const h = this.held;
    if (!h) return;
    this.move(cx, cy);
    const a = h.samples[0];
    const b = h.samples[h.samples.length - 1];
    const dt = (b[0] - a[0]) / 1000;
    h.v = dt > 0.012 ? [(b[1] - a[1]) / dt, (b[2] - a[2]) / dt] : [0, 0];
    h.released = performance.now();
    // Sonuç gelmezse (hamle reddedildi) zarlar bir süre sonra tepsiye geri bırakılır.
    setTimeout(() => this.held === h && this.drop(), 4000);
  }

  // Elden vazgeçildi: zarlar tepsiye geri döner.
  drop() {
    this.held = null;
    this.run++;
    this.el.classList.remove('holding');
    this.values = null;
    this.ready();
  }

  // Zar boyu (px): CSS'teki --d.
  size() {
    return parseFloat(getComputedStyle(this.el).getPropertyValue('--d')) || 56;
  }

  label(i, lab) {
    SLOTS.forEach((s, k) => {
      const f = this.dice[i].faces[k];
      f.className = `zf zf-${s} v${lab[s]}`;
      f.innerHTML = pips(lab[s]);
    });
  }

  draw(i, { p, q }, R) {
    const { w, sh } = this.dice[i];
    const m = qmat(q);
    const h = Math.max(0, p[2] - R);
    w.style.transform = `translate3d(${p[0] - R}px, ${p[1] - R}px, ${p[2]}px) matrix3d(${m[0][0]},${m[1][0]},${m[2][0]},0,${m[0][1]},${m[1][1]},${m[2][1]},0,${m[0][2]},${m[1][2]},${m[2][2]},0,0,0,0,1)`;
    // Yalnız transform ve opaklık değişir (her karede bulanıklık değiştirmek ekranı baştan boyatır).
    sh.style.transform = `translate(${p[0] - R + h * 0.3}px, ${p[1] - R + h * 0.2}px) scale(${1 + h / (4 * R)})`;
    sh.style.opacity = String(Math.max(0.15, 0.55 - h / (12 * R)));
  }

  // Toplam rozeti en sağdaki zarın yanında (yer yoksa solundakinin).
  total(values, states, R, glow) {
    if (!this.sum) return;
    const W = this.el.clientWidth;
    const xs = states.map((s) => s.p[0]);
    const right = Math.max(...xs) + R * 1.5;
    const x = right + 28 < W ? right : Math.min(...xs) - R * 1.5 - 28;
    const y = states.reduce((a, s) => a + s.p[1], 0) / states.length;
    this.sum.textContent = String(values.reduce((a, b) => a + b, 0));
    this.sum.style.left = `${Math.max(0, x)}px`;
    this.sum.style.top = `${y}px`;
    this.sum.classList.toggle('glow', glow);
    this.sum.classList.add('on');
  }

  // Anlık gösterim (null: gizle). Aynı değerler zaten duruyorsa (atıştan kalan) yerinde bırakır.
  show(values) {
    if (this.held) return;
    this.el.classList.remove('ready');
    this.el.classList.toggle('off', !values);
    const key = values ? values.join() : '';
    if (!values || key === this.values) return;
    this.run++;
    this.values = key;
    this.el.classList.remove('rolling');
    const R = this.size() / 2;
    const W = this.el.clientWidth || R * 8;
    const H = this.el.clientHeight || R * 3;
    const gap = R * 1.6;
    const states = values.map((v, i) => {
      const x = W / 2 + (i - (values.length - 1) / 2) * 2 * gap;
      const yaw = (Math.random() - 0.5) * 0.6;
      this.label(i, labelingFor('a', v));
      return { p: [x, H / 2 + (i ? 4 : -4) * (values.length > 1 ? 1 : 0), R], q: qaxis([0, 0, 1], yaw) };
    });
    states.forEach((s, i) => this.draw(i, s, R));
    this.total(values, states, R, false);
  }

  // cap: zarın üstünde kısa açıklama (ör. dava zarları); boşsa yok. k: oyun hızı çarpanı.
  // Atış PACE.roll * k içinde biter (simülasyon zamanı ölçeklenir); söz, waitMs dolunca (en az atış bitince) çözülür.
  async roll(values, fast, waitMs = 1250, cap = '', k = 1) {
    if (cap) this.el.dataset.cap = cap;
    else delete this.el.dataset.cap;
    const h = this.held && this.held.released && values.length === this.n ? this.held : null;
    this.held = null;
    this.el.classList.remove('holding', 'ready');
    if (fast) return this.show(values);
    const run = ++this.run;
    const t0 = performance.now();
    this.el.classList.remove('off');
    this.values = values.join();
    const R = this.size() / 2;
    const W = Math.max(this.el.clientWidth, R * 4);
    const H = Math.max(this.el.clientHeight, R * 2);
    const opts = { n: this.n, W, H, R };
    // Elden savrulduysa eldeki yüzler kalır, sonucu onlarla veren atış aranır; yoksa atış serbest, üstte kalacak yüze
    // istenen sayı yazılır. İkisinde de oynatılırken hiçbir şey düzeltilmez.
    const tossed = h && simulateTo({ ...opts, toss: { ps: h.ps, qs: h.qs, v: h.v } }, h.labs, values, Math.floor(Math.random() * 1e9));
    const sim = tossed || simulate(opts);
    if (!tossed) values.forEach((v, i) => this.label(i, labelingFor(sim.tops[i], v)));
    const last = sim.frames[sim.frames.length - 1];
    this.sum?.classList.remove('on', 'glow');
    if (calm()) {
      // Hareket azaltma: sonuç hemen; kısa zar sesi yine duyulur.
      play('dice', 0.35);
      last.forEach((s, i) => this.draw(i, s, R));
      this.total(values, last, R, false);
      await wait(waitMs);
      return;
    }
    const budget = Math.min(PACE.roll * k, waitMs) / 1000;
    const tl = timeline(sim, budget);
    play('dice', tl.duration);
    this.el.classList.add('rolling');
    // Arka plandaki sekmede requestAnimationFrame durur; süre dolunca zamanlayıcı yine bitirir (oyun beklemez).
    await new Promise((resolve) => {
      let over = false;
      const done = () => {
        over = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(done, tl.duration * 1000 + 60);
      const frame = () => {
        if (over) return;
        if (run !== this.run) return done();
        const rt = (performance.now() - t0) / 1000;
        frameAt(sim, tl.simAt(rt)).forEach((s, i) => this.draw(i, s, R));
        if (rt >= tl.duration) return done();
        requestAnimationFrame(frame);
      };
      frame();
    });
    if (run !== this.run) return;
    this.el.classList.remove('rolling');
    last.forEach((s, i) => this.draw(i, s, R));
    this.total(values, last, R, true);
    await wait(waitMs - (performance.now() - t0));
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
