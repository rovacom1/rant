# Mekanik planı: kaçak serbest, simge yapı, belediye (2026-11-01, taslak)

Çizim: https://claude.ai/artifact/WKd7QWXGmviH4XQX58tjXw, "Mekanik fikirleri" sayfası. Kullanıcı kararı bekliyor (3 Kasım'a kadar, heykeller kredi bitmeden çizilsin diye).

## Öneri
Kat kalsın (rant kat üzerinden konuşulur), kaçak serbest olsun, her şehir setine bir simge yapı gelsin. Tam setle iki yol:
ucuz ve riskli kaçak kule ya da pahalı ve güvenli simge yapı. Belediye başkanlığı sonra, küçük bir katman olarak. Evler baştan çizilmez.

## Bugün (tools/sim.js 200 5)
Yasal kat 32.2, kaçak 14.3, konkordato 2.9 / oyun; hiç seti olmayan oyuncu %26; birinci-sonuncu farkı 5896 (ort. puan 2583);
en büyük kira ort. 1194; kira ödemesi 46 / oyun.

## Kaçak serbest
- Her mülke istenen kadar kaçak, eşitlik yok. Seviye (yasal + kaçak) tam sette en çok 6, değilse en çok 2.
- Yasal kat yalnız tam sette, en çok 4; 5-6 yalnız kaçak. Kaçak yarı fiyat; set tam değilse kira yarı.
- 5. ve 6. kat kirası: 4 kat kirasının 1,25 ve 1,5 katı.
- İhbar ve Zabıta seçilen tek mülkün kaçaklarını yıkar; Belediye Operasyonu herkesinkini. Ceza kat başı 25.
- Çay parası: yıkılacak kaçakların maliyetinin yarısını ödeyip kurtar (açık; Operasyon'da yok).
- 5-6 katlılar Deprem ve Duvarda Çatlak'ta tepeden çöker. Net değerde kaçak yarı, afla tam.

## Simge yapı
- Koşul: set tamam, ipotek yok, her mülkte en az 3 yasal kat, sette kaçak yok. Setin adını taşıyan ilde, set başına bir.
- Bedel: kat fiyatı x 4. Setin kirası +%50 (sim ile %30-60). Setin mülkleri kamulaştırılamaz, takas edilemez, tedbir konamaz.
- Heykel varken sete kaçak dikilmez. Net değere bedeli kadar. Set el değiştirirse heykel yeni sahibine.
- Şehri temsil eden yapılar (kullanıcı: belediye binası ya da ürün heykeli değil). Piyonlardaki Galata, Kız Kulesi, Atakule,
  Saat Kulesi, Hitit Güneşi tekrar edilmez; dini yapılar ve Anıtkabir dışarıda: Amasya Yalıboyu evleri, Trabzon Sümela,
  Bursa Irgandı Köprüsü, Kapadokya peribacaları, Antalya Hadrian Kapısı, Ankara Kalesi, İzmir Tarihi Asansör, Boğaziçi Köprüsü.
- Not: kullanıcı Monopoly'den ayrışmak istiyor; bu plan yeni oyun kararına bağlı (bkz. `tasks/yeni-oyun-fikirleri.md`).

## Dayının unvanları
Seçim Günü'nde +150 puan: Kaçak Kralı, İhale Canavarı, Davacı. Oyun boyunca rozetle görünür. Sayımlar `stats`te var.

## Kart ve gündem
İhbar tek mülk; yeni gündem "Af Söylentisi" (sonraki gündem %50 İmar Affı); Kentsel Dönüşüm kaçakları yarı bedelle yasallaştırabilir;
Müteahhit Dostu ve Belediyeden Jest 4'ü aşmaz; Duvarda Çatlak önce kaçak kulenin tepesi.

## Denge hedefleri (200 bot, 5 kişi)
Konkordato < 2,5; birinci-sonuncu farkı büyümesin; 20 tur; setsiz oyuncu < %26; kaçak 25-35 / oyun, yıkılan 8-15;
simge yapı 1-3 / oyun. Kollar: kaçak fiyatı %50-70, 5-6. kat çarpanı, simge kira artışı ve bedeli, çay parası, maaş 200 → 250, İhbar/Zabıta kapsamı.

## Belediye başkanlığı (sonra)
Tam hali (parti başkanları, seçim, harç) yeni oyun: motor, 84 kart/etki metni, botlar, testler, ekranlar; Monopoly sezgisi kaybolur.
Küçük katman: setin çoğunluğu sendeyse başkansın; dönemde bir kez imar tadilatı (bir mülkün yasal sınırı 4 → 5, rakibe de yapılır,
pazarlıkta "imar izni" satılır); setteki kat dikiminden %10 harç; "Yerel Seçim" gündemi. Hayali partiler, gerçek ad yok.

## Görsel (bu hafta)
- Evler baştan: hayır. Kaçak eklentileri: evet (ortak tek sayfa, binanın tepesine üst üste, k0-k3 emekli). Heykeller: evet (8).

## İş
data.js (kira 5-6), rules.js (buildBlock sınırları, simge, çay parası), kartlar ve gündem, bot.js, testler, sim metrikleri
(yıkılan kaçak, af, simge, unvan), SAVE_VERSION ve PROTOCOL, TASARIM.md §3 §5 §7 §8 §9. Senkron adımından sonra, arayüzden önce.

## Kararlar
- [ ] Kaçak serbest (tam sette 6, değilse 2)
- [ ] İhbar ve Zabıta tek mülke
- [ ] Çay parası
- [ ] Simge yapı kuralları
- [ ] Heykel fikri
- [ ] Dayının unvanları
- [ ] Belediye katmanı sonraya
