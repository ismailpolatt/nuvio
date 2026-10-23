# Menü, uygulamalar, veri durumu ve tam Nuvio yedeği

## Tek menü

Nuvio stratejisi bütün sayfalarda aynı üst menüyü üretir. Kiosk Mode kurulu olduğunda Home Assistant'ın dış başlığı ve yan çubuğu varsayılan olarak gizlenir. Mevcut yönetici profil menüsünden kiosk kapatılabilir; `?disable_km` kurtarma yolu korunur. Stratejinin açık `kiosk_mode` tercihleri varsayılanın önüne geçer. Diğer HA panellerinin menüsü değiştirilmez.

## Uygulamalar

Üst menüde **Uygulamalar**: HACS, Music Assistant, Zigbee2MQTT ve Blueprint Studio. Bağlantılar Home Assistant'ın kayıtlı panel listesinden bulunur; kurulum adı veya IP sabit değildir. Kayıtlı olması servisin sağlıklı çalıştığı anlamına gelmez. Yönetici panelleri normal hesapta gösterilmez; HA'nın kendi yetkileri geçerlidir. Uygulama, panelin adresini veya ana sayfasını değiştirmeyen tam ekran bir pencere içinde açılır. Üstteki uygulama sekmeleri arasında geçiş yapılabilir; Kapat düğmesi aynı panele döndürür. Aynı uygulama tekrar seçildiğinde veya HA durumları güncellendiğinde çerçeve yeniden oluşturulmaz. İçerik aynı Home Assistant sunucusundaki kayıtlı panelden yüklenir; HA oturumu ve yetkileri geçerlidir.

Uygulama penceresindeki Home Assistant yan menüsü gizlenir ve ayırdığı genişlik sıfırlanır. Bu yalnız gömülü uygulama belgesine uygulanır; normal HA sekmelerinin menüleri değişmez. Pencere kapanınca görünüm izleyicisi durdurulur.

## Varlık seçimi

Arama; varlık kimliği, görünen ad veya oda adıyla yapılabilir. Türkçe karakterler, büyük/küçük harf ve kopyalanan görünmez işaretler eşleştirmeyi bozmaz. Tam varlık kimliği yazıldığında tür sekmesi sonucu gizlemez. Gizli/tanılama varlıkları açık aramada açıklamasıyla görünür. Zaten ekli, devre dışı veya kartın alanına uygun olmayan sonuçlar boş liste yerine nedenleriyle gösterilir; uygun olmayan seçim yapılamaz. Sonuçlarda varlık kimliği de yazılıdır.

## Veri durumu

**Kontrol → Veri durumu** sunucu bağlantısını ve görünür sensör kayıtlarını gösterir. Son `last_reported`, bulunamazsa `last_updated` kullanılır; bu zaman fiziksel cihazın son kalp atışı anlamına gelmez. **Bakım ve pil** bölümünün eski kayıt eşiği kullanılır (varsayılan 24 saat). Eksik/geçersiz/gelecek zaman damgaları doğrulanmış sayılmaz. Eski değerler bu listede yalnız “Son bilinen” olarak yer alır. İlgili kartlarda güncellik uyarısı bulunur. Kapı/pencere kartı eksik veya eski veriyi “kapalı” saymaz.

## Tam Nuvio yedeği

Yönetici hesabında **Kontrol → Tam Nuvio yedeği → Tam yedeği indir**. Sunucudan son kaydedilen veriler okunur; açık form taslakları dahil değildir. JSON dosyası şunları kapsar:

- Bu panelin strateji tanımı, ortak düzen ve hesabın kendi düzen kaydı; görünüm, kartlar, duvar ekranı ve Assist tercihleri.
- Bu hesabın favorileri, görünür kişiler, kart sırası/genişliği, ev modları, bütçe, bakım görevleri ve konfor eşikleri.
- Bu hesabın işlem günlüğü ve dil tercihi.
- Bu tarayıcı, hesap ve panele ait yatay/dikey tablet profili; ekranın burada etkinliği ve performans tercihleri.

Dosya Home Assistant sistem yedeği değildir. Cihaz eşleştirmeleri, eklentiler, ölçüm geçmişi ve yüklenmiş görsellerin dosya içerikleri dahil değildir. Görsel adresleri korunur. Diğer hesapların kişisel verileri ve kimlik doğrulama deposu okunmaz. Yedek kişisel düzen ve cihaz adları içerebilir; GitHub'a eklenmez.

**Yedek dosyası seç** yalnız önizleme açar. Dosyanın sürümü, içerik sayıları ve bulunamayan varlıklar gösterilir. Geri yüklemek için açıklamayı okuyup kutuyu işaretlemek ve **Yedeği geri yükle** düğmesine basmak gerekir. Hedef mevcut hesap/paneldir; kaynak panel adresine yazılmaz. Hedefin ortak/kendi düzen erişim eşlemesi korunur. Ev modları çalıştırılmaz, cihaz servisleri çağrılmaz.

İlk değişiklikten önce bu hesap/panel için yerel kurtarma kopyası saklanır; **Geri yükleme öncesi yedeği indir** ile alınabilir. Yeterli tarayıcı alanı yoksa işlem başlamaz. Kayıt adımları atomik değildir; hata durumunda yapılan yazımlar ters sırayla geri alınır. Geri alma da başarısız olursa ayrı hata gösterilir ve kurtarma kopyası korunur. Başarıda panel yeniden yüklenir.

Eski **Ayarlar → Yedekleme** düzen dosyası biçimi korunur; tam yedek bu yeni bölümden yönetilir. Eski dosyayı tam yedek alanına yüklemeyin.


### Hesaba özel uygulamalar (2.23.3)
Uygulamalar → Uygulamaları düzenle. Kayıtlı ve hesabın erişebildiği HA panelleri listeden eklenebilir; adlar değiştirilebilir, yukarı taşınabilir ve kaldırılabilir. Kaydet yalnız frontend kullanıcı verisini yazar; ortak paneli veya diğer hesapları değiştirmez. Vazgeç değişiklikleri bırakır. Başlangıç listesini getir dört öneriyi taslağa geri getirir; ayrıca Kaydet gerekir. Boş liste geçerlidir. Uygulamanın kendisi kaldırılmaz. Yönetici erişimi her açılışta yeniden kontrol edilir. Bu tercihler tam Nuvio yedeğinin kişisel bölümü içindedir.

### Oda hızlı kontrolünde komut geri bildirimi (2.23.3)
Yeni güç komutu eski mesajı temizler; cihaz adı ve aç/kapat hedefiyle gönderiliyor, gönderildi veya gönderilemedi gösterilir. Başarı mesajı 3,5 saniye, hata 6 saniye sonra kalkar. Yeni komut eski zamanlayıcıyı iptal eder; pencere kapandığında zamanlayıcı temizlenir. Gönderildi hizmet isteğinin kabulüdür; cihazın fiziksel durumunun doğrulanması değildir. Satırdaki durum HA verisini izler.


### Mobil uygulama açılışı ve sürüm kontrolü (2.23.4–2.23.5)
Sürüm uyarısı, önbellekte eski olabilen nuvio.js yükleyicisi yerine aynı paket yolundaki nuvio-version.json manifestini okur. Daha düşük sürüm için yeniden yükleme önermez. Yeni çekirdek veya daha yeni sürüm için öneri korunur. Menü ve düzenleyici aynı HGVersion yardımcısını kullanır.

Android/iOS, dar dokunmatik ekranlar ve HA Companion dış oturumunda uygulamalar ikinci bir Home Assistant iframe'i yerine mevcut oturumda H.navigate ile açılır. Bu pushState + location-changed üzerinden doğal HA sayfa geçişidir; window.open/location.href/reload kullanılmaz. Geri ile panele dönülür. Masaüstü gömülü pencereyi korur. Yetki ve kayıtlı panel kontrolleri her iki yolda da uygulanır. Mobilde açılan yerel panelin kendi menüsü HA tarafından yönetilir; masaüstü iframe menüsü gizleme sadece masaüstünde geçerlidir. Bir eklentinin kendi yüklenme veya oturum sorunu ayrı olabilir; fiziksel telefon testi beklenir.
