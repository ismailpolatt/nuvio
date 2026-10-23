**English** · [Polski](pl/configuration.md) · [Français](fr/configuration.md)

# Configuration

Optional settings for Nuvio. Back to the [README](../README.md).

Optional strategy options:

```yaml
strategy:
  type: custom:nuvio
  language: en        # any available language code (en, pl, fr …): dashboard default (a personal choice in Settings still wins)
```

## Settings layout

Open **Settings** from the edit mode or the user menu. The settings window has a sidebar with grouped pages:

- **General**: General (language, performance)
- **Appearance**: Theme (dashboard style, panel backdrop, accent), Background (background, dimming, gallery), Header (header and navigation)
- **Dashboard**: Views and navigation (views, view settings), Rooms and climate
- **Wall tablet**: Screensaver, PIN and locks (screensaver PIN lock and view PIN lock)
- **System**: Assist, Users, Integrations, Backup and import, About Nuvio

Type in the search box at the top of the sidebar to show every matching setting from all pages; each page shows how many matches it has. Press Escape to clear the search. In the sidebar, use the arrow keys, Home and End to move between pages. On a phone the sidebar is a list: tap a page to open it and use the back arrow to return. Activity detection for each climate device in **Rooms and climate** is folded under an advanced block that opens by itself when a custom source is set. Changes made in edit mode are a draft: nothing is saved and the dashboard is not reloaded until you tap **Done**, which saves once and reloads at most once. **Cancel** discards the draft. All settings keep their stored keys, so existing configurations work unchanged.

## Language

Nuvio is available in several languages: English, Polish and French today, and any language added as a catalog (see below). Each person picks their language in **Settings → Appearance → Language** (*Automatic*, then one button per available language) or with the language item in the user menu, which everyone can use, including people without access to settings. The whole dashboard switches at once without reloading the page: navigation, cards, settings, edit mode, toasts, numbers and dates. The choice is stored on this device and in your Home Assistant account, so it follows you to other devices.

Which language is used, first match wins:

1. Your own choice in Settings or the user menu.
2. The `language:` strategy option (dashboard default set in YAML). It accepts any language code that Nuvio has (`en`, `pl`, `fr` …); a regional code such as `fr-CA` falls back to `fr`.
3. The language you picked in the first-run wizard. Only a language you actually tapped counts: a language that older versions saved automatically (often English when the browser was neither Polish nor English) is ignored, so the browser decides.
4. Your browser languages, in order of preference: the full code first (`pt-br`), then the language alone (`pt`). If none of them is available, English.

Texts that are not translated in the chosen language are shown in English.

### Adding a language

A language is one JSON file. No code change is needed.

1. Create `src/locales/<code>.json`, where `<code>` is the lowercase language code (`de`, `pt-br` …); the check and the build refuse any other file name. The easiest start is a copy of `src/locales/en.json`, the reference catalog.
2. Fill in its `_meta` block:

   ```json
   "_meta": {
     "name": "Deutsch",
     "locale": "de-DE",
     "flag": "🇩🇪",
     "intro": "Oberfläche auf Deutsch"
   }
   ```

   `name` (the language name in that language, shown in the language pickers) and `locale` (used for dates, numbers and plural rules) are required. `flag` and `intro` are optional: the first-run wizard shows them on the language step (a globe and the name otherwise).
3. Translate the values. Keep the keys, the `{variables}` and the plural suffixes as they are, and give every plural form your language needs (see [Development](development.md#translations)). A key you leave out is shown in English. Write plain text: no HTML tags, and outside English no straight double quote `"` (use your language's typographic quotes); the check refuses them because catalog text is inserted into the page as HTML.
4. Check the catalog: `python3 tools/i18n_check.py --lang <code>` lists the missing and obsolete keys, and `python3 tools/i18n_check.py` checks variables, plural forms and `_meta`.
5. Build with `python3 tools/build.py`. The catalog is compiled to `dist/nuvio-locale-<code>.<hash>.json` and the language is added to the manifest embedded in the bundle: it appears in Settings, in the user menu and in the wizard, and `language: <code>` and browser detection accept it.

English, Polish and French must stay complete (`REQUIRED` in `tools/i18n_check.py`); another language may be partial, and the check then only warns with its coverage.

> [!TIP]
> To take over a generated dashboard as plain YAML, use *Take control* in the dashboard editor. All `custom:nuvio-*` cards keep working.

## Presets

Configuration (layout + appearance) can be exported/imported as JSON. Personal presets live outside the repository.


## Clock, tab badges and hidden sidebar

- **Clock in the header.** Put `{time}` or `{date}` in a view title or subtitle (view header editor, or **Add a clock**). The time follows the 12 or 24 hour setting of your Home Assistant profile and refreshes every minute.
- **Tab badges.** In **Settings > Views**, the **Badge** column picks what to count for each view: lights, switches, fans, climate or people that are on, media that is playing, or **Selected entities** (comma separated ids). The number shows on the top tab only when it is above 0. Stored as `wiz.vx.<view>.badge` = `{ m: on | active, d: <domain> }` or `{ m: on, e: [<entity ids>] }`.
- **Hide the sidebar.** Switch on **Hide the sidebar** in **Settings > Views**: the sidebar and its Settings button disappear on computers and tablets whatever the per-view **Sidebar** switches say (the phone bar stays). Views that are not in the top tabs move to the profile menu. To get back to settings use the profile menu, the pencil, or open any Nuvio view with `?nuvio_settings` at the end of the address. It opens settings only for people who may edit and never on a view locked with a PIN. This is the Nuvio sidebar; the Home Assistant sidebar is hidden with Kiosk Mode (**Integrations**).
