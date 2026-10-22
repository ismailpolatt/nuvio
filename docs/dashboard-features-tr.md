# Ana sayfa, ev durumu, odalar, gece modu ve enerji

## Ana sayfa kişiselleştirme

Kalem düğmesiyle düzenlemeyi aç, **Görünüm → Ana sayfa** bölümüne gir. Kartları anahtarla göster/gizle, oklarla sırala, genişlik düğmesiyle yarım veya tam genişlik seç. **Kaydet** mevcut Nuvio düzenine yazar. Ortak düzen kullanılıyorsa aynı düzeni kullanan kişiler etkilenir; kişisel düzen kullanılıyorsa kişisel seçim olarak saklanır. Home Assistant erişim izinleri değişmez.

Günlük enerji, medya ve ev halkı kartları isteğe bağlıdır. Ek kartları açmak veya kartları büyütmek kaydırma gerektirebilir. Var olan sürükleyerek düzenleme sistemi aynı kayıtları kullanır; ikinci bir ayar deposu yoktur.

## Ev durumu

Ana sayfadaki kart açık kapı/pencere temaslarını, yüzde 20 ve altındaki pilleri, uygun sensörlerin eksik verilerini ve problem/duman/gaz/sızıntı uyarılarını özetler. Ayrıntılar açılır; bir satıra dokunmak Home Assistant varlık ayrıntısını gösterir. Gizli, devre dışı veya yapılandırma varlıkları varsayılan listeye alınmaz; tanısal pil sensörleri değerlendirilir. Bu görünüm yalnız mevcut verileri gösterir; bildirim veya otomasyon oluşturmaz.

## Oda kontrol grupları

Bir odada **Tümü, Işıklar, İklim, Cihazlar, Sensörler** düğmeleri mevcut bölümleri filtreler. Odanın kendi cihaz grupları, parlaklık kontrolleri ve termostatları korunur. Düzenleme modunda bütün bölümler görünür; filtre ayarı bir cihaza komut göndermez.

## Zamanlı gece modu

**Görünüm → Ekran koruyucu** bölümünde ekran koruyucuyu ve zamanlı gece modunu aç. Başlangıç ve bitiş saatleri değiştirilebilir; varsayılan aralık 23:00–07:00. Eşit saatler zaman aralığını devre dışı bırakır.

Bu saatler içinde açılan sonraki bekleme ekranı loş saat ve hava durumu kullanır. Dokunmak normal kontrollere döndürür. Saatler tabletin yerel saatine göre değerlendirilir; gece yarısını geçen aralıklar desteklenir. Tabletin sistem parlaklığı değiştirilmez. Ekran koruyucu zaten açıksa mevcut oturumun stili bir sonraki açılışa kadar korunur. Mevcut PIN kilidi davranışı değişmez.

## Günlük enerji

Enerji sayfasında bugünkü tüketim dünün aynı saatine kadar olan tüketimle karşılaştırılır. Ana sayfaya ayrıca eklenebilir. **Görünüm → Ana sayfa → Enerji sayacı** kaynağı seçer. Otomatik seçim yalnız Home Assistant Enerji panosundaki şebeke giriş sayaçlarını kullanır; rastgele sayaç seçmez veya birbiriyle çakışan alt sayaçları toplamaz.

Hesap kayıt istatistiklerinin saatlik `sum` farklarını kWh birimine dönüştürerek kullanır; anlık W değeri enerji gibi gösterilmez. Birden çok şebeke girişi varsa her kaynakta başlangıç ve son veri gerekir. Başlangıç/geçmiş veri eksikse çizgi gösterilir. İstatistikler saatlik olduğundan canlı sayaçla küçük zaman farkları olabilir. Dünün değeri sıfırsa yüzde fark hesaplanmaz.

Kaynak seçimi ve bu özellikler yalnız panel ayarıdır; hiçbir sayacı sıfırlamaz, cihaz çalıştırmaz veya fatura tahmini üretmez.
