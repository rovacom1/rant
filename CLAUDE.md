# RANT — proje kuralları (Claude ve diğer ajanlar için)

## Ürün
- Türkiye temalı, 4-5 kişilik, internetten oynanan emlak + kart oyunu. Kullanıcı (avukat, yazılımcı değil) tüm ürün kararlarını bize bıraktı: "eğlenceli, yaratıcı, farklı mekanikler".
- Arkadaşlar farklı şehirlerden, kendi bilgisayarlarından oynar. Kurulum ve hesap istemeyen akış kutsaldır: link aç, adını yaz, katıl.
- Kurallar `docs/TASARIM.md`'de. Kural değişirse önce orayı güncelle, sonra kodu.

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
