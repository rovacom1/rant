// Tahta görünümü sözleşmesi: piyonların (board.js Tokens) ve kameranın (camera.js) bir tahtadan bildiği her şey.
// Klasik tahta (36 kare çevre) ve Mahalle arazisi (6x6, ui/arazi.js) aynı sözleşmeyi uygular; piyonlar ve kamera hangi
// tahtada olduklarını bilmez.
//
// Koordinatlar "düz": tahta düzleminin (view.el) dönmemiş, kaydırılmamış kendi kutusunda px, sol üst köşe 0,0
// (offsetLeft/offsetTop uzayı). Telefonda kamera düzlemi eğer ve kaydırır; düz koordinatlar bundan etkilenmez.
//
//   el                  tahta düzlemi. Kamera yalnız bunun transform, translate ve scale özelliklerine dokunur;
//                       piyon katmanı ve kare efektleri bunun içindedir.
//   count               kare sayısı (kareler 0..count-1)
//   box(i)              karenin düz kutusu: { x, y, w, h }
//   focus(i)            kameranın o karede baktığı nokta: { x, y }
//   pawnSize()          piyon kutusu (px)
//   feet(i, s, n)       i karesinde duran n piyonun ayak noktaları [{ x, y }] (s: piyon kutusu); figür ayaktan yukarı çizilir
//   aspect              (isteğe bağlı) telefonda eğik tahtanın boy/en oranı sınırları { amin, amax } (camera.js fitTilt)
//
// Tahtanın dışındaki piyonun karesi null'dır (Mahalle'de ilk zardan önce); Tokens onu gizler, view'a sormaz.
//
// Yeni tahta bu nesneyi döndüren bir işlev yazar (aşağıdaki classicView gibi). Bu işlevler yalnız okur, hiçbir şey
// yazmaz (Tokens önce bütün noktaları okur, sonra yazar; yerleşim bir kez hesaplanır).
import { cellPos } from './board.js';
import { PAWN, feet } from './slots.js';
import { layout, cellRect, focusPoint, pawnSize, pawnFeet, SIDE } from './arazigeom.js';

const boxOf = (el) => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });

// Klasik tahta: kareler ızgaranın kenarında (board.js buildBoard), piyonlar kaldırım düzeninde (slots.js).
export function classicView(el, cells) {
  return {
    el,
    count: cells.length,
    box: (i) => boxOf(cells[i]),
    focus(i) {
      const b = boxOf(cells[i]);
      return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    },
    pawnSize: () => Math.round(cells[1].offsetHeight * PAWN),
    feet: (i, s, n) => feet(cellPos(i).side, boxOf(cells[i]), s, n, el.clientWidth, el.clientHeight),
  };
}

// Mahalle arazisi: 6x6 arsa (arazigeom.js). Yerleşim Arazi.layout'tan (tahtanın boyu ve ortanın yeri değişince yenilenir);
// henüz ölçülmediyse boş bir yerleşim, piyonlar ilk ölçümde yerine geçer. Telefonda arazi kare (sağda kıyı payı); tahta
// pencerenin boyunu doldurana kadar uzar, arsaların üstünde ve altında arazi resmi görünür (pencerede boş masa kalmaz).
export function araziView(arazi) {
  const L = () => arazi.L || layout(1, 1, false);
  return {
    el: arazi.board,
    count: SIDE * SIDE,
    box: (i) => cellRect(L(), i),
    focus: (i) => focusPoint(L(), i),
    pawnSize: () => pawnSize(L()),
    feet: (i, s, n) => pawnFeet(L(), i, n, s),
    aspect: { amin: 0.9, amax: 1.4 },
  };
}
