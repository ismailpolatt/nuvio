# Kişisel kontrol merkezi

Üst menüde **Kontrol** sekmesini aç. Dar ekranda sekme şeridi yatay kaydırılabilir. Doğrudan adres, mevcut panonun `/kontrol` sayfasıdır. Varsayılan açılış sayfası Ana sayfa olarak kalır. Yeni araçlar ana ekranı büyütmez; 3D plan eklenmez.

## 1. Favoriler

**Favoriler → Favorileri düzenle** ile en fazla 12 cihaz seçip kaydet. Arama alanı listeyi süzer. Işık ve prizlerin ayrı güç düğmesi bulunur. Cihaz ikonuna dokunmak Home Assistant ayrıntılarını açar; diğer cihaz türlerinin kontrolleri kendi ayrıntı ekranlarındadır. Kaydetmek cihazı çalıştırmaz. Kullanılamayan cihazların güç düğmesi kapalıdır.

## 2. Ev modları

**Evdeyim, Dışarıdayım, Film, Uyku** başlangıçta boştur. Her modun Düzenle düğmesiyle ışık ve prizlere Açık/Kapalı/Değiştirme seç. En fazla 12 açık adım kaydedilir. Seçenekler cihaz listesinin sırasıyla uygulanır. Var olan HA sahne veya script içerikleri tahmin edilmez; bu modlar açıkça seçilmiş aç/kapat adımlarından oluşur.

**Önizle** seçili cihazları ve hedef durumlarını gösterir. **Bu adımları çalıştır** ayrı bir düğmedir. Bir cihazın verisi yoksa başlatılmaz. Bir servis çağrısı hata verirse sonraki adımlar durur ve tamamlanan adım sayısı gösterilir; tamamlanan fiziksel işlemler otomatik geri alınmaz. Başarı, servis çağrısının kabulüdür; cihazdan fiziksel sonuç onayı anlamına gelmez. HA izinleri geçerlidir. Otomasyon veya zamanlama oluşturulmaz.

## 3. Oda özeti

Odalar kartlarında mevcut sıcaklık/nemin yanında açık ışık / toplam ışık, açık temas ve eksik ışık/temas verisi sayıları bulunur. Kullanılamayan kapı/pencere kapalı kabul edilmez. Sayılar varlık sayılarıdır; bir cihaz birden fazla varlık sağlayabilir.

## 4. Enerji geçmişi

Kontrol → Enerji geçmişi son 7 tamamlanmış günün grafiğini gösterir. Haftalık görünüm son 14 tamamlanmış günü iki 7 günlük dönemde toplar; takvim haftası veya içinde bulunulan gün değildir. Kaynak ana sayfa ayarlarında seçilen ev sayacı veya HA Enerji şebeke girişleridir. Saatlik kayıtların kWh `sum` farkları kullanılır. Eksik veri çizgidir, sıfır tüketimle karıştırılmaz.

Tarife ve sayaçlar bölümünden kWh fiyatı, para birimi ve en fazla 12 cihaz enerji sayacı seçilir. Maliyet yalnız tüketim × girilen fiyat tahminidir; vergi, kademe, sabit ücret veya gerçek fatura hesaplamaz. Cihaz tablosu bugünün saatlik tüketimini karşılaştırır ve ev toplamına eklenmez. Çakışan sayaçlar seçilmemelidir. Cihaz listesi boşsa HA Enerji cihaz tüketimi ayarları kullanılır. Ev sayacı yoksa kurulum mesajı gösterilir.

## 5. Tablet

Tarayıcı ağ durumu ve HA bağlantısı, seçilen tablet pil yüzdesi, şarj durumu ve pil sensörünün son güncellemesi gösterilir. Tablet sensörünü elle seç: otomatik olarak başka cihazın pili alınmaz. Pil için yüzde birimli battery sensörü, şarj için battery_charging ikili sensörü gerekir. Sensör yoksa değer çizgidir. Son güncelleme tarihi son pil değişimini de ifade edebilir; bağlantı testi değildir. Bu sayfa işletim sistemi parlaklığını/şarjını yönetmez.

## 6. Ana sayfam

**Kendi ana sayfa ve kişi tercihlerimi kullan** seçeneği etkinse kart görünürlüğü, genişliği ve sırası kişisel olarak uygulanır. Yukarı ok sıralar. Ortak varsayılan seçimi yöneticinin düzenini izler; Göster/Gizle kişisel olarak üzerine yazabilir. Görünür kişiler listesinde işaret kaldırmak yalnız o hesapta kişiyi gizler; ortak düzende gizlenen kişiler geri açılmaz. Tercihler kaydedilince sayfa yeniden yüklenir.

Bu bölüm ve favoriler, ev modları, tarife/sayaç ve tablet seçimleri **oturum açmış HA hesabının** `frontend/user_data` kaydında `nuvio_personal_controls_v1` anahtarıyla saklanır; ortak dashboard kaydı değiştirilmez. Aynı hesapla kullanılan cihazlar tercihleri paylaşır. Ayrı tablet hesabı kullanılırsa ayrı tercihler olur. Bu görünüm kişiselleştirmesidir, erişim kontrolü değildir.

Üst kalemle açılan mevcut Nuvio düzenleme modu ortak düzen kullanılıyorsa ortak düzeni değiştirmeye devam eder. Kişisel maske bu düzenleme sırasında uygulanmaz. Ortak dashboard izinleri ve Kullanıcılar bölümündeki yerel Nuvio ortak/kendi düzen seçimi değişmez.

Türkçe ve İngilizce yeni metinler kaynak kataloglarında bulunur; yeni Kontrol alanları Fransızca/Lehçe kataloglarında şimdilik İngilizce yedek metinler kullanır.
