// Mahalle arazisinin geometrisi (docs/TASARIM.md §13): 6x6 arsanın tahtadaki yeri, piyonların ayak noktaları, zıplama yayı.
// DOM yok, ölçüler tahtaya göre px; testler (test/arazi.test.js) ve tahta görünümü (boardview.js araziView) bunları kullanır.
// Sözleşme: layout(W, H, panel) bir yerleşim döndürür; cellRect(L, i), pawnFeet(L, i, n, s), focusPoint(L, i) o
// yerleşimde arsanın kutusu, piyonların ayakları ve kameranın bakacağı nokta. Arsa i = (satır-1)*6 + (sütun-1).

export const SIDE = 6;
export const GAP = 0.07; // arsalar arası yol, arsa kenarına oranla
export const HEAD = 0.34; // zar yüzlü satır/sütun başlıkları, arsa kenarına oranla (küçük arsada yok)
export const LAND = 0.8; // arazi resminde kumsalın başladığı yer (genişliğe oranla, iki temada aynı)
export const PAWN_K = 0.5; // piyon kutusu, arsa kenarına oranla

// W x H tahta. panel: tahtanın ortası (istem, zar, gündem) arazinin sağında dar sütun olarak durur (masaüstü, yatay
// telefon); yoksa (dikey telefon) arazi tahtanın tamamını alır, sağda kıyıya yer kalır.
// Döner: { pad, cell, gap, head, grid: { x, y, size }, center: { x, y, w, h } | null, bg: { x, y, size } }.
export function layout(W, H, panel = true) {
  const pad = Math.round(Math.max(6, Math.min(16, Math.min(W, H) * 0.018)));
  const minC = panel ? (W < 720 ? 196 : 300) : 0;
  const side = panel ? minC + pad : Math.round(W * 0.09); // sağda ortaya ya da kıyıya ayrılan
  const fit = (k) => Math.max(8, Math.min((H - 2 * pad) / (SIDE + (SIDE - 1) * GAP + k), (W - 2 * pad - side) / (SIDE + (SIDE - 1) * GAP + k)));
  let cell = fit(HEAD);
  let head = cell * HEAD;
  if (cell < 46) {
    cell = fit(0);
    head = 0;
  }
  cell = Math.floor(cell);
  head = Math.round(head);
  const gap = Math.max(2, Math.round(cell * GAP));
  const size = SIDE * cell + (SIDE - 1) * gap;
  const gx = pad + head;
  // dikey telefonda tahta eğik durur: uzak (üst) pay kısa, yakın (alt) pay uzun görünür; arsalar biraz aşağıda durur ki
  // ekranda iki pay denk görünsün
  const gy = Math.round((H - size - head) * (panel ? 0.5 : 0.64)) + head;
  let center = null;
  if (panel) {
    const w = Math.min(460, W - gx - size - 2 * pad);
    center = { x: W - pad - w, y: pad, w, h: H - 2 * pad };
  }
  // Arazi resmi kare; kumsal arazinin hemen sağında başlar, resim tahtanın boyundan kısa kalmaz. Resmin sağı deniz rengidir.
  const bgSize = Math.ceil(Math.max(H, (gx + size + pad * 0.6) / LAND));
  return { pad, cell, gap, head, grid: { x: gx, y: gy, size }, center, bg: { x: 0, y: Math.round((H - bgSize) / 2), size: bgSize } };
}

export const rowCol = (i) => ({ row: Math.floor(i / SIDE) + 1, col: (i % SIDE) + 1 });

export function cellRect(L, i) {
  const { row, col } = rowCol(i);
  const step = L.cell + L.gap;
  return { x: L.grid.x + (col - 1) * step, y: L.grid.y + (row - 1) * step, w: L.cell, h: L.cell };
}

// Zar yüzlü başlıklar: k. sütunun başlığı sütunun üstünde, k. satırınki satırın solunda (k = 1-6).
export function headRect(L, k, isRow) {
  const step = L.cell + L.gap;
  const off = (k - 1) * step + (L.cell - L.head) / 2;
  return isRow ? { x: L.grid.x - L.head - L.gap / 2, y: L.grid.y + off, w: L.head, h: L.head } : { x: L.grid.x + off, y: L.grid.y - L.head - L.gap / 2, w: L.head, h: L.head };
}

export const focusPoint = (L, i) => {
  const r = cellRect(L, i);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
};

export const pawnSize = (L) => Math.round(L.cell * PAWN_K);

// Arsadaki n piyonun ayak noktaları: binanın önünde, arsanın alt kenarına yakın, yan yana en çok 3; fazlası bir sıra arkada.
export function pawnFeet(L, i, n, s) {
  const r = cellRect(L, i);
  const out = [];
  const rows = Math.ceil(n / 3);
  for (let k = 0; k < rows; k++) {
    const m = Math.min(3, n - k * 3);
    const y = r.y + r.h * 0.9 - (rows - 1 - k) * s * 0.32;
    const step = m > 1 ? Math.min(s * 0.62, (r.w - s) / (m - 1)) : 0;
    const x0 = r.x + r.w / 2 - (step * (m - 1)) / 2;
    for (let j = 0; j < m; j++) out.push({ x: x0 + step * j, y });
  }
  return out;
}

// Zıplama yayı: yükseklik mesafeyle büyür (kısa zıplama alçak, tahtayı geçen zıplama yüksek), en az bir piyon boyu.
export const arcHeight = (dx, dy, s) => Math.max(s * 0.9, Math.min(s * 3, Math.hypot(dx, dy) * 0.35));

// Zıplamanın süresi (ms, normal hızda): uçuş ve iniş (ezilme, toz). Toplamı ev sahibinin PACE.jump bütçesine sığar.
export const JUMP_FLY = 640;
export const JUMP_SETTLE = 220;
