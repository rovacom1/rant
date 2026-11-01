// Mahalle modu (docs/TASARIM.md §13): 6x6 adsız arsa, köşe ve özel kare yok. Zarlar (satır, sütun) ya da (sütun, satır)
// gösterir, oyuncu birini seçer ve piyon oraya zıplar. Maaş yerine her sıra başında hakediş; Torpil jetonu bir zarı 1
// oynatır; inşaat yalnız piyonun yanında; site, blok, park, AVM ve gecekondu kiraya çarpan olur (rules.js rentBreakdown).
// Oyun akışı (game.js) tahtaya özel her şeyi buradaki mod nesnesinden çağırır, klasik.js gibi.

import { MAHALLE, AMOUNTS } from './data.js';
import { boardOf, plotAt, SIDE } from './board.js';
import { rollDie } from './rng.js';
import * as R from './rules.js';
import { need, emit, say, nm, sqName, isOpp, drawCards, transfer, chargeRent, stat } from './core.js';

const MANAGE_STEPS = ['preroll', 'free'];
const sameLine = (a, b) => a !== b && (Math.floor(a / SIDE) === Math.floor(b / SIDE) || a % SIDE === b % SIDE);
// n. satır ve n. sütundaki arsalar (11 arsa): çift atınca ve Taksi'de seçilebilenler.
export const lineOf = (sq) => boardOf({ mode: 'mahalle' }).ownable.filter((q) => sameLine(sq, q));

// Zar atıldıktan sonra seçilebilecek arsalar. Çift değilse (satır, sütun) ve (sütun, satır); çift (n, n) ise n. satır ve
// n. sütundaki her arsa. İlki süre dolunca seçilir.
export function pickOptions([a, b]) {
  if (a !== b) return [plotAt(a, b), plotAt(b, a)];
  const n = plotAt(a, a);
  return [n, ...lineOf(n)];
}

const moveOptions = (s) => (s.turn?.dice ? pickOptions(s.turn.dice) : []);

// Piyon arsaya zıplar (yol yok, aradaki arsalar işlemez). Olay gizli bilgi taşımaz: nereden nereye.
function jump(s, ctx, p, sq) {
  const pl = s.players[p];
  const from = pl.pos;
  if (from !== null) pl.prev = from;
  pl.pos = sq;
  emit(s, ctx, { type: 'move', p, path: [sq], jump: true, from, text: `${nm(s, p)} zıpladı → ${sqName(s, sq)}` });
  s.turn.step = 'free';
  land(s, ctx, p);
}

function land(s, ctx, p) {
  const sq = s.players[p].pos;
  const ps = s.props[sq];
  if (ps.owner === null) s.pending = { type: 'buy', p, sq };
  else if (ps.owner !== p) {
    if (ps.park) return say(s, ctx, `${sqName(s, sq)} park: kira yok.`);
    chargeRent(s, ctx, p, sq);
  }
}

// İhbar Mahalle'de gecekonduları da yıkar: her kaçak kat ve gecekondu için ceza.
function ihbar(s, ctx, victim, by) {
  let n = 0;
  let g = 0;
  for (const ps of s.props) {
    if (ps.owner === victim && ps.kacak) {
      ps.kacak = 0;
      n++;
    }
    if (ps.gk && ps.gk.p === victim) {
      ps.gk = null;
      g++;
    }
  }
  if (!n && !g) return say(s, ctx, `İhbar: ${nm(s, victim)} oyuncusunda kaçak kat ya da gecekondu bulunamadı.`);
  stat(s, by, 'yikim', n + g);
  const what = [n && `${n} kaçak katı`, g && `${g} gecekondusu`].filter(Boolean).join(' ve ');
  emit(s, ctx, { type: 'demolish', p: victim, n, gk: g, text: `İhbar: ${nm(s, victim)} oyuncusunun ${what} yıkıldı!` });
  transfer(s, ctx, victim, null, R.money(s, AMOUNTS.ihbarFine) * (n + g), 'İhbar cezası');
}

// Kamulaştırma ve Zorla Takas'ta alınamayan arsa: katlı, parklı, AVM'li, sitede.
function takeBlock(s, sq) {
  const ps = s.props[sq];
  if (R.level(ps) > 0) return 'Katlı arsa alınamaz.';
  if (ps.park) return 'Parklı arsa alınamaz.';
  if (R.inSite(s, sq)) return 'Sitedeki arsa alınamaz.';
  return null;
}

// Kart uyarlamaları (game.js cardBlock / cardTargets / applyCard / cardText bunları önce sorar).
const cards = {
  taksi: {
    block(s, p, t) {
      const pos = s.players[p].pos;
      if (pos === null) return 'Piyonun henüz arazide değil.';
      return R.isOwnable(s, t.sq) && sameLine(pos, t.sq) ? null : 'Piyonunun satırında ya da sütununda bir arsa seç.';
    },
    targets: (s, p) => (s.players[p].pos === null ? [] : lineOf(s.players[p].pos).map((sq) => ({ sq }))),
    text: (s, p, t) => `${nm(s, p)} Taksi çağırdı: ${sqName(s, t.sq)}.`,
    apply(s, ctx, card) {
      s.turn.dice = null;
      jump(s, ctx, card.by, card.target.sq);
    },
  },
  kestirme: {
    block: (s, p, t) => (t.die === 0 || t.die === 1 ? null : 'Yeniden atacağın zarı seç.'),
    text: (s, p, t) => `${nm(s, p)} Kestirme kullandı: ${t.die + 1}. zarı yeniden atıyor.`,
    apply(s, ctx, card) {
      const d = s.turn.dice;
      d[card.target.die] = rollDie(s);
      emit(s, ctx, { type: 'dice', p: card.by, dice: [...d], reroll: card.target.die, text: `Yeni zarlar: ${d[0]} ve ${d[1]}${d[0] === d[1] ? ', çift' : ''}` });
    },
  },
  geriVites: {
    block: (s, p) => (s.players[p].prev === null || s.players[p].pos === null ? 'Dönülecek önceki arsa yok.' : null),
    text: (s, p) => `${nm(s, p)} Geri Vites: önceki arsasına dönüyor.`,
    apply(s, ctx, card) {
      jump(s, ctx, card.by, s.players[card.by].prev);
    },
  },
  kamulastirma: {
    block(s, p, t) {
      const ps = R.isOwnable(s, t.sq) ? s.props[t.sq] : null;
      if (!ps || !isOpp(s, p, ps.owner)) return 'Bir rakibin arsasını seç.';
      if (ps.ipotek) return 'İpotekli arsa kamulaştırılamaz.';
      const b = takeBlock(s, t.sq);
      if (b) return b;
      return s.players[p].cash < R.price(s, t.sq) ? 'Kamulaştırma bedeline paran yetmiyor.' : null;
    },
  },
  takas: {
    block(s, p, t) {
      const mine = R.isOwnable(s, t.mine) ? s.props[t.mine] : null;
      const theirs = R.isOwnable(s, t.theirs) ? s.props[t.theirs] : null;
      if (!mine || mine.owner !== p || R.level(mine) > 0 || mine.park) return 'Vereceğin katsız, parksız bir arsanı seç.';
      if (!theirs || !isOpp(s, p, theirs.owner)) return 'Rakibin katsız bir arsasını seç.';
      return takeBlock(s, t.theirs);
    },
    targets(s, p) {
      const mine = R.propsOf(s, p).filter((q) => R.level(s.props[q]) === 0 && !s.props[q].park);
      const theirs = boardOf(s).ownable.filter((q) => isOpp(s, p, s.props[q].owner) && !takeBlock(s, q));
      return mine.flatMap((m) => theirs.map((t) => ({ mine: m, theirs: t })));
    },
  },
  muteahhit: {
    block(s, p, t) {
      const ps = R.isOwnable(s, t.sq) ? s.props[t.sq] : null;
      if (!ps || ps.owner !== p) return 'Kendi arsalarından birini seç.';
      if (!R.ownNeighbors(s, p, t.sq)) return 'Müteahhit için komşu bir arsan daha olmalı.';
      if (s.mods.durgunluk) return 'Piyasa durgun: bu dönem kat dikilemez.';
      if (ps.park) return 'Parka kat dikilmez.';
      if (ps.ipotek || ps.tedbir > 0) return 'İpotekli ya da tedbirli arsaya kat dikilemez.';
      return R.level(ps) >= 4 ? 'Bu arsa en üst seviyede.' : null;
    },
  },
  ihbar: {
    block(s, p, t) {
      if (s.mods.zabitaIzinde) return 'Zabıta izinde: bu dönem ihbar olmaz.';
      if (!isOpp(s, p, t.player)) return 'Bir rakip seç.';
      return R.floorsOf(s, t.player).kacak + R.gecekondular(s, t.player) > 0 ? null : 'Bu oyuncunun kaçak katı ya da gecekondusu yok.';
    },
    apply: (s, ctx, card, victim) => ihbar(s, ctx, victim, card.by),
  },
};

// Arayüz için Mahalle'de değişen kart ve gündem metinleri (docs/TASARIM.md §13).
export const MAHALLE_CARD_TEXT = {
  taksi: 'Zar atmadan piyonunun satırında ya da sütununda istediğin arsaya git.',
  kestirme: 'Zar attıktan sonra, seçimden önce oyna: zarlardan birini yeniden at.',
  geriVites: 'Zar atmadan oyna: zar yerine bir önceki arsana dön.',
  kamulastirma: 'Rakibinin katsız, ipoteksiz, parksız ve sitede olmayan bir arsasını, bedelini ona ödeyerek al.',
  takas: 'Katsız bir arsanı, rakibinin sitede olmayan katsız bir arsasıyla değiştir.',
  muteahhit: 'Komşularından biri de senin olan bir arsana bedava 1 yasal kat dik. Ruhsatı dostun halletti.',
  ihbar: 'Seçtiğin rakibin bütün kaçak katları ve gecekonduları yıkılır; her biri için 25 ceza öder.',
};

export const MAHALLE_GUNDEM_TEXT = {
  asgari: `Hakediş kalıcı olarak ${MAHALLE.asgari} arttı.`,
  imarAffi: 'Tüm kaçak katlar yasallaştı, gecekondular tapu aldı!',
  operasyon: 'Kepçeler geldi: tüm kaçak katlar ve gecekondular yıkıldı.',
  turizm: 'Bu dönem kıyı kiraları 2 katına çıkar.',
  deprem: 'Güçlendirme zamanı: yasal kat başı 15, kaçak kat ve gecekondu başı 30 öde.',
  emlakVergisi: 'Her arsan için 10 emlak vergisi öde.',
  kentsel: 'Rastgele seçilen bir bölgede, sahibi olan her arsaya bedava 1 yasal kat dikildi.',
  grev: 'Bu dönem hakediş ödenmez.',
  zabitaIzinde: 'Bu dönem İhbar oynanamaz.',
  metro: 'Rastgele seçilen bir bölgede fiyatlar ve kiralar kalıcı olarak %25 arttı.',
};

// ---------- mod nesnesi ----------

export const mahalle = {
  moveOptions,
  travel: jump,
  propExtra: { park: false, avm: false, gk: null }, // gk: { p: konduran, cost: kondurma bedeli }
  noGundem: ['ulasimZam'],
  gundemText: MAHALLE_GUNDEM_TEXT,
  asgari: MAHALLE.asgari,
  salaryWord: 'Hakediş',
  cards,
  setup(s) {
    s.salary = MAHALLE.hakedis;
    for (const pl of s.players) Object.assign(pl, { pos: null, prev: null, torpil: MAHALLE.torpilStart });
  },
  // Her 3 turda (4., 7., ... tur başı) herkes 1 kart alır (elinde 5'ten az varsa); torpil de kendi aralığıyla gelir.
  // grant olayı: { card: bool, torpil: bool } hangisinin dağıtıldığını söyler.
  roundStart(s, ctx) {
    const due = (every) => s.round > 1 && (s.round - 1) % every === 0;
    const card = due(MAHALLE.grantEvery);
    const torpil = due(MAHALLE.torpilEvery);
    if (!card && !torpil) return;
    for (const p of R.activePlayers(s)) {
      const pl = s.players[p];
      if (card && pl.hand.length < s.config.drawCap) drawCards(s, ctx, p, 1, true);
      if (torpil) pl.torpil = Math.min(MAHALLE.torpilMax, pl.torpil + 1);
    }
    const what = [card && '1 kart', torpil && '1 torpil'].filter(Boolean).join(' ve ');
    emit(s, ctx, { type: 'grant', card, torpil, text: `Herkese ${what} dağıtıldı.` });
  },
  // Sıra başı: hakediş ve gecekondu geliri.
  turnStart(s, ctx, p) {
    if (s.mods.grev) say(s, ctx, 'Bankacılar grevde: hakediş yatmadı.');
    else transfer(s, ctx, null, p, s.salary, 'Hakediş');
    const g = R.gecekondular(s, p);
    if (g) transfer(s, ctx, null, p, g * R.money(s, MAHALLE.gecekonduIncome), 'Gecekondu');
  },
  actions: {
    roll(s, p, a, ctx) {
      need(s.turn.step === 'preroll', 'Zar zaten atıldı.');
      const d = [rollDie(s), rollDie(s)];
      s.turn.dice = d;
      s.turn.step = 'choose';
      emit(s, ctx, { type: 'dice', p, dice: d, text: `${nm(s, p)} zar attı: ${d[0]} ve ${d[1]}${d[0] === d[1] ? ', çift' : ''}` });
    },
    // Zarın gösterdiği arsalardan birini seç; çiftte 1 kart (ek atış yok).
    pick(s, p, a, ctx) {
      need(s.turn.step === 'choose', 'Önce zar at.');
      need(moveOptions(s).includes(a.sq), 'Zarın göstermediği arsaya gidilmez.');
      const [x, y] = s.turn.dice;
      if (x === y && s.players[p].hand.length < s.config.drawCap) drawCards(s, ctx, p, 1);
      jump(s, ctx, p, a.sq);
    },
    // Torpil: zar atıldıktan sonra, seçimden önce bir zarı 1 artır ya da azalt (1-6), sırada en çok 1.
    torpil(s, p, a, ctx) {
      need(s.turn.step === 'choose', 'Torpil zar atıldıktan sonra, seçimden önce kullanılır.');
      need(!s.turn.torpil, 'Bu sıra zaten torpil kullandın.');
      need(s.players[p].torpil > 0, 'Torpilin yok.');
      need((a.die === 0 || a.die === 1) && (a.delta === 1 || a.delta === -1), 'Bir zar ve yön seç.');
      const d = s.turn.dice;
      const v = d[a.die] + a.delta;
      need(v >= 1 && v <= 6, 'Zar 1 ile 6 arasında kalır.');
      d[a.die] = v;
      s.turn.torpil = true;
      s.players[p].torpil--;
      emit(s, ctx, { type: 'torpil', p, die: a.die, delta: a.delta, dice: [...d], text: `${nm(s, p)} torpil yaptı: zarlar ${d[0]} ve ${d[1]}${d[0] === d[1] ? ', çift' : ''}` });
    },
    park(s, p, a, ctx) {
      need(MANAGE_STEPS.includes(s.turn.step), 'Şu an bunu yapamazsın.');
      const b = R.parkBlock(s, p, a.sq);
      need(!b, b);
      const cost = R.katCost(s, a.sq);
      s.props[a.sq].park = true;
      stat(s, p, 'park');
      transfer(s, ctx, p, null, cost, 'Park', true);
      emit(s, ctx, { type: 'park', p, sq: a.sq, text: `${nm(s, p)} ${sqName(s, a.sq)} arsasına park yaptı (${R.fmt(cost)}).` });
    },
    avm(s, p, a, ctx) {
      need(MANAGE_STEPS.includes(s.turn.step), 'Şu an bunu yapamazsın.');
      const b = R.avmBlock(s, p, a.sq);
      need(!b, b);
      const cost = R.katCost(s, a.sq);
      s.props[a.sq].avm = true;
      stat(s, p, 'avm');
      transfer(s, ctx, p, null, cost, 'AVM', true);
      emit(s, ctx, { type: 'avm', p, sq: a.sq, text: `${nm(s, p)} ${sqName(s, a.sq)} üstünde AVM açtı (${R.fmt(cost)}).` });
    },
  },
  pending: {
    buy: {
      // Sahipsiz arsaya gecekondu: arsa sahipsiz kalır, gecekondu konduranın.
      gecekondu(s, p, a, ctx) {
        const sq = s.pending.sq;
        const b = R.gecekonduBlock(s, p, sq);
        need(!b, b);
        const cost = R.gecekonduCost(s, sq);
        s.pending = null;
        s.props[sq].gk = { p, cost };
        stat(s, p, 'gecekondu');
        transfer(s, ctx, p, null, cost, 'Gecekondu', true);
        emit(s, ctx, { type: 'gecekondu', p, sq, text: `${nm(s, p)} ${sqName(s, sq)} arsasına gece yarısı gecekondu kondurdu (${R.fmt(cost)}).` });
      },
    },
  },
  defaults: {
    choose: (pd, s) => ({ type: 'pick', sq: moveOptions(s)[0] }),
  },
};
