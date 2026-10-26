# Oyun deneyimi düzeltme planı (2026-10-25, kullanıcı testinden)

Tam plan ve ölçümler: kullanıcı onaylı plan (sohbet). Özet ve takip burada.

## Faz 1 — Tempo, kart gösterimi, süre çubuğu (v0.10.0)
- [x] Ev sahibi olaylara göre bekler (pace); insanın süresi animasyon bitince başlar; bot döngüsü insan sürelerini gizlemez
- [x] Lobide Oyun hızı (Yavaş/Normal/Hızlı); istemci animasyonları aynı çarpanla
- [x] Hızlı mod eşiği 2 -> 5 mesaj
- [x] Rakip kartı: 3,5 sn, etki satırı, fare üstünde durur/büyür, tıklayınca kapanır, sırayla gösterilir; sürpriz tam beklenir
- [x] Günlükte kart kimliği; akış ve geçmişte renkli kart çipi + üzerine gelince kart önizlemesi
- [x] Ortak ipucu bileşeni (src/ui/tip.js)
- [x] Süre çubuğu: ev sahibi {at, span, now} gönderir, saat farkı, kararlı işaretleme, CSS geçişi; eksik istemlere süre
- [x] Dava zarı etiketi, haber kartında kapatma ipucu, pencerelerde kaydırma korunur

## Faz 2 — Karanlık mod ve belirsizlikler (v0.10.1)
- [x] Tüm pencereler ve paneller karanlık temada koyu (yüzey değişkenleri)
- [x] Kare penceresinde kat/kaçak/set/ipotek/tedbir açıklamaları
- [x] Simge ipuçları (kare, oyuncu paneli, üst çubuk, halka, gündem çipleri, taş halkası, oynanabilir kart)
- [x] Kurallarda "Tahtadaki işaretler"
- [x] Dayı/İtiraz beklemesinde nötr metin

## Faz 3 — Monopoly tarzı açık artırma (v0.11.0)
- [x] Motor: sırayla artır ya da çekil, son kalan kazanır; süre dolunca çekilir
- [x] Bot artırma/çekilme kuralı
- [x] Arayüz: en yüksek teklif, katılımcılar, +10/+50/+100, özel tutar, Çekil
- [x] "Gizli ihale" -> "Açık artırma"; PROTOCOL ve SAVE_VERSION
- [x] Testler

## Faz 4 — Kart ve para dengesi, Monopoly'ye yakın (v0.12.0)
- [x] Sıra başı ve çift zar kartı yalnız elde 5'ten az kartken
- [x] Dayı 4->2, Tedbir 3->2, Taksi 3->2, Kestirme 4->3; Piyango 150->100, 3->2
- [x] Set dışı mülkte kat kirası yarı; Müteahhit için şehirde en az 2 mülk
- [x] Monopoly kira cetveli (kira en az 5)
- [x] Bot Geri Vites kuralı
- [x] Sim önce/sonra tablosu (kira, konkordato, sıra adaleti, hedefler, değer hedefi süreleri)

## Faz 5 — Gündem
- [x] Mevcut sistemi anlat, yeni tasarımı kullanıcıyla konuş (kod yok)
- [x] Kullanıcı kararı: gündem 4 turda bir değişsin; dönem kuralları 4 tur sürer (v0.13.0)
- [x] Test (dönem ve oyun sonu sınırı), sim önce/sonra, headless tarayıcıda haber kartı yalnız değişimde
- [x] Kullanıcı kararı: dönem 3 tur (v0.13.1)
- [ ] Kullanıcıyla kart kart gözden geçirme (Gündem Sakin, Durgunluk, Grev 3 tur için)

---

# İlk sürüm planı (2026-10-25)

- [x] Oyun tasarımı ve kurallar (docs/TASARIM.md)
- [x] Motor: tahta, kira, kat/kaçak, ipotek, borç/konkordato
- [x] Kartlar: 14 Hamle/Tepki türü, İtiraz zinciri
- [x] Gündem (24 tür) ve gizli hedefler (16)
- [x] Gizli ihale, pazarlık, el sınırı, oyun sonu puanı
- [x] Botlar + denge simülasyonu, 27 test
- [x] Web arayüzü: menü, lobi, tahta, kartlar, pencereler, sesler, animasyonlar
- [x] PeerJS ile ev sahibi yetkili çok oyunculu; yeniden bağlanma; kayıttan devam
- [x] Tarayıcıda uçtan uca deneme (yerel + iki sekmeyle çevrimiçi)
- [x] GitHub reposu, Pages, CI
- [x] Masaüstü klasörü ve kısayollar
- [x] Sürekli geliştirme döngüsü (zamanlanmış görev + otomasyon/GOREV.md)

## Sonuç
İlk sürüm yayında. Sonraki işler ROADMAP.md'de; otomatik döngü oradan devam eder.

# Yenilikler planı (2026-10-26, yenilikler.md + kullanıcı kararları)

Kapsam: raporun tamamı (9. bölüm dahil). Her adım ayrı sürüm/commit; npm test + npm run check yeşil; arayüz iki temada tarayıcıda denenir.

## Faz 0 — Tasarım
- [x] Tasarım aracıyla 3 baştan aşağı farklı tasarım; kullanıcı A'yı (Geniş Tahta) seçti, C'den bir şey alınmıyor
- [ ] A'nın son hali (kullanıcı onayı bekleniyor, onaysız sonraki adıma geçilmez):
  - Şehir başına tek renk (iki renkli cam ve çerçeve kalkar), renk körlüğüne göre seçilir, hiçbiri oyuncu rengiyle aynı değil
  - Yazı tipi: başlık/düğme/sayı Bricolage Grotesque, metin Geist (Türkçe harf kontrolü)
  - Hiç emoji yok: kat, kaçak kat dahil tüm simgeler SVG
  - Kat dikme: (a) kare penceresinden ve (b) sağ alttaki İnşaat panelinden; ikisi de kalır (kullanıcı kararı)
  - Açık artırmada kaydırma çubuğu kalır; gösterilen tutar toplam teklif, artış ayrıca küçük yazar
  - Yeni oyuncu renkleri: #d1342f #2475e8 #0e9f80 #5a2d9c #f4b400 #f472b6; şehir renkleri buna göre
  - Düzeltmeler: standart düğme boyları, simge-yazı hizası, jenerik mavi yerine yeni ana renk, Konya açık temada okunur renk, kartlı istemlerde büyük kart, SVG oklar, daha büyük piyonlar
  - Pazarlık ve ipotek ekranları yeniden; açık artırmada mülkün tapu kartı, ayrıntılı kira cetveli üzerine gelince
  - Eksik tüm ekranlar çizilir (src/ui taranarak kontrol listesi)
- [ ] Kurallar değişince CLAUDE.md arayüz ilkeleri güncellenir (iki renk, Fredoka/Nunito, emoji katlar)

## Faz 1 — Görünüm (seçilen tasarıma göre)
- [ ] Tahta yerleşimi yeniden ölçülerek (el artık sağ sütunda); semt adı ≥ 12 px, kare kısa kenarı ≥ 75 px (1366x768)
- [ ] Orta alan: safe center, tek satır gündem, filigran/damalı zemin yok, 3 satır akış, zarlar gizlenir, nötr süre çubuğu, tek tur sayacı
- [ ] Bildirimler tahtayı kapatmaz ve tekrar etmez; "Sıra sende!" balonu kalkar (masaüstü bildirimi kalır)
- [ ] Yan panel ve kare penceresi az sayı; açık artırma, kart penceresi, pazarlık uyarısı sade
- [ ] Kare görünümü: iki sade renk bölgesi, ince soluk sahipsiz şerit / kalın parlak sahipli şerit; köşe taşları üst kenarda
- [ ] Karanlık mod: cam renkleri, tren ikonu, pasif düğme, pencere başlığı, ipucu kenarlığı

## Faz 2 — Denge (önce docs/TASARIM.md, sim ile; üç oyun sonu modunda)
- [ ] Kart b: sıra başı ve çift zar kartı yok; Başlangıç'tan geçince elde 5'ten az ise 1 kart; FIRSAT 2 kart
- [ ] Varsayılan 20 tur, lobide 15/20/25
- [ ] İtiraz 6->4, İhbar 4->2
- [ ] Bot pazarlığı: iki tarafa set tamamlatan takas
- [ ] Kat değeri yarıdan sayılmaz (kullanıcıyla kararlaştırıldı: uygulanmıyor)

## Faz 3 — Oyuncu simgeleri (Higgsfield)
- [x] 6 piyon üretildi; köfte tabaklı hali, Hitit kullanıcı referansıyla. Semazen (mevcut görsel kalır), İnegöl Köftesi, Çorum Leblebisi, Ankaray, Galata Kulesi, Hitit Güneşi
- [ ] Halka yok: oyuncu rengi şeffaf PNG'nin kendi kenarına çizilir (CSS drop-shadow), kalınlık boydan bağımsız 2-3 px
- [ ] Boyutlandırma yükseklik ve genişliğe göre (ince Galata küçükte kaybolmasın); köfte ve leblebi şekilce ayrışsın
- [ ] Emoji -> kimlik eşlemesi, eski kayıt/profil dönüşümü; PROTOCOL ve SAVE_VERSION; GORSEL_STIL.md'ye piyon kalıbı

## Faz 4 — Adalet ve hatalar
- [ ] Tepki kartı beklemesi herkes için aynı (Dayı, İtiraz, Kestirme sızıntısı)
- [ ] window.__rant ev sahibine eli göstermesin
- [ ] İhtiyati Tedbir gerçekten 2 tur
- [ ] README güncel

## Faz 5 — Teknik
- [ ] Ev sahibi devri
- [ ] Telefon düzeni (390 px)
- [ ] CI açık; otomasyon test geçmeden canlıya göndermesin
- [ ] Davet linki önizlemesi (og meta + 1200x630 görsel)

## Faz 6 — Müzik ve görseller (önce örnek, onaydan sonra tam set)
- [x] Örnekler: 2 piyon, 2 gündem kartı, sürpriz arka yüzü, davet görseli (Higgsfield); lobi, zafer, tokmak, sayaç (ElevenLabs)
- [x] Seçilen takeler: lobi-1, zafer-1, tokmak-1, sayac-1 (kullanıcı henüz dinlemedi, değişebilir)
- [ ] oyun içi 2 parça + son tur müziği
- [ ] Gündem kartı görselleri (tam set), sürpriz arka yüzü, davet görseli repoya
- [ ] Zafer sesi 3-4 sn'de kısılarak biter

## Faz 7 — Hız hissi
- [ ] 1-6 sonrası yeniden ölç; seçenekler: tek odak, bot sırası özeti, varsayılan Yavaş
