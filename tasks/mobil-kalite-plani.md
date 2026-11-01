# Mevcut oyun planı: telefon, masaüstü, his (2026-11-01)

Çizimler: https://claude.ai/artifact/WKd7QWXGmviH4XQX58tjXw ("Telefon ve masaüstü" sayfası; plan panosu "Mevcut oyun: plan").
Karar: bugünkü oyun korunur ve büyür; Koordinat fikri bugünkü oyuna "Mahalle" modu olarak eklenir (`tasks/mahalle-modu-plani.md`); şehir kurma oyunu ayrı, adı sonra
(`tasks/yeni-oyun-fikirleri.md`). Her adım ayrı sürüm; sonunda `npm test`, `npm run check`, tarayıcı denemesi, yenilikler dalına
commit + push (main'e birleştirme yok). Haftalar tahmin.

## Verilen kararlar
- Telefonda dikey düzen; yan tutan bugünkü yatay düzeni görür.
- Kare içerikleri iki platformda dik; setin bandı ve sahiplik şeridi ortaya bakan kenarda.
- Telefonda Zar At / Turu bitir 72 px, manşet yazısıyla. Titreşim Android'de, ses penceresinden kapanır.
- Masaüstü düz kalır; eğik tahta ve kamera yalnız telefonda.
- İhalede çubuk kalır, +10 / +50 / +100 kısayolları gelir (iki platform); büyük sayı toplam teklif.
- Köşe ve özel kare simgeleri yeniden (Başlangıç'taki lira işareti yanlış: `icons.js` `start`, çizgiler gövdeyi kesmiyor);
  lira her yerde tek SVG (`tl`). Simge yapılar şehirleri temsil eden yapılar.
- CLAUDE.md ve docs/TASARIM.md ilgili adım başlarken güncellenir.

## Bekleyen kararlar
- Mekanik planı (`tasks/mekanik-plani.md`): kaçak serbest, tek mülke yıkım, çay parası, simge yapı, unvanlar.

## Takvim (tahmin)
| Hafta | İş |
|---|---|
| 2 Kas | 0 Görseller, 1 Senkron |
| 9 Kas | 2 Efekt katmanı, 3-4 Dik yazılar + simgeler + ihale; Mahalle modu K0-K1 |
| 16-23 Kas | 5 Telefon iskeleti; Mahalle modu K1-K2 |
| 30 Kas | 6 Eğik tahta + kamera |
| 7 Ara | 7 Zar, yürüyüş, para; 8 başlar |
| 14 Ara | 8 El, kartlar, pencereler; 9 Rakip sırası, son; Mahalle modu K3 |
| 21 Ara | Mahalle modu K4 |

## Adımlar
0. [x] **Görseller** (bitti 2026-11-01, ~34 kredi; dayının tepki videoları kullanıcı kararıyla ertelendi) (bu hafta, kredi ~2026-11-08'de sıfırlanır; ~150 / 202): tahta simgeleri 8 (~20), dayının 6 tepki videosu (~36),
   jeton + toz + masa zemini + tepki çıkartmaları (~30), şehirlerin simge yapıları 8 (~32), Mahalle modu için arazi zemini, park, AVM, torpil (~12);
   kalırsa kaçak eklentileri, konfeti, iskele, banknot, kepçe, bekleyen dayı (~22). İlk gün iki simge, zemin, jeton, toz ile stil
   denemesi onaya. GORSEL_STIL.md güncellenir ("özel kareler SVG" kuralı değişir).
1. [x] **Senkron** (v0.39): `net/host.js` her yayına `at` (şimdi + 250 ms) ve `readyAt` +250; `ui/app.js` drain o anda başlar
   (`meta.now` saat farkı), geç kalan kalan süreye göre hızlanır (en çok 2x, `gameview.js` `spd()`), 3+ durum birikirse son duruma
   geçer + tek satır özet; `test/pace.test.js` her efektin `paceOf` bütçesini aşmadığını denetler; `?debug` gecikme göstergesi;
   PROTOCOL 14. Bitti: iki cihaz, 300 ms gecikme, 4x yavaş işlemci, 20 tur, bitiş farkı < 200 ms.
2. [x] **Efekt katmanı** (v0.40): `ui/fx.js` (üç kademe, donma, sarsıntı, titreşim), `ui/sprite.js` (jeton, toz, tokmak şeritleri),
   `ui/counter.js` (sayan sayaç); `boardfx.js` efektleri taşınır; ses penceresine Titreşim. Bitti: maaş küçük, kira orta, büyük kira büyük.
3. [x] **Dik yazılar, simgeler** (v0.41): `ui/board.js`, `styles/tahta.css` dönme kalkar; kare simgeleri `assets/kare/`;
   `ui/deed.js`; CLAUDE.md + TASARIM.md §3. Bitti: dört kenardaki adlar başı çevirmeden okunur.
4. [x] **İhale** (v0.41): çubuk + çipler (`ui/gameview.js`, `styles/main.css`).
5. [x] **Telefon iskeleti** (v0.42): `styles/telefon.css` + `body.tel`, `ui/sheet.js` (alttan sayfa yığını, geri hareketi),
   `ui/phone.js` (dikey perde kalkar), CLAUDE.md telefon maddesi yeniden. Bitti: 390x844 ve 360x740'ta kaydırmasız tur.
6. [x] **Eğik tahta, kamera** (v0.43): `ui/camera.js` (masa, izle, odak, hedef); tahta görünümü soyutlanır (hücre yerleri, piyon
   noktaları, kamera odakları) ki Mahalle arazisi da kullansın. Bitti: 60 fps, kamera bütçeyi uzatmaz.
7. [x] **Zar, yürüyüş, para** (v0.44): yükselen adım tıkları, varışta ezilme + toz, varılacak kare önceden; kira patlaması,
   jeton yayı, iki sayaç; büyük anda dayı videosu (`assets/dayi`, `ui/dayi.js`).
8. [x] **El, kartlar, pencereler** (v0.45): telefonda yelpaze; iki platformda kaldır-bırak, hedefler parlar; satın al, inşaat,
   pazarlık, tepki yeni tasarımda (telefonda alttan, masaüstünde ortada).
9. [x] **Rakip sırası, son** (v0.47): izleyici modu (`.game.spect`, kamera `takip`, alttaki çubukta çıkartmalar), resimli tepki
   çıkartmaları (`assets/tepki`), İtiraz anı (`T.itiraz`), giriş, lobi, oyun sonu telefonda dikey (sayarak açılan oyun sonu, lobide
   sabit Oyunu başlat), masa zemini (`assets/masa`); kurallarda Klasik/Mahalle seçici; 667x320'de pencereler kaymadan sığar,
   Mahalle'de atılan zar gündemin altında. Bitti: iki tür bot oyunu sonuna kadar, 1440x900, 844x340, 667x320, 390x844, 360x740.
K. [x] **Mahalle modu** (v0.45-0.47): K0-K3 ve K4 kod kısmı bitti; arkadaş oyunu kullanıcıda.

## Kalite dokunuşları (adımların içinde)
Sayan rakamlar, desteden dönerek gelen kart, set anı, "Satıldı" anında tapu ve jeton akışı, büyük anda müziğin kısılması, göçen
düğmeler, pencerelerin kaynağından açılması, sayarak ilerleyen oyun sonu.
