# Türkçe Nuvio geliştirmesi

Bu fork, Nuvio arayüzünü Türkçe kullanmak ve tablet düzenini geliştirmek için tutulur. Ana proje ve MIT lisans bildirimleri korunur.

## Türkçe desteği

`src/locales/tr.json` kaynak kataloğudur. İngilizce katalogla aynı anahtarları kullanır; derleme dil seçeneğini ve indeksli dil dosyasını otomatik üretir. Türkçe metinlerde makine yardımı kullanılmış, temel gezinme ve kontrol etiketleri elle gözden geçirilmiştir. Dil kapsamı denetimi dilbilimsel incelemenin yerini tutmaz.

## Windows üzerinde geliştirme

Node.js, Python 3 ve `npm.cmd ci` gerekir. PowerShell oturumunda:

```powershell
$env:PYTHONUTF8='1'
$env:PYTHON='C:/Python/python.exe' # Kendi Python 3 yolunu yaz.
& $env:PYTHON tools/build.py
& $env:PYTHON tools/guard.py
node --test "tests/js/**/*.test.mjs"
& $env:PYTHON -m unittest discover -s tests/py
```

Derleme Windows üzerinde npm kabuk betiği yerine Node ile esbuild giriş noktasını çalıştırır. JavaScript yükleyici testleri `PYTHON` değişkenini destekler.

## Geliştirme sırası

### Görünür kişiler

Görünüm ayarlarında **Başlık ve gezinme / Görünür kişiler** bölümünden kişi anahtarlarını kapatıp başlık ayarlarını kaydet. Dil çevirisine göre bölüm adı farklı görünebilir. Seçim ev halkı şeridine, aile/kişi listelerine, otomatik Aile sayfasına, otomatik haritadaki kişi listesine ve duvar ekranının aile bölümüne uygulanır. Tüm kişiler gizlenebilir; yeni kişiler varsayılan olarak görünür.

Bu bir görünüm tercihidir. Home Assistant hesaplarını, oturum açmış kullanıcının profilini veya erişim izinlerini değiştirmez. Açıkça eklenmiş bağımsız kişi kartları, cihaz takipçileri ve Home Assistant'ın diğer panoları için erişim sınırı sağlamaz. Tercih mevcut Nuvio düzeninin ortak veya kişisel kayıt kapsamını kullanır; dışa/içe aktarmayla taşınır. Kişisel düzen isteyen kullanıcı önce Nuvio'nun kendi düzen seçeneğini kullanmalıdır.

Samsung Galaxy Tab A9+ için yatay ana ekran ızgarası eklendi. İki kompakt termostat, hava durumu ve alt kişi şeridi ayrı alanlarda durur. Kullanılabilir yüksekliğe Home Assistant üst başlığı dahil edilmez. Dokunmatik kontroller en az 44 piksel hedef alanı kullanır. Stratejide tablet_home: false bu yerleşimi kapatır; dikey ve telefon görünümleri mevcut akışı kullanır. Çok sayıda özel kart eklenirse içerik güvenle kaydırılabilir, kontroller kırpılarak saklanmaz. Fiziksel tablet geri bildirimi ayrıca gereklidir. Sonraki çalışma etkileşimli ev planıdır.

Canlı Home Assistant adresleri, kimlik bilgileri ve kişisel cihaz kimlikleri bu depoya eklenmez. Üretilen dosyalar önce test panelinde doğrulanır.

### Tek gezinme menüsü

Otomatik sayfalar masaüstü/tablette yalnız üst menüyü kullanır; tüm sayfa bağlantıları burada bulunur ve dar alanda yatay kaydırılabilir. Telefonda alt menü korunur. Home Assistant dış menüleri kurulu Kiosk Mode ile panel bazında gizlenebilir. Yönetici profil menüsünden kiosk modunu kapatabilir; kurtarma için panel adresine ?disable_km eklenebilir.
