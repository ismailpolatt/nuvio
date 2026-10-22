/* Home Glass – glassmorphism dashboard components for Home Assistant
 * Plik: /local/home-glass/home-glass.js   (generowany z www/*.part.js przez build.py)
 * Karty: hg-page, hg-energy-card, hg-ac-card, hg-light-card, hg-switch-card,
 *        hg-solar-card, hg-bars-card, hg-media-card, hg-person-card, hg-link-card
 */
const HG_VER = '1.0.0';
const HG_BUILD = '__HG_BUILD__';   /* build.py wstawia hash paczki = ?v= zasobu */
/* kontrola wersji: zasób Lovelace wskazuje nowszy ?v= niż wczytany kod (stara karta przeglądarki, kiosk, cache aplikacji)
   -> mały toast „Nowa wersja – odśwież”. Sprawdzane przy starcie i po powrocie do karty (najwyżej co 5 min). */
const HGVer = window.__hgVer || {
  t: 0, shown: false,
  async check(hass, force) {
    if (!hass || !hass.callWS || this.shown || window.__hgNoVer || HG_BUILD.startsWith('__') || (window.__hgLocal && !window.__hgVerTest)) return;   // testy lokalne: kod celowo nowszy niż zasób
    if (!force && Date.now() - this.t < 300000) return;
    this.t = Date.now();
    try {
      const res = await hass.callWS({ type: 'lovelace/resources' });
      const r = (res || []).find((x) => /home-glass\.js/.test(x.url || ''));
      const v = r && (/[?&]v=([^&]+)/.exec(r.url) || [])[1];
      if (v && v !== HG_BUILD) this.toast(v);
    } catch (e) { /* brak uprawnień admina do listy zasobów -> bez kontroli */ }
  },
  toast(v) {
    if (this.shown || document.getElementById('hg-ver-toast')) return;
    this.shown = true;
    const d = document.createElement('div'); d.id = 'hg-ver-toast'; d.setAttribute('role', 'status');
    const dark = document.documentElement.getAttribute('data-hg-scheme') === 'dark';
    d.style.cssText = `position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:100000;display:flex;align-items:center;gap:12px;
      padding:8px 8px 8px 16px;border-radius:24px;font:400 14px/1.2 'HG DM Sans',system-ui,sans-serif;box-shadow:var(--hg-sh);
      -webkit-backdrop-filter:var(--hg-bfo, blur(20px) saturate(140%));backdrop-filter:var(--hg-bfo, blur(20px) saturate(140%));
      background:${dark ? 'rgba(40,40,44,.88)' : 'rgba(255,255,255,.9)'};color:${dark ? '#fff' : '#1C1C1E'};border:1px solid ${dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.7)'}`;
    d.innerHTML = `<span>${hgT('core.version_toast.text')}</span><button type="button" data-r style="font:inherit;font-weight:600;border:0;border-radius:16px;padding:0 16px;height:40px;cursor:pointer;background:${dark ? '#fff' : '#1C1C1E'};color:${dark ? '#1C1C1E' : '#fff'}">${hgT('core.version_toast.reload')}</button><button type="button" data-x aria-label="${hgT('common.close')}" style="border:0;background:none;color:inherit;opacity:.6;cursor:pointer;padding:6px;display:flex"><ha-icon icon="mdi:close" style="--mdc-icon-size:18px;width:18px;height:18px;pointer-events:none"></ha-icon></button>`;
    d.querySelector('[data-r]').onclick = () => location.reload();
    d.querySelector('[data-x]').onclick = () => d.remove();
    document.body.appendChild(d);
    console.info('home-glass: wczytany', HG_BUILD, 'zasób', v);
  },
};
window.__hgVer = HGVer;
(function hgFonts() {
  if (document.getElementById('hg-fonts')) return;
  const s = document.createElement('style');
  s.id = 'hg-fonts';
  const b = HG_ASSET + 'nuvio-font-';
  s.textContent = `
@font-face{font-family:'HG DM Sans';font-style:normal;font-weight:100 700;font-display:swap;src:url(${b}dmsans-latin-ext.woff2) format('woff2')${typeof hgCdn === 'function' && hgCdn(b + 'dmsans-latin-ext.woff2') ? `, url(${hgCdn(b + 'dmsans-latin-ext.woff2')}) format('woff2')` : ''};unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF;}
@font-face{font-family:'HG DM Sans';font-style:normal;font-weight:100 700;font-display:swap;src:url(${b}dmsans-latin.woff2) format('woff2')${typeof hgCdn === 'function' && hgCdn(b + 'dmsans-latin.woff2') ? `, url(${hgCdn(b + 'dmsans-latin.woff2')}) format('woff2')` : ''};unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}`;
  document.head.appendChild(s);
})();

/* surowy stan HA -> segment klucza states.* (małe litery, spacje i myślniki jako _) */
const hgStN = (v) => String(v).trim().toLowerCase().replace(/[\s-]+/g, '_');
/* "12u" -> calc(var(--k) * 12): jednostka skalowana względem referencji (912x597) */
const U = (css) => css.replace(/(-?\d+(?:\.\d+)?)u\b/g, (m, n) => `calc(var(--k) * ${n})`);

/* ukryta karta przeglądarki: wstrzymaj animacje ciągłe (zmienna dziedziczona przez wszystkie shadow DOM) */
(function hgPlay() {
  const f = () => document.documentElement.style.setProperty('--hg-play', document.hidden ? 'paused' : 'running');
  document.addEventListener('visibilitychange', f); f();
})();

/* wydajność (osobno na każdym urządzeniu, localStorage): rozmycie szkła i oszczędzanie baterii.
   blur: '' = automatycznie | 'full' | 'light' | 'off'; eco: '' = automatycznie | '1' | '0'.
   Atrybuty na <html> (data-hg-blur, data-hg-eco) przełączają tokeny w motywie: --hg-bfo: none wyłącza każde backdrop-filter,
   --hg-loop: none zatrzymuje animacje w pętli (zmienne dziedziczą się przez shadow DOM). Stare nadpisanie home-glass:lite = 1/0 działa dalej jako light/full. */
const HGPerf = window.__hgPerf || (window.__hgPerf = {
  KB: 'home-glass:blur', KE: 'home-glass:eco', BLURS: ['full', 'light', 'off'],
  _g(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
  _s(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* tryb prywatny */ } },
  _mq(q) { return !!(window.matchMedia && matchMedia(q).matches); },
  blurSel() { const v = this._g(this.KB); if (this.BLURS.includes(v)) return v; const o = this._g('home-glass:lite'); return o === '1' ? 'light' : o === '0' ? 'full' : ''; },
  ecoSel() { const v = this._g(this.KE); return v === '1' || v === '0' ? v : ''; },
  /* stary iPad / iPhone (WebKit na dotyku z systemem starszym niż 18) albo bardzo słaby sprzęt */
  weak() {
    const ua = navigator.userAgent || '', touch = (navigator.maxTouchPoints || 0) > 1 || /iPad|iPhone|iPod/.test(ua);
    const m = /\bOS (\d+)_\d+[_\d]* like Mac OS X/.exec(ua) || (/Safari\//.test(ua) && !/Chrome|CriOS|Edg|Firefox|FxiOS/.test(ua) && /Version\/(\d+)/.exec(ua));
    const oldApple = touch && /AppleWebKit/.test(ua) && !/Android/.test(ua) && !!m && +m[1] < 18;
    return oldApple || (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;
  },
  eco() { const s = this.ecoSel(); return s ? s === '1' : this.weak(); },
  /* automatycznie: bez rozmycia przy oszczędzaniu baterii albo „Ogranicz przezroczystość”; lżejsze na dotyku i słabszym sprzęcie; pełne na komputerze */
  blur() {
    const s = this.blurSel(); if (s) return s;
    if (this.eco() || this._mq('(prefers-reduced-transparency: reduce)')) return 'off';
    return this._mq('(pointer: coarse)') || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 ? 'light' : 'full';
  },
  set(kind, v) { if (kind === 'blur') { this._s(this.KB, this.BLURS.includes(v) ? v : ''); this._s('home-glass:lite', ''); } else this._s(this.KE, v === '1' || v === '0' ? v : ''); this.apply(); },
  apply() {
    const d = document.documentElement, b = this.blur(), e = this.eco();
    if (d.getAttribute('data-hg-blur') !== b) d.setAttribute('data-hg-blur', b);
    d.toggleAttribute('data-hg-eco', e);
    window.dispatchEvent(new CustomEvent('hg-perf', { detail: { blur: b, eco: e } }));
  },
});
HGPerf.apply();
if (window.matchMedia && !window.__hgPerfMq) { window.__hgPerfMq = 1; try { matchMedia('(prefers-reduced-transparency: reduce)').addEventListener('change', () => HGPerf.apply()); } catch (e) { /* stary Safari: bez nasłuchu */ } }

/* język interfejsu kart: osobisty wybór (HGLang), opcja language strategii, wybór z kreatora, inaczej języki przeglądarki (domyślnie angielski).
   Język bez katalogu w pamięci: pierwsze użycie go pobiera, a gdy dotrze – hg-lang (karty poza strategią przerysowują się same, bez przeładowania).
   Teksty: hgT / hgTLazy / hgTO / hgTD (hg-i18n); HG_LOC() – locale do liczb i dat z manifestu */
const hgI18nWant = (l) => {
  if (l === 'en' || HGI18n.cache[l]) { HGI18n.code = l; return; }
  if (HGI18n.pend[l] || HGI18n.bad[l] || !HGI18n.has(l)) return;
  /* po mikrozadaniu: HGI18n.ready (strategia) na tej samej obietnicy ustawia kod pierwszy i sam powiadamia, gdy spóźniony */
  HGI18n.load(l).then((ok) => Promise.resolve().then(() => { if (ok && HGI18n.code !== l && hgCurLang() === l) { HGI18n.code = l; window.dispatchEvent(new CustomEvent('hg-lang')); } }));
};
/* język z kreatora liczy się tylko, gdy kliknięto go w kreatorze (wiz.lp); stare wiz.lang zapisywane zawsze (często 'en' przy przeglądarce bez pl/en) nie zasłania przeglądarki */
const hgWizLang = (w) => (w && w.lp && w.lang) || null;
const hgCurLang = () => { const w = window.__hgL && window.__hgL.data && window.__hgL.data.wiz, l = hgLang(window.__hgHass, HGLang.get() || window.__hgLangOpt || hgWizLang(w));
  if (l !== HGI18n.code) hgI18nWant(l); return l; };
const HG_LOC = () => HGI18n.locale(hgCurLang());
/* Kiosk Mode (HACS) wyłączony z menu użytkownika: ?disable_km działa tylko, gdy jest w adresie, więc do końca sesji karty dopinamy go do nawigacji */
const hgKmOff = (v) => { try { if (v === undefined) return sessionStorage.getItem('home-glass:km-off') === '1'; if (v) sessionStorage.setItem('home-glass:km-off', '1'); else sessionStorage.removeItem('home-glass:km-off'); } catch (e) { /* bez sessionStorage */ } return !!v; };
const hgKmPath = (p) => { if (!hgKmOff() || typeof p !== 'string' || !p.startsWith('/') || /[?&]disable_km\b/.test(p)) return p; const [a, hs] = p.split('#'); return a + (a.includes('?') ? '&' : '?') + 'disable_km' + (hs !== undefined ? '#' + hs : ''); };
const H = {
  st: (hass, e) => (hass && e ? hass.states[e] : undefined),
  ok: (s) => !!s && !['unavailable', 'unknown'].includes(s.state),
  num: (hass, e) => { const s = H.st(hass, e); const v = s ? parseFloat(s.state) : NaN; return isFinite(v) ? v : null; },
  esc: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  /* adres do CSS url('…') w atrybucie style: znaki zamykające url() / cudzysłów kodowane procentowo, potem escape HTML */
  cssUrl: (u) => H.esc(String(u ?? '').replace(/['"()\\\s]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))),
  fire: (node, type, detail) => node.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true })),
  navigate: (path) => {
    const nav = () => { history.pushState(null, '', hgKmPath(path)); window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } })); };
    return typeof HGNav !== 'undefined' ? HGNav.go(path, nav) : nav();
  },
  /* jedyne miejsce wywołań usług; window.__hgDryRun=true -> tylko zapis (testy bez przełączania urządzeń) */
  call: (hass, domain, service, data) => {
    if (window.__hgDryRun) { (window.__hgCalls = window.__hgCalls || []).push([domain, service, data]); return Promise.resolve(); }
    return hass.callService(domain, service, data);
  },
  /* wibracja: aplikacja HA (zdarzenie „haptic” na window, jak forwardHaptic we frontendzie HA), w przeglądarce navigator.vibrate */
  haptic: (t = 'selection') => {
    try { window.dispatchEvent(new CustomEvent('haptic', { detail: t })); } catch (e) { /* */ }
    const app = window.externalApp || (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.externalBus);
    if (!app && navigator.vibrate && matchMedia('(pointer: coarse)').matches) try { navigator.vibrate(t === 'selection' ? 6 : t === 'heavy' ? 30 : 14); } catch (e) { /* */ }
  },
  icon: (i, cls = '') => `<ha-icon class="${cls}" icon="${H.esc(i)}"></ha-icon>`,
  name: (hass, e, fb) => { const s = H.st(hass, e); return (s && s.attributes.friendly_name) || fb || e; },
  action(node, hass, a) {
    if (!a) return;
    if (window.__hgDryRun && !a.navigate && !a.back) { (window.__hgActions = window.__hgActions || []).push(a); }
    if (a.navigate) return H.navigate(a.navigate);
    if (a.url) return a.url.startsWith('/') ? H.navigate(a.url) : window.open(a.url, '_blank', 'noopener');
    if (a.more_info) return H.fire(node, 'hass-more-info', { entityId: a.more_info });
    if (a.notifications) return H.fire(node, 'hass-show-notifications');
    if (a.quickbar) {
      // HA czyta e.composedPath() -> zdarzenie klawiatury musi być w trakcie dispatchu
      const fwd = (ev) => window.dispatchEvent(new CustomEvent('hass-quick-bar-trigger', { detail: ev }));
      node.addEventListener('keydown', fwd, { once: true });
      node.dispatchEvent(new KeyboardEvent('keydown', { key: a.quickbar, bubbles: false, composed: false }));
      return;
    }
    if (a.back) return history.length > 1 ? history.back() : H.navigate(a.fallback || '/');
    if (a.service) { const [d, s] = a.service.split('.'); return H.call(hass, d, s, a.data || {}); }
  },
  sig: (hass, ents) => ents.map((e) => { const s = H.st(hass, e); return s ? e + s.state + JSON.stringify(s.attributes) : e + '-'; }).join('|'),
  fmt: (v, d = 1) => (v == null ? '–' : Number(v).toLocaleString(HG_LOC(), { maximumFractionDigits: d, minimumFractionDigits: 0 })),
  /* tekst składany z katalogu (typografia języka, np. spacja przed % lub : po francusku): procent i para etykieta–wartość */
  pct: (v) => hgT('common.percent', { value: v }),
  lv: (label, value) => hgT('common.label_value', { label, value }),
  get DAYS() { return [hgT('core.days.sun'), hgT('core.days.mon'), hgT('core.days.tue'), hgT('core.days.wed'), hgT('core.days.thu'), hgT('core.days.fri'), hgT('core.days.sat')]; },
  /* etykieta samodzielnego stanu (wielka litera): states.label.<stan>; poza tabelą EN pokazuje surowy stan ze spacjami, inne języki słownik states.* */
  stateLabel: (s) => hgTD('states.label.' + s) ?? (hgCurLang() === 'en' ? String(s).replace(/_/g, ' ') : hgTD('states.' + hgStN(s), s)),
  /* stan encji: tłumaczenia HA (formatEntityState / formatEntityAttributeValue), a gdy integracja ich nie ma – słownik states.* katalogu; małe litery do wstawiania w zdania */
  t: (h, so, attr) => {
    const en = hgCurLang() === 'en';
    if (!so) return hgT('common.state_unavailable');
    const raw = attr ? so.attributes[attr] : so.state;
    if (raw == null) return '';
    let r = String(raw); h = h || window.__hgHass;
    try { r = attr ? (h && h.formatEntityAttributeValue ? h.formatEntityAttributeValue(so, attr) : r) : (h && h.formatEntityState ? h.formatEntityState(so) : r); } catch (e) { /* starsze HA */ }
    if (en) return (r === String(raw) ? r.replace(/_/g, ' ') : r).replace(/^[A-Z][a-z]+$/, (x) => x.toLowerCase());   // EN: tłumaczenie HA, bez słownika PL
    if (!attr && so.entity_id && so.entity_id.startsWith('binary_sensor.') && (raw === 'on' || raw === 'off')) {
      if (r !== raw) return r.toLowerCase();                                    // tłumaczenie HA zależne od device_class
      const bm = hgTD('states.binary.' + so.attributes.device_class + '.' + raw); if (bm) return bm;   /* zapas wg device_class (katalog), gdy HA nie zwróci tłumaczenia */
    }
    const tr = hgTD('states.' + hgStN(raw)) || hgTD('states.' + hgStN(r));
    if (tr) return tr;
    return /^[A-Z][a-z]/.test(r) && !/\d/.test(r) && r === String(raw) ? r.toLowerCase() : r;
  },
  /* samodzielna wartość (kafel/wiersz): wielka litera na początku */
  T: (h, so, attr) => { const r = H.t(h, so, attr), on = hgTD('states.on'), off = hgTD('states.off');   /* wł. / wył. -> pełna etykieta (Włączone / Wyłączone) */
    return r && r !== on && r !== off ? r.charAt(0).toUpperCase() + r.slice(1) : r === on ? hgTD('states.label.on') : r === off ? hgTD('states.label.off') : r; },
  dayKey: (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
};
window.__hg = H;

/* zamrożenie przerysowań na czas animacji panelu (ukryj/pokaż) – po zwolnieniu zaległe karty odświeżają się raz */
const HG_FREEZE = window.__hgFreezeObj || (window.__hgFreezeObj = { on: false, q: new Set(),
  release() { this.on = false; clearTimeout(this._wd); this._wd = 0; const q = [...this.q]; this.q.clear(); for (const c of q) if (c.isConnected) { try { c._doUpdate(false); } catch (e) { /* jedna karta nie blokuje reszty */ } } },
  /* strażnik: zamrożenie poza trybem edycji trwa najwyżej 2 s (przerwana animacja, uśpiona aplikacja), potem karty same się odświeżają */
  guard() { if (this._wd) return; this._wd = setTimeout(() => { this._wd = 0; if (!this.on) return; if (typeof HGL !== 'undefined' && HGL.editing) return this.guard(); this.release(); }, 2000); } });
/* przekazanie hass jednej karcie: błąd w jednej karcie nie może zatrzymać odświeżania pozostałych */
const hgPass = (el, h) => { try { el.hass = h; } catch (e) { if (!el.__hgErr) { el.__hgErr = 1; console.warn('Nuvio: card update failed', el.localName, e); } } };
/* karty poza ekranem nie przerysowują się: zmiana stanu tylko oznacza kartę jako zaległą, a odświeżenie przychodzi, gdy karta wjedzie
   w widok (z zapasem 300 px, więc przy przewijaniu jest już gotowa). Pierwsze malowanie i zmiana konfiguracji zawsze od razu. */
/* czy karta naprawdę leży w oknie (z zapasem jak w HG_VIS); 0x0 = ukryta */
const hgOnScreen = (el) => { const r = el.getBoundingClientRect(), m = 300; return r.width > 0 && r.height > 0 && r.bottom > -m && r.right > -m && r.top < innerHeight + m && r.left < innerWidth + m; };
/* karty zaległe poza ekranem: po pokazaniu widoku (hgOffFlush) te, które są już widoczne, rysują się od razu */
const HG_OFFQ = window.__hgOffQ || (window.__hgOffQ = new Set());
const hgOffFlush = () => { for (const c of [...HG_OFFQ]) { if (!c.isConnected) { HG_OFFQ.delete(c); continue; } if (!c._offDirty) { HG_OFFQ.delete(c); continue; } if (hgOnScreen(c)) { HG_OFFQ.delete(c); c._off = false; c.removeAttribute('hg-off'); c._offDirty = false; c._doUpdate(true); } } };
if (!window.__hgOffVis) { window.__hgOffVis = 1; document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(() => hgOffFlush(), 60); }); }
const HG_VIS = window.__hgVisObj || (window.__hgVisObj = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((es) => {
  for (const e of es) { const c = e.target; c._off = !e.isIntersecting; c.toggleAttribute('hg-off', c._off);   /* karty z animacjami zatrzymują je poza ekranem */ if (!c._off && c._offDirty) { c._offDirty = false; c._doUpdate(true); } }
}, { rootMargin: '300px' }));
/* żywe karty (WeakRef, bez trzymania odłączonych w pamięci): jedno nasłuchiwanie hg-lang przerysowuje podłączone.
   Po mikrozadaniu, więc strona Nuvio najpierw przebudowuje się sama (jej stare karty są już odłączone, bez podwójnego rysowania);
   odłączona karta (ukryty widok HA) jest oznaczana jako zaległa i przerysowuje się przy ponownym podłączeniu. */
const HG_LIVE = new Set();
let hgLiveN = 0;
const hgLivePurge = () => { for (const r of HG_LIVE) if (!r.deref()) HG_LIVE.delete(r); };
/* teksty z defaults() liczone przed nadejściem katalogu (karta poza strategią) są w _config: gdy po zmianie kodu języka defaults() daje
   inny tekst niż przy setConfig, karta dostaje swoją konfigurację jeszcze raz (hgReg zapamiętuje ją w _cfgRaw) zamiast samego przerysowania */
const hgCfgDef = (c) => { try { return JSON.stringify(c.defaults()); } catch (e) { return null; } };
const hgCfgFresh = (c) => {
  if (c._cfgRaw === undefined || c._cfgLang === HGI18n.code) return false;
  c._cfgLang = HGI18n.code; if (hgCfgDef(c) === c._cfgDef) return false;
  c.setConfig(c._cfgRaw); return true;
};
window.addEventListener('hg-lang', () => queueMicrotask(() => {
  for (const r of HG_LIVE) { const c = r.deref(); if (!c) { HG_LIVE.delete(r); continue; }
    if (c.isConnected) { try { if (!hgCfgFresh(c)) c.rerender(); } catch (e) { /* karta bez konfiguracji */ } } else if (c._html != null) c._stale = true; }
}));
class HGBase extends HTMLElement {
  constructor() {
    super();
    if (typeof WeakRef === 'function') { HG_LIVE.add(new WeakRef(this)); if (++hgLiveN % 256 === 0) hgLivePurge(); }
    this.attachShadow({ mode: 'open' });
    hgSelWatch(this.shadowRoot);
    this._sig = null;
    const down = () => { this._touching = true; this._touchT = Date.now(); clearTimeout(this._tt); this._tt = setTimeout(up, 1500); };
    const up = () => { clearTimeout(this._tt); this._tt = setTimeout(() => { this._touching = false; if (this._pendingUpd) { this._pendingUpd = false; this._update(true); } }, 60); };
    this.shadowRoot.addEventListener('pointerdown', down, { passive: true });
    this.shadowRoot.addEventListener('pointerup', up, { passive: true });
    this.shadowRoot.addEventListener('pointercancel', up, { passive: true });
    this.shadowRoot.addEventListener('click', (e) => {
      const t = e.composedPath().find((n) => n.dataset && n.dataset.act);
      if (!t || t.hasAttribute('disabled')) return;
      e.stopPropagation();
      this.onAct(t.dataset.act, t, e);
    });
  }
  defaults() { return {}; }
  setConfig(c) {
    if (!c) throw new Error(hgT('core.missing_config'));
    this._config = Object.assign({}, this.defaults(), c);
    this._sig = null; this._entsC = null; this._prevStates = null; this._html = null;
    if (!this._styled) {
      const st = document.createElement('style');
      st.textContent = HG_BASE + (typeof hgUI !== 'undefined' ? hgUI.css() : '') + this.css() + ':host([panel-fill]) .root > ha-card.glass{min-height:100%;box-sizing:border-box}';
      this.shadowRoot.appendChild(st);
      this.$ = document.createElement('div');
      this.$.className = 'root';
      this.$.style.height = '100%';
      this.shadowRoot.appendChild(this.$);
      this._styled = true;
    }
    if (this._hass) this._update();
  }
  set hass(h) { this._hass = h; window.__hgHass = h; if (typeof HGTheme !== 'undefined') HGTheme.pick(h); this._update(); }
  get hass() { return this._hass; }
  ents() { return [this._config.entity].filter(Boolean); }
  /* szybka ścieżka: HA podmienia obiekt stanu tylko dla zmienionej encji -> porównanie referencji, bez JSON */
  _changed() {
    /* lista encji zależna od rejestru (pokoje, obszary): po zmianie rejestru liczona od nowa */
    const hr = this._hass, rk = this._regK; if (!rk || rk[0] !== hr.entities || rk[1] !== hr.devices || rk[2] !== hr.areas) { this._regK = [hr.entities, hr.devices, hr.areas]; if (rk) { this._entsC = null; this._prevStates = null; } }
    const ents = this._entsC || (this._entsC = this.ents());
    const st = this._hass.states, prev = this._prevStates;
    const ex = JSON.stringify(this._extraSig ? this._extraSig() : '');
    let ch = !prev || ex !== this._prevEx;
    if (!ch) for (let i = 0; i < ents.length; i++) if (st[ents[i]] !== prev[i]) { ch = true; break; }
    if (ch) { this._prevStates = ents.map((e) => st[e]); this._prevEx = ex; }
    return ch;
  }
  /* rAF: kilka zmian hass w jednej klatce -> jedno przerysowanie; pierwsze malowanie synchronicznie (View Transition czeka na gotowy widok).
     Odłączona karta (ukryty widok w pamięci HA) nie liczy niczego; nadrabia przy ponownym podłączeniu. */
  _update(force) {
    if (!this._config || !this._hass || this._busy) return;
    if (this._html != null && !this.isConnected) { this._stale = true; return; }
    if (this._html != null && !force) {
      /* rAF bywa wstrzymany (karta w tle, uśpiona aplikacja): zapasowy timer gwarantuje, że zaległa zmiana nie utknie na zawsze */
      if (this._raf) { if (performance.now() - this._rafT < 1000) return; cancelAnimationFrame(this._raf); clearTimeout(this._rafTo); }
      const go = () => { if (!this._raf) return; cancelAnimationFrame(this._raf); clearTimeout(this._rafTo); this._raf = 0; this._doUpdate(false); };
      this._rafT = performance.now(); this._raf = requestAnimationFrame(go); this._rafTo = setTimeout(go, 500);
      return;
    }
    this._doUpdate(force);
  }
  /* hgCfgFresh zawsze (najpierw porównuje _cfgLang): karta skonfigurowana przed katalogiem, a podłączona po nim, nawet nigdy nie rysowana */
  connectedCallback() { if (HG_VIS) HG_VIS.observe(this); let f = false; try { f = hgCfgFresh(this); } catch (e) { /* zła konfiguracja */ }
    if (this._stale) { this._stale = false; if (!f) this._update(true); } }
  disconnectedCallback() { if (HG_VIS) HG_VIS.unobserve(this); }
  _doUpdate(force) {
    if (!this._config || !this._hass || this._busy) return;
    if (HG_FREEZE.on && !this._hgPv) { HG_FREEZE.q.add(this); HG_FREEZE.guard(); return; }
    if (this._off && this._html != null && !window.__hgNoPause) {
      /* IntersectionObserver bywa nieaktualny (Safari / aplikacja HA po pokazaniu ukrytego widoku): karta widoczna na ekranie rysuje się od razu */
      if (hgOnScreen(this)) { this._off = false; this.removeAttribute('hg-off'); } else { this._offDirty = true; HG_OFFQ.add(this); return; } }   // poza ekranem: nadrobi po pokazaniu           // panel w trakcie animacji: przerysuj po jej końcu
    if (!force && !this._changed()) return;
    // nie podmieniaj DOM pod palcem: przerysuj dopiero po puszczeniu
    if (this._touching && Date.now() - (this._touchT || 0) < 2000) { this._pendingUpd = true; return; }
    this._touching = false;
    hgCurLang();   /* katalog bieżącego języka: aktywny albo pobierany (hgT czyta HGI18n.code) */
    let html;
    /* błąd renderu: karta pokazuje komunikat zamiast rzucać wyjątek w pętli przekazującej hass (to zatrzymywało inne karty) */
    try { html = this.render(); } catch (e) { if (!this._rErr) { this._rErr = 1; console.warn('Nuvio: render failed', this.localName, e); } html = `<ha-card class="glass" style="padding:12px;opacity:.7">${hgT('core.card_error')}</ha-card>`; }
    if (html === this._html) return;      // treść bez zmian (np. zmienił się tylko atrybut GPS) -> zero pracy DOM
    const first = this._html == null; this._html = html;
    /* na żywo: łatanie istniejących węzłów (ui/morph). Węzły przeżywają aktualizację, więc afterRender musi być idempotentne:
       nasłuchiwanie podpina się raz na węzeł przez this._once(el), a resztę (wartości, obserwatory) może powtarzać bez szkody. */
    if (first || this.constructor.noMorph || typeof hgMorph === 'undefined') this.$.innerHTML = html;
    else hgMorph(this.$, html);
    if (this.afterRender) { try { this.afterRender(); } catch (e) { console.warn('Nuvio: afterRender failed', this.localName, e); } }
  }
  rerender() { this._prevStates = null; this._update(true); }
  /* true tylko za pierwszym razem dla danego węzła i klucza: podpinanie nasłuchiwania w afterRender bez dublowania po łataniu */
  _once(el, k = 'b') { if (!el) return false; const s = el.__hgOnce || (el.__hgOnce = new Set()); if (s.has(k)) return false; s.add(k); return true; }
  onAct() {}
  css() { return ''; }
  render() { return ''; }
  getCardSize() { return 3; }
  getGridOptions() { return { columns: 6, rows: 3 }; }
  toggleHtml(on, act, disabled, label) {
    return `<button class="tg ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${H.esc(label || hgT('core.toggle'))}" data-act="${act}" ${disabled ? 'disabled' : ''}><i></i></button>`;
  }
}
window.customCards = window.customCards || [];
const hgReg = (tag, cls, name, desc) => {
  /* karty z własnym disconnectedCallback (bez super) też przestają być obserwowane po odłączeniu */
  const dc = cls.prototype.disconnectedCallback;
  if (cls.prototype instanceof HGBase && dc && dc !== HGBase.prototype.disconnectedCallback && !dc.__hgVis) {
    const w = function () { if (HG_VIS) HG_VIS.unobserve(this); return dc.call(this); }; w.__hgVis = true; cls.prototype.disconnectedCallback = w;
  }
  /* zewnętrzne wywołanie setConfig (HA, karta-rodzic) zapamiętane z kodem języka – dla hgCfgFresh; wewnętrzne super.setConfig pomijane */
  const sc = cls.prototype.setConfig;
  if (cls.prototype instanceof HGBase && sc && !Object.prototype.hasOwnProperty.call(cls.prototype, '__hgCfgW')) {
    cls.prototype.setConfig = function (c) {
      if (this.__hgCfgIn) return sc.call(this, c);
      this.__hgCfgIn = true; this._cfgRaw = c; this._cfgLang = HGI18n.code; this._cfgDef = hgCfgDef(this);
      try { return sc.call(this, c); } finally { this.__hgCfgIn = false; }
    };
    Object.defineProperty(cls.prototype, '__hgCfgW', { value: true });
  }
  if (!customElements.get(tag)) customElements.define(tag, cls);
  /* name / desc: tekst albo hgTLazy (rozwiązywane przy odczycie, w bieżącym języku – lista kart HA czyta je później niż rejestracja) */
  const lz = (v) => (v == null ? v : String(v));
  if (!window.customCards.find((c) => c.type === tag)) window.customCards.push({ type: tag, get name() { return lz(name); }, get description() { return lz(desc); }, preview: false });
};
