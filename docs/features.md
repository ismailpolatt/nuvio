**English** · [Polski](pl/features.md) · [Français](fr/features.md)

# Features guide

How the shared dashboard, wall tablet mode and layout backup work. Back to the [README](../README.md).

## Shared dashboard

Everyone sees the same Nuvio dashboard by default: the layout, appearance, views, rooms and wall tablet settings an administrator sets up.

- **Who edits**: administrators edit the shared dashboard (edit mode). Other people see it without the edit button.
- **Own layout**: in **Settings → Users** (edit mode, admins only) every Home Assistant user has a switch. Turn a person off and they get their own layout: it starts as a copy of the shared one, the edit button appears for them, and their changes affect only them. Turn them back on to return them to the shared dashboard. Your own account stays on the shared dashboard.
- **Who sees a view**: in **Settings → Views** each view (except Home) has a people button. Every view is visible to everyone by default; turn a person off to hide the view from them, including from their own layout. Their screen reloads on its own to drop the view.
- **Live**: changes to the shared dashboard and to the list reach open screens without a reload.
- **Storage**: the shared layout lives in a hidden storage dashboard `nuvio-shared` (*Nuvio (shared layout)*, named in the language of the admin who created it, admins only, not in the sidebar). Only admins can write it; do not edit it by hand. Own layouts stay in Home Assistant user data (`frontend/set_user_data`, key `nuvio_layout`), with a local copy per user. Assist settings are always personal.
- **Upgrading from 1.3.x**: the first time an admin opens Nuvio 1.4.0, their current layout becomes the shared dashboard. Until then everyone keeps their own layout as before.

## Wall tablet mode

A screensaver for a tablet on the wall. It is **off by default**; admins turn it on in **Appearance → Wall tablet mode** (edit mode) and press **Done** to save.

- **Start after inactivity**: 30 s, 1, 2, 5, 10 or 30 min without touch, mouse or keyboard input (default 2 min).
- **Dimming**: 0 to 90 %, how dark the screen gets under the clock (default 50 %).
- **Photo**: your dashboard background, a slideshow of the bundled backgrounds (crossfade every 45 s) or your own image URL (`https://…` or `/local/…`).
- **Motion sensor**: pick any `binary_sensor`; motion, occupancy and presence sensors are listed first. When it turns `on` while the screensaver is showing, the screen wakes. Without a sensor, only touch wakes it.
- **Wake**: touch, key press or scroll. The first touch only wakes the screen and does not press the tile underneath.
- **Screensaver style**: *Clock on photo* (described below) or *Board*: a light or dark board with a large weekday or clock and the date, sunrise and sunset, a countdown to the next all-day event, weather with forecast, upcoming events, now playing, a photo and room temperatures. In Board mode you choose the theme (auto by the sun, light, dark), the heading, which elements are shown, the order of the cards, the weather entity and which calendars and rooms are used.
- More styles (2.16.0), each with a preview tile in the gallery: *Analog clock* (frosted glass face over the photo, accent second hand, date, weather), *Flip clock* (two flip cards for hours and minutes), *Aurora* (thin clock over slowly flowing light in the accent colour) and *Night* (dim warm clock on black for bedrooms and OLED screens, moves further every minute). The weather comes from the weather entity chosen for Board, or the first one available.
- **Preview screensaver** shows it immediately; touch to close.
- Layout: a large clock in the centre (no panel behind it), the date fixed at the bottom left and, if Home Assistant has a `weather` entity, the current weather (icon, temperature, condition) at the top right. The clock follows your HA time format (12 / 24 h) and language, moves slightly every minute to protect OLED panels, asks the browser to keep the screen on while showing (Screen Wake Lock) and respects reduced motion.
- It only starts on the Nuvio dashboard (not in edit mode, not in a background tab) and is drawn above Home Assistant dialogs.
- **PIN lock (BETA)**: turn on *PIN lock*, set a PIN of 4 to 8 digits and choose when the screensaver locks (at once, after 1, 5, 15 or 30 min). A locked screensaver does not wake on touch or motion: touching it blurs the photo and shows a round glass PIN pad with the PIN dots above it and a **Lock** button below it, which returns to the screensaver. After 5 wrong PINs the pad waits 30 s (longer after more attempts), and it closes by itself after 20 s without a touch. **Lock screen** in the user menu locks right away, and a reload of the page stays locked. Only a hash of the PIN is stored. The lock keeps the tablet from casual use and does not replace the Home Assistant password.
- Settings are part of the layout: on the shared dashboard they apply to everyone, and a person with their own layout has their own. See [Shared dashboard](#shared-dashboard).
- **Screensaver on this device** (2.21.0): the settings are shared, but whether the screensaver runs is chosen per device and saved in that browser only. Turning the screensaver on turns it on for the device you are using; on a phone or a computer, turn **Screensaver on this device** off and the wall tablet keeps it. A device that never chose stays off, except a tablet that was locked with the PIN before the update.
- **PIN lock for views (BETA, 2.21.0)**: pick views (for example Cameras) that ask for the PIN before they show anything. It uses the PIN of *PIN lock*, so set that first. After the right PIN the view stays open for 5 minutes in that browser tab, until the screensaver starts or someone uses **Lock screen**: then every unlocked view closes and the view on screen asks for the PIN again after waking; **Back** returns to the previous view. This is a convenience lock against casual use, not security: anyone with a Home Assistant account can see the same data in another dashboard.

## Dashboard style

**Settings > Appearance > Dashboard style** (2.16.0) has eight ready-made looks, each shown as a small thumbnail of the dashboard: Nuvio (default), Frost, Midnight, Sunset, Forest, Ocean, Pastel and Graphite. A style sets the accent, the background, the dimming and the glass (tint of cards, tiles and panel, blur strength and, for Pastel and Graphite, the corner radius). The accent and background can be changed afterwards. With *Glass blur* off, the dense readable fill is kept. The choice is saved with the layout (`app.look`), so it is part of the backup.

**Settings > Appearance > Panel background** (2.21.0) turns off the shared glass panel behind the cards. Off, the cards sit right on the wallpaper, each with its own glass, without the common frame (the same as `panel_backdrop: false` in the page config). **This view** overrides the choice for the view you are on: *As everywhere*, on or off.

## Performance

Older tablets drain their battery fast when every glass surface is blurred and decorative animations keep running. **Settings > Appearance > Performance** has two options, saved on this device only, so a wall tablet and a desktop can differ:

- **Glass blur**: *Full* (desktop default), *Light* (touch default: weaker blur, no heavy shadows), *Off* (no blur at all; glass gets a denser fill and dialogs are opaque). *Auto* picks one of these and shows which.
- **Power saving**: stops looping animations (screensaver photo zoom, spinning fans, pulsing rings, the washing machine drum and similar) and refreshes camera snapshots at most every 30 s. *Auto* turns it on for iPads and iPhones on iOS or iPadOS older than 18 and for very weak hardware; blur on *Auto* is then off as well.

Independent of these options, animations in cards scrolled off screen pause, and *Reduce transparency* in the system settings turns blur off on *Auto*.

## Layout backup

Admins can export and import the whole Nuvio layout from **Appearance → Layout backup** (edit mode).

- **Export** downloads `nuvio-uklad-YYYY-MM-DD.json`; **Copy to clipboard** copies the same JSON. Choose what to include: views and custom views; layout, widgets with their entities, titles, section widths and hidden items; appearance (accent, background, dimming); view panel widths; wall tablet mode settings.
- **Import** accepts a file (picker or drag and drop) or pasted JSON. The file is validated and a summary shows the number of views, widgets, sections and entities, with entities missing on this instance highlighted. Pick the parts to import and **Replace** or **Merge**.
- Before importing, the current layout is kept as a backup; **Restore previous** in the notification (or in the Layout backup section) undoes the import with one click.
- The file is versioned (`format`, `schema`, `nuvio`, `exported`). Older raw layout data is converted automatically; files from a newer schema or damaged files are rejected with a clear message.
