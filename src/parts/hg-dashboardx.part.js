/* Dashboard preferences reuse the native layout store and save permissions. */
const HGDashboard = window.HGDashboard = {
  cards: [], draft: null,
  keys(cards) {
    const seen = {};
    return cards.map((c) => { const k = `${String(c.type || '').replace('custom:', '')}|${c._hgid || c.entity || (c.entities && c.entities[0]) || c.title || c.area || ''}`; seen[k] = (seen[k] || 0) + 1; return seen[k] > 1 ? `${k}#${seen[k]}` : k; });
  },
  catalog() {
    const L = HGL.get('dashboard'), tl = HGL.get('dashboard:tiles'), keys = this.keys(this.cards);
    let cards = this.cards.map((c, i) => ({ ...c, _k: keys[i] }));
    for (const x of tl.added || []) if (x.c && customElements.get(x.c)) cards.push({ type: 'custom:hg-tiles-card', _k: '+' + x.e, title: x.n || (x.cfg || {}).title || x.e });
    if ((tl.added || []).some((x) => !x.c)) cards.push({ type: 'custom:hg-tiles-card', _k: '_tiles', title: hgT('edit.tiles_card.picker_name') });
    cards = cards.map((c) => (L.conf[c._k] || {}).n ? { ...c, title: L.conf[c._k].n } : c);
    return HGL.sort(cards, (c) => c._k, L.order);
  },
  health(h, exclude = []) {
    const hidden = new Set(exclude), rows = [];
    for (const [e, s] of Object.entries(h.states || {})) {
      const r = (h.entities || {})[e] || {}, a = s.attributes || {}, dc = a.device_class;
      if (hidden.has(e) || r.hidden || r.hidden_by || r.disabled_by || r.entity_category === 'config') continue;
      if (e.startsWith('binary_sensor.') && ['door', 'window', 'opening', 'garage_door'].includes(dc)) {
        if (s.state === 'on') rows.push({ e, kind: 'open', icon: 'mdi:door-open' });
        else if (['unknown', 'unavailable'].includes(s.state)) rows.push({ e, kind: 'offline', icon: 'mdi:lan-disconnect' });
      } else if (e.startsWith('sensor.') && dc === 'battery' && a.unit_of_measurement === '%' && s.state.trim() !== '' && Number.isFinite(Number(s.state)) && Number(s.state) <= 20)
        rows.push({ e, kind: 'battery', icon: 'mdi:battery-alert-variant-outline' });
      else if (/^(sensor|binary_sensor)\./.test(e) && ['temperature', 'humidity', 'battery', 'connectivity', 'problem', 'smoke', 'gas', 'moisture'].includes(dc) && ['unknown', 'unavailable'].includes(s.state))
        rows.push({ e, kind: 'offline', icon: 'mdi:lan-disconnect' });
      else if (e.startsWith('binary_sensor.') && ['battery', 'problem', 'smoke', 'gas', 'moisture', 'safety'].includes(dc) && s.state === 'on')
        rows.push({ e, kind: dc === 'battery' ? 'battery' : 'alert', icon: 'mdi:alert-outline' });
    }
    return rows.sort((a, b) => ({ alert: 0, open: 1, battery: 2, offline: 3 }[a.kind] - { alert: 0, open: 1, battery: 2, offline: 3 }[b.kind]) || a.e.localeCompare(b.e));
  },
  nightRange(now, start, end) {
    if (!/^\d{2}:\d{2}$/.test(start || '') || !/^\d{2}:\d{2}$/.test(end || '')) return false;
    const mins = (s) => { const [h, m] = s.split(':').map(Number); return h < 24 && m < 60 ? h * 60 + m : NaN; };
    const a = mins(start), b = mins(end), n = now.getHours() * 60 + now.getMinutes();
    return Number.isFinite(a) && Number.isFinite(b) && a !== b && (a < b ? n >= a && n < b : n >= a || n < b);
  },
  energyDelta(rows, from, to) {
    const points = rows.map((r) => ({ t: typeof r.end === 'number' ? r.end : Date.parse(r.end), v: r.sum }))
      .filter((r) => Number.isFinite(r.t) && typeof r.v === 'number' && Number.isFinite(r.v)).sort((a, b) => a.t - b.t);
    const before = points.filter((r) => r.t <= from).at(-1), after = points.filter((r) => r.t > from && r.t <= to).at(-1);
    return before && after && after.v >= before.v ? after.v - before.v : null;
  },
  roomGroup(key, html, sections) {
    const section = sections.find((s) => s[1] === key);
    return section ? (section[0] === 'light' ? 'light' : section[0] === 'clim' ? 'clim' : ['sens', 'door', 'mot'].includes(section[0]) ? 'sens' : 'devices') : /data-ac=/.test(html) ? 'clim' : /glass chips|class="unh/.test(html) ? 'sens' : 'devices';
  },
  html(page) {
    if (!page._canEdit()) return '';
    if (!this.draft) this.draft = JSON.parse(JSON.stringify(HGL.get('dashboard')));
    const L = this.draft, keys = page._keys(this.cards), rows = HGL.sort(this.cards.map((c, i) => ({ c, k: keys[i] })), (x) => x.k, L.order);
    const energy = this.energyDraft ?? ((HGL.data.wiz || {}).homeEnergy) ?? '';
    return `<section class="lk-g lx rx" data-tab="home" data-pg="home"><h4>${H.icon('mdi:view-dashboard-outline')}${hgT('dashboardx.personalize')}</h4><small class="lk-hn">${hgT('dashboardx.personalize_help')}</small>
      <div class="lx-l">${rows.map(({ c, k }, i) => `<div class="lx-r"><span class="lx-t"><b>${H.esc(c.title || c.entity || c.type)}</b></span>
        <button class="lx-a" data-hge="home-up" data-k="${H.esc(k)}" ${i ? '' : 'disabled'} aria-label="${hgT('lookr.move_up')}">${H.icon('mdi:chevron-up')}</button>
        <button class="lx-a" data-hge="home-down" data-k="${H.esc(k)}" ${i < rows.length - 1 ? '' : 'disabled'} aria-label="${hgT('lookr.move_down')}">${H.icon('mdi:chevron-down')}</button>
        <button class="lx-hbtn" data-hge="home-size" data-k="${H.esc(k)}">${(L.size[k] ? L.size[k] === 'l' : c.span === 'full') ? hgT('dashboardx.full') : hgT('dashboardx.half')}</button>
        <button class="lx-sw" role="switch" data-hge="home-toggle" data-k="${H.esc(k)}" aria-label="${H.esc(c.title || c.entity || c.type)}" aria-checked="${!L.hidden.includes(k) && (!c.home_optional || !!(L.conf[k] || {}).home_visible)}"><i></i></button></div>`).join('')}</div>
      <div class="rx-f"><span>${hgT('dashboardx.energy_source')}</span><select name="home-energy"><option value="">${hgT('dashboardx.energy_auto')}</option>${Object.keys(page._hass.states).filter((e) => e.startsWith('sensor.') && page._hass.states[e].attributes.device_class === 'energy' && ['Wh', 'kWh', 'MWh'].includes(page._hass.states[e].attributes.unit_of_measurement)).map((e) => `<option value="${H.esc(e)}"${e === energy ? ' selected' : ''}>${H.esc(H.name(page._hass, e))}</option>`).join('')}</select></div>
      <button class="lk-mini" data-hge="home-save">${hgT('common.save')}</button><small class="lk-hn">${hgT('dashboardx.scope_help')}</small></section>`;
  },
  async act(page, b, a) {
    if (!page._canEdit()) return;
    const L = this.draft, k = b.dataset.k;
    if (a === 'home-toggle') {
      const card = this.cards[page._keys(this.cards).indexOf(k)], visible = !L.hidden.includes(k) && (!card.home_optional || !!(L.conf[k] || {}).home_visible);
      L.hidden = visible ? [...new Set([...L.hidden, k])] : L.hidden.filter((x) => x !== k);
      L.conf[k] = Object.assign({}, L.conf[k], { home_visible: !visible });
    }
    if (a === 'home-size') { const c = this.cards[page._keys(this.cards).indexOf(k)]; L.size[k] = (L.size[k] ? L.size[k] === 'l' : c && c.span === 'full') ? 's' : 'l'; }
    if (a === 'home-up' || a === 'home-down') {
      const keys = page._keys(this.cards), order = HGL.sort(keys, (x) => x, L.order), i = order.indexOf(k), j = i + (a === 'home-up' ? -1 : 1);
      if (i >= 0 && j >= 0 && j < order.length) { [order[i], order[j]] = [order[j], order[i]]; L.order = order; }
    }
    if (a === 'home-save') {
      const select = page._eSheetEl.querySelector('[name=home-energy]');
      HGL.data.wiz = Object.assign({}, HGL.data.wiz, { homeEnergy: select ? select.value : '' });
      HGL.set('dashboard', L); if (window.HGDraft) { HGDraft.defer(page, { reload: true }); this.draft = null; this.energyDraft = null; page._eToast(hgT('settings.applies_on_save')); return page._eLook(); } const saved = await HGL.save(page._hass); page._eSnap = JSON.stringify(HGL.data); this.draft = null; this.energyDraft = null;
      page._eToast(saved === 'ha' ? hgT('edit.settings_saved') : hgT('lookr.saved_on_this_device')); page._eSheet(false); return page._eRefresh(true);
    }
    // Preserve the source selection while rerendering the card list.
    const input = page._eSheetEl.querySelector('[name=home-energy]'); this.energyDraft = input ? input.value : this.energyDraft;
    return page._eLook();
  }
};

class HGHealthCard extends HGBase {
  defaults() { return { title: hgT('dashboardx.health'), exclude: [] }; }
  ents() { return Object.keys(this._hass.states).filter((e) => /^(sensor|binary_sensor)\./.test(e)); }
  css() { return U(`ha-card.glass{padding:var(--s2);display:flex;flex-direction:column;gap:8px}.issues{display:grid;gap:4px;max-height:210px;overflow:auto}.issue{display:flex;align-items:center;gap:10px;min-height:44px;text-align:left;padding:6px;border-radius:12px}.issue span{flex:1;min-width:0}.issue b{display:block;overflow-wrap:anywhere}.issue small{opacity:.7}.issue ha-icon{width:22px;height:22px}.count{font-size:var(--fs-sm);opacity:.8}`); }
  render() {
    const rows = HGDashboard.health(this._hass, this._config.exclude);
    const labels = { open: hgT('dashboardx.open'), offline: hgT('dashboardx.offline'), battery: hgT('dashboardx.battery'), alert: hgT('dashboardx.alert') };
    return `<ha-card class="glass"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;min-width:0">${hgUI.header(this._config.title, { sub: '', right: '' })}<span class="count">${rows.length ? hgT('dashboardx.issue_count', { count: rows.length }) : hgT('dashboardx.all_clear')}</span></div>${rows.length ? `<button class="issue" data-act="expand" aria-expanded="${!!this._expanded}" aria-label="${this._expanded ? hgT('common.close') : hgT('cards.people.details')}">${H.icon('mdi:information-outline')}</button>` : ''}</div>${this._expanded ? `<div class="issues">${rows.map((r) => `<button class="issue" data-act="more" data-e="${H.esc(r.e)}">${H.icon(r.icon)}<span><b>${H.esc(H.name(this._hass, r.e))}</b><small>${H.esc(labels[r.kind])}</small></span></button>`).join('')}</div>` : ''}</ha-card>`;
  }
  onAct(a, el) { if (a === 'more') H.fire(this, 'hass-more-info', { entityId: el.dataset.e }); if (a === 'expand') { this._expanded = !this._expanded; this.rerender(); } }
}
hgReg('hg-health-card', HGHealthCard, hgTLazy('dashboardx.health'), hgTLazy('dashboardx.health_desc'));

class HGDailyEnergyCard extends HGBase {
  defaults() { return { title: hgT('dashboardx.daily_energy'), entity: '' }; }
  ents() { return []; }
  _extraSig() { return [Math.floor(Date.now() / 300000), ((HGL.data.wiz || {}).homeEnergy) || this._config.entity]; }
  css() { return U(`ha-card.glass{padding:var(--s2);display:flex;flex-direction:column;gap:12px}.ev{display:flex;align-items:baseline;gap:6px}.ev b{font-size:32px;font-weight:300}.ev small{opacity:.7}.ec{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ec span{display:block;font-size:var(--fs-sm);opacity:.75}.ec b{font-size:var(--fs-md)}.note{font-size:var(--fs-sm);opacity:.7;white-space:normal;overflow-wrap:anywhere}.empty{white-space:normal}.empty{min-height:44px}.refresh{min-height:44px;align-self:start}`); }
  async _load() {
    if (this._loading || !this.isConnected) return;
    const key = JSON.stringify(this._extraSig()); if (this._loaded === key) return;
    this._loading = true; const token = this._requestToken = (this._requestToken || 0) + 1;
    try {
      let ids = [((HGL.data.wiz || {}).homeEnergy) || this._config.entity].filter(Boolean);
      if (!ids.length) { const p = await this._hass.callWS({ type: 'energy/get_prefs' }); ids = [...new Set((p.energy_sources || []).filter((s) => s.type === 'grid').flatMap((s) => (s.flow_from || []).map((f) => f.stat_energy_from)).filter(Boolean))]; }
      if (!ids.length) { this._result = { missing: true }; return; }
      const now = new Date(), today = new Date(now); today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const sameTime = new Date(now); sameTime.setDate(sameTime.getDate() - 1);
      const start = new Date(yesterday); start.setHours(start.getHours() - 2);
      const stats = await this._hass.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(), end_time: now.toISOString(), period: 'hour', statistic_ids: ids, types: ['sum'], units: { energy: 'kWh' } });
      const sum = (from, to) => { const parts = ids.map((id) => HGDashboard.energyDelta(stats[id] || [], +from, +to)); return parts.every((v) => v != null) ? parts.reduce((a, b) => a + b, 0) : null; };
      if (token === this._requestToken) this._result = { today: sum(today, now), yesterday: sum(yesterday, sameTime), ids };
    } catch (e) { if (token === this._requestToken) this._result = { error: true }; }
    finally { if (token === this._requestToken) { this._loaded = key; this._loading = false; this.rerender(); } }
  }
  render() {
    this._load(); const r = this._result, fmt = (v) => v == null ? '—' : H.fmt(v, 2), change = r && r.today != null && r.yesterday > 0 ? (r.today - r.yesterday) / r.yesterday * 100 : null;
    return `<ha-card class="glass">${hgUI.header(this._config.title, { sub: '', right: '' })}${!r ? `<span class="empty">${hgT('dashboardx.loading')}</span>` : r.missing ? `<span class="empty">${hgT('dashboardx.energy_choose')}</span>` : r.error ? `<span class="empty">${hgT('dashboardx.energy_error')}</span>` : `<div class="ev"><b>${fmt(r.today)}</b><small>kWh · ${hgT('common.today')}</small></div><div class="ec"><div><span>${hgT('dashboardx.yesterday_same')}</span><b>${fmt(r.yesterday)} kWh</b></div><div><span>${hgT('dashboardx.change')}</span><b>${change == null ? '—' : (change > 0 ? '+' : '') + H.fmt(change, 1) + '%'}</b></div></div><small class="note">${hgT('dashboardx.hourly_note')}</small>`}<button class="refresh" data-act="refresh">${hgT('dashboardx.refresh')}</button></ha-card>`;
  }
  onAct(a) { if (a === 'refresh') { this._loaded = null; this._load(); } }
}
hgReg('hg-daily-energy-card', HGDailyEnergyCard, hgTLazy('dashboardx.daily_energy'), hgTLazy('dashboardx.energy_desc'));

