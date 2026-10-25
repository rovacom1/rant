# RANT Yol Haritası

Otomatik geliştirme döngüsü her oturumda **Sıradaki** listesinin en üstündeki işaretsiz maddeyi alır.
Liste 8 maddenin altına düşerse döngü yeni fikirler ekler (oyun eğlencesini artıran, basit tutulabilen işler).
Her 5. oturum bakım oturumudur (bkz. otomasyon/GOREV.md).

## Sıradaki

- [ ] **Bot zorluk seviyesi (devam):** Motor tarafı bitti (v0.14.0, `config.botLevel`, Host `config` mesajında `botLevel`).
  - [ ] Lobide Masa ayarlarına Kolay / Normal / Zor seçimi (yalnız ev sahibi), kurallar penceresinde bir satır; tarayıcıda iki temada dene.
  - [ ] Zor bot 4 kişide belirgin güçlü değil (1000 oyunda %24, eşit şans %25; 5 kişide %25/%20). Kat dikme zamanlaması ya da kart oynama sırasıyla güçlendir.
- [ ] **Açık pazarlık:** Sırası olmayan oyuncular da birbirine teklif yapabilsin (aynı anda tek teklif kuralıyla).
- [ ] **Mobil düzen:** 400-800 px genişlikte tahta ve panelin rahat kullanımı (alt sekmeli panel). 10x10 tahtada kareler dar ekranda çok küçülüyor.
- [ ] **İlk oyun rehberi:** İlk oyunda adım adım ipuçları (zar, satın alma, kart oynama, kat dikme); "bir daha gösterme".
- [ ] **Yeni harita: İstanbul:** İlçelerden oluşan ikinci tahta; lobide harita seçimi (tahta verisi data.js'te haritaya göre).
- [ ] **Yeni kartlar (denge simülasyonuyla):** "Kat Karşılığı" (rakibin arsasına onunla ortak kat), "Kredi Kartı" (şimdi 300 al, 2 tur sonra 360 öde), "Torpil" (ihalede ikinci en yüksek teklifle kazan).
- [ ] **Yeni gündem kartları:** "Arsa Spekülasyonu", "Altın Rekor" ("Duvarda Çatlak" artık SÜRPRİZ etkisi).
- [ ] **Ev sahibi devri:** Ev sahibi düşerse en eski oyuncu kayıttan oyunu devralsın (her oyuncuda son durum kopyası).
- [ ] **PWA:** Masaüstüne kurulabilir uygulama (manifest + service worker); botlarla çevrimdışı oynama.
- [ ] **Erişilebilirlik:** Klavyeyle tam oynanış, renk körleri için şehir desenleri, ekran okuyucu etiketleri.
- [ ] **İsteğe bağlı sunucu:** P2P'nin çalışmadığı ağlar için aynı protokolle küçük bir WebSocket aktarıcısı (Cloudflare Workers + Durable Objects), varsayılan kapalı.

## Tamamlananlar

- [x] Bot seviyesi motoru: Kolay (pazarlık ve kaçak kat yok, kat ve kartı yarı yarıya unutur, artırmada erken çekilir) / Zor (eksik parçayı karşının kabul edeceği en ucuz teklifle ister, gerekirse mülk takası; artırmada en az artış); sim'de `node tools/sim.js N 5 zor` ile tek botu seviyeli oynatma. 1000 oyun, 5 kişi: zor %25, kolay %14, eşit şans %20 (v0.14.0)

- [x] Monopoly'ye yakın denge: Monopoly kira cetveli, set dışı kat kirası yarı, kirayı atlatan kartlar azaldı, elde 5 kart varken kart gelmez, Piyango 100 (v0.12.0)
- [x] Gündem 4 turda bir değişir, dönem kuralları 4 tur sürer; çubukta kalan tur (v0.13.0)
- [x] Gündem dönemi 3 tur (v0.13.1)
- [x] Monopoly tarzı açık artırma: sırayla artır ya da çekil, son kalan kazanır, teklifler açık, teklif başı 15 sn (v0.11.0)
- [x] Karanlık mod tüm pencerelerde; kare penceresinde kat/kaçak/set/ipotek/tedbir açıklamaları; simgelerin üzerine gelince ipucu; kurallarda Tahtadaki işaretler (v0.10.1)
- [x] Tempo ve okunurluk: ev sahibi canlandırma bitene kadar bekler, lobide Oyun hızı; rakip kartı 3,5 sn, kime ne yaptığı yazar, üzerine gelince durur; akışta renkli kart çipi ve önizleme; süre çubuğu artık zıplamıyor (v0.10.0)
- [x] Daha büyük tahta: el ekranın altına gömüldü (boştayken kart adları görünür, fare gelince yükselir); 1920x945'te tahta 759'dan 833 px'e (v0.9.3)
- [x] Oyun sonu grafiği: motor oyun başında ve her tur sonunda herkesin net değerini kaydeder; Seçim Günü sonuçlarında oyuncu renklerinde tur tur net değer çizgisi, kazananınki kalın (v0.9.2)
- [x] Para animasyonu: kira, transfer ve banka ödemelerinde ödeyenden alana kavisli uçan altın jetonlar (tutarla 1-6 jeton, tahtanın ortası banka); kat dikilince kare sıçrar ve üstünden vinç yükselir; hareket azaltma tercihinde kapalı (v0.9.1)
- [x] Oyun sonu seçimi: tur sayısı (10/15/20) ya da değer hedefi (2.500/3.500/5.000 ₺; ulaşılan tur tamamlanınca Seçim Günü, en geç 30. tur); üst çubukta hedef, gündem halkasında hedefe yakınlık (v0.9.0)
- [x] Lobide masa ayarları: gizli ihale, SÜRPRİZ kareleri, gündem kartları ve gizli hedefler açılıp kapanır (yalnız ev sahibi); karanlık temada lobi düğmeleri okunur (v0.8.0)
- [x] Erzurum yerine Çorum (İskilip, Osmancık; kırmızı-siyah), Eskişehir yerine Bursa (İnegöl, Nilüfer; yeşil-beyaz); fiyat ve kiralar yerlerindeki eski semtlerle aynı (v0.7.0)
- [x] Maaş Günü'nün adı Başlangıç Noktası; plaka rozeti kaldırıldı, her şehre iki renkli set çerçevesi; alınan karenin camı değişmez, yalnız şerit sahibin rengine döner; HD kareler (parlak kurdele şerit, ışık kenarı, gölge, cam parlaması ve ince doku); sığmayan semt adı bölünmeden küçülür (v0.6.2)
- [x] Hedef dengesi: Hukuk Dünyası 7 kart, Kaçak Ama Sağlam 1 kaçak kat; botlar hedef şehrine daha istekli (üç mülklü şehirde daha da); 3000 oyunluk simde her hedef %13-45 (önce %9-58) (v0.6.1)
- [x] Monopoly tarzı sade SVG ikonlar (uçak, lokomotif, sandık, soru işareti, tapu, zabıta şapkası, çay bardağı, para kesesi), alınmamış mülklerde şehir renkli buzlu cam ve plaka rozeti, tahta ortasının altında solarak akan son olaylar ve tıklayınca tüm geçmiş; yan paneldeki olay listesi kaldırıldı (v0.6.0)
- [x] Taşlar kare adını kapatmıyor: şeritten uzak kenarda (resimli karelerde üstte) yan yana dizilir, kare genişliğine göre boyutlanır; aynı karede çok taş varsa sığacak kadar üst üste biner. Kare vurgusunun nabız animasyonu düzeltildi (v0.5.1)
- [x] 36 karelik 10x10 tahta: 4 havalimanı (her biri kirayı ikiye katlar), 4 gar (kira gar sayısıyla orantılı), 2 SÜRPRİZ karesi ve hemen uygulanan 15 etki, dönen soru işaretli kart animasyonu; hedef eşikleri yeni tahtaya göre ayarlandı (v0.5.0)
- [x] Kart yelpazesinde titremesiz üzerine gelme (fare konumuna göre seçim, komşular açılır), kart adı kartın üstünde, karede 🏠×N kat göstergesi, özel kareler için resimli kutucuklar, ceviz-altın tahta çerçevesi, karanlık mod, sohbet kaldırıldı, sade ve büyük yazılı olaylar paneli (v0.4.0)
- [x] Hearthstone tarzı el (yelpaze, büyüme, sürükleyip oynama, desteden çekme, oynanan kartın ortada gösterilmesi), 16 kart görseli, yeni sağ panel, gündem barı ve haber kartı, ElevenLabs ses efektleri ve arka plan müziği, ses ayarları; tahtada şerit rengiyle sahiplik (v0.3.0)
- [x] Kullanıcı geri bildirimiyle sade arayüz: Fredoka + Nunito yazı tipi, 3 boyutlu zar, gri/oyuncu rengi tahta, karelerde fiyat-kira yok (tıklayınca kira penceresi), pazarlık ve ihalede kaydırma çubuğu (v0.2.0)
- [x] Oyun motoru, kurallar, kartlar, gündem, ihale, itiraz zinciri, pazarlık, borç/konkordato (v0.1.0)
- [x] Sezgisel botlar ve denge simülasyonu (v0.1.0)
- [x] Web arayüzü, lobi, P2P çok oyunculu, yeniden bağlanma, kayıttan devam (v0.1.0)
- [x] Sıra sende bildirimi: üst çubukta 🔔 düğmesi, sekme arkadayken masaüstü bildirimi; ses mevcut 🔊 düğmesiyle (v0.1.1)
- [x] Hedefi tahtadan seç: mülk hedefli kartlarda "🎯 Tahtadan seç", geçerli kareler parlar, Takas iki adımlı, Esc/Vazgeç ile çıkış (v0.1.3)
- [x] Bakım 1: ölü kod (squareLabel) silindi, denge kontrolü (300 oyun: sıra en çok %22, hedef %29, kira 18.6/oyun), PeerJS 1.5.5 güncel ve CDN erişilebilir (v0.1.4)
- [x] Tur özeti: her tur sonunda olay akışına özet satırı (en çok kazanan/kaybeden, el değiştiren mülkler); sonraki turun "Son dakika" kartında "N. turun özeti" kutusu (v0.1.5)
- [x] Tapu Dairesi tahtadan: parası yeten sahipsiz kareler parlar, kareye tıklayınca bilgi penceresinde "📜 Tapudan al"; uzun liste kaldırıldı (v0.2.1)
