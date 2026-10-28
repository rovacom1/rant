// Dayı videolarının krem zeminini siler (n×n RGBA dizisi, yerinde). tools/dayi_video.js bunu her kareye bir kez uygular,
// oyun hazır saydamlık maskesini kullanır. Krem renk dayının üstünde de var (göz akı, diş, ceketin parlak çizgileri),
// bu yüzden yalnız renge bakılmaz: kenardan başlayıp zemine benzeyen pikseller doldurularak şeffaf olur; dayının içindeki
// krem alanlar kalın lacivert çizgiyle ayrıldığı için korunur. Kapalı krem boşluklardan yalnız büyükler (tespih halkasının
// içi, kolla gövde arası) silinir; göz akı ve diş kalır. Çizgi kenarı zemine yakınlığı ölçüsünde yarı saydam olur.

let seen = null;
let queue = null;
let dist = null;

export function keyCream(p, n, hole = n * n * 0.004) {
  const nn = n * n;
  if (!seen || seen.length !== nn) {
    seen = new Uint8Array(nn);
    queue = new Int32Array(nn);
    dist = new Uint16Array(nn);
  }
  seen.fill(0);
  const r0 = p[0], g0 = p[1], b0 = p[2];
  for (let k = 0, j = 0; k < nn; k++, j += 4) dist[k] = Math.abs(p[j] - r0) + Math.abs(p[j + 1] - g0) + Math.abs(p[j + 2] - b0);
  let t = 0;
  for (let i = 0; i < n; i++) for (const k of [i, nn - n + i, i * n, i * n + n - 1]) t = push(k, 75, t);
  t = flood(n, 75, 0, t);
  clear(p, 0, t);
  for (let k = 0; k < nn; k++) {
    if (seen[k] || dist[k] >= 28) continue;
    const s = t;
    t = flood(n, 28, s, push(k, 28, t));
    if (t - s > hole) clear(p, s, t);
  }
}

// Doldurmanın iç döngüleri kapanışsız: her video karesinde yüz binlerce kez dönerler.
function push(k, lim, t) {
  if (seen[k] || dist[k] >= lim) return t;
  seen[k] = 1;
  queue[t] = k;
  return t + 1;
}

function flood(n, lim, h, t) {
  const last = seen.length - n;
  while (h < t) {
    const k = queue[h++], x = k % n;
    if (x > 0) t = push(k - 1, lim, t);
    if (x < n - 1) t = push(k + 1, lim, t);
    if (k >= n) t = push(k - n, lim, t);
    if (k < last) t = push(k + n, lim, t);
  }
  return t;
}

function clear(p, from, to) {
  for (let j = from; j < to; j++) p[queue[j] * 4 + 3] = Math.max(0, Math.min(255, (dist[queue[j]] - 28) * 5));
}
