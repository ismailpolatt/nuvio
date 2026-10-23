[English](../configuration.md) · **Polski** · [Français](../fr/configuration.md)

# Konfiguracja

Opcjonalne ustawienia Nuvio. Wróć do [README](../../README.pl.md).

Opcjonalne ustawienia strategii:

```yaml
strategy:
  type: custom:nuvio
  language: pl        # dowolny dostępny kod języka (en, pl, fr …): domyślny język pulpitu (osobisty wybór w Ustawieniach i tak wygrywa)
```

## Układ ustawień

**Ustawienia** otworzysz z trybu edycji albo z menu użytkownika. Okno ustawień ma pasek boczny ze stronami w grupach:

- **Ogólne**: Ogólne (język, wydajność)
- **Wygląd**: Motyw (styl pulpitu, tło paneli, akcent), Tło (tło, przyciemnienie, galeria), Nagłówek (nagłówek i nawigacja)
- **Pulpit**: Widoki i nawigacja (widoki, ustawienia widoków), Pokoje i klimat
- **Tablet ścienny**: Wygaszacz, PIN i blokady (blokada wygaszacza PIN-em i blokada widoków PIN-em)
- **System**: Assist, Użytkownicy, Integracje, Kopia i import, O Nuvio

Wpisz tekst w polu wyszukiwania na górze paska bocznego, aby zobaczyć wszystkie pasujące ustawienia ze wszystkich stron; każda strona pokazuje liczbę trafień. Escape czyści wyszukiwanie. Na pasku bocznym strzałki, Home i End przenoszą między stronami. Na telefonie pasek boczny jest listą: stuknij stronę, aby ją otworzyć, a strzałką wstecz wróć do listy. Wykrywanie pracy każdego urządzenia klimatu w **Pokoje i klimat** jest zwinięte w bloku zaawansowanym, który otwiera się sam, gdy ustawiono własne źródło. Zmiany w trybie edycji są szkicem: nic się nie zapisuje i pulpit się nie przeładowuje, dopóki nie stukniesz **Gotowe**; wtedy zapis jest jeden, a przeładowanie najwyżej jedno. **Anuluj** odrzuca szkic. Wszystkie ustawienia zachowują zapisane klucze, więc obecne konfiguracje działają bez zmian.

## Język

Nuvio jest dostępne w kilku językach: dziś po angielsku, po polsku i po francusku, a także w każdym języku dodanym jako katalog (zobacz niżej). Każdy wybiera swój język w **Ustawienia → Wygląd → Język** (*Automatycznie*, a potem po jednym przycisku na każdy dostępny język) albo pozycją języka w menu użytkownika, dostępną dla wszystkich, także bez dostępu do ustawień. Cały pulpit zmienia się od razu, bez przeładowania strony: nawigacja, karty, ustawienia, tryb edycji, komunikaty, liczby i daty. Wybór zapisuje się na tym urządzeniu i na Twoim koncie Home Assistant, więc działa też na innych urządzeniach.

Który język jest używany (wygrywa pierwszy pasujący):

1. Twój wybór w Ustawieniach albo w menu użytkownika.
2. Opcja strategii `language:` (domyślny język pulpitu w YAML). Przyjmuje każdy kod języka, który ma Nuvio (`en`, `pl`, `fr` …); kod regionalny, np. `fr-CA`, oznacza `fr`.
3. Język wybrany w kreatorze pierwszego uruchomienia. Liczy się tylko język, który faktycznie kliknięto: język zapisany automatycznie przez starsze wersje (często angielski, gdy przeglądarka nie była ani polska, ani angielska) jest pomijany i decyduje przeglądarka.
4. Języki przeglądarki w kolejności preferencji: najpierw pełny kod (`pt-br`), potem sam język (`pt`). Jeśli żaden nie jest dostępny, angielski.

Teksty, których brakuje w wybranym języku, wyświetlają się po angielsku.

### Nowy język

Język to jeden plik JSON. Nie trzeba zmieniać kodu.

1. Utwórz `src/locales/<kod>.json`, gdzie `<kod>` to kod języka małymi literami (`de`, `pt-br` …); kontrola i budowanie odrzucają każdą inną nazwę pliku. Najprościej zacząć od kopii `src/locales/en.json`, katalogu wzorcowego.
2. Uzupełnij blok `_meta`:

   ```json
   "_meta": {
     "name": "Deutsch",
     "locale": "de-DE",
     "flag": "🇩🇪",
     "intro": "Oberfläche auf Deutsch"
   }
   ```

   `name` (nazwa języka w tym języku, widoczna przy wyborze języka) i `locale` (daty, liczby i reguły liczby mnogiej) są wymagane. `flag` i `intro` są opcjonalne: kreator pierwszego uruchomienia pokazuje je na kroku wyboru języka (w przeciwnym razie globus i nazwę).
3. Przetłumacz wartości. Zostaw bez zmian klucze, `{zmienne}` i przyrostki liczby mnogiej, i podaj wszystkie formy liczby mnogiej, których potrzebuje Twój język (zobacz [Rozwój](development.md#tłumaczenia)). Brakujący klucz wyświetla się po angielsku. Pisz zwykły tekst: bez znaczników HTML, a poza angielskim bez prostego cudzysłowu `"` (użyj cudzysłowów typograficznych swojego języka); kontrola je odrzuca, bo tekst katalogu trafia na stronę jako HTML.
4. Sprawdź katalog: `python3 tools/i18n_check.py --lang <kod>` wypisuje brakujące i przestarzałe klucze, a `python3 tools/i18n_check.py` sprawdza zmienne, formy liczby mnogiej i `_meta`.
5. Zbuduj: `python3 tools/build.py`. Katalog trafia do `dist/nuvio-locale-<kod>.<hash>.json`, a język do manifestu wbudowanego w bundle: pojawia się w Ustawieniach, w menu użytkownika i w kreatorze, a `language: <kod>` i wykrywanie języka przeglądarki go rozpoznają.

Angielski, polski i francuski muszą być kompletne (`REQUIRED` w `tools/i18n_check.py`); inny język może być niepełny, a kontrola tylko ostrzega i podaje jego pokrycie.

> [!TIP]
> Aby przejąć wygenerowany pulpit jako zwykły YAML, użyj *Przejmij kontrolę* w edytorze pulpitu. Wszystkie karty `custom:nuvio-*` dalej działają.

## Presety

Konfigurację (układ + wygląd) można eksportować i importować jako JSON. Osobiste presety są przechowywane poza repozytorium.


## Zegar, liczniki na zakładkach i ukryty pasek boczny

- **Zegar w nagłówku.** Wpisz `{time}` lub `{date}` w tytule albo podtytule widoku (edytor nagłówka albo **Dodaj zegar**). Godzina ma format 12 lub 24 h z profilu Home Assistant i odświeża się co minutę.
- **Liczniki na zakładkach.** W **Ustawienia > Widoki** kolumna **Licznik** wybiera, co liczyć dla widoku: włączone światła, przełączniki, wentylatory, klimatyzację, osoby w domu, odtwarzane media albo **Wybrane encje** (id rozdzielone przecinkami). Liczba pojawia się na zakładce u góry tylko, gdy jest większa od 0. Zapis: `wiz.vx.<widok>.badge` = `{ m: on | active, d: <domena> }` albo `{ m: on, e: [<encje>] }`.
- **Ukryj pasek boczny.** Włącz **Ukryj pasek boczny** w **Ustawienia > Widoki**: pasek boczny razem z przyciskiem Ustawienia znika na komputerze i tablecie bez względu na przełączniki **Pasek boczny** przy widokach (pasek telefonu zostaje). Widoki spoza zakładek u góry trafiają do menu profilu. Do ustawień wrócisz przez menu profilu, ołówek albo dopisując `?nuvio_settings` do adresu dowolnego widoku Nuvio. Otwiera to ustawienia tylko osobom z prawem edycji i nigdy na widoku zablokowanym PIN-em. To pasek Nuvio; pasek boczny Home Assistant ukrywa Kiosk Mode (**Integracje**).
