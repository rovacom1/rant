// Kenarlı piyon resmini ana iş parçacığının dışında çizer (pawns.js): resim, oyuncunun renginde kalın kenar, temanın ince
// çizgisi ve yumuşak gölge. İstek { key, url, color, edge, dpr, w, h, o, pad }, cevap { key, blob } (olmazsa blob: null).
const images = new Map(); // adres -> ImageBitmap sözü

// main.css .pawn img filtresinin aynısı; uzunluklar tuval pikseli (d: cihaz piksel oranı).
const chain = (color, edge, o, d) =>
  [[o, 0, color], [-o, 0, color], [0, o, color], [0, -o, color], [1, 0, edge], [-1, 0, edge], [0, 1, edge], [0, -1, edge]]
    .map(([x, y, c]) => `drop-shadow(${x * d}px ${y * d}px 0 ${c})`)
    .concat(`drop-shadow(0 ${2 * d}px ${3 * d}px rgba(0, 0, 0, 0.35))`)
    .join(' ');

self.onmessage = async ({ data: j }) => {
  try {
    if (!images.has(j.url)) images.set(j.url, fetch(j.url).then((r) => r.blob()).then((b) => createImageBitmap(b)));
    const img = await images.get(j.url);
    const d = j.dpr;
    const cv = new OffscreenCanvas(Math.ceil((j.w + 2 * j.pad) * d), Math.ceil((j.h + 2 * j.pad) * d));
    const cx = cv.getContext('2d', { willReadFrequently: true }); // işlemcide: ekran kartında bu filtre ekranın çizimini bekletiyordu
    cx.filter = chain(j.color, j.edge, j.o, d);
    cx.drawImage(img, j.pad * d, j.pad * d, j.w * d, j.h * d);
    self.postMessage({ key: j.key, blob: await cv.convertToBlob() });
  } catch {
    images.delete(j.url);
    self.postMessage({ key: j.key, blob: null });
  }
};
