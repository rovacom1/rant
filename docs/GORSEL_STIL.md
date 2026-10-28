# Kart görseli ve ses rehberi

Yeni bir kart eklenirse görseli aynı tarzda üretilir; tutarlılık oyunun kalitesi için önemli.

## Kart görseli

- Stil (v0.30, kullanıcı seçti, `tasks/yenilikler-plani.md` madde 11): tek büyük, simge gibi okunan nesne; zemin kartın türünün
  renginde düz tek renk; insan, yüz, sahne yok. Kalın lacivert dış çizgili düz çizgi film; gradyan ve doku yok.
  Eski sahneli resimler (insanlı, krem zeminli) küçük boyda okunmuyordu.
- Tür renkleri (kartın çerçevesi de bu renk, `src/ui/hand.js` `CARD_GROUPS`): Saldırı kırmızı `#d8283c` (Kamulaştırma, Zorla
  Takas, İhtiyati Tedbir, İhbar, Dava Aç) · Kazanç hardal `#e9b10c` (Kira Zammı, Müteahhit Dostu, Piyango, Aidat Günü, Pazarlık
  Ustası) · Savunma turkuaz `#14918a` (İtiraz, Dayın Çıktı) · Hareket mor `#6a3fb0` (Taksi, Kestirme, Geri Vites). Yeni kart
  önce bu dört türden birine yazılır (`CARD_GROUP`).
- Nesneler: İtiraz kalkmış el, Dayın Çıktı güneş gözlüğü + bıyık + altın zincir, Taksi taksi, Kestirme motosiklet, Geri Vites
  geri ok ve araba, Kamulaştırma tokmak ve ev, Zorla Takas iki anahtar, İhtiyati Tedbir zincirli kilitli ev, İhbar düdük,
  Kira Zammı para destesi ve yukarı ok, Müteahhit Dostu baret ve tuğla, Piyango yıldızlı bilet ve konfeti, Aidat Günü
  bozuk para dolu üç posta kutusu, Pazarlık Ustası etiket ve makas,
  Dava Aç tokmak.
- Araç: Higgsfield, `gpt_image_2_5`, `quality: medium`, 1:1. Stil referansı (`image_references`) olarak daha önce aynı
  tarzda üretilmiş 2x2 dört kartlık bir deneme sayfası yüklenir.
- Ham dosyalar `tasks/gorsel-ham/kart2/<kartId>.png` (repoya girmez), sonra `python tools/kart_gorsel_hazirla.py` ile
  `assets/kart/<kartId>.jpg` (360x360). Kart arkası `arka.jpg` değişmedi (çekilen ve oynanan kart dönerken görünür).
- Komut kalıbı (yalnız "Background" ve "Subject" değişir):

```
Square board game card illustration, artwork only: no frame, no border, no text, no letters, no numbers. Match the style of the reference image exactly: bold flat vector cartoon, thick dark navy outlines, flat fills, no gradients, no texture, one solid saturated background color filling the whole square, ONE single big iconic object centered filling about 70% of the square, readable at 60 px, no people, no scenery. Background: <tür rengi adı ve kodu, ör. red #d8283c>. Subject: <nesne>.
```

- Kartta resmin altında krem yazı alanı var (ad ve kısa kural); resim yazı taşımaz.

## Gündem kartları

- `assets/gundem/<gündemId>.jpg`, 360x360. Kart görseliyle aynı araç, aynı stil referansı (`assets/kart/itiraz.jpg`) ve aynı komut kalıbı; sahne gündemin esprisini anlatır. Komutun sonuna: "No portraits, no pictures on walls, no banknotes, no signs with writing."
- SÜRPRİZ kartının arka yüzü `assets/kart/surpriz.jpg` (250x350): `arka.jpg` referansıyla, aynı aileden ama domates kırmızısı zemin, ortada büyük "?".
- Davet linki önizlemesi `assets/davet.jpg` (1200x630): insan yok, yazı yok; İstanbul silueti, zar, kartlar, çay bardağı.

## Oyuncu piyonları

- `assets/piyon/<ad>.png` (15 piyon, `AVATARS` sırası tahtadaki şehir sırası; v0.28.0'da Atakule, Kız Kulesi, Nasreddin Hoca, Kestane Şekeri, Hamsi, Trabzon Ekmeği, Caretta Caretta, İzmir Saat Kulesi ve Boyoz eklendi, her biri iki denemeden seçildi; Hamsi gerçek hamsi resmi ikinci referans verilerek üç balıklık deste olarak, İzmir Saat Kulesi de Commons'taki CC0 fotoğraf referans verilerek yeniden çizildi (gerçeğindeki gibi baştan sona krem taş; kubbe ve saatlerde mavi yok); Nasreddin Hoca eşeğine ters binmiş, eşeğin kuyruğunu dizgin gibi tutar; Hitit Güneşi Alacahöyük'ten geldiği için Çorum'da sayılır): şeffaf zemin, görünen figüre kırpılmış, uzun kenarı 256 px. Oyuncu rengi resme değil, oyunda figürün kenarına çizilir; resimde halka ya da kaide olmaz.
- Araç ve stil referansı kartlarla aynı (`gpt_image_2_5`, `itiraz.jpg`); Hitit Güneşi için kullanıcının verdiği Ankara amblemi de referans verildi. Yeni piyon eklenirse `src/ui/pawns.js`'teki en/boy oranı tablosuna da yazılır.
- Komut kalıbı (yalnız "Subject" değişir):

```
Board game player token, a single compact figurine-like object, artwork only: no text, no letters, no numbers, no base, no pedestal, no ring. Match the art style of the reference image exactly (style only, not its characters or scene): bold flat vector cartoon, medium-weight dark navy outline (clear but not extra thick), flat fills only in tomato red, teal and mustard plus cream/off-white, no gradients, no texture, no shading. Compact figure that fills a roughly square area (not tall-thin, not wide-flat), no thin protruding parts, clean solid silhouette edge, readable at 36 px. Centered, whole object visible, filling about 85% of the frame, isolated on a fully transparent background, no shadow, no scenery. Subject: <figür>
```

## Giriş ekranı videoları

- Ana görsel `assets/giris/dayi.jpg` (ham: `tasks/gorsel-ham/giris/dayi-ana.png`, Higgsfield `gpt_image_2_5`). Tespihi başparmakla tutar, imame ve tek püskül altta; iki göz bebeği tek. Kullanıcı uzun, ayrıntılı komutlarla çizilen elleri "doğal değil" buldu; kısa komut ve modele inisiyatif daha iyi sonuç verdi.
- Senaryo videosu: Kling 4.0, image-to-video, başlangıç ve bitiş karesi aynı ana görsel, 720p, 1:1, 6 sn (yaklaşık 3 kredi). Kısa komut kalıbı:

```
Flat 2D cartoon animation in the exact same style, static camera. He keeps holding the tespih exactly as in the image and it sways gently the whole time. <hareket>. He does not talk. Sunglasses stay on his head. Ends in the starting pose.
```

- Her varyant kare kare denetlenir: tek tespih ve tek püskül (iki tespih, yukarı fırlayan uç, kopan boncuk olmaz), tespih durmaz, ağız konuşmaz, gözlük başta kalır, el ağza ya da yüze kapanmaz. Tespihi "parmağın etrafında çevirme" istenmez; model boncukları çoğaltıyor.
- Şehir arka planı `assets/giris/sehir.mp4` (8 sn döngü) ve afişi `sehir.jpg`: gökyüzü dayı videosunun zemini ile aynı krem olmalı.
- Ham video `tasks/gorsel-ham/giris/senaryo-N.mp4` olarak kaydedilir ve `sh tools/giris_video.sh` ile hazırlanır (oyun sonu videoları da; ffmpeg gerekir; sessiz, şehir CRF 22). Dayı videoları `tools/dayi_video.js` ile 640 px, CRF 18 olur; krem zemin her karede bir kez silinir ve saydamlık videonun alt yarısına gri olarak yazılır (üst yarı renk). Oyun iki yarıyı WebGL ile birleştirir (`src/ui/alphavideo.js`), tarayıcı piksel işlemez. Krem renk dayının üstünde de olduğu için (göz akı, diş) yalnız renge göre silinmez; bkz. `tools/keycream.js`. Çıkan `assets/giris/dayi-N.mp4`, `src/ui/intro.js` içindeki `CLIPS` listesine yazılır.

- Oyun sonu videoları `assets/sonu`: `gurur` (mendille gözyaşı siler), `alkis` (tespihi bırakıp alkışlar), `para` (masanın altından zarf uzatır), `kayip` (acıyarak bozukluk uzatır). Aynı ana görselden, aynı kısa komutla; ham dosya `tasks/gorsel-ham/sonu/<ad>.mp4`.

## Tahta kareleri

- Özel kareler (Başlangıç Noktası, Fırsat, SÜRPRİZ, Tapu, Çay Ocağı, Zabıta) ve ulaşım (gar, havalimanı) resim değil, `src/ui/icons.js` içindeki elle çizilmiş SVG ikonlardır (64x64). Kullanıcı yapay zeka resimlerini kalabalık buldu (v0.6); istenen, orijinal Monopoly gibi tek bakışta okunan, kalın hatlı sade ikon.
- Yeni ikon: tek nesne, 2-3 ana renk, koyu dış çizgi (1.6-2.4), hafif gradyan; açık ve koyu zeminde okunmalı.
- Mülk kareleri simgesiz: üstte setin tam doygun renginde bant, altta il adı, arada bina resmi (aşağıda); sahiplik yalnız iç kenardaki şeritte. Kare zemini sahibin rengine boyanmaz.

## Bina görselleri

- `assets/bina/<grup>/{0..4,k0..k3,yikik}.png`: `0` boş arsa (yalnız tapu cetvelinde), `1`-`4` kat sayısı, `k0`-`k3` üst katı kaçak (ya da affedilmiş) bina, `yikik` yıkıntı (yıkım canlandırmasında).
- Her set için tek bir 2x5 sprite sayfası: aynı model (`gpt_image_2_5`), stil referansı `assets/kart/itiraz.jpg`. Üst sıra boş arsa ve 1-4 katlı bina; alt sıra aynı binanın üstüne eklenmiş çirkin kaçak kat, en sonda yıkıntı. Setin mimarisi şehre göre seçilir.
- Bir setin bütün kareleri aynı ortak kutuyla kırpılır: kat çıktıkça bina resimde de gerçekten yükselir. Tek katlı gecekondu `k0` ayrı bir 4x2 sayfadan alınır ve 1 katlı binanın yüksekliğine ölçeklenir.
- 96 renge indirilir (her biri yaklaşık 12 KB). Ham sayfalar `tasks/gorsel-ham/bina/` (repoya girmez).

## Harita

- `assets/harita/turkiye.svg` üretilmedi: Natural Earth 1:50m ülke sınırından (kamu malı) çizildi. İllerin yerleri `tasks/yenilikler-plani.md` madde 8.

## Ses

- Efektler ve müzik ElevenLabs ile üretildi (`assets/ses/*.mp3`). Yeni efekt: kısa (1-2 sn), temiz, "close mic" komutlu. Kod sesi kendisi kırpar ve düzeyini eşitler (`src/ui/sound.js`).
- Müzik: `assets/ses/muzik.mp3`, 60 sn, döngüde 3 sn geçişle çalar.
