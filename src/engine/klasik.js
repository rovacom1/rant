// Klasik tahta: 36 karelik halka, zar toplamı kadar yürüyüş, Başlangıç'tan geçince maaş, köşeler (Tapu, Çay, Zabıta),
// Fırsat ve Sürpriz. Oyun akışı (game.js) tahtaya özel her şeyi buradaki mod nesnesinden çağırır; Mahalle modu aynı
// biçimde `mahalle.js` olarak eklenir (docs/TASARIM.md "Mahalle modu").

import { BOARD, CARDS, SURPRIZ, OWNABLE, MODE_SQUARES, AMOUNTS } from './data.js';
import { randInt, rollDie } from './rng.js';
import * as R from './rules.js';
import { need, emit, say, nm, sqName, others, pick, tableHolds, discardCard, drawCards, transfer, chargeRent, acquire, demolishKacak } from './core.js';

const N = BOARD.length;

// Çift zar atan, turunu bitirince bir daha zar atar (Monopoly gibi); üçüncü çiftte ek hak yok.
const MAX_DOUBLES = 2;

function moveOptions(s) {
  const d = s.turn?.dice;
  return d ? [d[0] + d[1]] : [];
}

function travel(s, ctx, p, steps, backward) {
  const pl = s.players[p];
  const path = [];
  let pos = pl.pos;
  let passed = 0;
  for (let i = 0; i < steps; i++) {
    pos = (pos + (backward ? N - 1 : 1)) % N;
    path.push(pos);
    if (!backward && pos === 0) passed++;
  }
  pl.pos = pos;
  emit(s, ctx, { type: 'move', p, path, backward, text: `${nm(s, p)} ${steps} kare ${backward ? 'geri gitti' : 'ilerledi'} → ${sqName(s, pos)}` });
  for (let i = 0; i < passed; i++) {
    if (s.mods.grev) say(s, ctx, 'Bankacılar grevde: maaş yatmadı.');
    else transfer(s, ctx, null, p, s.salary, 'Maaş');
    // Monopoly'deki gibi tur atlamanın küçük ödülü: kart yalnız buradan (ve FIRSAT'tan) gelir.
    if (pl.hand.length < s.config.drawCap) drawCards(s, ctx, p, 1, true);
  }
  s.turn.step = 'free';
  land(s, ctx, p);
}

function land(s, ctx, p) {
  const pos = s.players[p].pos;
  const sq = BOARD[pos];
  switch (sq.kind) {
    case 'prop':
    case 'transport': {
      const ps = s.props[pos];
      if (ps.owner === null) s.pending = { type: 'buy', p, sq: pos };
      else if (ps.owner !== p) chargeRent(s, ctx, p, pos);
      return;
    }
    case 'chance':
      return drawCards(s, ctx, p, 2);
    case 'surpriz':
      if (!s.config.rules.surpriz) return say(s, ctx, 'Sürprizler bu masada kapalı.');
      return applySurpriz(s, ctx, p, pick(s, Object.keys(SURPRIZ)));
    case 'tapu': {
      const cash = s.players[p].cash;
      if (OWNABLE.some((q) => s.props[q].owner === null && R.price(s, q) <= cash)) s.pending = { type: 'tapu', p };
      else {
        say(s, ctx, 'Tapu Dairesi: alınabilecek arsa yok, teselli olarak 1 kart.');
        drawCards(s, ctx, p, 1);
      }
      return;
    }
    case 'cay': {
      const amt = R.money(s, AMOUNTS.cay);
      for (const o of others(s, p)) {
        const c = s.players[o].cash;
        if (c > 0) transfer(s, ctx, o, p, Math.min(amt, c), 'Çay parası');
      }
      return;
    }
    case 'zabita': {
      if (s.mods.zabitaIzinde) return say(s, ctx, 'Zabıta izinde, kimse ihbar edilemedi.');
      const options = others(s, p).filter((o) => R.floorsOf(s, o).kacak > 0);
      if (!options.length) return say(s, ctx, 'Zabıta turladı ama kaçak kat bulamadı.');
      s.pending = { type: 'zabita', p, options };
      return;
    }
    default:
  }
}

// ---------- Sürpriz ----------

// Sürpriz etkisi seçim beklemeden hemen uygulanır; gerekirse oyuncuyu başka kareye taşıyıp oraya indirir.
function applySurpriz(s, ctx, p, id) {
  const pl = s.players[p];
  const sur = SURPRIZ[id];
  const amt = (k) => R.money(s, AMOUNTS[k]);
  emit(s, ctx, { type: 'surpriz', p, id, text: `${nm(s, p)} için Sürpriz: ${sur.name}! ${sur.text}` });
  switch (id) {
    case 'miras':
      return transfer(s, ctx, null, p, amt('surMiras'), 'Miras');
    case 'radar':
      return transfer(s, ctx, p, null, amt('surRadar'), 'Hız cezası');
    case 'dugun':
      for (const o of others(s, p)) {
        const c = s.players[o].cash;
        if (c > 0) transfer(s, ctx, o, p, Math.min(amt('surDugun'), c), 'Düğün takısı');
      }
      return;
    case 'hesap':
      for (const o of others(s, p)) transfer(s, ctx, p, o, amt('surHesap'), 'Kebap hesabı');
      return;
    case 'robin': {
      const all = R.activePlayers(s);
      const rich = all.reduce((a, b) => (s.players[b].cash > s.players[a].cash ? b : a));
      const poor = all.reduce((a, b) => (s.players[b].cash < s.players[a].cash ? b : a));
      if (s.players[rich].cash === s.players[poor].cash) return say(s, ctx, 'Herkesin nakdi eşit, Robin Hood eli boş döndü.');
      return transfer(s, ctx, rich, poor, Math.min(amt('surRobin'), Math.max(0, s.players[rich].cash)), 'Robin Hood');
    }
    case 'catlak': {
      const built = R.propsOf(s, p).filter((q) => R.level(s.props[q]) > 0);
      if (!built.length) return say(s, ctx, 'Neyse ki çökecek katın yoktu.');
      const q = built.sort((a, b) => R.level(s.props[b]) - R.level(s.props[a]) || R.katValue(s, b) - R.katValue(s, a))[0];
      const ps = s.props[q];
      if (ps.kacak) ps.kacak = 0;
      else ps.kat--;
      return emit(s, ctx, { type: 'collapse', p, sq: q, text: `${sqName(s, q)} üstündeki 1 kat çöktü.` });
    }
    case 'jest': {
      const ok = s.mods.durgunluk ? [] : R.propsOf(s, p).filter((q) => BOARD[q].kind === 'prop' && !s.props[q].ipotek && !s.props[q].tedbir && R.level(s.props[q]) < 4);
      if (!ok.length) return transfer(s, ctx, null, p, amt('surTeselli'), 'Belediye tesellisi');
      const q = pick(s, ok);
      s.props[q].kat++;
      return emit(s, ctx, { type: 'build', p, sq: q, text: `${sqName(s, q)} üstüne belediyeden bedava kat çıktı.` });
    }
    case 'tarla': {
      const free = OWNABLE.filter((q) => s.props[q].owner === null);
      if (!free.length) return transfer(s, ctx, null, p, amt('surTarla'), 'Tarla satışı');
      const q = free.reduce((a, b) => (R.price(s, b) < R.price(s, a) ? b : a));
      s.props[q].owner = p;
      return emit(s, ctx, { type: 'own', p, sq: q, text: `${nm(s, p)} dededen kalan ${sqName(s, q)} tapusunu bedavaya aldı.` });
    }
    case 'ucak': {
      const steps = Math.min(...MODE_SQUARES.air.map((q) => (q - pl.pos + N) % N || N));
      return travel(s, ctx, p, steps, false);
    }
    case 'isinlan': {
      const to = pick(s, BOARD.map((_, i) => i).filter((i) => BOARD[i].kind !== 'surpriz'));
      pl.pos = to;
      emit(s, ctx, { type: 'move', p, path: [to], jump: true, text: `${nm(s, p)} ışınlandı → ${sqName(s, to)}` });
      return land(s, ctx, p);
    }
    case 'tersKose': {
      const o = pick(s, others(s, p));
      const [a, b] = [pl.pos, s.players[o].pos];
      pl.pos = b;
      s.players[o].pos = a;
      emit(s, ctx, { type: 'move', p, path: [b], jump: true });
      emit(s, ctx, { type: 'move', p: o, path: [a], jump: true, text: `${nm(s, p)} ile ${nm(s, o)} yer değiştirdi.` });
      return;
    }
    case 'kapkac': {
      const victims = others(s, p).filter((o) => s.players[o].hand.length);
      if (!victims.length) return drawCards(s, ctx, p, 1);
      const o = pick(s, victims);
      const hand = s.players[o].hand;
      pl.hand.push(hand.splice(randInt(s, hand.length), 1)[0]);
      return say(s, ctx, `${nm(s, p)}, ${nm(s, o)} oyuncusunun elinden bir kart kaptı.`);
    }
    case 'bavul': {
      if (!pl.hand.length) return say(s, ctx, 'Bavul zaten boştu.');
      const uid = pick(s, pl.hand);
      discardCard(s, p, uid);
      return say(s, ctx, `${nm(s, p)} elindeki ${CARDS[R.cardId(uid)].name} kartını kaybetti.`);
    }
    case 'haciz':
      return transfer(s, ctx, p, null, R.round5(Math.max(0, pl.cash) * 0.1), 'Haciz');
    case 'vergiIade': {
      const n = R.propsOf(s, p).length;
      if (!n) return say(s, ctx, 'Mülkün olmadığı için iade çıkmadı.');
      return transfer(s, ctx, null, p, n * amt('surVergi'), 'Vergi iadesi');
    }
    default:
  }
}

// ---------- mod nesnesi ----------

export const klasik = {
  moveOptions,
  travel,
  // Sıranın tahtaya özel hamleleri (game.js TURN tablosuna eklenir).
  actions: {
    roll(s, p, a, ctx) {
      need(s.turn.step === 'preroll', 'Zar zaten atıldı.');
      const d = [rollDie(s), rollDie(s)];
      s.turn.dice = d;
      s.turn.step = 'choose';
      emit(s, ctx, { type: 'dice', p, dice: d, text: `${nm(s, p)} zar attı: ${d[0]} ve ${d[1]}${d[0] === d[1] ? ', çift' : ''}` });
      if (d[0] === d[1]) {
        s.turn.doubles = (s.turn.doubles || 0) + 1;
        s.turn.again = s.turn.doubles <= MAX_DOUBLES;
      }
      // Masada Kestirme varsa oyuncu (kartı olsun olmasın) zarı görüp karar verir; yoksa doğrudan ilerler.
      if (s.turn.hamle || !tableHolds(s, 'kestirme')) travel(s, ctx, p, d[0] + d[1], s.turn.backward);
    },
    move(s, p, a, ctx) {
      need(s.turn.step === 'choose', 'Önce zar at.');
      need(moveOptions(s).includes(a.steps), 'Zar toplamı kadar ilerlenir.');
      travel(s, ctx, p, a.steps, s.turn.backward);
    },
  },
  // Tahtaya özel bekleyen kararlar (game.js PENDING tablosuna eklenir) ve süre dolunca verilecek karar.
  pending: {
    tapu: {
      tapuBuy(s, p, a, ctx) {
        if (a.sq === null || a.sq === undefined) {
          s.pending = null;
          return say(s, ctx, `${nm(s, p)} tapuda bir şey almadı.`);
        }
        need(R.isOwnable(s, a.sq) && s.props[a.sq].owner === null, 'Bu arsa sahipsiz değil.');
        const cost = R.price(s, a.sq);
        need(s.players[p].cash >= cost, 'Paran yetmiyor.');
        s.pending = null;
        acquire(s, ctx, p, a.sq, cost, 'tapudan aldı:');
      },
    },
    zabita: {
      zabitaTarget(s, p, a, ctx) {
        need(s.pending.options.includes(a.target), 'Bu oyuncu ihbar edilemez.');
        s.pending = null;
        demolishKacak(s, ctx, a.target, R.money(s, AMOUNTS.zabitaFine), 'Zabıta', p);
      },
    },
  },
  // Süre dolunca ya da oyuncu yokken: bekleyen karar türüne göre (pd, s) ve zar atıldıktan sonra (choose).
  defaults: {
    tapu: () => ({ type: 'tapuBuy', sq: null }),
    zabita: (pd) => ({ type: 'zabitaTarget', target: pd.options[0] }),
    choose: (pd, s) => ({ type: 'move', steps: moveOptions(s)[0] }),
  },
};
