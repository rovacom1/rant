// Pencere odağı (klavye ve ekran okuyucu için): pencere açılınca odak içine girer, Tab pencerenin içinde döner,
// pencere kapanınca odak onu açan öğeye döner. Pencere yeniden çizilince odak aynı sıradaki öğeye geri konur.
const SEL = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea, summary, [tabindex]:not([tabindex="-1"])';
const items = (root) => [...root.querySelectorAll(SEL)].filter((n) => n.getClientRects().length);
const open = []; // açık pencereler, en üstteki sonda: { box, opener }
let uid = 0;

function mark(dlg) {
  dlg.setAttribute('role', 'dialog');
  if (!dlg.matches('.sound-pop')) dlg.setAttribute('aria-modal', 'true');
  dlg.tabIndex = -1;
  if (dlg.hasAttribute('aria-label') || dlg.hasAttribute('aria-labelledby')) return;
  const t = dlg.querySelector('.h22, .h18, .h28, .h16, .logo');
  if (!t) return;
  t.id ||= `dlg${++uid}`;
  dlg.setAttribute('aria-labelledby', t.id);
}

// Açan öğe yeniden çizildiyse yerine gelen eşi: aynı kimlik ya da aynı data-* öznitelikleri.
function twin(n) {
  if (!n) return null;
  if (n.id) return document.getElementById(n.id);
  const d = n.dataset || {};
  if (!d.act) return null;
  const q = [...n.attributes].filter((x) => x.name.startsWith('data-')).map((x) => `[${x.name}="${CSS.escape(x.value)}"]`).join('');
  return document.querySelector(q);
}

// box: pencerenin konduğu kap; draw(): kabı yeniden çizer. Çizimden önce ve sonra bakarak açılma, kapanma ve yeniden
// çizim ayrılır. sel: kabın içinde pencerenin kendisi.
export function withDialog(box, draw, sel = '.sheet') {
  const was = box.querySelector(sel);
  const a = document.activeElement;
  const inside = !!(was && a && was.contains(a));
  const idx = inside ? items(was).indexOf(a) : -1;
  draw();
  const dlg = box.querySelector(sel);
  if (dlg) mark(dlg);
  if (dlg && !was) {
    open.push({ box, opener: a && a !== document.body ? a : null });
    dlg.focus({ preventScroll: true });
  } else if (dlg && dlg !== was && inside) {
    const list = items(dlg);
    (idx >= 0 ? list[Math.min(idx, list.length - 1)] || dlg : dlg).focus({ preventScroll: true });
  } else if (!dlg && was) {
    const i = open.findIndex((o) => o.box === box);
    const o = i >= 0 ? open.splice(i, 1)[0] : null;
    const back = document.activeElement;
    const to = o && (o.opener?.isConnected ? o.opener : twin(o.opener));
    if (to && (!back || back === document.body || !back.isConnected)) to.focus({ preventScroll: true });
  }
}

// Tab ve Shift+Tab en üstteki açık pencerenin içinde döner. Belgenin keydown dinleyicisinden çağrılır; işlediyse true.
export function trapTab(e) {
  if (e.key !== 'Tab') return false;
  for (let i = open.length - 1; i >= 0; i--) {
    const dlg = open[i].box.querySelector('[aria-modal="true"]');
    if (!dlg) continue;
    const list = items(dlg);
    if (!list.length) {
      e.preventDefault();
      dlg.focus();
      return true;
    }
    const at = list.indexOf(document.activeElement);
    const next = e.shiftKey ? (at <= 0 ? list.length - 1 : at - 1) : at < 0 || at === list.length - 1 ? 0 : at + 1;
    e.preventDefault();
    list[next].focus();
    return true;
  }
  return false;
}
