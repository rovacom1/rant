// Simgeler: emoji yok, hepsi SVG. İki tür var:
// - Renkli oyun simgeleri (ev, koni, tokmak, tahta kareleri...) kendi renklerindedir; koyu temada ince açık kontur alır (CSS .ic.c).
// - Çizgi simgeler (ses, tema, ok, kapat...) yazının rengini alır (currentColor).
// ic(ad) yazı boyunun 1,2 katı, yazının orta çizgisine hizalı çizilir (CSS .ic); boyu üst öğenin font-size'ı belirler.
// icon(ad) tahta karesindeki büyük kare simgesidir (64x64, kareye göre boyutlanır).

const LINE = {
  sound: 'M4 9.5v5h4l5 4.5V5L8 9.5zM16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11',
  mute: 'M4 9.5v5h4l5 4.5V5L8 9.5zM17 9.5l5 5M22 9.5l-5 5',
  music: 'M9 18V5.5l11-2V16M9 18a3 3 0 1 1-6 0a3 3 0 1 1 6 0M20 16a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
  shake: 'M8.5 5h7v14h-7zM5 8v8M19 8v8M2 10v4M22 10v4',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20.5a2 2 0 0 0 4 0',
  smile: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5v1M15 9.5v1',
  bellOff: 'M6 16V11a6 6 0 0 1 9.5-4.9M18 11v5l2 2H4M10 20.5a2 2 0 0 0 4 0M3.5 3.5l17 17',
  sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  copy: 'M9 9h11v11H9zM15 9V4H4v11h5',
  info: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 11v6M12 7.5v.01',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M4.5 12.5l5 5l10-11',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  gear: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
  history: 'M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4.5h4.5M12 8v4.5l3 2',
  map: 'M3 6.5l6-2.5l6 2.5l6-2.5v13l-6 2.5l-6-2.5l-6 2.5zM9 4v13M15 6.5v13',
  eye: 'M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z',
  user: 'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4.5 21a7.5 7.5 0 0 1 15 0',
  chevron: 'M9 5l7 7l-7 7',
  back: 'M15 5l-7 7l7 7',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4.5h-4.5',
  rotate: 'M5 9.5h14a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17v-6A1.5 1.5 0 0 1 5 9.5zM17 14h.01M7.5 6.5A6 6 0 0 1 16 4.5M16 2v2.5h-2.5',
  expand: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  play: 'M7 4.5l12 7.5l-12 7.5z',
  arrow: 'M4 12h15M13 6l6 6l-6 6',
  arrowL: 'M20 12H5M11 6l-6 6l6 6',
  swap2: 'M4 8h14M14 4l4 4l-4 4M20 16H6M10 12l-4 4l4 4',
  tl: 'M9 3.5V20.5M9 20.5C14.5 20.5 18.5 17 18.5 11.5M4.5 11.5L14.5 7M4.5 16L14.5 11.5',
  shield: 'M12 3l7.5 3v5.5c0 5-3.5 8-7.5 9.5c-4-1.5-7.5-4.5-7.5-9.5V6z',
  bolt: 'M13.5 2.5L5.5 13.5h6l-1 8l8-11h-6z',
  home: 'M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5',
};

// Renkli küçük simgeler (24x24).
const COLOR = {
  house: '<path d="M2 12.5L12 3.5L22 12.5Z" fill="#d1495b" stroke="#1b2233" stroke-width="2" stroke-linejoin="round"/><path d="M5 11.5H19V21H5Z" fill="#fff3dc" stroke="#1b2233" stroke-width="2" stroke-linejoin="round"/><path d="M10 21V15.5H14V21" fill="#8a5a2b" stroke="#1b2233" stroke-width="1.6"/>',
  kacak: '<path d="M9.2 3H14.8L19 18.5H5Z" fill="#f28c28" stroke="#1b2233" stroke-width="2" stroke-linejoin="round"/><path d="M7.6 9.5H16.4L17.3 13H6.7Z" fill="#fff"/><rect x="2.5" y="18" width="19" height="3.5" rx="1" fill="#f28c28" stroke="#1b2233" stroke-width="2"/>',
  ipotek: '<path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="#1b2233" stroke-width="2.4"/><rect x="4.5" y="10.5" width="15" height="11" rx="2.5" fill="#edae49" stroke="#1b2233" stroke-width="2"/><circle cx="12" cy="15" r="1.7" fill="#1b2233"/><path d="M12 15.5v3" stroke="#1b2233" stroke-width="2" stroke-linecap="round"/>',
  tedbir: '<path d="M12 3.5V20M5 7H19M7 20.5H17M5.5 7L2.5 13.5M5.5 7L8.5 13.5M18.5 7L15.5 13.5M18.5 7L21.5 13.5" fill="none" stroke="#1b2233" stroke-width="1.8" stroke-linecap="round"/><path d="M2 13.5H9A3.5 3.5 0 0 1 2 13.5Z" fill="#7aa2d6" stroke="#1b2233" stroke-width="1.6"/><path d="M15 13.5H22A3.5 3.5 0 0 1 15 13.5Z" fill="#7aa2d6" stroke="#1b2233" stroke-width="1.6"/><circle cx="12" cy="4" r="1.8" fill="#edae49" stroke="#1b2233" stroke-width="1.2"/>',
  star: '<path d="M12 2.5l2.9 6l6.6.9l-4.8 4.6l1.2 6.5L12 17.4l-5.9 3.1l1.2-6.5L2.5 9.4l6.6-.9z" fill="#f5c542" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/>',
  crown: '<path d="M3 8l4.5 4L12 4.5l4.5 7.5L21 8l-2 11H5z" fill="#f5c542" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="15" r="1.6" fill="#d1495b"/>',
  trophy: '<path d="M7 3.5h10v5a5 5 0 0 1-10 0z" fill="#f5c542" stroke="#1b2233" stroke-width="1.8"/><path d="M7 5.5H4a3.5 3.5 0 0 0 3.5 4M17 5.5h3a3.5 3.5 0 0 1-3.5 4" fill="none" stroke="#1b2233" stroke-width="1.8"/><path d="M12 13.5v3.5M8 21h8l-1-4H9z" fill="#c9962a" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/>',
  gavel: '<g transform="rotate(-45 11 10)"><rect x="9.6" y="9" width="2.8" height="12.5" rx="1.4" fill="#d9a066" stroke="#1b2233" stroke-width="1.6"/><rect x="4.5" y="2.5" width="13" height="7" rx="2" fill="#b0743a" stroke="#1b2233" stroke-width="1.6"/><path d="M7.5 2.8V9.2M14.5 2.8V9.2" stroke="#1b2233" stroke-width="1.4"/></g><rect x="12.5" y="18.5" width="9.5" height="3.5" rx="1.2" fill="#8a5a2b" stroke="#1b2233" stroke-width="1.6"/>',
  deal: '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5H18M14.5 4.5L18.5 8.5L14.5 12.5" stroke="#1b2233" stroke-width="4.4"/><path d="M3.5 8.5H18M14.5 4.5L18.5 8.5L14.5 12.5" stroke="#2a9d8f" stroke-width="2.2"/><path d="M20.5 15.5H6M9.5 11.5L5.5 15.5L9.5 19.5" stroke="#1b2233" stroke-width="4.4"/><path d="M20.5 15.5H6M9.5 11.5L5.5 15.5L9.5 19.5" stroke="#e8833a" stroke-width="2.2"/></g>',
  hamle: '<rect x="4.5" y="2.5" width="15" height="19" rx="2.5" fill="#273152" stroke="#1b2233" stroke-width="1.8"/><path d="M13.5 5L8 13h4l-1.5 6L16 11h-4z" fill="#f5c542" stroke="#1b2233" stroke-width="1.2" stroke-linejoin="round"/>',
  tepki: '<rect x="4.5" y="2.5" width="15" height="19" rx="2.5" fill="#273152" stroke="#1b2233" stroke-width="1.8"/><path d="M12 5.5l5 2v4c0 3.5-2.2 5.5-5 6.5c-2.8-1-5-3-5-6.5v-4z" fill="#d1495b" stroke="#1b2233" stroke-width="1.2" stroke-linejoin="round"/>',
  news: '<path d="M3.5 4.5H17.5V19.5H6A2.5 2.5 0 0 1 3.5 17Z" fill="#fffaf0" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><path d="M17.5 8.5H20.5V17.5A2 2 0 0 1 17.5 19.5" fill="#efe2c2" stroke="#1b2233" stroke-width="1.8"/><rect x="6" y="7" width="9" height="3.2" fill="#d1495b"/><path d="M6 13H15M6 16H12" stroke="#1b2233" stroke-width="1.6" stroke-linecap="round"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4.5" fill="#fffaf0" stroke="#1b2233" stroke-width="2"/><circle cx="8" cy="8" r="1.8" fill="#1b2233"/><circle cx="12" cy="12" r="1.8" fill="#d1495b"/><circle cx="16" cy="16" r="1.8" fill="#1b2233"/>',
  coin: '<circle cx="12" cy="12" r="9" fill="#f5c542" stroke="#1b2233" stroke-width="2"/><path d="M10 7v10M10 11l5-2M10 14l5-2M10 17c3 0 5-1.6 5-4" fill="none" stroke="#8a5a14" stroke-width="1.8" stroke-linecap="round"/>',
  iflas: '<path d="M11 3.1A9 9 0 0 0 11 20.9L9.5 15L12.5 11.5L10 7.5Z" fill="#c9ced8" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><path d="M13.5 3.2A9 9 0 0 1 13.5 20.8L15 15.5L12 12L14.5 7.5Z" fill="#c9ced8" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/>',
  timer: '<path d="M6 3H18M6 21H18" stroke="#1b2233" stroke-width="2.2" stroke-linecap="round"/><path d="M7.5 3.5C7.5 8.5 16.5 9 16.5 12S7.5 15.5 7.5 20.5H16.5C16.5 15.5 7.5 15 7.5 12S16.5 8.5 16.5 3.5Z" fill="#fffaf0" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.5 19.5H14.5L12 16.5Z M10 6H14L12 9Z" fill="#edae49"/>',
  turn: '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12a7 7 0 1 1-2.1-5M19 4v4h-4" stroke="#1b2233" stroke-width="4.2"/><path d="M19 12a7 7 0 1 1-2.1-5M19 4v4h-4" stroke="#2a9d8f" stroke-width="2.2"/></g>',
  target: '<circle cx="12" cy="12" r="9.5" fill="#d1495b" stroke="#1b2233" stroke-width="1.8"/><circle cx="12" cy="12" r="6" fill="#fffaf0"/><circle cx="12" cy="12" r="3" fill="#d1495b"/>',
  build: '<path d="M6 21V4H8V21M3 21H11M8 5H21M8 5L12 9M17 5V11" fill="none" stroke="#1b2233" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 21V4H8V21M3 21H11M8 5H21M8 5L12 9M17 5V11" fill="none" stroke="#f5c542" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="14.5" y="11" width="5" height="4" rx="1" fill="#d1495b" stroke="#1b2233" stroke-width="1.4"/>',
  bot: '<path d="M12 3.5V7" stroke="#1b2233" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="3.5" r="1.6" fill="#d1495b" stroke="#1b2233" stroke-width="1.2"/><rect x="4" y="7" width="16" height="13" rx="4" fill="#c9d1de" stroke="#1b2233" stroke-width="1.8"/><circle cx="9" cy="13" r="2" fill="#1b2233"/><circle cx="15" cy="13" r="2" fill="#1b2233"/><path d="M9.5 17H14.5" stroke="#1b2233" stroke-width="1.6" stroke-linecap="round"/>',
  plug: '<path d="M9 3V7M15 3V7" stroke="#1b2233" stroke-width="2" stroke-linecap="round"/><path d="M6 7H18V11A6 6 0 0 1 6 11Z" fill="#c9d1de" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 17V21" stroke="#1b2233" stroke-width="2" stroke-linecap="round"/><path d="M3.5 3.5L20.5 20.5" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M3.5 3.5L20.5 20.5" stroke="#d1495b" stroke-width="2.2" stroke-linecap="round"/>',
  door: '<path d="M5 21V3.5H15V21" fill="#b0743a" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12.3" cy="12.5" r="1.2" fill="#f5c542"/><path d="M17 12H22M19.5 9.5L22 12L19.5 14.5" fill="none" stroke="#1b2233" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 21H17" stroke="#1b2233" stroke-width="2" stroke-linecap="round"/>',
  warning: '<path d="M12 3L22 20H2Z" fill="#f5c542" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9.5V14" stroke="#1b2233" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.3" fill="#1b2233"/>',
  cards: '<rect x="3" y="5" width="10" height="14" rx="2" transform="rotate(-14 8 12)" fill="#7aa2d6" stroke="#1b2233" stroke-width="1.6"/><rect x="7" y="4" width="10" height="14" rx="2" fill="#f5c542" stroke="#1b2233" stroke-width="1.6"/><rect x="11" y="5" width="10" height="14" rx="2" transform="rotate(14 16 12)" fill="#273152" stroke="#1b2233" stroke-width="1.6"/>',
  up: '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18L9 12L13 15L21 6M15 6H21V12" stroke="#1b2233" stroke-width="4.2"/><path d="M3 18L9 12L13 15L21 6M15 6H21V12" stroke="#2f9e66" stroke-width="2.2"/></g>',
  down: '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6L9 12L13 9L21 18M15 18H21V12" stroke="#1b2233" stroke-width="4.2"/><path d="M3 6L9 12L13 9L21 18M15 18H21V12" stroke="#d1495b" stroke-width="2.2"/></g>',
  taksi: '<path d="M3 15.5V12.5L5.5 7.5H18.5L21 12.5V15.5Z" fill="#f5c542" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 8.5H17L18.5 12H5.5Z" fill="#dff1ff" stroke="#1b2233" stroke-width="1.2"/><rect x="9.5" y="5" width="5" height="2.5" rx="1" fill="#1b2233"/><circle cx="7" cy="16.5" r="2.4" fill="#1b2233"/><circle cx="17" cy="16.5" r="2.4" fill="#1b2233"/>',
  fork: '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V13L12 6M12 6L19 13V21M12 6V3M9 3H15" stroke="#1b2233" stroke-width="4"/><path d="M5 21V13L12 6M12 6L19 13V21M12 6V3" stroke="#f28c28" stroke-width="2"/></g>',
  book: '<path d="M4 4.5A2 2 0 0 1 6 2.5H20V18.5H6A2 2 0 0 0 4 20.5Z" fill="#2a9d8f" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 20.5A2 2 0 0 0 6 22H20V18.5" fill="#fffaf0" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 7H16M9 10H14" stroke="#fffaf0" stroke-width="1.8" stroke-linecap="round"/>',
  scroll: '<path d="M6 4H18V18A2.5 2.5 0 0 0 20.5 20.5H8.5A2.5 2.5 0 0 1 6 18Z" fill="#fffaf0" stroke="#1b2233" stroke-width="1.8" stroke-linejoin="round"/><path d="M3.5 4A2.5 2.5 0 0 1 6 1.5V4H3.5" fill="#efe2c2" stroke="#1b2233" stroke-width="1.6"/><path d="M9 8H15M9 11H15M9 14H13" stroke="#1b2233" stroke-width="1.6" stroke-linecap="round"/>',
};

// Tahta karelerinin büyük simgeleri (64x64).
const BOARD_ART = {
  start: '<path d="M23 22C16 28 10 35 10 44C10 53 19 58 32 58C45 58 54 53 54 44C54 35 48 28 41 22Z" fill="#2f9e66" stroke="#12513a" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 8C26 11 29 11 32 9C35 11 38 11 42 8L39 18H25Z" fill="#4cc38a" stroke="#12513a" stroke-width="2.2" stroke-linejoin="round"/><rect x="23" y="18.5" width="18" height="4.5" rx="2" fill="#edae49" stroke="#9b6b12" stroke-width="1.6"/><path d="M28 34v15M28 40l9-4M28 45l9-4M28 49c6 0 10-3 10-7" fill="none" stroke="#fff3c4" stroke-width="3.2" stroke-linecap="round"/>',
  tapu: '<path d="M14 7H42L50 15V57H14Z" fill="#fffaf0" stroke="#5b4a2e" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 7V15H50" fill="#efe2c2" stroke="#5b4a2e" stroke-width="2.5" stroke-linejoin="round"/><rect x="18" y="12" width="18" height="5" rx="1" fill="#2e7d5b"/><rect x="18" y="23" width="27" height="2.6" rx="1.3" fill="#b8a98a"/><rect x="18" y="29" width="24" height="2.6" rx="1.3" fill="#b8a98a"/><rect x="18" y="35" width="27" height="2.6" rx="1.3" fill="#b8a98a"/><path d="M37 53L35 61L38 59L40 62L41 54Z M45 53L47 61L44 59L42 62L41 54Z" fill="#b83343"/><circle cx="41" cy="47" r="8" fill="#d1495b" stroke="#8f2433" stroke-width="1.8"/>',
  cay: '<path d="M27 13C24 10 30 7 27 3M33 13C30 10 36 7 33 3M39 13C36 10 42 7 39 3" fill="none" stroke="#9aa6ba" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="32" cy="55" rx="19" ry="5" fill="#f3e3bd" stroke="#8a5a2b" stroke-width="2"/><path d="M22 16H42C42 25 37 29 37 35C37 42 41 46 41 53H23C23 46 27 42 27 35C27 29 22 25 22 16Z" fill="#c4502b" stroke="#7a4a22" stroke-width="2.2" stroke-linejoin="round"/><path d="M22.4 16H41.6L41 19H23Z" fill="#fff3e6"/><path d="M25.5 21C26 27 29.5 30 29.5 35C29.5 40 26.5 44 26.5 50" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>',
  zabita: '<path d="M8 31C8 19 19 12 32 12C45 12 56 19 56 31Z" fill="#2a4aa0" stroke="#0f1a3d" stroke-width="2.5" stroke-linejoin="round"/><rect x="10" y="30" width="44" height="8" rx="1.5" fill="#14204a" stroke="#0f1a3d" stroke-width="2"/><rect x="12" y="33" width="40" height="2" fill="#edae49"/><path d="M9 38H55C53 46 43 50 32 50C21 50 11 46 9 38Z" fill="#11151f" stroke="#0f1a3d" stroke-width="2" stroke-linejoin="round"/><path d="M32 15L40 18.5V25C40 30 36.5 33 32 35C27.5 33 24 30 24 25V18.5Z" fill="#f2c14e" stroke="#9b6b12" stroke-width="2" stroke-linejoin="round"/>',
  air: '<g transform="rotate(45 32 32)"><path d="M32 4C35 4 36.5 7 36.5 11V24L57.5 36V42L36.5 36V48L43.5 53V57L32 54L20.5 57V53L27.5 48V36L6.5 42V36L27.5 24V11C27.5 7 29 4 32 4Z" fill="#dfe8f6" stroke="#2c4a7a" stroke-width="2.8" stroke-linejoin="round"/><path d="M30 10Q32 8 34 10V14H30Z" fill="#2c4a7a"/></g>',
  rail: '<circle cx="17" cy="9" r="3.5" fill="#c9d1de"/><circle cx="25" cy="6" r="4.5" fill="#c9d1de"/><path d="M11 13H21L19.5 17V25H12.5V17Z" fill="#3b465c" stroke="#1b2233" stroke-width="2" stroke-linejoin="round"/><rect x="6" y="24" width="36" height="15" rx="6" fill="#55678a" stroke="#1b2233" stroke-width="2.2"/><rect x="17" y="24.8" width="2.6" height="13.4" fill="#edae49"/><rect x="30" y="24.8" width="2.6" height="13.4" fill="#edae49"/><rect x="41" y="15" width="17" height="24" rx="2" fill="#d1495b" stroke="#1b2233" stroke-width="2.2"/><rect x="45" y="19" width="9" height="8" rx="1.5" fill="#fff3cf" stroke="#1b2233" stroke-width="1.6"/><rect x="4" y="38" width="56" height="5" rx="1.5" fill="#2b3445" stroke="#1b2233" stroke-width="1.6"/><circle cx="22" cy="49" r="7.5" fill="#2b3445" stroke="#1b2233" stroke-width="2"/><circle cx="38" cy="49" r="7.5" fill="#2b3445" stroke="#1b2233" stroke-width="2"/><circle cx="52" cy="51" r="5" fill="#2b3445" stroke="#1b2233" stroke-width="2"/><path d="M22 49H38" stroke="#edae49" stroke-width="2.6" stroke-linecap="round"/>',
  surpriz: '<path d="M20 22C20 12 27 7 33 7C41 7 46 12 46 19C46 27 36 29 36 37V40H28V35C28 26 38 24 38 19C38 16 36 14 33 14C29.5 14 28 17 28 22Z" fill="#ea5ea8" stroke="#8e1d57" stroke-width="2.6" stroke-linejoin="round"/><circle cx="32" cy="50" r="5.5" fill="#ea5ea8" stroke="#8e1d57" stroke-width="2.6"/><path d="M52 6 L53.4 10.6 L58 12 L53.4 13.4 L52 18 L50.6 13.4 L46 12 L50.6 10.6 Z" fill="#ffd84d" stroke="#9b6b12" stroke-width="1"/>',
  chance: '<path d="M9 31V24C9 15 18 11 32 11C46 11 55 15 55 24V31Z" fill="#f7b04a" stroke="#6b3510" stroke-width="2.5" stroke-linejoin="round"/><rect x="9" y="31" width="46" height="23" rx="3" fill="#e2802b" stroke="#6b3510" stroke-width="2.5"/><rect x="17" y="13" width="5" height="41" fill="#ffdf7e" stroke="#6b3510" stroke-width="1.6"/><rect x="42" y="13" width="5" height="41" fill="#ffdf7e" stroke="#6b3510" stroke-width="1.6"/><rect x="27" y="26" width="10" height="12" rx="2" fill="#ffe9a8" stroke="#6b3510" stroke-width="2"/>',
};

// Küçük boyda da kullanılan tahta simgeleri (oyuncu satırı, geçmiş, sürpriz): aynı çizim 64'lük alanda.
export function ic(name, cls = '') {
  if (LINE[name]) return `<svg class="ic l ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${LINE[name]}"/></svg>`;
  if (COLOR[name]) return `<svg class="ic c ${cls}" viewBox="0 0 24 24" aria-hidden="true">${COLOR[name]}</svg>`;
  if (BOARD_ART[name]) return `<svg class="ic c ${cls}" viewBox="0 0 64 64" aria-hidden="true">${BOARD_ART[name]}</svg>`;
  return '';
}

export const icon = (name) => (BOARD_ART[name] ? `<svg class="ico" viewBox="0 0 64 64" aria-hidden="true">${BOARD_ART[name]}</svg>` : '');

// Para: sayı başlık yazı tipinde, lira işareti SVG (yazı tiplerinin ₺ çizimine güvenilmez). Negatifte uzun eksi.
export function money(n, sign = false) {
  const abs = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const pre = n < 0 ? '−' : sign && n > 0 ? '+' : '';
  return `<span class="m">${pre}${abs}${ic('tl', 'tl')}</span>`;
}

// Kart, gündem, sürpriz ve olay türlerinin simgeleri.
export const CARD_IC = { itiraz: 'shield', dayi: 'shield', taksi: 'taksi', kestirme: 'fork', geriVites: 'arrowL', kamulastirma: 'tapu', takas: 'swap2', tedbir: 'tedbir', ihbar: 'zabita', kiraZammi: 'up', muteahhit: 'build', piyango: 'coin', aidat: 'coin', dava: 'tedbir', pazarlik: 'deal' };
export const GUNDEM_IC = { enflasyon: 'up', dolar: 'down', asgari: 'coin', imarAffi: 'house', operasyon: 'kacak', turizm: 'sun', ulasimZam: 'rail', deprem: 'warning', emlakVergisi: 'tapu', kiraTavani: 'down', kiraArtisi: 'up', bayram: 'coin', kentsel: 'build', secimVaadi: 'trophy', rantVergisi: 'coin', grev: 'warning', durgunluk: 'down', kampanya: 'house', faizIndirimi: 'ipotek', faizUctu: 'ipotek', zabitaIzinde: 'zabita', metro: 'rail', komsuluk: 'cards', sakin: 'cay' };
export const SURPRIZ_IC = { miras: 'coin', radar: 'warning', dugun: 'coin', hesap: 'coin', robin: 'swap2', catlak: 'kacak', jest: 'house', tarla: 'tapu', ucak: 'air', isinlan: 'surpriz', tersKose: 'swap2', kapkac: 'cards', bavul: 'cards', haciz: 'tedbir', vergiIade: 'coin' };
