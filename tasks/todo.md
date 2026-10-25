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
- [ ] Tüm pencereler ve paneller karanlık temada koyu (yüzey değişkenleri)
- [ ] Kare penceresinde kat/kaçak/set/ipotek/tedbir açıklamaları
- [ ] Simge ipuçları (kare, oyuncu paneli, üst çubuk, halka, gündem çipleri, taş halkası, oynanabilir kart)
- [ ] Kurallarda "Tahtadaki işaretler"
- [ ] Dayı/İtiraz beklemesinde nötr metin

## Faz 3 — Monopoly tarzı açık artırma (v0.11.0)
- [ ] Motor: sırayla artır ya da çekil, son kalan kazanır; süre dolunca çekilir
- [ ] Bot artırma/çekilme kuralı
- [ ] Arayüz: en yüksek teklif, katılımcılar, +10/+50/+100, özel tutar, Çekil
- [ ] "Gizli ihale" -> "Açık artırma"; PROTOCOL ve SAVE_VERSION
- [ ] Testler

## Faz 4 — Kart ve para dengesi, Monopoly'ye yakın (v0.12.0)
- [ ] Sıra başı ve çift zar kartı yalnız elde 5'ten az kartken
- [ ] Dayı 4->2, Tedbir 3->2, Taksi 3->2, Kestirme 4->3; Piyango 150->100, 3->2
- [ ] Set dışı mülkte kat kirası yarı; Müteahhit için şehirde en az 2 mülk
- [ ] Monopoly kira cetveli
- [ ] Bot Geri Vites kuralı
- [ ] Sim önce/sonra tablosu (kira, konkordato, sıra adaleti, hedefler, değer hedefi süreleri)

## Faz 5 — Gündem
- [ ] Mevcut sistemi anlat, yeni tasarımı kullanıcıyla konuş (kod yok)

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
