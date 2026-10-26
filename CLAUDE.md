# RANT — proje kuralları (Claude ve diğer ajanlar için)

## Ürün
- Türkiye temalı, 4-5 kişilik, internetten oynanan emlak + kart oyunu. Kullanıcı (avukat, yazılımcı değil) tüm ürün kararlarını bize bıraktı: "eğlenceli, yaratıcı, farklı mekanikler".
- Arkadaşlar farklı şehirlerden, kendi bilgisayarlarından oynar. Kurulum ve hesap istemeyen akış kutsaldır: link aç, adını yaz, katıl.
- Kurallar `docs/TASARIM.md`'de. Kural değişirse önce orayı güncelle, sonra kodu.

## Arayüz ilkeleri (kullanıcı kararları, 2026-10-26; tasarım A "Geniş Tahta")
- Tasarımın kaynağı: https://claude.ai/artifact/8b2weEn38FFwrKuTF34UvG (bütün ekranlar, iki tema). Yeni ekran bu dille çizilir.
- Ekranda az yazı ve sayı. Yeni bilgi önce bir tıklamanın arkasına (küçük pencere, ipucu) konur.
- Yerleşim: tahta ekranın tüm yüksekliğini kaplar, genişliği en fazla yüksekliğin 1,45 katı; sağda 340 px sütun (oyuncular, el, Pazarlık/İpotek/İnşaat). Üst çubuk yok. Pencereler ve bildirimler tahtanın ortasında açılır, kenar kareleri kapatmaz.
- Karelerde fiyat ve kira yazmaz; kareye tıklayınca tapu kartı ve kira cetveli açılır. Kendi karende kat dik / kaçak kat / kat sat / ipotek oradan; ayrıca sağ alttaki İnşaat panelinden.
- Mülkler şehrin tek rengindeki buzlu cam ve aynı renkte set çerçevesiyle çizilir (renkler renk körlüğüne göre seçildi, oyuncu renklerine benzemez). Sahipliği yalnız iç kenardaki şerit gösterir: sahipsizken ince ve soluk, sahipliyken kalın ve sahibinin renginde. Sırası gelen oyuncunun karesi onun renginde parlar.
- Emoji yok. Bütün simgeler SVG (`src/ui/icons.js`): kat ev simgesi ×N, kaçak kat koni. Yazı tipi okları da kullanılmaz. `npm run check` emojiyi yakalar.
- Oyuncu piyonları resimdir (`assets/piyon`, 6 tane); oyuncu rengi halka değil, figürün kendi kenarına çizilir. Tahtada piyon kare yüksekliğinin yaklaşık yarısıdır.
- Elde kartlar sağ sütunda: üstüne gelince büyür ve resmin altında tek satırlık kısa kuralı belirir (ayrı açıklama alanı ya da "sürükle/tıkla" yazısı yok); tahtaya sürüklenip bırakılınca oynanır. Şu an oynanabilen kartın köşesinde şimşek rozeti olur, sıra sendeyken oynanamayanlar soluk durur. Her kartın resmi var (`assets/kart`); yeni görsel `docs/GORSEL_STIL.md`'deki tarzda üretilir.
- Düğmeler 3 boy (56/46/36 px) ve 4 tür (ana pirinç #c8912f, ikincil, hayalet, sakin). Aynı rol aynı boy, ekranda tek ana düğme. Simge yazı boyunun 1,2 katı, yazıyla aynı çizgide.
- Para seçimi elle yazarak değil, oyuncu rengindeki kaydırma çubuğuyla yapılır. Açık artırmada büyük yazan sayı toplam tekliftir, artış ayrıca küçük yazar. Lira işareti SVG.
- Yazı tipleri: başlık/düğme/sayı Bricolage Grotesque, metin Geist. Zarlar 3 boyutlu döner, yukarıdan bakılır (geçerli değer üst yüz), atıştan kısa süre sonra gizlenir. Sesler canlandırmayla aynı anda başlar ve aynı sürede biter.
- Sesler ve müzik `assets/ses` altında; ayarı sağ üstteki ses penceresinden (müzik ve efektler ayrı, bildirim de orada).
- Sohbet yok (kullanıcı kaldırttı). Son 3 olay tahtanın ortasının altında; zar, yürüme, maaş gibi gürültü gösterilmez. Tıklayınca turlara ayrılmış geçmiş açılır.
- Karanlık mod var (sağ üstte ay/güneş); yeni arayüz parçaları iki temada da denenmeli.

## Mimari
- Derleme adımı yok, npm bağımlılığı yok. Tarayıcıda ES modülleri; testler `node:test`.
- `src/engine/` saf ve deterministik: DOM yok, `Math.random` yok (rng state'te). Olaylar (events) asla gizli bilgi taşımaz.
- `src/net/host.js` yetkili kopya. Taşıma katmanı (PeerJS / yerel) değiştirilebilir.
- Dış kaynak: yalnız PeerJS (jsDelivr, sabit sürüm) ve Google Fonts. Yeni CDN/bağımlılık eklemeden önce iki kez düşün.
- `src/version.js`: her yayında APP_VERSION artır; mesaj/görünüm biçimi uyumsuz değişirse PROTOCOL, kayıt biçimi değişirse SAVE_VERSION artır.

## Kalite
- Her değişiklikten sonra `npm test` (birim + 125 bot oyunu) yeşil olmalı. Kural/denge değişikliğinde `node tools/sim.js 200 5` raporunu karşılaştır.
- Arayüz değişikliğinde yerel sunucuda (`node tools/serve.js 4188`) tarayıcıyla dene; konsol hatası kalmasın.
- Türkçe metinlerde şapkalı harf yok (a, i, u kullan). Teslimden önce `npm run check` temiz geçmeli.
- Basit tut: küçük, bitmiş, test edilmiş adımlar. Kod tabanını şişirme; ölü kodu sil.
- Commit mesajları İngilizce, sonunda `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Asla
- Geçmişi yeniden yazma, force push yapma, repoyu/dalları silme.
- Takip/analitik, reklam, kişisel veri toplama, ücretli servis ekleme.
- Gizli anahtar, token, şifre commit'leme.
