import { test } from 'node:test';
import assert from 'node:assert/strict';
import { project, fitTilt, pose, TILT } from '../src/ui/camera.js';

const near = (a, b, eps = 0.5) => Math.abs(a - b) <= eps;

test('merkez yerinde kalir; uzak satir kucuk, yakin satir buyuk gorunur', () => {
  const o = project(0, 0);
  assert.equal(o.x, 0);
  assert.equal(o.y, 0);
  const far = project(100, -200);
  const close = project(100, 200);
  assert.ok(far.k < 1 && close.k > 1);
  assert.ok(Math.abs(far.y) < 200 * Math.cos((TILT * Math.PI) / 180) + 0.01, 'egik tahta kisa gorunur');
});

// Eğik tahtanın ekrandaki kutusu (düz kutu merkeze göre izdüşürülür).
function shown(f) {
  const t = project(0, -f.h / 2).y;
  const u = project(0, f.h / 2).y;
  const cx = f.x + f.w / 2;
  const cy = f.y + f.h / 2;
  const half = (f.w / 2) * project(0, f.h / 2).k; // en geniş yer yakın kenar
  return { left: cx - half, right: cx + half, top: cy + t, bottom: cy + u };
}

test('egik tahta pencereye sigar, kenarlari tasmaz ve bir boyutu doldurur', () => {
  for (const slot of [{ x: 6, y: 8, w: 378, h: 422 }, { x: 6, y: 8, w: 348, h: 334 }, { x: 6, y: 8, w: 378, h: 900 }, { x: 0, y: 0, w: 300, h: 200 }]) {
    const f = fitTilt(slot);
    const b = shown(f);
    assert.ok(b.left >= slot.x - 0.5 && b.right <= slot.x + slot.w + 0.5, `yatayda sigar ${JSON.stringify(slot)}`);
    assert.ok(b.top >= slot.y - 0.5 && b.bottom <= slot.y + slot.h + 0.5, `dikeyde sigar ${JSON.stringify(slot)}`);
    assert.ok(near(b.right - b.left, slot.w, 1) || near(b.bottom - b.top, slot.h, 1), 'bir boyut dolu');
    assert.ok(f.h / f.w >= 1 - 1e-9 && f.h / f.w <= 1.4 + 1e-9, 'boy orani sinirda');
  }
});

test('kamera odak noktasini istenen yere getirir; tahta pencereyi yatayda doldurur', () => {
  const box = fitTilt({ x: 6, y: 8, w: 378, h: 422 });
  const view = { w: 390, top: 0, bottom: 438 };
  const s = 1.6;
  const p = { x: box.w / 2, y: box.h / 2 }; // tahtanın ortası
  const at = { x: 195, y: 200 };
  const c = pose(box, p, s, at, view);
  const q = project(p.x - box.w / 2, p.y - box.h / 2);
  assert.ok(near(box.x + box.w / 2 + c.x + s * q.x, at.x) && near(box.y + box.h / 2 + c.y + s * q.y, at.y));
  // köşedeki kare: tahtanın kenarı pencerenin içine kaçmaz
  const corner = { x: 5, y: box.h - 5 };
  const k = pose(box, corner, s, at, view);
  const left = box.x + box.w / 2 + k.x - (s * box.w * project(0, box.h / 2).k) / 2; // görünen en alt sıra: yakın kenar
  assert.ok(left <= 0.5, 'sol kenar pencerenin solunda ya da tam kenarda');
});

test('yakin kamerada tahtanin ust ve alt kenari pencerenin icine kacmaz (bos masa kalmaz)', () => {
  const box = fitTilt({ x: 6, y: 8, w: 378, h: 422 });
  const view = { w: 390, top: 0, bottom: 438 };
  for (const s of [1.15, 1.3, 1.7]) {
    for (const y of [5, box.h / 2, box.h - 5]) {
      for (const x of [5, box.w / 2, box.w - 5]) {
        const c = pose(box, { x, y }, s, { x: 195, y: 219 }, view);
        const cy = box.y + box.h / 2 + c.y;
        const top = cy + s * project(0, -box.h / 2).y;
        const bottom = cy + s * project(0, box.h / 2).y;
        assert.ok(top <= view.top + 8.5, `ust kenar ${top}`);
        assert.ok(bottom >= view.bottom - 4.5, `alt kenar ${bottom}`);
        const near = box.x + box.w / 2 + c.x;
        const half = (s * box.w * project(0, box.h / 2).k) / 2;
        assert.ok(near - half <= 0.5 && near + half >= view.w - 0.5, 'yakin kenar pencereyi yatayda doldurur');
      }
    }
  }
});
