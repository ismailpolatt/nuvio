**English** · [Polski](pl/installation.md) · [Français](fr/installation.md)

# Installation

Nuvio needs Home Assistant 2024.8.0 or newer. Back to the [README](../README.md).

## HACS (custom repository)

1. HACS → ⋮ → *Custom repositories* → `https://github.com/ismailpolatt/nuvio`, category **Dashboard**.
2. Install **Nuvio**. HACS adds the resource `/hacsfiles/nuvio/nuvio.js`.
3. Settings → Dashboards → *Add dashboard* → *New dashboard from scratch*, open it, ⋮ → *Edit* → ⋮ → *Raw configuration editor* and paste:

   ```yaml
   strategy:
     type: custom:nuvio
   ```

4. Open the dashboard. The wizard starts on first visit.

## Manual

1. Download the source archive of the latest release (GitHub, Releases, Source code) and copy the contents of its `dist/` folder (`nuvio.js` and the `nuvio-font-*`, `nuvio-bg-*`, `nuvio-meteo-*`, `nuvio-locale-*` files, all flat) to `/config/www/nuvio/`. Releases have no attached files.
2. Add the resource `/local/nuvio/nuvio.js` (type: **JavaScript module**).
3. Use the same `strategy` config as above.

## Recommended companion packages

Nuvio works on its own, but for the full-screen look from the screenshots these HACS packages help:

| Package | Why |
|---|---|
| [kiosk-mode](https://github.com/NemesisRE/kiosk-mode) | Hides the Home Assistant header and/or sidebar, so only the Nuvio dashboard is visible (wall tablets, phones). Nuvio's navigation is kiosk-mode aware. |
| [custom-sidebar](https://github.com/elchininet/custom-sidebar) | Hides or reorders Home Assistant sidebar items per user or device, if you prefer to keep the sidebar but trim it. |
| [browser_mod](https://github.com/thomasloven/hass-browser_mod) *(optional)* | Turns a browser into a controllable device (popups, per-device control). Nuvio handles its interaction overlay and skips browser_mod's own media players and sensors. |
