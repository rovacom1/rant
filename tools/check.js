// Metin denetimi: Türkçe metinlerde şapkalı harf (â, î, û) olmamalı. node tools/check.js
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIRS = ['src', 'docs', 'otomasyon', 'tasks', 'test', 'tools', 'styles', '.github'];
const EXTS = new Set(['.js', '.md', '.html', '.css', '.yml', '.json']);
const BAD = /[âîûÂÎÛ]/;
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
for (const f of files) {
  if (f.endsWith('check.js')) continue;
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (BAD.test(line)) {
        bad++;
        console.log(`${f.slice(ROOT.length + 1)}:${i + 1}: ${line.trim().slice(0, 120)}`);
      }
    });
}
console.log(bad ? `${bad} satırda şapkalı harf var.` : `Şapkalı harf yok (${files.length} dosya).`);
process.exit(bad ? 1 : 0);
