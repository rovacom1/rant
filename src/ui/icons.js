// Özel kare ikonları: Monopoly tahtasındaki gibi sade, kalın hatlı, tek bakışta okunan çizimler (64x64).
// Aynı ikon tahtada birkaç kez çizildiği için gradyan kimlikleri her çağrıda tekilleşir.

let seq = 0;

const star = (cx, cy, R, r) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36 - 90) * Math.PI) / 180;
    const k = i % 2 ? r : R;
    return `${(cx + k * Math.cos(a)).toFixed(2)},${(cy + k * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

const grad = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

const DRAW = {
  air: (u) => `<defs>${grad(`a${u}`, '#f6f9ff', '#9db6da', 1, 1)}</defs>
    <g transform="rotate(45 32 32)">
      <path d="M32 4C35 4 36.5 7 36.5 11V24L57.5 36V42L36.5 36V48L43.5 53V57L32 54L20.5 57V53L27.5 48V36L6.5 42V36L27.5 24V11C27.5 7 29 4 32 4Z" fill="url(#a${u})" stroke="#2c4a7a" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M30 10Q32 8 34 10V14H30Z" fill="#2c4a7a" opacity=".75"/>
    </g>`,
  rail: (u) => `<defs>${grad(`b${u}`, '#6a7fa3', '#36435c')}</defs>
    <circle cx="17" cy="9" r="3.5" fill="#d5dbe6"/><circle cx="25" cy="6" r="4.5" fill="#d5dbe6"/><circle cx="35" cy="5" r="3.5" fill="#d5dbe6" opacity=".8"/>
    <path d="M11 13H21L19.5 17V25H12.5V17Z" fill="#3b465c" stroke="#1b2233" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M24 25C24 19 32 19 32 25Z" fill="#edae49" stroke="#1b2233" stroke-width="1.6"/>
    <rect x="6" y="24" width="36" height="15" rx="6" fill="url(#b${u})" stroke="#1b2233" stroke-width="1.8"/>
    <rect x="17" y="24.8" width="2.6" height="13.4" fill="#edae49"/><rect x="30" y="24.8" width="2.6" height="13.4" fill="#edae49"/>
    <circle cx="7" cy="30" r="3" fill="#ffd75e" stroke="#1b2233" stroke-width="1.4"/>
    <rect x="41" y="15" width="17" height="24" rx="2" fill="#d1495b" stroke="#1b2233" stroke-width="1.8"/>
    <rect x="39" y="12" width="21" height="5" rx="2" fill="#8f2433" stroke="#1b2233" stroke-width="1.6"/>
    <rect x="45" y="19" width="9" height="8" rx="1.5" fill="#fff3cf" stroke="#1b2233" stroke-width="1.4"/>
    <rect x="4" y="38" width="56" height="5" rx="1.5" fill="#2b3445" stroke="#1b2233" stroke-width="1.4"/>
    <path d="M7 41L1.5 51H12Z" fill="#d1495b" stroke="#1b2233" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="22" cy="49" r="7.5" fill="#2b3445" stroke="#1b2233" stroke-width="1.6"/><circle cx="22" cy="49" r="4.3" fill="none" stroke="#edae49" stroke-width="1.6"/>
    <circle cx="38" cy="49" r="7.5" fill="#2b3445" stroke="#1b2233" stroke-width="1.6"/><circle cx="38" cy="49" r="4.3" fill="none" stroke="#edae49" stroke-width="1.6"/>
    <circle cx="52" cy="51" r="5" fill="#2b3445" stroke="#1b2233" stroke-width="1.6"/><circle cx="52" cy="51" r="1.8" fill="#edae49"/>
    <path d="M22 49H38" stroke="#edae49" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M2 58.5H62" stroke="#8a8f9c" stroke-width="2" stroke-linecap="round"/>`,
  surpriz: (u) => `<defs>${grad(`q${u}`, '#ffa3d9', '#e0408f')}</defs>
    <text x="33.5" y="56" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="62" fill="#8e1d57">?</text>
    <text x="32" y="53" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="62" fill="url(#q${u})" stroke="#fff" stroke-width="1.6" paint-order="stroke">?</text>
    <polygon points="${star(52, 12, 4.5, 1.6)}" fill="#ffe27a"/><polygon points="${star(11, 20, 3, 1.1)}" fill="#ffe27a"/>`,
  chance: (u) => `<defs>${grad(`c${u}`, '#ffc857', '#f0902a')}${grad(`d${u}`, '#f4a23c', '#cf6418')}</defs>
    <path d="M9 31V24C9 15 18 11 32 11C46 11 55 15 55 24V31Z" fill="url(#c${u})" stroke="#6b3510" stroke-width="2" stroke-linejoin="round"/>
    <rect x="9" y="31" width="46" height="23" rx="3" fill="url(#d${u})" stroke="#6b3510" stroke-width="2"/>
    <rect x="17" y="13" width="5" height="41" fill="#ffdf7e" stroke="#6b3510" stroke-width="1.4"/><rect x="42" y="13" width="5" height="41" fill="#ffdf7e" stroke="#6b3510" stroke-width="1.4"/>
    <path d="M9 31H55" stroke="#6b3510" stroke-width="2"/>
    <rect x="27" y="26" width="10" height="12" rx="2" fill="#ffe9a8" stroke="#6b3510" stroke-width="1.6"/>
    <circle cx="32" cy="30.5" r="1.8" fill="#6b3510"/><rect x="31.2" y="31" width="1.6" height="4" fill="#6b3510"/>
    <polygon points="${star(53, 8, 4.5, 1.6)}" fill="#fff3b0"/><polygon points="${star(9, 10, 3, 1.1)}" fill="#fff3b0"/>`,
  tapu: () => `<path d="M14 7H42L50 15V57H14Z" fill="#fffaf0" stroke="#5b4a2e" stroke-width="2" stroke-linejoin="round"/>
    <path d="M42 7V15H50" fill="#efe2c2" stroke="#5b4a2e" stroke-width="2" stroke-linejoin="round"/>
    <rect x="18" y="12" width="18" height="5" rx="1" fill="#2e7d5b"/>
    <rect x="18" y="23" width="27" height="2.4" rx="1.2" fill="#b8a98a"/><rect x="18" y="29" width="24" height="2.4" rx="1.2" fill="#b8a98a"/>
    <rect x="18" y="35" width="27" height="2.4" rx="1.2" fill="#b8a98a"/><rect x="18" y="41" width="13" height="2.4" rx="1.2" fill="#b8a98a"/>
    <path d="M37 53L35 61L38 59L40 62L41 54Z M45 53L47 61L44 59L42 62L41 54Z" fill="#b83343"/>
    <circle cx="41" cy="47" r="8" fill="#d1495b" stroke="#8f2433" stroke-width="1.6"/>
    <polygon points="${star(41, 47, 4.2, 1.8)}" fill="#ffe1a0"/>`,
  zabita: (u) => `<defs>${grad(`z${u}`, '#3d63c2', '#1d2f6b')}</defs>
    <path d="M8 31C8 19 19 12 32 12C45 12 56 19 56 31Z" fill="url(#z${u})" stroke="#0f1a3d" stroke-width="2" stroke-linejoin="round"/>
    <rect x="10" y="30" width="44" height="8" rx="1.5" fill="#14204a" stroke="#0f1a3d" stroke-width="1.6"/>
    <rect x="12" y="33" width="40" height="2" fill="#edae49"/>
    <path d="M9 38H55C53 46 43 50 32 50C21 50 11 46 9 38Z" fill="#11151f" stroke="#0f1a3d" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M16 41C24 44 40 44 48 41" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M32 15L40 18.5V25C40 30 36.5 33 32 35C27.5 33 24 30 24 25V18.5Z" fill="#f2c14e" stroke="#9b6b12" stroke-width="1.6" stroke-linejoin="round"/>
    <polygon points="${star(32, 24, 3.6, 1.5)}" fill="#9b6b12"/>`,
  cay: (u) => `<defs><linearGradient id="t${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3e6"/><stop offset=".1" stop-color="#fff3e6"/><stop offset=".11" stop-color="#e5743a"/><stop offset="1" stop-color="#9e2a1d"/></linearGradient></defs>
    <path d="M27 13C24 10 30 7 27 3M33 13C30 10 36 7 33 3M39 13C36 10 42 7 39 3" fill="none" stroke="#cfd6e2" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="32" cy="55" rx="19" ry="5" fill="#f3e3bd" stroke="#8a5a2b" stroke-width="1.8"/>
    <ellipse cx="32" cy="54" rx="10" ry="2.5" fill="#e3cd9c"/>
    <path d="M22 16H42C42 25 37 29 37 35C37 42 41 46 41 53H23C23 46 27 42 27 35C27 29 22 25 22 16Z" fill="url(#t${u})" stroke="#7a4a22" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M25.5 20C26 27 29.5 30 29.5 35C29.5 40 26.5 44 26.5 50" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.8" stroke-linecap="round"/>`,
  start: (u) => `<defs>${grad(`m${u}`, '#4cc38a', '#1f7a52')}</defs>
    <path d="M23 22C16 28 10 35 10 44C10 53 19 58 32 58C45 58 54 53 54 44C54 35 48 28 41 22Z" fill="url(#m${u})" stroke="#12513a" stroke-width="2" stroke-linejoin="round"/>
    <path d="M22 8C26 11 29 11 32 9C35 11 38 11 42 8L39 18H25Z" fill="#4cc38a" stroke="#12513a" stroke-width="1.8" stroke-linejoin="round"/>
    <rect x="23" y="18.5" width="18" height="4.5" rx="2" fill="#edae49" stroke="#9b6b12" stroke-width="1.4"/>
    <text x="32" y="50" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="22" fill="#fff3c4">₺</text>`,
};

export function icon(name) {
  const draw = DRAW[name];
  return draw ? `<svg class="ico" viewBox="0 0 64 64" aria-hidden="true">${draw(++seq)}</svg>` : '';
}
