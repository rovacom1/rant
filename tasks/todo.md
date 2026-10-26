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

# Yenilikler planı (2026-10-26) — tamamlandı, yenilikler dalında (v0.17.0 - v0.23.0)

- [x] Faz 0 Tasarım A (https://claude.ai/artifact/8b2weEn38FFwrKuTF34UvG)
- [x] Faz 1 Görseller (piyonlar, gündem kartları, sürpriz arkası, davet) ve sesler (lobi, oyun 1-2, son tur, zafer, tokmak, sayaç)
- [x] Faz 2 Denge: kart yalnız Başlangıç/FIRSAT, 20 tur, İtiraz 4, İhbar 2, bot set takası, sıra nakdi
- [x] Faz 3 Adalet: tepki beklemesi masa genelinde, Tedbir 2 sıra, __rant yok, README
- [x] Faz 4-6 Arayüz: tasarım A, emoji yok, karşı teklif, itiraz zinciri
- [x] Faz 7 Ev sahibi devri, telefon düzeni, CI, davet önizlemesi
- [x] Faz 8 Hız hissi: tek odak sırası
- [ ] Kullanıcıyla: yerelde deneme, main'e merge, CI için `gh auth refresh -s workflow`
