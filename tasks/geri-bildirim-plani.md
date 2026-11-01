# Geri bildirim planı (2026-11-01)

Kullanıcı: "İhaleyi kimin kazandığı ve ne kadara gittiği çok anlaşılmıyor." Mühür kaldırıldı (beğenilmedi, v0.37.2).

İlke: bir olay olunca oyuncu üç şeyi tahtaya bakarak anlamalı: **kim**, **ne oldu**, **ne kadar**. Bunlar ya olayın
geçtiği yerde (kare, piyon) ya da tahtanın ortasında görünür; sağdaki olay satırına bakmak zorunda kalınmamalı.
Yeni yazı az olur: piyon resmi, oyuncu rengi ve tutar çoğu zaman yeter.

## Tarama: olay olunca ekranda ne oluyor

Motorun her olayı `present()` (src/ui/gameview.js) içinde nasıl gösterildiğine bakıldı.

| Olay | Şu an | Eksik |
|---|---|---|
| Açık artırmada teklif (`bid`) | Hiçbir şey; istemdeki sayı sessizce değişir | Kim ne kadar artırdı, kim çekildi görünmüyor, ses yok |
| Açık artırma bitti (`auction`) | İstem birden kapanır; ortada "Gidiyor... gidiyor... Satıldı!"; köşede "Konya: Ali aldı"; fiyat yalnız sağdaki oyuncu panelinde uçan "-180" | Kazanan ve fiyat "Satıldı!" ile aynı yerde değil; olayda fiyat alanı yok (yalnız metinde) |
| Teklifsiz artırma | Yalnız olay satırı | Mülkün sahipsiz kaldığı anlaşılmıyor |
| Pazarlık tamam (`tradeDone`) | "Anlaşma sağlandı" bildirimi, karelerde renk dolanır | Kim kime ne verdi yok |
| Pazarlık reddedildi, geri çekildi, düştü | Yalnız olay satırı | Teklifi yapan, cevabı kaçırır |
| İtiraz zinciri bitti | "Ali itiraz etti" bildirimi | Kartın düştüğü mü geçtiği mi yazmıyor ("itirazla düştü" yalnız olay satırında) |
| İpotekli ya da tedbirli kareye gelme | Yalnız olay satırı | Neden kira ödenmediği anlaşılmıyor |
| Deprem: kat çöktü (`collapse`) | Yalnız ses | Hangi karede çöktüğü görünmüyor |
| Rakip borçta | Bekleyenlerde "işlerini hallediyor" | Neden beklendiği belli değil |
| Grev: maaş yatmadı | Yalnız olay satırı | Başlangıçtan geçen, maaşın neden gelmediğini bilmez |
| Rakip kart çekti | Hiçbir şey (sayı panelde değişir) | Düşük öncelik: desteden piyona uçan kart arkası |

İyi çalışanlar (dokunulmayacak): kira (jetonlar piyondan piyona uçar, iki uçta tutar), satın alma (kare renkle dolanır,
şerit dolar), dava düellosu, rakip kartı, sürpriz, haber, yıkım ve iflas.

## Adımlar (öncelik sırasıyla)

### 1. Açık artırma: teklifler görünür olsun
- `present()` `bid` olaylarını işler. Teklif veren oyuncunun istemdeki piyon rozetinin üstünde kısa bir "+20" balonu
  çıkar (oyuncu renginde, 1 sn), "En yüksek" sayısı eski değerden yenisine sayarak artar, kısa bir "tık" sesi çalar.
- Çekilenin rozeti soluklaşırken altında kısa süre "çekildi" yazar (şu an yalnız ipucunda).
- Sıradaki oyuncunun rozeti hafifçe nabız atar (yalnız transform/opacity).

### 2. Açık artırma: kapanış kim ve ne kadar desin
- Motor: `auction` olayına `high` alanı eklenir (yalnız ekleme; eski istemci görmezden gelir, PROTOCOL artmaz).
- "Gidiyor... gidiyor..." artırma istemi kapanmadan istemin üstünde söylenir; "Satıldı!" anında balon kazananın
  rengine döner ve içinde **piyon + ad + fiyat** yazar: "Satıldı! [piyon] Ali · 180 ₺". Ardından istem kapanır.
- Aynı anda jetonlar kazananın piyonundan mülkün karesine uçar, karede "-180" belirir, şerit kazananın rengiyle dolar
  (bugünkü renk dolanması korunur).
- Teklif yoksa: "Kimse almadı" balonu, kare kısa süre soluklaşır.
- Köşedeki bildirim: "Konya: Ali 180 ₺'ye aldı".
- Kendim kazanınca balonun yanında küçük konfeti, kaybedince yok (abartma yok).

### 3. Pazarlık: kim kime ne verdi
- Anlaşma olunca tahtanın ortasında 1,5 sn'lik küçük sahne: iki piyon karşılıklı, aralarında verilenlerin mini tapuları
  ve para çipi, ok yerine `swap2` simgesi. Tıklayınca kapanır. Karelerdeki renk dolanması ardından oynar.
- Reddedilen, geri çekilen ya da düşen teklif: teklifi yapana köşede bildirim ("Ayşe teklifini reddetti").

### 4. Kart çatışmasının sonucu
- İtiraz zinciri bitince ortada kart kısa süre görünür: düştüyse soluklaşır ve altında "İtirazla düştü" yazar,
  geçtiyse etkisi her zamanki gibi oynar. Bildirim de sonucu söyler: "Kamulaştırma itirazla düştü".

### 5. Kira alınmayan durumlar ve küçük olaylar
- İpotekli ya da tedbirli kareye gelinince karede, tur başı etiketi gibi kısa etiket: "Kira yok · ipotekli" / "Kira yok ·
  tedbir" (`turnFx`'teki etiketi yeniden kullan).
- Deprem çökmesi: karede küçük yıkım canlandırması (`demolishFx`'in hafif hali) ve sarsıntı yok.
- Grevde başlangıçtan geçince piyonun üstünde "Maaş yok · grev" etiketi.
- Rakip borçtayken bekleme yazısı: "Ali borcunu kapatıyor".

### 6. (İsteğe bağlı) Rakip kart çekince
- Desteden rakibin oyuncu paneline uçan kart arkası; kartın ne olduğu gizli kalır.

## Sınamalar
- Her adımda iki tema, 844x340 ve 667x320; konsol hatası yok; `npm test` ve `npm run check`.
- Açık artırmayı botlarla en az üç kez sonuna kadar izle: kendim kazanınca, rakip kazanınca, teklif çıkmayınca.
- Hızlı oyun ve hareket azaltmada: balonlar ve yazılar kalır, uçuş ve zıplama yok.
- Akıcılık kuralı: yeni canlandırmalar yalnız transform/opacity.

## Kapsam dışı
- Ses dosyası üretimi: mevcut seslerle (`thud`, `stamp`, `sold`, `coin`, `card`) yetinilir.
- Olay satırının (son 3 olay) yeniden tasarımı.
