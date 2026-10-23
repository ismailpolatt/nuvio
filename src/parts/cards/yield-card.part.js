/* hg-yield-card: prognoza produkcji na kolejne dni, jeden czujnik na dzień (pierwszy = dziś), stan = energia dnia.
   Ocena dnia: z mocą instalacji (capacity, liczba albo encja) uzysk kWh na kW porównany z progami good / poor, bez niej względem najlepszego dnia okresu. */
const HG_YIELD_LV = { good: 'var(--hg-accent)', average: 'color-mix(in srgb, currentColor 42%, transparent)', poor: '#FF8A3D' };
const HG_YIELD_KWH = { Wh: 1e-3, kWh: 1, MWh: 1e3, GWh: 1e6 };   // energia czujnika -> kWh (inna jednostka: bez przeliczenia)
const HG_YIELD_KW = { W: 1e-3, kW: 1, MW: 1e3 };                 // moc encji capacity -> kW (także Wp, kWp, MWp)
/* liczba z konfiguracji: number albo tekst z kropką lub przecinkiem ("3,4"); inaczej null */
const hgYieldNum = (v) => (typeof v === 'number' ? v : typeof v === 'string' && /^\s*-?\d+(?:[.,]\d+)?\s*$/.test(v) ? parseFloat(v.replace(',', '.')) : null);
/* progi oceny dnia: liczby (także "3,5"), poor <= good (zamienione, gdy wpisane odwrotnie).
   abs = progi w kWh dnia zamiast kWh na kW: gdy nie ma mocy odniesienia, a progi są wpisane, albo gdy próg dobrego dnia
   przekracza 12 kWh na kW (fizycznie niemożliwe w ciągu doby, czyli wpisano kWh dnia). Bez mocy i bez progów: względem najlepszego dnia. */
const hgYieldTh = window.hgYieldTh = (c, cap, D = { good: 3.5, poor: 1.5 }) => {
  const set = (v) => hgYieldNum(v) != null, n = (v, d) => (set(v) ? hgYieldNum(v) : d);
  let good = n(c.good, D.good), poor = n(c.poor, D.poor); if (poor > good) [good, poor] = [poor, good];
  const abs = (!cap && (set(c.good) || set(c.poor))) || (!!cap && good > 12);
  return { good, poor, abs };
};
class HGYieldCard extends HGBase {
  static getStubConfig(h) { const S = (h && h.states) || {}; return { entities: Object.keys(S).filter((e) => hgDom(e) === 'sensor' && S[e].attributes.device_class === 'energy' && S[e].attributes.state_class !== 'total_increasing' && hgNum(S[e])).slice(0, 7) }; }
  defaults() { return { entities: [], title: null, icon: 'mdi:calendar-weather', capacity: null, good: 3.5, poor: 1.5, unit: null, decimals: 1 }; }
  /* capacity jako encja (id z kropką, nie liczba) albo null */
  _capEnt() { const v = this._config.capacity; return typeof v === 'string' && v.includes('.') && hgYieldNum(v) == null ? v.trim() : null; }
  ents() { const e = this._capEnt(); return e ? [...this._config.entities, e] : this._config.entities; }
  _extraSig() { return [this._sel, this._today().key]; }
  /* dziś w strefie czasowej HA: klucz daty i północ UTC tego dnia (etykiety dni liczone w UTC, więc bez przesunięć strefy przeglądarki) */
  _today() { const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: HGStats.tz(this._hass), year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { key: `${p.year}-${p.month}-${p.day}`, t: Date.UTC(+p.year, +p.month - 1, +p.day) }; }
  /* moc odniesienia w kW: { kw } gdy znana, { off: true } gdy ustawiona, ale nieczytelna (encja niedostępna, 0), null gdy brak */
  _cap() { const c = this._config, v = c.capacity; if (v == null || v === '') return null;
    const e = this._capEnt(), n = e ? H.num(this._hass, e) : hgYieldNum(v);
    const f = e ? HG_YIELD_KW[String((H.st(this._hass, e) || { attributes: {} }).attributes.unit_of_measurement || 'kW').replace(/p$/, '')] || 1 : 1;
    return n != null && n * f > 0 ? { kw: n * f } : { off: true }; }
  css() {
    return HG_DAYBARS_CSS + U(`
ha-card.glass{ display:flex; flex-direction:column; gap:var(--s1); padding:var(--s2) var(--s3) var(--s2); container-type:inline-size; }
.hd .tt{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sum{ display:flex; align-items:baseline; gap:var(--s2); flex-wrap:wrap; }
.sum b{ font-size:calc(18u * var(--hg-fsv, 1)); font-weight:var(--hg-fw-num, 300); letter-spacing:-.01em; } .sum b em{ font-style:normal; font-size:var(--fs-xs); font-weight:400; color:#5A5E64; margin-left:3u; }
.lv{ font-size:var(--fs-xs); font-weight:600; padding:3px 10px; border-radius:var(--hg-radius-pill, 999px); color:#111214; background:var(--c); white-space:nowrap; }
.lv.average{ color:inherit; background:transparent; box-shadow:inset 0 0 0 1px color-mix(in srgb, currentColor 35%, transparent); }
.lg{ display:flex; gap:var(--s2); flex-wrap:wrap; font-size:var(--fs-xs); color:#5A5E64; } .lg span{ display:inline-flex; align-items:center; gap:4u; } .lg i{ width:6u; height:6u; border-radius:50%; background:var(--c); }
.ch{ min-height:190px; }
.d{ all:unset; box-sizing:border-box; cursor:pointer; position:relative; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:6px; border-radius:var(--r-sm); padding-top:3u; min-width:0; }
.pr{ --bwf:.38; --bwmin:9px; --bwmax:32px; transition:height var(--hg-t-slow, 320ms) var(--hg-ease-out, ease-out); }
.pr i.nd{ margin:0 0 -2.5u; }
.d small{ white-space:nowrap; } .d small .ln{ display:none; }
.best .val{ font-weight:600; }
.tip i{ background:var(--c); }
@container (max-width: 300px){ .ch{ min-height:150px; } .lg{ display:none; } .sum b{ font-size:calc(15u * var(--hg-fsv, 1)); } .d:not(.today):not(.best) .val{ display:none; } }
@container (max-width: 380px){ .lv{ display:none; } .ch.many .d:nth-child(even):not(.today):not(.best) .val{ display:none; } }
@container (min-width: 560px){ .ch{ min-height:250px; } .d small .ln{ display:inline; } .d small .sn{ display:none; } }
@media (prefers-reduced-motion:reduce){ .pr{ transition:none; } }
`);
  }
  render() {
    const c = this._config, h = this._hass, L = c.entities, D = this.defaults();
    const hd = `<div class="hd">${H.icon(c.icon, 'ic')}<span class="tt">${H.esc(c.title || hgT('cards.yield.default_title'))}</span><span class="sp"></span></div>`;
    if (!L.length) return `<ha-card class="glass">${hd}<div class="ph"><b>${hgT('cards.yield.choose_sensors')}</b>${hgT('cards.yield.choose_sensors_hint')}</div></ha-card>`;
    const num = (v, d) => { const n = hgYieldNum(v); return n == null ? d : n; };
    const dec = Math.min(6, Math.max(0, Math.round(num(c.decimals, D.decimals))));
    const LN = { good: hgT('cards.yield.levels.good'), average: hgT('cards.yield.levels.average'), poor: hgT('cards.yield.levels.poor') };
    const NA = hgT('common.unavailable'), ND = hgT('common.no_data');
    const df = new Intl.DateTimeFormat(HG_LOC(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }), t0 = this._today().t;
    /* dzień: wartość w kWh (k), data, nazwy, brak danych z powodem */
    const days = L.map((e, i) => { const s = H.st(h, e), n = H.num(h, e), u = s && s.attributes.unit_of_measurement, d = new Date(t0 + i * 864e5);
      return { e, i, today: i === 0, u, has: n != null, k: n != null ? Math.max(0, n) * (HG_YIELD_KWH[u] || 1) : 0, why: s && s.state === 'unavailable' ? NA : ND, ds: df.format(d), dn: H.DAYS[d.getUTCDay()] }; });
    const ok = days.filter((x) => x.has), mx = Math.max(0.001, ...ok.map((x) => x.k));
    /* wyświetlana jednostka: z opcji albo pierwszego czujnika z wartością; wartości przeliczone z kWh na nią */
    const su = (ok[0] || days.find((x) => x.u) || {}).u, unit = c.unit || su || 'kWh', uf = HG_YIELD_KWH[su] || 1, fv = (k) => H.fmt(k / uf, dec);
    const cp = this._cap(), cap = cp && cp.kw;
    const th = hgYieldTh(c, cap, D), [div, g, p] = th.abs ? [1, th.good, th.poor] : cap ? [cap, th.good, th.poor] : [mx, 0.75, 0.4];
    days.forEach((x) => { const r = x.k / div; x.lv = x.has ? (r >= g ? 'good' : r < p ? 'poor' : 'average') : null; x.txt = x.has ? `${fv(x.k)} ${H.esc(unit)} · ${H.esc(LN[x.lv])}` : H.esc(x.why); });
    const best = ok.reduce((a, x) => (!a || x.k > a.k ? x : a), null), top = best && best.k > 0 ? best : null;
    const tot = ok.reduce((a, x) => a + x.k, 0), sel = this._sel;
    const cols = days.map((x) => {
      const bar = !x.has ? `<i class="nd" title="${H.esc(x.why)}"></i>` : `<i class="${x.k > 0 ? '' : 'z'}" style="animation-delay:${x.i * 35}ms"></i>`;
      const tip = sel === x.i ? `<span class="tip">${H.esc(x.ds)}<br>${x.has ? `<i></i><b>${fv(x.k)} ${H.esc(unit)}</b> · ${H.esc(LN[x.lv])}${cap ? `<br>${hgT('cards.yield.per_kw', { value: H.fmt(x.k / cap, 2) })}` : ''}` : H.esc(x.why)}</span>` : '';
      const dn = x.today ? `<span class="ln">${hgT('common.today_lower')}</span><span class="sn">${x.dn}</span>` : x.dn;
      return `<button class="d${sel === x.i ? ' sel' : ''}${x.today ? ' today' : ''}${top === x ? ' best' : ''}" data-act="day" data-i="${x.i}" style="--c:${x.lv ? HG_YIELD_LV[x.lv] : '#C3C6CA'}" aria-pressed="${sel === x.i}" aria-label="${H.lv(H.esc(x.ds), x.txt)}">${tip}<span class="bs"><span class="bw"><span class="pr" style="height:${x.has ? (x.k / mx) * 100 : 0}%">${x.has ? `<span class="val">${fv(x.k)}</span>` : ''}${bar}</span></span></span><small>${dn}</small></button>`;
    }).join('');
    const pill = top ? `<span class="lv ${top.lv}" style="--c:${HG_YIELD_LV[top.lv]}">${H.lv(hgT('cards.yield.best_day'), H.esc(top.today ? hgT('common.today_lower') : top.dn))}</span>` : '';
    const lg = `<div class="lg">${['good', 'average', 'poor'].map((k) => `<span style="--c:${HG_YIELD_LV[k]}"><i></i>${H.esc(LN[k])}</span>`).join('')}</div>`;
    const note = cp && cp.off ? `<div class="note" title="${hgT('cards.yield.reference_unavailable_hint')}"><i></i>${hgT('cards.yield.reference_unavailable')}</div>` : '';
    return `<ha-card class="glass">${hd}
      <div class="sum"><b>${ok.length ? fv(tot) : '–'}<em>${H.esc(unit)} · ${hgT('cards.yield.days_count', { count: days.length })}</em></b>${pill}</div>
      ${lg}<div class="ch${days.length > 7 ? ' many' : ''}" style="--n:${days.length}">${cols}</div>${note}</ha-card>`;
  }
  onAct(a, t) { if (a === 'day') { const i = Number(t.dataset.i); this._sel = this._sel === i ? null : i; this.rerender(); } }
  getGridOptions() { return { columns: 12, rows: 4 }; }
}
hgReg('hg-yield-card', HGYieldCard, hgTLazy('cards.yield.picker_name'), hgTLazy('cards.yield.picker_description'));
