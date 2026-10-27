// Tapu kartı: üstte setin renginde bant (mülk adı ve setin illeri), fiyat ve sahibi; ladder ile kira cetveli,
// her satırda o kattaki bina resmi (assets/bina/<set>/). Kaçak üst kat kırmızı, affedilmiş kat yeşil yazılır.
// Ulaşım tapusu koyu bantlı, simgeli ve binasız. Damga, mühür, ada/parsel yok (plan madde 12).
import * as E from '../engine/index.js';
import { html, raw } from './dom.js';
import { ic, money } from './icons.js';
import { APP_VERSION } from '../version.js';
import { emWidth } from './hand.js';

const { BOARD, GROUPS, GROUP_SQUARES } = E;
const I = (name) => raw(ic(name));
const M = (n) => raw(money(n));

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
// Bant yazısı: açık renkte koyu, koyu renkte beyaz.
export const bandInk = (hex) => (lum(hex) > 0.62 ? '#1b2233' : '#ffffff');

// Endeks ve şehir çarpanıyla ölçeklenmiş tutar (kira tablosu için).
const scaled = (v, sq, x) => Math.max(5, Math.round((x * (v.index / 100) * (BOARD[sq].group ? v.groupMult?.[BOARD[sq].group] || 1 : 1)) / 5) * 5);

// Setin illeri: "Giresun · Rize · Trabzon". Ulaşımda türü.
export const setLine = (sq) => {
  const s = BOARD[sq];
  return s.group ? GROUP_SQUARES[s.group].map((q) => BOARD[q].name).join(' · ') : E.TRANSPORT_LABEL[s.mode];
};

// Bina resmi: n kat (0 = boş arsa); kaçak/affedilmiş üst katta k{n-1}.
export const binaSrc = (group, n, ugly = false) => `assets/bina/${group}/${ugly && n > 0 ? `k${n - 1}` : n}.png?v=${APP_VERSION}`;

// o: mini (küçük, yalnız ad ve fiyat), sel (seçili), off (seçilemez), cls, w (genişlik px), ladder (kira cetveli),
// level (vurgulu satır: 0 arsa, 0.5 tam set, 1-4 kat; ulaşımda sahibi varsa herhangi bir değer), attrs (ek öznitelikler).
export function deed(v, sq, o = {}) {
  const s = BOARD[sq];
  const tr = s.kind === 'transport';
  const color = tr ? null : GROUPS[s.group].color; // ulaşımın koyu bandı temaya göre CSS'te (.deed.tr)
  const ps = v.props[sq];
  const owner = ps && ps.owner !== null && ps.owner !== undefined ? v.players[ps.owner] : null;
  const cls = ['deed', tr ? 'tr' : '', o.mini ? 'mini' : '', o.sel ? 'sel' : '', o.off ? 'off' : '', o.cls || ''].join(' ');
  const style = `${color ? `--dc:${color};--di:${bandInk(color)};` : ''}--ne:${Math.max(3, emWidth(s.name))}${o.w ? `;--dw:${o.w}px` : ''}`;
  const top = html`<div class="d-top"><div class="d-title">${tr ? I(s.mode) : ''}<span class="d-name">${s.name}</span>${o.sel ? I('check') : ''}</div>${o.mini ? '' : html`<span class="d-set">${setLine(sq)}</span>`}</div>`;
  const own = owner ? html`<span class="d-own"><i style="--oc:${owner.color}"></i><span>${owner.name}</span></span>` : '';
  let body;
  if (o.mini) body = html`<div class="d-meta"><span class="d-price">${M(E.price(v, sq))}</span></div>`;
  else {
    const meta = html`<div class="d-meta"><span class="d-price">${M(E.price(v, sq))}</span>${own}</div>`;
    if (!o.ladder) {
      const rent = tr
        ? html`<div class="d-rent"><span>Kira <b>${M(E.money(v, E.TRANSPORT_RENT[s.mode][1]))}</b></span><span>${s.mode === 'air' ? 'her biri 2 katı' : 'gar başına artar'}</span></div>`
        : html`<div class="d-rent"><span>Kira <b>${M(scaled(v, sq, s.rents[0]))}</b></span><span>Setle <b>${M(scaled(v, sq, s.rents[0] * 2))}</b></span></div>`;
      body = html`${meta}${rent}`;
    } else if (tr) {
      const n = owner && o.level !== undefined ? E.transportCount(v, ps.owner, s.mode) : 0;
      const label = E.TRANSPORT_LABEL[s.mode].toLowerCase();
      const rows = E.TRANSPORT_RENT[s.mode].slice(1).map((x, l) => html`<div class="d-lr ${n === l + 1 ? 'cur' : ''}"><span>${l + 1} ${label}</span><b>${M(E.money(v, x))}</b></div>`);
      body = html`${meta}<div class="d-lad">${rows}</div><div class="d-ft"><span>${s.mode === 'air' ? 'Her havalimanı kirayı 2 katına çıkarır' : 'Her gar kirayı artırır'}</span></div>`;
    } else {
      const lv = o.level;
      const L = ps ? E.level(ps) : 0;
      const mark = owner && L > 0 ? (ps.kacak ? 'k' : ps.affed ? 'a' : '') : '';
      const rows = [0, 1, 2, 3, 4].map((n) => {
        const cur = n === 0 ? lv === 0 || lv === 0.5 : lv === n;
        const ugly = !!mark && n === L;
        const note = ugly ? html`<small class="${mark}">${mark === 'k' ? 'üstü kaçak' : 'kaçaktı, affedildi'}</small>` : '';
        const name = n === 0 ? (lv === 0.5 ? 'Setle arsa' : 'Arsa') : `${n} kat`;
        const rent = n === 0 && lv === 0.5 ? s.rents[0] * 2 : s.rents[n];
        return html`<div class="d-lr ${cur ? 'cur' : ''}"><img src="${binaSrc(s.group, n, ugly)}" alt=""><span><span>${name}</span>${note}</span><b>${M(scaled(v, sq, rent))}</b></div>`;
      });
      const foot = html`<div class="d-ft"><span>Setle <b>${M(scaled(v, sq, s.rents[0] * 2))}</b></span><span>Kat <b>${M(E.katCost(v, sq))}</b></span><span>Kaçak <b>${M(E.kacakCost(v, sq))}</b></span></div>`;
      body = html`${meta}<div class="d-lad">${rows}</div>${foot}`;
    }
  }
  const attrs = o.attrs ? raw(o.attrs) : '';
  const mort = ps && ps.ipotek && !o.mini ? html`<div class="dmort">${I('ipotek')}<span>İpotekli</span></div>` : '';
  return html`<div class="${cls}" style="${style}" ${attrs}>${top}<div class="d-bd">${body}</div>${mort}</div>`;
}
