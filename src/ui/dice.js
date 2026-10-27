// Zarlar ("Savruk", docs: tasks/yenilikler-plani.md 9). Atış önce görünmeden simüle edilir (dicesim.js), üstte kalan
// yüz bulunur ve motorun verdiği sayı o yüze yazılır; sonra kayıt oynatılır. Oynatılan zar sonunda asla çevrilmez.
// Zarlara yukarıdan, hafif önden bakılır (geçerli değer üst yüz). Ses oynatmayla aynı anda başlar ve biter.
import { simulate, labelingFor, timeline, frameAt, qmat, qaxis, NORM } from './dicesim.js';
import { play } from './sound.js';
import { PACE } from '../net/host.js';

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
    sh.style.transform = `translate(${p[0] - R + h * 0.3}px, ${p[1] - R + h * 0.2}px) scale(${1 + h / (5 * R)})`;
    sh.style.opacity = String(Math.max(0.15, 0.55 - h / (12 * R)));
    sh.style.filter = `blur(${2 + h / 10}px)`;
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
    if (fast) return this.show(values);
    const run = ++this.run;
    const t0 = performance.now();
    this.el.classList.remove('off');
    this.values = values.join();
    const R = this.size() / 2;
    const W = Math.max(this.el.clientWidth, R * 4);
    const H = Math.max(this.el.clientHeight, R * 2);
    const sim = simulate({ n: this.n, W, H, R });
    // Üstte kalacak yüze istenen sayı yazılır: oynatılırken hiçbir şey düzeltilmez.
    values.forEach((v, i) => this.label(i, labelingFor(sim.tops[i], v)));
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
