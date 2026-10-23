/* cards/remote-card: Pilot klimatyzacji w stylu aplikacji producenta: jednostka z animowanym nawiewem (kolor i prędkość z trybu i wentylatora),
   duża nastawa, suwak zimno–ciepło z −/+, kafle Tryb / Wentylator / Sen / Nawiew otwierające dolny arkusz z opcjami.
   Pokazuje tylko to, co encja climate zgłasza (hvac_modes, fan_modes, swing_modes, preset_modes). Zmiany od razu (optymistycznie). */
/* etykiety programów (preset): hgTD('cards.remote.presets.' + program) */
const HG_FAN_IC = { auto: 'mdi:fan-auto', low: 'mdi:fan-speed-1', quiet: 'mdi:fan-minus', silent: 'mdi:fan-minus', medium: 'mdi:fan-speed-2', middle: 'mdi:fan-speed-2', mid: 'mdi:fan-speed-2', high: 'mdi:fan-speed-3', strong: 'mdi:fan-speed-3', turbo: 'mdi:fan-plus', on: 'mdi:fan', off: 'mdi:fan-off', diffuse: 'mdi:weather-windy', focus: 'mdi:target' };
const HG_SWING_IC = { off: 'mdi:arrow-collapse-down', on: 'mdi:arrow-oscillating', swing: 'mdi:arrow-oscillating', vertical: 'mdi:arrow-up-down', horizontal: 'mdi:arrow-left-right', both: 'mdi:arrow-all' };
const HG_PRESET_IC = { none: 'mdi:circle-off-outline', eco: 'mdi:leaf', sleep: 'mdi:power-sleep', boost: 'mdi:rocket-launch', comfort: 'mdi:sofa', away: 'mdi:home-export-outline', home: 'mdi:home', activity: 'mdi:run' };
const HG_FAN_SP = { quiet: 3, silent: 3, low: 2.6, auto: 1.6, medium: 1.6, middle: 1.6, mid: 1.6, diffuse: 1.8, on: 1.6, high: 1, strong: 1, focus: 1, turbo: .7 };
/* --rca jako zarejestrowany kolor: zmiana trybu płynnie przechodzi w nowy kolor (tło, nawiew, kafle) */
try { CSS.registerProperty({ name: '--rca', syntax: '<color>', inherits: true, initialValue: '#' + '4C8DF6' }); } catch (e) { /* już zarejestrowany albo brak API */ }
class HGACRemoteCard extends HGBase {
  defaults() { return { title: hgT('cards.remote.air_conditioner') }; }
  css() {
    return U(`
ha-card.glass{ display:flex; flex-direction:column; container-type:inline-size; gap:10px; padding:14px var(--s2) var(--s2); min-height:0; user-select:none; -webkit-user-select:none;
  background-image:radial-gradient(120% 60% at 50% 22%, color-mix(in srgb, var(--ac) 20%, transparent), transparent 72%); --ac:var(--rca); transition: --rca .9s cubic-bezier(.4,0,.2,1); }
ha-card.glass > *{ flex-shrink:0; }
.hd{ display:flex; align-items:center; gap:var(--s1); min-height:40px; }
.ht{ flex:1; min-width:0; display:flex; flex-direction:column; line-height:1.25; }
.ht b{ font-size:var(--fs-sm); font-weight:600; color:#1E2023; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ht span{ font-size:var(--fs-xs); color:#5A5E64; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-variant-numeric:tabular-nums; }
.pw{ width:44px; height:44px; flex:none; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--hg-tile-bg); color:#2A2D31; transition: background .2s, color .2s, transform .1s; }
.pw ha-icon{ --mdc-icon-size:22px; width:22px; height:22px; } .pw:active{ transform:scale(.93); }
.on .pw{ background:var(--ac); color:#fff; box-shadow:0 4px 16px color-mix(in srgb, var(--ac) 45%, transparent); }
.eco{ height:32px; padding:0 12px 0 8px; border-radius:16px; display:flex; align-items:center; gap:4px; font-size:var(--fs-xs); font-weight:600; background:var(--hg-tile-bg); color:#4A4E54; flex:none; transition: background .2s, color .2s; }
.eco ha-icon{ --mdc-icon-size:18px; width:18px; height:18px; } .eco.act{ background:#2E9D5B; color:#fff; }
/* jednostka i nawiew */
.un{ flex:1 1 130px; min-height:0; max-height:190px; display:flex; justify-content:center; overflow:hidden; }
.un svg{ height:100%; width:auto; max-width:100%; overflow:visible; }
.un .bd{ fill:${'#' + 'FBFCFD'}; stroke:rgba(0,0,0,.08); } .un .vt{ fill:${'#' + 'DADEE3'}; } .un .lv{ stroke:${'#' + 'B9BFC6'}; stroke-width:2; stroke-linecap:round; }
.un .led{ fill:var(--ac); } .off .un .led{ fill:${'#' + 'C4C8CE'}; }
.un .sh{ fill:rgba(0,0,0,.10); filter:blur(6px); }
.str{ transform-box:view-box; transform-origin:120px 60px; transition: opacity .4s; }
.str path{ fill:none; stroke:var(--ac); stroke-width:3.2; stroke-linecap:round; stroke-dasharray:12 18; animation: var(--hg-loop, rcFlow var(--sp, 1.6s) linear infinite); animation-play-state:var(--hg-play, running); }
.str path:nth-child(2n){ animation-delay:calc(var(--sp, 1.6s) * -.5); } .str path:nth-child(3n){ animation-delay:calc(var(--sp, 1.6s) * -.25); }
.sw .str{ animation: var(--hg-loop, rcSwing 3.2s ease-in-out infinite alternate); animation-play-state:var(--hg-play, running); }
/* zmiana trybu: jednostka delikatnie rozbłyska nowym kolorem, nawiew wraca od góry */
.mc .un svg{ animation: rcMode 1.5s cubic-bezier(.4,0,.2,1); }
@keyframes rcMode{ 0%{ filter:none; transform:none; } 35%{ filter:drop-shadow(0 0 22px color-mix(in srgb, var(--ac) 70%, transparent)); transform:scale(1.025); } 100%{ filter:none; transform:none; } }
.mc .un .str path{ animation: var(--hg-loop, rcFlow var(--sp, 1.6s) linear infinite, rcIn 1.1s ease-out); }
@keyframes rcIn{ from{ opacity:0; } to{ opacity:1; } }
@media (prefers-reduced-motion:reduce){ ha-card.glass{ transition:none; } .mc .un svg, .mc .un .str path{ animation:none; } }
.off .str{ opacity:0; } .off .un .bd{ fill:${'#' + 'E9EBEE'}; }
@keyframes rcFlow{ to{ stroke-dashoffset:-60; } }
@keyframes rcSwing{ from{ transform:skewX(-14deg); } to{ transform:skewX(14deg); } }
:host([hg-off]) .str, :host([hg-off]) .str path{ animation-play-state:paused; }
@media (prefers-reduced-motion: reduce){ .str, .str path{ animation:none !important; } }
/* nastawa */
.tv{ display:flex; flex-direction:column; align-items:center; gap:2px; margin-top:-4px; }
.num{ font-size:clamp(48px, 22cqi, 84px); font-weight:200; letter-spacing:-.04em; line-height:1; color:#16181B; font-variant-numeric:tabular-nums; position:relative; padding-right:.42em; cursor:pointer; }
.num sup{ position:absolute; top:.1em; right:0; font-size:.3em; font-weight:400; letter-spacing:0; }
.off .num{ color:#8A8F96; }
.st{ font-size:var(--fs-sm); font-weight:600; color:var(--ac); white-space:nowrap; } .off .st{ color:#6A6E74; }
.sl{ display:grid; grid-template-columns:44px 1fr 44px; align-items:center; gap:6px; }
.cv{ width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--hg-tile-bg); color:#2A2D31; transition: transform .1s, opacity .2s; touch-action:manipulation; }
.cv ha-icon{ --mdc-icon-size:22px; width:22px; height:22px; } .cv:active{ transform:scale(.92); } .cv[disabled]{ opacity:.35; }
input.tsl{ width:100%; height:44px !important; touch-action:pan-y; }
input.tsl::-webkit-slider-runnable-track{ height:10px !important; border-radius:5px !important; box-shadow:none !important; background:linear-gradient(90deg, #2F7CF6, #8DBBF5 42%, #F6BE8C 58%, #F2762A) !important; }
input.tsl::-moz-range-track{ height:10px; border-radius:5px; background:linear-gradient(90deg, #2F7CF6, #8DBBF5 42%, #F6BE8C 58%, #F2762A); } input.tsl::-moz-range-progress{ background:transparent; }
input.tsl::-webkit-slider-thumb{ width:28px !important; height:28px !important; margin-top:-9px !important; background:${'#' + 'fff'} !important; border:3px solid var(--ac) !important; box-shadow:0 3px 10px rgba(0,0,0,.3) !important; }
input.tsl::-moz-range-thumb{ width:22px; height:22px; background:${'#' + 'fff'}; border:3px solid var(--ac); }
input.tsl:disabled{ opacity:.5; filter:grayscale(1); }
/* kafle */
.tl{ display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:var(--s1); }
@container (min-width: 520px){ .tl{ grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); } }
.ti{ display:flex; align-items:center; gap:10px; min-width:0; min-height:56px; padding:8px 10px; border-radius:var(--r-md); background:var(--hg-tile-bg); text-align:left; color:#2A2D31; transition: background .2s, color .2s, transform .1s; }
.ti:active{ transform:scale(.97); }
.ti i{ width:36px; height:36px; flex:none; border-radius:50%; display:flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--ac) 16%, transparent); color:var(--ac); font-style:normal; }
.ti i ha-icon{ --mdc-icon-size:20px; width:20px; height:20px; }
.ti span{ display:flex; flex-direction:column; min-width:0; line-height:1.2; }
.ti small{ font-size:11px; color:#5A5E64; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ti b{ font-size:var(--fs-sm); font-weight:600; color:#1E2023; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ti .dd{ display:none; margin-left:auto; flex:none; color:#5A5E64; transition: transform .2s; } .ti .dd ha-icon{ --mdc-icon-size:20px; width:20px; height:20px; display:flex; } .ti[aria-expanded=true] .dd{ transform:rotate(180deg); }
@media (min-width: 700px){ .ti .dd{ display:flex; } }
.ti.act{ background:var(--ac); } .ti.act i{ background:rgba(255,255,255,.22); color:#fff; } .ti.act small, .ti.act b{ color:#fff; }
.off .ti i{ background:rgba(0,0,0,.06); color:#6A6E74; }
@container (max-width: 300px){ .eco span{ display:none; } .eco{ padding:0 7px; } .ti{ flex-direction:column; justify-content:center; text-align:center; padding:8px 6px; gap:4px; } .ti span{ align-items:center; max-width:100%; } .ti i{ width:30px; height:30px; } .ti small{ display:none; } .cv{ width:40px; height:40px; } .sl{ grid-template-columns:40px 1fr 40px; } }
`);
  }
  _lim(s) { const a = s.attributes, cf = this._hass && this._hass.config, f = !!(cf && cf.unit_system && cf.unit_system.temperature === '°F'); return { step: a.target_temp_step || (f ? 1 : 0.5), mn: a.min_temp ?? 16, mx: a.max_temp ?? 30, u: f ? '°F' : '°C' }; }
  /* stan z nałożonymi zmianami jeszcze niepotwierdzonymi przez HA (najdłużej 8 s) */
  _eff(s) {
    const a = s.attributes, r = { st: s.state, t: a.temperature != null ? Number(a.temperature) : null, fan: a.fan_mode, swing: a.swing_mode, preset: a.preset_mode }, o = this._opt;
    if (o) {
      const done = Object.keys(o).every((k) => k === 'ts' || k === 'any' || (k === 'st' && o.any ? s.state !== 'off' : r[k] === o[k]));
      if (done || Date.now() - o.ts > 8000) this._opt = null;
      else Object.keys(o).forEach((k) => { if (k in r && !(k === 'st' && o.any && s.state !== 'off')) r[k] = o[k]; });
    }
    return r;
  }
  _extraSig() { return this._opt ? JSON.stringify(this._opt) : ''; }
  _set(o) { this._opt = { ...(this._opt || {}), ...o, ts: Date.now() }; this.rerender(); }
  /* kolor nawiewu: chłodzenie niebieski, grzanie pomarańcz, auto przechodzi przez fiolet zależnie od nastawy */
  _col(st, t, mn, mx) { return hgClimCol(st, t, mn, mx); }   // wspólna mapa HG_CLIM_COL (shared/climate-modes)
  _room() {
    const c = this._config, h = this._hass; if (c.room !== undefined) return c.room;
    const e = h.entities && h.entities[c.entity], dv = e && e.device_id && h.devices ? h.devices[e.device_id] : null, ar = (e && e.area_id) || (dv && dv.area_id);
    return ar && h.areas && h.areas[ar] ? h.areas[ar].name : '';
  }
  _lab(k, v) {
    if (k === 'mode') return (HG_AC_MODE[v] || {}).l || v;
    const M = k === 'fan' ? hgFanL : k === 'swing' ? hgSwingL : (x) => hgTD('cards.remote.presets.' + x, null);
    if (k === 'swing' && /^\d+$/.test(v)) return hgT('cards.remote.position', { position: v });
    if (!M(v) && /_/.test(v) && String(v).split('_').every((x) => M(x))) return String(v).split('_').map((x) => M(x)).join(' · ');
    return M(v) || String(v).replace(/_/g, ' ').replace(/^./, (x) => x.toUpperCase());
  }
  _ic(k, v) { return k === 'mode' ? (HG_AC_MODE[v] || {}).i || 'mdi:thermostat' : k === 'fan' ? HG_FAN_IC[v] || (/high/.test(v) ? 'mdi:fan-speed-3' : /low/.test(v) ? 'mdi:fan-speed-1' : 'mdi:fan') : k === 'swing' ? HG_SWING_IC[v] || (/^\d+$/.test(v) ? `mdi:numeric-${v}-circle-outline` : 'mdi:arrow-oscillating') : HG_PRESET_IC[v] || 'mdi:tune-variant'; }
  _stat(st, t) { if (st === 'off') return hgT('common.off_masc'); const l = this._lab('mode', st); return (st === 'fan_only' || st === 'dry' || t == null) ? l : hgT('cards.remote.mode_to_temp', { mode: l, temp: H.fmt(t) }); }
  render() {
    const c = this._config, h = this._hass, s = H.st(h, c.entity);
    if (!H.ok(s)) return `<ha-card class="glass off" style="--rca:#8A9099"><div class="hd"><div class="ht"><b>${H.esc(c.title)}</b></div></div><div class="ph"><b>${hgT('common.unavailable_masc')}</b></div></ha-card>`;
    const a = s.attributes, e = this._eff(s), on = e.st !== 'off', { mn, mx, step, u } = this._lim(s);
    if (s.state !== 'off') this._last = s.state;
    if (this._pm !== undefined && this._pm !== e.st) { this._mcT = Date.now() + 1500; clearTimeout(this._mcR); this._mcR = setTimeout(() => this.isConnected && this.rerender(), 1550); }
    this._pm = e.st;
    const fz = String(e.fan || ''), col = this._col(e.st, e.t, mn, mx), sp = HG_FAN_SP[fz] || (/high|turbo|strong|max/.test(fz) ? 1 : /low|quiet|silent|min/.test(fz) ? 2.6 : 1.6), swing = on && /^(on|auto|both|vertical|horizontal)$|swing/.test(e.swing || '');
    const cur = a.current_temperature != null ? Number(a.current_temperature) : null, room = this._room();
    const sub = [room, cur != null ? hgT('cards.remote.indoor_temp', { temp: H.fmt(cur) }) : ''].filter(Boolean).join(' · ');
    const pr = a.preset_modes || [], hasEco = pr.includes('eco'), hasSleep = pr.includes('sleep'), other = pr.filter((x) => !['eco', 'sleep', 'none'].includes(x));
    const eco = hasEco ? `<button class="eco ${e.preset === 'eco' ? 'act' : ''}" data-act="preset" data-v="eco" aria-pressed="${e.preset === 'eco'}" title="${hgT('cards.remote.eco_mode')}">${H.icon('mdi:leaf')}<span>${hgT('cards.remote.eco')}</span></button>` : '';
    const pw = `<button class="pw" data-act="power" aria-pressed="${on}" aria-label="${on ? hgT('common.turn_off') : hgT('common.turn_on')}" title="${on ? hgT('common.turn_off') : hgT('common.turn_on')}">${H.icon('mdi:power')}</button>`;
    /* jednostka (neutralna, bez marki) i sześć strug powietrza rozchodzących się w dół */
    const str = [0, 1, 2, 3, 4, 5].map((i) => { const x = 50 + i * 28, x2 = Math.round(x + (x - 120) * .45); return `<path d="M${x} 62 C${x - 5} 88 ${x2 + 6} 112 ${x2} 146"/>`; }).join('');
    const W = '#' + 'fff', unit = `<svg viewBox="0 0 240 150" aria-hidden="true"><defs><linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${W}"/><stop offset=".25" stop-color="${W}"/><stop offset="1" stop-color="${W}" stop-opacity="0"/></linearGradient><mask id="rm"><rect x="0" y="56" width="240" height="94" fill="url(#rf)"/></mask></defs>
      <g class="str" mask="url(#rm)">${str}</g><ellipse class="sh" cx="120" cy="64" rx="96" ry="6"/><rect class="bd" x="16" y="6" width="208" height="58" rx="16"/><rect class="vt" x="32" y="48" width="176" height="9" rx="4.5"/><line class="lv" x1="40" y1="52.5" x2="200" y2="52.5"/><circle class="led" cx="204" cy="20" r="3"/></svg>`;
    const dis = !on || e.t == null;
    const cv = (d, ic, l) => `<button class="cv" data-act="step" data-d="${d}" ${dis || (d < 0 ? e.t <= mn : e.t >= mx) ? 'disabled' : ''} aria-label="${l}" title="${l}">${H.icon(ic)}</button>`;
    const sl = `<div class="sl">${cv(-1, 'mdi:minus', hgT('cards.remote.lower_temperature'))}<input class="tsl" type="range" min="${mn}" max="${mx}" step="${step}" value="${e.t ?? (mn + mx) / 2}" ${dis ? 'disabled' : ''} aria-label="${hgT('cards.remote.target_temperature')}" aria-valuetext="${e.t != null ? H.fmt(e.t) + '°' : ''}">${cv(1, 'mdi:plus', hgT('cards.remote.raise_temperature'))}</div>`;
    const ti = (k, l, v, act) => `<button class="ti ${act ? 'act' : ''}" data-act="${k === 'sleep' ? 'preset' : 'pick'}" data-k="${k}"${k === 'sleep' ? ' data-v="sleep"' : ''} aria-label="${H.esc(H.lv(l, v))}"><i>${H.icon(k === 'sleep' ? 'mdi:power-sleep' : this._ic(k, k === 'mode' ? e.st : e[k]))}</i><span><small>${H.esc(l)}</small><b>${H.esc(v)}</b></span>${k === 'sleep' ? '' : `<em class="dd">${H.icon('mdi:chevron-down')}</em>`}</button>`;
    const hv = (a.hvac_modes || []).filter((x) => x !== 'off');
    const tiles = [
      hv.length > 1 ? ti('mode', hgT('common.mode'), on ? this._lab('mode', e.st) : hgT('common.off_masc')) : '',
      (a.fan_modes || []).length > 1 && e.fan ? ti('fan', hgT('common.fan'), this._lab('fan', e.fan)) : '',
      hasSleep ? ti('sleep', hgT('cards.remote.sleep'), e.preset === 'sleep' ? hgT('common.on_masc') : hgT('common.off_masc'), e.preset === 'sleep') : '',
      (a.swing_modes || []).length > 1 && e.swing ? ti('swing', hgT('cards.remote.airflow'), this._lab('swing', e.swing)) : '',
      other.length ? ti('preset', hgT('cards.remote.preset'), this._lab('preset', e.preset && !['eco', 'sleep'].includes(e.preset) ? e.preset : 'none')) : '',
    ].join('');
    const tv = `<div class="tv"><div class="num" data-act="more" aria-live="polite" title="${hgT('common.details')}">${e.t != null ? H.fmt(e.t) : a.target_temp_low != null ? `${H.fmt(a.target_temp_low)}–${H.fmt(a.target_temp_high)}` : '–'}<sup>${u}</sup></div><div class="st" role="status">${H.esc(this._stat(e.st, e.t))}</div></div>`;
    return `<ha-card class="glass ${on ? 'on' : 'off'}${swing ? ' sw' : ''}${this._mcT > Date.now() ? ' mc' : ''}" style="--rca:${col};--sp:${sp}s">
      <div class="hd"><div class="ht"><b>${H.esc(c.title)}</b>${sub ? `<span>${H.esc(sub)}</span>` : ''}</div>${eco}${pw}</div>
      <div class="un">${unit}</div>${tv}${sl}${tiles ? `<div class="tl">${tiles}</div>` : ''}</ha-card>`;
  }
  /* nastawa w miejscu (bez przerysowania pod palcem), zatwierdzenie z opóźnieniem */
  _setT(v, ms) {
    const s = H.st(this._hass, this._config.entity); if (!s) return;
    const { step, mn, mx } = this._lim(s); v = +Math.max(mn, Math.min(mx, Math.round((v - mn) / step) * step + mn)).toFixed(1);
    const e = this._eff(s); if (e.t !== v) H.haptic('selection');
    this._opt = { ...(this._opt || {}), t: v, ts: Date.now() };
    const R = this.$, card = R.querySelector('ha-card');
    if (card) {
      card.style.setProperty('--rca', this._col(e.st, v, mn, mx));
      const n = R.querySelector('.num'); if (n) n.firstChild.nodeValue = H.fmt(v);
      const st = R.querySelector('.st'); if (st) st.textContent = this._stat(e.st, v);
      const rg = R.querySelector('.tsl'); if (rg) { if (+rg.value !== v) rg.value = v; rg.setAttribute('aria-valuetext', H.fmt(v) + '°'); }
      R.querySelectorAll('.cv').forEach((x) => x.toggleAttribute('disabled', +x.dataset.d < 0 ? v <= mn : v >= mx));
    }
    clearTimeout(this._ct); this._ct = setTimeout(() => this._commit(), ms);
  }
  _commit() {
    this._ct = 0; const s = H.st(this._hass, this._config.entity); if (!s || !this._opt || this._opt.t == null) return;
    if (Number(s.attributes.temperature) !== this._opt.t) H.call(this._hass, 'climate', 'set_temperature', { entity_id: this._config.entity, temperature: this._opt.t });
    this._opt.ts = Date.now();
  }
  afterRender() {
    const rg = this.$.querySelector('.tsl');
    if (rg && this._once(rg)) {
      rg.addEventListener('input', () => this._setT(+rg.value, 60000));
      rg.addEventListener('change', () => { clearTimeout(this._ct); this._ct = setTimeout(() => this._commit(), 250); });
    }
  }
  disconnectedCallback() { super.disconnectedCallback(); if (this._ct) { clearTimeout(this._ct); this._commit(); } if (this._sh) this._sh.close(); }
  /* dolny arkusz z opcjami (tryb / wentylator / nawiew / program) */
  _pick(k, anchor) {
    const s = H.st(this._hass, this._config.entity); if (!s) return;
    const a = s.attributes, e = this._eff(s), { mn, mx } = this._lim(s);
    const L = k === 'mode' ? (a.hvac_modes || []).filter((x) => x !== 'off') : k === 'fan' ? a.fan_modes || [] : k === 'swing' ? a.swing_modes || [] : (a.preset_modes || []).filter((x) => !['eco', 'sleep'].includes(x));
    const curV = k === 'mode' ? e.st : e[k];
    const T = { mode: hgT('cards.remote.mode'), fan: hgT('cards.remote.fan_speed'), swing: hgT('cards.remote.airflow_direction'), preset: hgT('cards.remote.preset') }[k];
    const btn = (v) => { const sel = v === curV, col = k === 'mode' ? this._col(v, e.t, mn, mx) : this._col(e.st, e.t, mn, mx);
      return `<button class="o${sel ? ' on' : ''}" data-v="${H.esc(v)}" style="--ac:${col}" aria-pressed="${sel}"><i>${H.icon(this._ic(k, v))}</i><span>${H.esc(this._lab(k, v))}</span>${sel ? `<em>${H.icon('mdi:check')}</em>` : ''}</button>`; };
    const css = `<style>.nvrc{ display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:10px; padding-top:4px; }
.nvrc .o{ all:unset; box-sizing:border-box; position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:10px; min-height:96px; padding:14px; border-radius:18px; cursor:pointer; color:inherit; font:inherit; background:color-mix(in srgb, currentColor 7%, transparent); transition: background .2s, transform .1s; }
.nvrc .o:active{ transform:scale(.97); } .nvrc .o:focus-visible{ outline:2px solid var(--ac); outline-offset:2px; }
.nvrc i{ width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--ac) 16%, transparent); color:var(--ac); }
.nvrc span{ font-weight:600; font-size:15px; } .nvrc em{ position:absolute; top:12px; right:12px; width:22px; height:22px; display:flex; color:#fff; }
.nvrc em ha-icon, .nvrc i ha-icon{ --mdc-icon-size:22px; width:22px; height:22px; display:flex; }
.nvrc .o.on{ background:var(--ac); color:#fff; } .nvrc .o.on i{ background:rgba(255,255,255,.22); color:#fff; }
@media (hover:hover){ .nvrc .o:not(.on):hover{ background:color-mix(in srgb, currentColor 11%, transparent); } }</style>`;
    if (this._sh) { const same = this._shK === k; this._sh.close(); this._sh = null; if (same && anchor && innerWidth >= 700) return; }   // drugie dotknięcie kafla zamyka menu
    this._shK = k;
    /* duży ekran: rozwijane menu pod kaflem; telefon: dolny arkusz z dużymi kafelkami */
    if (anchor && innerWidth >= 700) {
      const row = (v) => { const sel = v === curV, col = k === 'mode' ? this._col(v, e.t, mn, mx) : this._col(e.st, e.t, mn, mx);
        return `<button class="o${sel ? ' on' : ''}" role="menuitemradio" aria-checked="${sel}" data-v="${H.esc(v)}" style="--ac:${col}"><i>${H.icon(this._ic(k, v))}</i><span>${H.esc(this._lab(k, v))}</span>${sel ? `<em>${H.icon('mdi:check')}</em>` : ''}</button>`; };
      const dcss = `<style>.nvrd{ display:flex; flex-direction:column; gap:2px; min-width:var(--w, 200px); }
.nvrd > b{ font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; opacity:.6; padding:4px 10px 6px; }
.nvrd .o{ all:unset; box-sizing:border-box; display:flex; align-items:center; gap:12px; min-height:48px; padding:6px 12px 6px 6px; border-radius:12px; cursor:pointer; color:inherit; font:inherit; font-size:14px; transition: background .15s; }
.nvrd i{ width:34px; height:34px; flex:none; border-radius:50%; display:flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--ac) 16%, transparent); color:var(--ac); }
.nvrd i ha-icon, .nvrd em ha-icon{ --mdc-icon-size:20px; width:20px; height:20px; display:flex; }
.nvrd span{ flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .nvrd em{ display:flex; color:var(--ac); }
.nvrd .o.on{ background:color-mix(in srgb, var(--ac) 14%, transparent); font-weight:600; } .nvrd .o:focus-visible{ outline:2px solid var(--ac); outline-offset:-2px; }
@media (hover:hover){ .nvrd .o:not(.on):hover{ background:color-mix(in srgb, currentColor 7%, transparent); } }</style>`;
      anchor.setAttribute('aria-expanded', 'true');
      const pp = this._sh = hgOverlay.popover(anchor, `${dcss}<div class="nvrd" role="menu" aria-label="${H.esc(T)}" style="--w:${Math.round(anchor.getBoundingClientRect().width - 16)}px"><b>${H.esc(T)}</b>${L.map(row).join('')}</div>`,
        { role: 'menu', onClose: () => { anchor.setAttribute('aria-expanded', 'false'); if (this._sh === pp) this._sh = null; } });
      pp.el.addEventListener('click', (ev) => { const b = ev.composedPath().find((n) => n.dataset && n.dataset.v != null); if (!b) return; H.haptic('light'); this._apply(k, b.dataset.v); pp.close(); });
      pp.el.addEventListener('keydown', (ev) => { const f = [...pp.el.querySelectorAll('.o')], i = f.indexOf(pp.el.getRootNode().activeElement);
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); f.at((i + (ev.key === 'ArrowDown' ? 1 : -1) + f.length) % f.length).focus(); } });
      requestAnimationFrame(() => { const f = pp.el.querySelector('.o.on') || pp.el.querySelector('.o'); if (f) f.focus({ preventScroll: true }); });
      return;
    }
    const sh = this._sh = hgOverlay.sheet({ title: T, side: 'bottom', html: `${css}<div class="nvrc">${L.map(btn).join('')}</div>`, onClose: () => { if (this._sh === sh) this._sh = null; } });
    sh.body.addEventListener('click', (ev) => {
      const b = ev.composedPath().find((n) => n.dataset && n.dataset.v != null); if (!b) return;
      H.haptic('light'); this._apply(k, b.dataset.v); sh.close();
    });
  }
  _apply(k, v) {
    const id = { entity_id: this._config.entity };
    if (k === 'mode') { this._set({ st: v }); return H.call(this._hass, 'climate', 'set_hvac_mode', { ...id, hvac_mode: v }); }
    if (k === 'fan') { this._set({ fan: v }); return H.call(this._hass, 'climate', 'set_fan_mode', { ...id, fan_mode: v }); }
    if (k === 'swing') { this._set({ swing: v }); return H.call(this._hass, 'climate', 'set_swing_mode', { ...id, swing_mode: v }); }
    this._set({ preset: v }); return H.call(this._hass, 'climate', 'set_preset_mode', { ...id, preset_mode: v });
  }
  onAct(a, el) {
    const c = this._config, s = H.st(this._hass, c.entity); if (!s) return;
    const id = { entity_id: c.entity }, e = this._eff(s);
    if (a === 'more') return H.fire(this, 'hass-more-info', { entityId: c.entity });
    if (a === 'step') { if (e.t != null) this._setT(e.t + (+el.dataset.d) * this._lim(s).step, 700); return; }
    H.haptic('light');
    if (a === 'pick') return this._pick(el.dataset.k, el);
    if (a === 'preset') {   // Eko / Sen: przełącznik; wyłączenie wraca do „none” albo do pierwszego innego programu
      const v = el.dataset.v, pr = s.attributes.preset_modes || [];
      return this._apply('preset', e.preset === v ? (pr.includes('none') ? 'none' : pr.find((x) => !['eco', 'sleep'].includes(x)) || v) : v);
    }
    if (a === 'power') {
      const sf = s.attributes.supported_features || 0;
      if (e.st === 'off') {
        const back = c.default_mode || this._last || (s.attributes.hvac_modes || []).find((x) => x !== 'off') || 'cool';
        this._set({ st: back, any: true });
        return sf & 256 ? H.call(this._hass, 'climate', 'turn_on', id) : H.call(this._hass, 'climate', 'set_hvac_mode', { ...id, hvac_mode: back });
      }
      this._set({ st: 'off' });
      return sf & 128 ? H.call(this._hass, 'climate', 'turn_off', id) : H.call(this._hass, 'climate', 'set_hvac_mode', { ...id, hvac_mode: 'off' });
    }
  }
  getGridOptions() { return { columns: 6, rows: 'auto', min_rows: 6 }; }
}
hgReg('hg-acremote-card', HGACRemoteCard, hgTLazy('cards.remote.picker_name'), hgTLazy('cards.remote.picker_description'));
