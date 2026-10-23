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
