# RANT Yol Haritası

Otomatik geliştirme döngüsü her oturumda **Sıradaki** listesinin en üstündeki işaretsiz maddeyi alır.
Liste 8 maddenin altına düşerse döngü yeni fikirler ekler (oyun eğlencesini artıran, basit tutulabilen işler).
Her 5. oturum bakım oturumudur (bkz. otomasyon/GOREV.md).

## Sıradaki

- [ ] **Kat Karşılığı arayüz denemesi:** v0.21.0 kare rozeti (🏗️), kare penceresindeki ortak satırı, hedef seçimi ve rakip kart açıklaması tarayıcıda denenmedi (League açıktı); iki temada ve 375 px'te bak.
- [ ] **Mobil düzen (kalan):** Kart sürükleme dokunmatikte denenmeli; 375 px'te kare adları ~5 px (okunmuyor; dokununca açılan pencere adı gösteriyor, gerekirse kısaltılmış ad ya da dokununca büyüyen kare); dar ekranda gündem açıklaması gizli (gündem çubuğuna dokununca açıklama penceresi düşünülebilir).
- [ ] **İlk oyun rehberi:** İlk oyunda adım adım ipuçları (zar, satın alma, kart oynama, kat dikme); "bir daha gösterme".
- [ ] **Yeni harita: İstanbul:** İlçelerden oluşan ikinci tahta; lobide harita seçimi (tahta verisi data.js'te haritaya göre).
- [ ] **Ev sahibi devri:** Ev sahibi düşerse en eski oyuncu kayıttan oyunu devralsın (her oyuncuda son durum kopyası).
- [ ] **PWA:** Masaüstüne kurulabilir uygulama (manifest + service worker); botlarla çevrimdışı oynama.
- [ ] **Erişilebilirlik:** Klavyeyle tam oynanış, renk körleri için şehir desenleri, ekran okuyucu etiketleri.
- [ ] **Oyun sonu unvanları:** Sonuç ekranında eğlenceli rozetler (Kira Kralı: en çok kira toplayan, Kaçak Ustası, İtirazcı, Ev Sahibi Mağduru); motor istatistiği sayar, olaylar gizli bilgi taşımaz.
- [ ] **Hızlı oyun:** Lobide 'Hızlı' seçeneği: 8 tur, herkes 2 rastgele sahipsiz mülkle başlar; 20-25 dakikalık oyun.
- [ ] **İsteğe bağlı sunucu:** P2P'nin çalışmadığı ağlar için aynı protokolle küçük bir WebSocket aktarıcısı (Cloudflare Workers + Durable Objects), varsayılan kapalı.

## Tamamlananlar

- [x] Kat Karşılığı hamle kartı (2 adet, deste 50): rakibin arsasına kat parasını sen ödersin, sahibine bedava yasal kat çıkar, o mülkün kirası bundan sonra ikinize yarı yarıya; mülk başına tek ortak, İtiraz edilebilir, ortak iflas edince biter; sim 300x5 sıra %17-22, kira 22,6, kart 0,9/oyun (v0.21.0)
- [x] Bakım (oturum 40): kullanılmayan .wait kuralı silindi, rng.js rand dışa kapatıldı, Nasıl oynanır puan tanımına ödenmemiş kredi ve Hamle listesine Kredi Kartı eklendi; denge 300x5 sıra %18-21, kira 22,3/oyun; PeerJS 1.5.5 güncel, CDN 200 (v0.20.2)
- [x] Mobil düzen 2. dilim: 375 px'te Zar At düğmesi görünmüyordu (gündem kartı tahta ortasını kaplıyordu, istem 0 px); dar ekranda gündem tek satır, karar beklerken son olaylar gizli, istem taşınca üstü kesilmiyor, artırmada katılımcı listesi gizli, üst çubuk sayfayı yana kaydırmıyor; kare penceresi ve pazarlık penceresi 375 px'e sığıyor (v0.20.1)
- [x] Torpil tepki kartı (2 adet, deste 48): açık artırmada sıran gelince oynanır, artırma kapanır, mülk liste fiyatının yarısına (teklif daha yüksekse 10 fazlasına) alınır; bot normal tavanı içindeyse oynar; sim 500x5 sıra %19-22, kira 22,4, torpil 2,0/oyun (v0.20.0)
- [x] Kredi Kartı hamle kartı (2 adet, deste 46): bankadan hemen 300, 2 tur sonra sıra gelince 360 ödenir; aynı anda tek kredi, ödenmemiş borç net değerden düşer; bot yalnız nakdi yedeğin altındayken oynar; sim 500x5 sıra %15-22, kira 22,1 (v0.19.0)
- [x] Yeni gündem kartları: Altın Rekor Kırdı (herkes nakdinin %10'u kadar kazanır) ve Arsa Spekülasyonu (katsız, ipoteksiz her arsa için 20); gündem destesi 31 kart; sim 200x5 sıra %15-24, kira 21,8 (v0.18.0)
- [x] Bakım (oturum 35): kullanılmayan CSS (.bigcard, .gundem-card, .pl .pname, .cell .pr) silindi, yalnız kendi dosyasında kullanılan 7 ad dışa kapatıldı; denge 300x5 sıra %18-23, kira 21,7/oyun; PeerJS 1.5.5 güncel (v0.17.2)
- [x] Mobil düzen 1. dilim: 800 px ve altında üst çubuk tek satır ve yalnız ikon (142 -> 44-54 px), tahta tam genişlik (375 px'te 347 -> 367), altında 'Kartların / Oyuncular' sekmeleri (sayfa 1222 -> 855 px); izleyicide sekme yok (v0.17.1)
- [x] Açık pazarlık: sırası olmayan oyuncu da, sıradaki oyuncu zar öncesi ya da serbest evredeyken, turda bir teklif yapabilir; masada aynı anda tek teklif; pazarlık penceresi sıra beklerken açık kalır, gönderme düğmesi uygun ana kadar kapalı (v0.17.0)
- [x] Lobide Bot seviyesi seçimi (Kolay / Normal / Zor, yalnız ev sahibi); kurallarda bot seviyesi satırı, eskimiş gizli hedef ve "kimse batmaz" ifadeleri düzeltildi (v0.16.2)
- [x] Zor bot kaçak kat dikmez (zabıta ve ihbar riskine girmez); 1000 oyunda zor bot 4 kişide %24->%40, 5 kişide %25->%29 (v0.16.1)
- [x] Bot seviyesi motoru: Kolay (pazarlık ve kaçak kat yok, kat ve kartı yarı yarıya unutur, artırmada erken çekilir) / Zor (eksik parçayı karşının kabul edeceği en ucuz teklifle ister, gerekirse mülk takası; artırmada en az artış); sim'de `node tools/sim.js N 5 zor` ile tek botu seviyeli oynatma. 1000 oyun, 5 kişi: zor %25, kolay %14, eşit şans %20 (v0.14.0)

- [x] Monopoly'ye yakın denge: Monopoly kira cetveli, set dışı kat kirası yarı, kirayı atlatan kartlar azaldı, elde 5 kart varken kart gelmez, Piyango 100 (v0.12.0)
- [x] Gündem 4 turda bir değişir, dönem kuralları 4 tur sürer; çubukta kalan tur (v0.13.0)
- [x] Gündem dönemi 3 tur (v0.13.1)
- [x] El sağ sütunda, kart boyu kalan yere göre; tahta daha büyük (v0.14.1)
- [x] Gizli hedef mekaniği kaldırıldı; puan = net değer - konkordato cezası (v0.15.0)
- [x] Oyun sonu: Son kalan (iflas) modu, kiralar her tur artar (v0.16.0)
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
