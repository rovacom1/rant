# Animasyon planı (2026-10-26)

Durum: yalnız plan. Devam eden görsel değişiklik bitince uygulanır; uygulamadan önce kural/arayüz kısmı `docs/TASARIM.md`'ye işlenir.
Çalışma yeri: bu klasör (`rant-yenilikler`, dal `yenilikler`). Denemeler eski yuvarlak emoji taşlarla yapıldı; bu dalda taşlar resimli piyonlara (`src/ui/pawns.js`, `assets/piyon`) geçiyor. Uygularken konum ve katman kuralları piyonlara uyarlanır.

## Karar: tur başı animasyonu "Sade" (kesin)
Kullanıcı üç denemeden (Sahne / Sade / Kamera) **Sade**'yi seçti ve her koşulda bu uygulanacak; kendi sıran için de ayrı, daha gösterişli bir sürüm yok.
- Tahta kararmaz, oyun bölünmez.
- Sırası gelen oyuncunun taşı zıplar (büyüyüp iki kez seker), etrafına oyuncu renginde 3 halka yayılır.
- Taşın karesi oyuncu renginde iki kez parlar.
- Taşın yanında oyuncu renginde kısa bir etiket çıkar: avatar + ad (kendi sıranda "Sıra sende!"), ~2,4 sn sonra kaybolur.
  Taş tahtanın üst yarısındaysa etiket taşın altında, alt yarısındaysa üstünde durur (yoksa ekrandan taşar).
- `prefers-reduced-motion`: zıplama ve halkalar yok, yalnız parlama ve etiket.
- Bağlanacağı yer: `src/ui/gameview.js` `present()` içindeki `turn` olayı, yürüyüş/zar sırası bittikten sonra; taş konumu `Tokens` (`src/ui/board.js`).
- Deneme sayfası: https://claude.ai/artifact/9sLyPxPDHyQaRGK9NDLMW8

## Genel kurallar (kullanıcı geri bildirimi, 2026-10-26)
- Kareyi (mülk kartını) büyüten ya da yerinden oynatan animasyon yok. Vurgu kenarda olur: oyuncu rengi karenin kenarını dolanır, sonra söner.
- Taşın/karenin yanında beliren her şey (etiket, para yazısı, avatar) tahtanın üst yarısında aşağı, alt yarısında yukarı doğru çıkar.
- Tahta efektleri (halka, kenar çizgisi, etiket, toz, yıldız, düşen ev) taşların altında kalır, taşın üstüne binmez. Yalnız para (jetonlar ve +/− ₺ yazısı) taşların üstünden uçar.

## Sesler
Oyunda olan (`src/ui/sound.js`): zar, adım, para, ödeme, kart, sıra (yalnız kendi sıran), gündem, tokmak, inşaat, yıkım, zafer, ihale.
Eksik olanlar için ElevenLabs (eleven_text_to_sound_v2) adayları `tasks/ses-ham/` altında; kullanıcı seçti (2026-10-26), seçilenler `assets/ses`'e taşınıp `FILE`/`MAX_LEN`'e eklenecek:
- [x] Mülk alındı: **`satinal-3`** seçildi (bugün ses yok)
- [x] Tam set: **`set-3`** seçildi (bugün ses yok)
- [x] İflas: **`iflas-3`** seçildi (bugün yıkım sesi)
- [x] Başkasının sırası (Sade): **`sira-diger-2`** seçildi; kendi sıranda mevcut `sira` kalır
Kira, kat, yıkım ve maaş mevcut seslerle karşılanıyor.
ElevenLabs akışı: https://elevenlabs.io/app/flows/KdrEk2RzPD9O2DraxQM3

## Değerlendirmede: diğer olay animasyonları
Deneme sayfası: https://claude.ai/artifact/PcmrrAgHXEd7cnRdxhjVQ9 — kullanıcı her birini ayrı değerlendirecek.
- [ ] Mülk alındı: alıcının rengi karenin kenarını dolanır, sonra şerit o renkle dolar
- [ ] Kira: jetonlar ödeyenin taşından sahibinin taşına uçar (bugün oyuncu panelleri arasında)
- [ ] Kat dikildi: 🏠 kareye düşüp seker (bugün 🏗️ yukarı süzülür)
- [ ] Kaçak kat yıkıldı: kare sarsılır, 🚧 toz olur (bugün yalnız bildirim)
- [ ] Maaş: Başlangıç köşesi parlar, jetonlar taşa uçar
- [ ] Tam set: setin karelerinin kenarı sırayla oyuncu rengine boyanır, ★ belirir
- [ ] İflas: taş solup düşer, mülklerin şeritleri sırayla griye döner
