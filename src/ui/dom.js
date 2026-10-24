// Küçük DOM yardımcıları. html`` şablonu değerleri kaçırır; raw() ile işaretlenen HTML olduğu gibi kalır.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

class Raw {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}
export const raw = (s) => new Raw(s);

const part = (v) => {
  if (v === null || v === undefined || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(part).join('');
  return esc(v);
};

export function html(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += part(vals[i]) + strings[i + 1];
  return raw(out);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function setHTML(el, content) {
  if (!el) return;
  const s = String(content);
  if (el._last !== s) {
    el.innerHTML = s;
    el._last = s;
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const store = {
  get(k, d = null) {
    try {
      const v = localStorage.getItem(`rant.${k}`);
      return v === null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(`rant.${k}`, JSON.stringify(v));
    } catch {}
  },
  del(k) {
    try {
      localStorage.removeItem(`rant.${k}`);
    } catch {}
  },
};
