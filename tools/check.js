// Metin denetimi: Türkçe metinlerde şapkalı harf (â, î, û) olmamalı; oyunun kodunda ve sayfasında emoji olmamalı
// (simgeler SVG, src/ui/icons.js). node tools/check.js
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIRS = ['src', 'docs', 'otomasyon', 'tasks', 'test', 'tools', 'styles', '.github'];
const EXTS = new Set(['.js', '.md', '.html', '.css', '.yml', '.json']);
const BAD = /[âîûÂÎÛ]/;
// Emoji ve resimli yazı karakterleri (ok, yıldız, güneş...); yalnız oyunun kendi dosyalarında aranır.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const GAME = /^(src|styles)[\\/]|^index\.html$/;
// Ok karakterleri motorun günlük metinlerinde ayraçtır (arayüz onları SVG oka çevirir); arayüzde yazı oku olmaz.
const ARROW = /[\u{2190}-\u{21FF}]/u;
const UI = /^(src[\\/]ui|styles)[\\/]|^index\.html$/;
const files = readdirSync(ROOT).filter((f) => EXTS.has(extname(f))).map((f) => join(ROOT, f));
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXTS.has(extname(p))) files.push(p);
  }
};
for (const d of DIRS) {
  try {
    walk(join(ROOT, d));
  } catch {}
}
let bad = 0;
let emoji = 0;
for (const f of files) {
  if (f.endsWith('check.js')) continue;
  const rel = f.slice(ROOT.length + 1);
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (BAD.test(line)) {
        bad++;
        console.log(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
      }
      if ((GAME.test(rel) && EMOJI.test(line)) || (UI.test(rel) && ARROW.test(line))) {
        emoji++;
        console.log(`${rel}:${i + 1}: emoji: ${line.trim().slice(0, 120)}`);
      }
    });
}
console.log(bad ? `${bad} satırda şapkalı harf var.` : `Şapkalı harf yok (${files.length} dosya).`);
console.log(emoji ? `${emoji} satırda emoji var (simgeler src/ui/icons.js'ten SVG olmalı).` : 'Oyun dosyalarında emoji yok.');
process.exit(bad || emoji ? 1 : 0);
