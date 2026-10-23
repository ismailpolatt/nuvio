# Günlük kullanım araçları

Odalar sayfasında odaya dokununca hızlı panel açılır. Odanın ışık ve anahtarları ayrı güç düğmeleriyle yönetilir; iklim ve sensör ayrıntıları Home Assistant'ın kendi penceresinde açılır. Kullanılamayan cihazın güç düğmesi kapalıdır. Tam oda sayfası bağlantısı korunur. Panel klavyeyle kapatılabilir ve odak açan karta döner.

Kontrol sayfasındaki ek bölümler:

1. **Öneriler:** Aynı odada açık temas + gerçek `heating/cooling` eylemi, oda neminin %70'i aşması ve %20/altı pil. `heat` modu tek başına çalışıyor sayılmaz. Oda veya sensör verisi eksikse ilgili kural sonuç üretmeyebilir. Kendiliğinden komut göndermez.
2. **Çıkış kontrolü:** Açık ışık/anahtar, açık veya kullanılamayan temas, açık iklim modu ve oynayan medya. Başlangıçta hiçbir cihaz seçili değildir. Yalnız ışık/anahtar kapatma seçilebilir. Önizleme ve ayrı Onayla adımı vardır. Priz bağlı cihazın elektriğini kesebilir. Hedefler güncel durumla doğrulanır; servis hatasında işlem durur ve kabul edilen komut sayısı gösterilir. Geri alma veya fiziksel sonuç garantisi yoktur.
3. **Tablet:** Mevcut bağlantı/pil ayarlarının altında bu tarayıcı+hesap+panel için yatay/dikey kart gizleme, düzen kilidi ve 48 piksel dokunma hedefleri. Ortak veya kişisel düzende gizli kartları açmaz. 600–1600 piksel genişlikte dokunmatik tarayıcıda uygulanır. Kilit güvenlik/erişim yetkisi değildir; Kontrol → Tablet'ten kaldırılır. Cihaz işletim sistemi ayarlarını değiştirmez. Fazladan büyük hedefler bazı içeriklerde kaydırma gerektirebilir.
4. **Bildirimler:** Güncel sağlık uyarıları ve Home Assistant kalıcı bildirimleri; kritik, dikkat, pil, bağlantı sırası. Okundu bilgisi `nuvio_personal_controls_v1.readAlerts` ile hesaba kaydedilir (en çok100). Olayın `last_changed` veya bildirim içeriği/tarihi değişirse yeniden okunmamış olur. Okundu, HA bildirimini silmez ve sensörün fiziksel sorununu çözmez.
5. **Otomasyonlar:** Mevcut otomasyonları kayıtlı oda atamasına göre filtreler; oda adı tahmini yapmaz. Son tetiklenme `last_triggered` üzerinden gösterilir. Yönetici ayrı önizleme/onay ile etkinleştirir veya devre dışı bırakır. Yeni otomasyon oluşturmaz veya `automation.trigger` çağırmaz. Devre dışı bırakırken `stop_actions:false` gönderilir; çalışan adımlar durdurulmaz. [Home Assistant servis tanımı](https://github.com/home-assistant/core/blob/dev/homeassistant/components/automation/services.yaml).

Türkçe/İngilizce metinler çevrildi; bu yeni bölümde Fransızca/Lehçe kataloglar İngilizce yedek metin içerir. Önceki çeviriler korunur. Varsayılan tablet gizleme/kilit/büyük hedef ayarları kapalıdır. Fiziksel cihaz komutları görsel doğrulama için çalıştırılmaz; servis akışı sahte HA ile test edilir.


## İşlem günlüğü (2026-10-23)

Kontrol → İşlem günlüğü, bu panelden favoriler, ev modları, çıkış kontrolü, oda güç düğmeleri ve otomasyon açma/kapatma üzerinden gönderilen son 100 işlemi oturum açan hesabın Home Assistant kullanıcı verisinde saklar. Kişisel görünüm ayarlarından ayrı tutulur. Önizleme ve iptal kayıt oluşturmaz.

Komut kabul edildi, kısmen tamamlandı ve başarısız durumları ayrı gösterilir. Kabul edilen adım sayısı, hedefler ve istenen aç/kapat komutları incelenebilir. Kabul, fiziksel cihaz durumunun doğrulandığı anlamına gelmez; diğer uygulamalar ve geçmiş işlemler içe aktarılmaz.

Günlük okuma/yazma hatası cihaz komutunu tekrar göndermez ve komut sonucunu değiştirmez. Aynı tarayıcıdaki eklemeler sıraya alınır ve her eklemeden önce sunucudaki son kayıt okunur. Home Assistant bu veri alanında koşullu yazma sunmadığı için farklı tarayıcıların tam eşzamanlı yazıları arasında kayıt kaybı yine mümkündür; bu bir eksiksiz denetim kaydı değildir. Hesap değişiminde eski yanıtlar yeni hesabın ekranını değiştirmez.

## Aylık enerji bütçesi (2026-10-23)

Kontrol → Enerji geçmişi → Bütçe ayarları üzerinden aylık kWh veya para birimi hedefi ve ekran uyarısı eşiği belirlenir. Hedef 0 ise kapalıdır; varsayılan hedef uydurulmaz. Ayarlar yalnız ilgili hesabın kişisel tercihlerine kaydedilir. TL/para birimi hedefi için Tarife bölümündeki pozitif birim fiyat gerekir.

Takvim ayı Home Assistant saat dilimine göre hesaplanır. Ana sayfada seçilen enerji sayacı veya Home Assistant enerji ayarlarındaki şebekeden alım kaynakları kullanılır; bunların toplamı tüm ev tüketimiyle aynı olmak zorunda değildir (örneğin güneş üretimi varsa). Recorder saatlik `sum` verileri kWh olarak istenir; ay başı referansı, kesintisiz saatlik kayıt ve çoklu kaynaklarda ortak son zaman gereklidir. Eksik kayıt sıfır tüketim sayılmaz. Kümülatif toplamın düşmesi de eksik/geçersiz veri kabul edilir.

Kullanılan, kalan, aşım ve ay sonu tahmini gösterilir. Tahmin en az 24 saat kayıt gerektirir; son kayıt iki saatten eskiyse durdurulur. Hedefe ulaşma, uyarı yüzdesi ve tahmini aşım yalnız bu ekranda gösterilir; bildirim servisi veya cihaz komutu gönderilmez. Tek fiyatlı maliyet yaklaşık olup vergi/kademeli tarife içermez. Sıfır tüketim geçerlidir. Yenile düğmesi bütçe verisini de yeniler.

API biçimi: [Home Assistant Recorder WebSocket kaynağı](https://github.com/home-assistant/core/blob/dev/homeassistant/components/recorder/websocket_api.py) (`statistics_during_period`, saatlik `sum`, enerji birimi dönüşümü).

## Bakım ve pil (2026-10-23)

Kontrol → Bakım ve pil: hesaba özel en fazla 50 görev. Ad, isteğe bağlı cihaz, planlanan tarih ve tekrar süresi girilir. Tekrar 0 ise tek seferliktir; “Yaptım” sonrası tamamlandı olarak saklanır. Tekrarlanan görev tamamlandığı tarihten belirtilen gün kadar ileri planlanır. Tarih Home Assistant saat dilimine göredir. Düzenleme ve iki aşamalı kaldırma desteklenir. Bunlar panel içi hatırlatmalardır; arka planda bildirim, takvim kaydı veya cihaz komutu oluşturulmaz.

Düşük pil (%0–20), unavailable/unknown ve eski zaman damgası ayrı durumlar olarak gösterilir. `last_reported` varsa o, yoksa `last_updated` kullanılır. Varsayılan eski veri eşiği 24 saattir; 1–720 saat arası değiştirilebilir. Eski damga çevrimdışı kanıtı değildir; yalnız değişiklikte raporlayan cihazlar olabilir. Gizli/devre dışı bırakılmış varlıklar gösterilmez.

## Kişisel hızlı işlemler

Kontrol → Ev modları → Yapılandır: dört mevcut modun adını değiştirebilir ve “Favoriler bölümüne sabitle” seçebilirsin. Sabitlenen mod Favoriler üstünde görünür; adımlar açıkça yapılandırılmadan düğme etkinleşmez. Dokunma yalnız önizleme açar; cihaz/komut listesi onaylanınca mevcut güvenli yürütme ve sonuç günlüğü kullanılır. Yeni bir paralel mod sistemi veya varsayılan cihaz seçimi oluşturulmaz. İsim ve sabitleme hesaplar arasında taşınmaz.

## Oda konforu

Kontrol → Oda konforu: seçili oda sıcaklık/nem sensörleri, açık/belirsiz kontaklar ve aynı odada fiilen heating/cooling bildiren iklimlendirme birlikte gösterilir. Sıcaklık °C’ye çevrilir (°F/K destekli). Başlangıç gösterge eşikleri sıcaklık18–26°C, nem%30–65 olup kullanıcı değiştirebilir; bunlar tıbbi veya otomasyon önerisi değildir. Eksik/boş/ölçü dışı/eski veya zaman damgasız veri uygun kabul edilmez. Veri eskiliği bakım bölümündeki kişisel saat eşiğini kullanır. Açık kontak ve çalışan iklimlendirme ayrıca işaretlenir; otomatik müdahale yoktur.

## Tablet yön profilleri

Kontrol → Tablet: aynı tarayıcı/hesap/dashboard için yatay ve dikeyde bağımsız görünürlük, yukarı taşıma ve genişlik seçimi. Mevcut görünürlük tercihleri korunur. Genişlik varsayılan/yarım/tam olabilir. Açık kişisel tablet sırası CSS boşluk doldurmasıyla bozulmaz; yeni kartlar listenin sonuna eklenir. Ortak düzende gizlenen kart açılamaz. Ayarlar yalnız dokunmatik600–1600px görünümünde uygulanır; telefon etkilenmez. “Varsayılanları forma getir” yalnız taslaktır; Kaydet olmadan uygulanmaz. Düzenleme kilidi ve büyük dokunma hedefleri korunur. Profil yerel tarayıcı saklamasıdır; HA izinlerini değiştirmez.

## Canlı bağlantı ve veri zamanı

Aktif panel açıkken dakikada en fazla bir salt okunur WebSocket ping ile sunucu erişimi kontrol edilir; sekiz saniye yanıt alınamazsa bekleme uyarısı gösterilir. Tarayıcı offline ve HA disconnected/ready olayları izlenir; gizli/ayrılmış sayfalar kontrol döngüsü çalıştırmaz. Bağlantı hatasında sayfalarda bilgi şeridi görünür; normale dönünce kaybolur. Kontrol → Tablet altında son başarılı kontrol, yanıt süresi ve favori/seçili tablet sensörlerinin zaman damgaları incelenebilir. “Bağlantıyı kontrol et” yalnız ping gönderir, cihaz komutu göndermez. Sunucu bağlantısı fiziksel sensör tazeliğinin kanıtı değildir.

İstemci olayları ve pong davranışı: [Home Assistant WebSocket istemcisi](https://github.com/home-assistant/home-assistant-js-websocket/blob/master/lib/connection.ts). Kullanıcı isteğiyle bu toplu sürümün fiziksel A9+ ve canlı form/cihaz kontrolü sonraki aşamaya bırakılmıştır; model/render testleri gerçek cihaz testi değildir.
