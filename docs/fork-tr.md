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

Türkçe kaynak kataloğu ve tekrarlanabilir derleme ilk adımdır. Sonraki çalışma Samsung Tab S9+ yatay ekranındaki kart hizaları, görünür termostatlar ve yoğunluğu ayarlanabilen yerleşimdir. Bu yerleşim değişiklikleri henüz uygulanmadı.

Canlı Home Assistant adresleri, kimlik bilgileri ve kişisel cihaz kimlikleri bu depoya eklenmez. Üretilen dosyalar önce test panelinde doğrulanır.
