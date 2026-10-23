# Polat fork güncellemeleri

Bu depo, [orijinal Nuvio](https://github.com/kczepiec/nuvio) üzerine Türkçe ve kişisel kullanım geliştirmelerini ekler. Kurulum kaynağı **ismailpolatt/nuvio**, ana dal **main** olmalıdır. İlk birleşim: upstream v2.22.3.

Fork sürümleri `X.Y.Z` biçimindedir. Güncel fork sürümü **2.23.6**, orijinal tabanı **2.22.3**’tür. GitHub etiketi `v2.23.6`, paket ve ekranda `2.23.6` kullanılır. Önceden yayımlanan etiketin içeriği değiştirilmez; düzeltmede yama numarası artırılır. Önbellek için kullanılan dahili derleme özeti kullanıcıya sürüm numarası olarak gösterilmez. Gelecek aday birleştirilirken paket sürümü mevcut fork sürümünden ileri olmalı; daha düşük upstream sürümüne geçilmez.

## HACS geçişi

HACS özel depolarına `https://github.com/ismailpolatt/nuvio` adresini Dashboard türünde ekle ve bu depodan indir. Orijinal ve fork aynı `www/community/nuvio` hedefini kullanır; ikisini birlikte güncelleme. Orijinal kaydı kaldırmak bu klasörü de kaldırabilir. Böyle bir durumda fork'u yeniden indir; dashboard veya Home Assistant tercihlerini silme.

Kaynak değişimi tamamlanınca HACS'taki depo bağlantısının ismailpolatt/nuvio olduğunu doğrula. Güncel sürümü görmüyorsan depo bilgilerini yenile, ardından yeniden indir. Eski fork etiketi veya orijinalden kalan v2.19.0 etiketi seçilmemeli.

## Gelecek upstream sürümleri

`Upstream update candidate` GitHub Actions akışı her gün yeni kararlı orijinal sürümü kontrol eder; Actions sayfasından elle de çalıştırılabilir. Yeni sürüm zaten main geçmişindeyse hiçbir şey yapmaz. Beta sürümler yerine en son kararlı release esas alınır.

Yeni sürümü ayrı adayda birleştirir. Yalnız üretilen `dist/` çakışmaları upstream dosyaları alınarak yeniden derlenir. Kaynak dosyasında çakışma varsa bir tarafı zorla seçmez; akış hata özetiyle durur ve main değişmez. Test, derleme ve Türkçe kapsamı geçmeyen aday yayımlanmaz. Geçen aday `automation/upstream-vX.Y.Z` dalına ve inceleme talebine dönüşür. Main'e otomatik birleştirme, sürüm yayımlama veya Home Assistant'a otomatik dağıtım yapılmaz.

Kaynak/test çalıştıran hazırlık işinin yazma yetkisi yoktur ve Home Assistant sırrı kullanılmaz. Adayı yazan ayrı iş yalnız dalı ve inceleme talebini oluşturur; aday kaynak kodunu çalıştırmaz. GitHub Actions kapatılırsa veya depo izinleri PR oluşturmayı engellerse otomasyon çalışmaz; Actions çıktısı incelenmelidir.

## Korunan özelleştirmeler

Türkçe katalog, tek üst menü, kişi gizleme, ana sayfa sırası/genişliği, A9+ düzeni, ev modları, enerji bütçesi, bakım/pil, konfor, yerel yön profilleri ve sonuç günlüğü regresyonlarla korunur. Mevcut normal kart grubu anahtarlarını ve kişisel tercihleri bozmamak için fork'un sade kartlar için `_tiles` gruplaması korunur; yeni upstream bağımsız basit kart ayrımı bu fork'ta aynı biçimde uygulanmaz. Bileşen kartlarının upstream düzeltmeleri alınır.

Hiçbir otomatik birleşim bütün gelecek değişikliklerin sorunsuz olacağını garanti etmez. Kaynak çakışması ve veri şeması değişiklikleri elle incelenmeli; fiziksel tablet testi yapılmalıdır.

## Veri ve yedekleme

HACS JavaScript/asset dosyalarını kurar. Ortak düzen, kişisel kullanıcı verileri ve tarayıcıdaki tablet profili ayrı tutulur. Dosya güncellemesi bunları normalde silmez; uyumsuz kod ise veriler dururken özellikleri gösteremeyebilir. Güncellemeden önce Home Assistant yedeği ve **Kontrol → Tam Nuvio yedeği** alınmalıdır. Bu yeni yedek kişisel kontrol/journal alanlarını ve mevcut tarayıcının tablet profilini de kapsar. Eski Ayarlar → Yedekleme düzen dışa aktarımı yalnız önceki kapsamını korur. Görsel dosyalarının kendisi ve HA sistem verileri tam Nuvio JSON'una dahil değildir. Ayrıntılar: [Panel araçları](panel-suite-tr.md). Depoya token, parola, kişisel kullanıcı verisi veya canlı Home Assistant yedeği yüklenmez.
