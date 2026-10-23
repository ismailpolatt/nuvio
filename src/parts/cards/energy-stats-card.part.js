/* --- hg-energy-stats-card: dziś / ten tydzień / ten miesiąc (jak panel Energia HA) + wykres z przełącznikiem dzień/tydzień/miesiąc --- */
class HGEnergyStatsCard extends HGBase {
  defaults() {
    return { title: hgT('cards.energy_stats.consumption_and_production'), icon: 'mdi:chart-bar', consumption: null, production: null, price: null, currency: 'zł',
      colors: { consumption: 'var(--hg-accent)', production: 'var(--hg-accent)' }, link: '/energy' };
  }
  setConfig(c) { super.setConfig(hgDeep(this.defaults(), c)); }
  ents() { return []; }
  _extraSig() { return [this._d ? this._d.t : 0, this._mode || 'week', this._sel]; }
  connectedCallback() { super.connectedCallback(); this._load(); clearInterval(this._iv); this._iv = setInterval(() => this._load(true), 5 * 60 * 1000); }
  disconnectedCallback() { clearInterval(this._iv); }
  set hass(h) { const first = !this._hass; this._hass = h; if (first) this._load(); this._update(); }
  get hass() { return this._hass; }
  async _load(force) {
    const c = this._config, h = this._hass; if (!h || !c || this._loading) return; this._loading = true;
    try {
      let pr = {}; try { pr = await HGEnergyPrefs.get(h); } catch (e) { /* bez prefs -> konfiguracja karty */ }
      const L = (x) => [].concat(x || []).filter(Boolean), cons = L(c.consumption).length ? L(c.consumption) : L(pr.consumption), prod = L(c.production).length ? L(c.production) : L(pr.production),   /* z galerii: jedna encja jako tekst */
      price = c.price != null ? c.price : pr.price;
      const ids = cons.concat(prod), tz = HGStats.tz(h), now = Date.now();
      const t0 = HGStats.midnight(now, tz), key = HGStats.key(new Date(now), tz), [y, mo, da] = key.split('-').map(Number);
      const dow = (new Date(Date.UTC(y, mo - 1, da)).getUTCDay() + 6) % 7;            // 0 = poniedziałek (tydzień jak w HA)
      const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
      const nDays = Math.max(da, dow + 1);
      if (force) delete HGStats.cache[ids.join(',') + nDays];
      const daily = await HGStats.daily(h, ids, nDays);
      const hr = await h.callWS({ type: 'recorder/statistics_during_period', start_time: new Date(t0).toISOString(), statistic_ids: ids, period: 'hour', types: ['change'], units: { energy: 'kWh' } });
      const hours = [...Array(24)].map((_, i) => ({ c: 0, p: 0, hc: false, hp: false }));
      const hourOf = (ms) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(new Date(ms)));
      for (const id of ids) for (const row of hr[id] || []) { const t = typeof row.start === 'number' ? row.start : Date.parse(row.start); const k = hourOf(t); if (!hours[k]) continue;
        if (cons.includes(id)) { hours[k].c += Math.max(0, row.change || 0); hours[k].hc = true; } else { hours[k].p += Math.max(0, row.change || 0); hours[k].hp = true; } }
      const day = (k, set) => set.reduce((a, id) => a + Math.max(0, (daily.byId[id] || {})[k] || 0), 0);
      const has = (k, set) => set.some((id) => daily.present[id] && daily.present[id].has(k));
      const D = daily.days.map((d) => ({ d, k: d.__k, c: day(d.__k, cons), p: day(d.__k, prod), hc: has(d.__k, cons), hp: has(d.__k, prod) }));
      const sum = (arr, f) => arr.reduce((a, x) => a + x[f], 0);
      const today = D[D.length - 1], week = D.slice(-(dow + 1)), month = D.slice(-da);
      // ostatni dzień z produkcją (do notki o falowniku)
      const lastP = [...D].reverse().find((x) => x.hp && x.p > 0);
      this._d = { t: now, cons, prod, price, dow, dim, da, y, mo, hours, D, today, week, month, lastP,
        tot: { day: [today.c, today.p], week: [sum(week, 'c'), sum(week, 'p')], month: [sum(month, 'c'), sum(month, 'p')] },
        hasP: { day: today.hp, week: week.some((x) => x.hp), month: month.some((x) => x.hp) } };
      this._err = null;
    } catch (e) { this._err = String((e && e.message) || e); }
    this._loading = false; this.rerender();
  }
  css() {
    return HG_TIP_CSS + U(`
ha-card.glass{ display:flex; flex-direction:column; gap:var(--s2); padding:var(--s2) var(--s3) var(--s2); }
.tiles{ display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:var(--s1); }
@container (max-width: 330px){ ha-card.glass{ padding:var(--s2); } .tiles{ grid-template-columns:minmax(0, 1fr); } .tl{ flex-direction:row; flex-wrap:wrap; align-items:center; column-gap:var(--s2); } .tl small{ flex:1 0 100%; } .tl .r span{ display:none; } }
.tl{ display:flex; flex-direction:column; gap:3u; padding:var(--s1) var(--s2); border-radius:var(--r-sm); background:rgba(255,255,255,.55); text-align:left; min-width:0; position:relative; transition:background .2s; }
.tl.sel{ background:rgba(255,255,255,.9); box-shadow:var(--hg-sh); }
.tl small{ font-size:var(--fs-xs); color:#5A5E64; font-weight:400; }
.tl .r{ display:flex; align-items:baseline; gap:4u; font-variant-numeric:tabular-nums; white-space:nowrap; }
.tl .r i{ width:6u; height:6u; border-radius:50%; background:var(--c); flex:none; align-self:center; }
.tl .r b{ font-size:var(--fs-md); font-weight:600; letter-spacing:-.01em; } .tl .r span{ font-size:var(--fs-xs); color:#5A5E64; }
.tl .r.p b{ font-size:var(--fs-md); font-weight:400; }
.tl .cost{ font-size:var(--fs-xs); color:#4A4E54; }
.sw{ display:flex; gap:2u; padding:2u; border-radius:var(--r-sm); background:rgba(118,118,128,.12); }
.sw button{ position:relative; padding:0 var(--s2); height:max(calc(var(--k) * 22), var(--hg-tgt, 0px)); border-radius:calc(var(--r-sm) - 2u); font-size:var(--fs-xs); font-weight:400; color:#4A4E54; }
.sw button.act{ background:#fff; color:#16181B; font-weight:600; box-shadow:var(--hg-sh-sm); }
.lg{ display:flex; gap:var(--s2); font-size:var(--fs-xs); color:#5A5E64; align-items:center; } .lg i{ display:inline-block; width:6u; height:6u; border-radius:50%; margin-right:4u; }
.ch{ position:relative; flex:1; min-height:120u; max-height:230u; display:grid; grid-template-columns:repeat(var(--n), minmax(0, 1fr)); gap:var(--g); }
.ch::after{ content:''; position:absolute; left:0; right:0; bottom:13u; height:1px; background:rgba(30,32,36,.12); pointer-events:none; }
.d{ position:relative; display:flex; flex-direction:column; align-items:center; gap:3u; min-width:0; border-radius:var(--r-sm); }
.d.sel{ background:rgba(255,255,255,.45); }
.bs{ position:relative; flex:1; width:100%; }
.bw{ position:absolute; left:0; right:0; top:4u; bottom:0; display:flex; align-items:flex-end; justify-content:center; gap:var(--bg); }
.bw i{ display:block; width:var(--bw); max-width:9u; height:var(--h); min-height:1px; border-radius:3u 3u 1px 1px; background:var(--c); transform-origin:bottom; animation:hgbar .5s cubic-bezier(.2,.8,.2,1) both; }
.bw i.z{ height:0; min-height:0; } .bw i.nd{ width:4u; height:4u; min-height:0; border-radius:50%; background:#A9ADB2; animation:none; margin-bottom:-2u; }
.fut .bw{ opacity:.0; } .today .bw i{ opacity:.55; }
.d small{ font-size:max(7.5u, var(--hg-fs-min, 0px)); color:#5A5E64; line-height:10u; height:10u; white-space:nowrap; } .d.today small{ color:#16181B; font-weight:600; }
.d.lbl-skip small{ visibility:hidden; }
.tip{ bottom:calc(100% - 6u); }
.d.l .tip{ left:0; transform:none; } .d.r .tip{ left:auto; right:0; transform:none; }
.ft{ display:flex; align-items:center; gap:var(--s1); font-size:var(--fs-xs); color:#6A6E74; flex-wrap:wrap; }
.ft a{ margin-left:auto; color:var(--hg-accent-tx); font-weight:600; text-decoration:none; display:flex; align-items:center; gap:3u; min-height:var(--hg-tgt, 0px); } .ft a ha-icon{ width:12u; height:12u; }
.ctl{ display:flex; align-items:center; gap:var(--s2); flex-wrap:wrap; justify-content:space-between; }
`);
  }
  _bars() {
    const d = this._d, m = this._mode || 'week', DAYS = H.DAYS;
    if (m === 'day') {
      const nowH = Number(new Intl.DateTimeFormat('en-GB', { timeZone: HGStats.tz(this._hass), hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
      return d.hours.map((x, i) => ({ lbl: String(i), skip: i % 3 !== 0, c: x.c, p: x.p, hc: x.hc, hp: x.hp, fut: i > nowH, today: i === nowH, name: `${i}:00–${i + 1}:00` }));
    }
    if (m === 'week') {
      const wk = d.week;
      return [...Array(7)].map((_, i) => { const x = wk[i]; return x ? { lbl: DAYS[x.d.getDay()], c: x.c, p: x.p, hc: x.hc, hp: x.hp, today: i === wk.length - 1, name: x.d.toLocaleDateString(HG_LOC(), { weekday: 'long', day: 'numeric', month: 'long' }) }
        : { lbl: DAYS[(i + 1) % 7], fut: true, c: 0, p: 0, name: '' }; });
    }
    const mo = d.month;
    return [...Array(d.dim)].map((_, i) => { const x = mo[i]; return x ? { lbl: String(i + 1), skip: (i + 1) % 5 !== 0 && i !== 0, c: x.c, p: x.p, hc: x.hc, hp: x.hp, today: i === mo.length - 1, name: x.d.toLocaleDateString(HG_LOC(), { weekday: 'long', day: 'numeric', month: 'long' }) }
      : { lbl: String(i + 1), skip: (i + 1) % 5 !== 0, fut: true, c: 0, p: 0, name: '' }; });
  }
  render() {
    const c = this._config, col = c.colors;
    const hd = `<div class="hd">${H.icon(c.icon, 'ic')}<span class="tt">${H.esc(c.title)}</span></div>`;
    if (this._err) return `<ha-card class="glass">${hd}<div class="ph"><b>${hgT('common.no_data_source')}</b>${H.esc(this._err)}</div></ha-card>`;
    if (!this._d) return `<ha-card class="glass">${hd}<div class="ph">${hgT('cards.energy_stats.loading_statistics')}</div></ha-card>`;
    const d = this._d, m = this._mode || 'week', price = d.price;
    const T = [['day', hgT('common.today')], ['week', hgT('cards.energy_stats.this_week')], ['month', hgT('cards.energy_stats.this_month')]];
    const tiles = T.map(([k, l]) => { const [cv, pv] = d.tot[k];
      return `<button class="tl ${m === k ? 'sel' : ''}" data-act="mode" data-m="${k}" aria-pressed="${m === k}" aria-label="${H.lv(l, `${hgT('cards.energy_stats.consumption')} ${H.fmt(cv, 1)} kWh, ${hgT('cards.energy_stats.production')} ${H.fmt(pv, 1)} kWh`)}">
        <small>${l}</small><span class="r" style="--c:${col.consumption}"><i></i><b>${H.fmt(cv, cv < 10 ? 2 : 1)}</b><span>kWh</span></span>
        <span class="r p" style="--c:${col.production}"><i></i>${d.hasP[k] ? `<b>${H.fmt(pv, pv < 10 ? 2 : 1)}</b><span>kWh PV</span>` : `<b>–</b><span>${hgT('cards.energy_stats.pv_no_data')}</span>`}</span>
        ${price != null ? `<span class="cost">≈ ${H.fmt(cv * price, 2)} ${H.esc(c.currency)}</span>` : ''}</button>`; }).join('');
    const bars = this._bars(), n = bars.length;
    const mx = Math.max(0.001, ...bars.map((b) => Math.max(b.c, b.p)));
    const bw = m === 'month' ? 'calc(var(--k) * 3.2)' : m === 'day' ? 'calc(var(--k) * 4)' : 'calc(var(--k) * 8)';
    const sel = this._sel;
    const cols = bars.map((b, i) => {
      const bar = (v, hasV, cc) => (b.fut ? '' : !hasV ? `<i class="nd"></i>` : `<i class="${v <= 0 ? 'z' : ''}" style="--c:${cc};--h:${((v / mx) * 100).toFixed(1)}%;animation-delay:${Math.min(i * 15, 300)}ms"></i>`);
      const tip = sel === i && !b.fut ? `<span class="tip">${H.esc(b.name)}<br><i style="background:${col.consumption}"></i>${H.lv(hgT('cards.energy_stats.consumption_title'), `<b>${b.hc ? H.fmt(b.c, 2) + ' kWh' : hgT('common.no_data')}</b>`)}<br><i style="background:${col.production}"></i>${H.lv(hgT('cards.energy_stats.production_title'), `<b>${b.hp ? H.fmt(b.p, 2) + ' kWh' : hgT('common.no_data')}</b>`)}${price != null && b.hc ? `<br>${hgT('cards.energy_stats.cost')} ≈ <b>${H.fmt(b.c * price, 2)} ${H.esc(c.currency)}</b>` : ''}</span>` : '';
      const side = i < n * 0.2 ? 'l' : i > n * 0.8 ? 'r' : '';
      return `<button class="d ${side} ${b.today ? 'today' : ''} ${b.fut ? 'fut' : ''} ${b.skip ? 'lbl-skip' : ''} ${sel === i ? 'sel' : ''}" data-act="bar" data-i="${i}" ${b.fut ? 'disabled tabindex="-1"' : ''} aria-label="${b.fut ? H.esc(b.name || b.lbl) : H.lv(H.esc(b.name || b.lbl), `${hgT('cards.energy_stats.consumption')} ${H.fmt(b.c, 2)} kWh, ${hgT('cards.energy_stats.production')} ${b.hp ? H.fmt(b.p, 2) + ' kWh' : hgT('common.no_data')}`)}">${tip}<span class="bs"><span class="bw">${bar(b.c, b.hc, col.consumption)}${bar(b.p, b.hp, col.production)}</span></span><small>${b.today ? (m === 'day' ? hgT('common.now') : hgT('common.today_lower')) : b.lbl}</small></button>`;
    }).join('');
    const sw = `<div class="sw" role="tablist">${T.map(([k, l]) => `<button role="tab" class="${m === k ? 'act' : ''}" data-act="mode" data-m="${k}" aria-selected="${m === k}">${{ day: hgT('cards.energy_stats.tab_day'), week: hgT('cards.energy_stats.tab_week'), month: hgT('cards.energy_stats.tab_month') }[k]}</button>`).join('')}</div>`;
    const anyNd = bars.some((b) => !b.fut && !b.hp);
    return `<ha-card class="glass">${hd}<div class="tiles">${tiles}</div>
      <div class="ctl">${sw}<span class="lg"><span><i style="background:${col.consumption}"></i>${hgT('cards.energy_stats.grid_consumption')}</span><span><i style="background:${col.production}"></i>${hgT('cards.energy_stats.pv_production')}</span></span></div>
      <div class="ch" style="--n:${n};--g:${m === 'week' ? 'calc(var(--k) * 6)' : '1px'};--bw:${bw};--bg:${m === 'week' ? 'calc(var(--k) * 3)' : '1px'}">${cols}</div>
      <div class="ft">${anyNd ? `<span>● ${hgT('cards.energy_stats.grey_dot_no_inverter')}</span>` : ''}${price != null ? `<span>${hgT('cards.energy_stats.price')} ${H.fmt(price, 2)} ${H.esc(c.currency)}/kWh ${hgT('cards.energy_stats.from_energy_settings')}</span>` : ''}
        <a href="${H.esc(c.link)}" data-act="link">${hgT('cards.energy_stats.ha_energy_dashboard')} ${H.icon('mdi:arrow-top-right')}</a></div></ha-card>`;
  }
  onAct(a, t, e) {
    if (a === 'mode') { this._mode = t.dataset.m; this._sel = null; return this.rerender(); }
    if (a === 'bar') { const i = Number(t.dataset.i); this._sel = this._sel === i ? null : i; return this.rerender(); }
    if (a === 'link') { e.preventDefault(); H.navigate(this._config.link); }
  }
  getCardSize() { return 7; }
}
hgReg('hg-energy-stats-card', HGEnergyStatsCard, hgTLazy('cards.energy_stats.picker_name'), hgTLazy('cards.energy_stats.picker_description'));
