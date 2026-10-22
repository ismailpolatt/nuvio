const HG_CONTROL_TEXT = hgTO({}, { title: 'controlx.title', description: 'controlx.description', favorites: 'controlx.favorites', modes: 'controlx.modes', energy: 'controlx.energy', tablet: 'controlx.tablet', profile: 'controlx.profile', edit_favorites: 'controlx.edit_favorites', limit: 'controlx.limit', favorites_empty: 'controlx.favorites_empty', mode_home: 'controlx.mode_home', mode_away: 'controlx.mode_away', mode_movie: 'controlx.mode_movie', mode_sleep: 'controlx.mode_sleep', steps: 'controlx.steps', preview: 'controlx.preview', configure: 'controlx.configure', mode_help: 'controlx.mode_help', no_change: 'controlx.no_change', before_run: 'controlx.before_run', partial_help: 'controlx.partial_help', execute: 'controlx.execute', completed: 'controlx.completed', failed: 'controlx.failed', saved: 'controlx.saved', invalid: 'controlx.invalid', daily: 'controlx.daily', weekly: 'controlx.weekly', last_weeks: 'controlx.last_weeks', last_days: 'controlx.last_days', history: 'controlx.history', total: 'controlx.total', estimate: 'controlx.estimate', history_help: 'controlx.history_help', top_devices: 'controlx.top_devices', meters_help: 'controlx.meters_help', device_note: 'controlx.device_note', tariff: 'controlx.tariff', rate: 'controlx.rate', currency: 'controlx.currency', estimate_help: 'controlx.estimate_help', meters: 'controlx.meters', connection: 'controlx.connection', browser: 'controlx.browser', online: 'controlx.online', offline: 'controlx.offline', connection_lost: 'controlx.connection_lost', tablet_battery: 'controlx.tablet_battery', charging: 'controlx.charging', not_charging: 'controlx.not_charging', charging_unknown: 'controlx.charging_unknown', last_update: 'controlx.last_update', tablet_help: 'controlx.tablet_help', battery_low: 'controlx.battery_low', battery_sensor: 'controlx.battery_sensor', charging_sensor: 'controlx.charging_sensor', none: 'controlx.none', personal_help: 'controlx.personal_help', personal_active: 'controlx.personal_active', home_cards: 'controlx.home_cards', visibility: 'controlx.visibility', size: 'controlx.size', inherit: 'controlx.inherit', show: 'controlx.show', hide: 'controlx.hide', visible_people: 'controlx.visible_people', people_help: 'controlx.people_help', lights_on: 'controlx.lights_on', open_contacts: 'controlx.open_contacts', missing_entities: 'controlx.missing_entities', load_failed: 'controlx.load_failed' });
/* Account-owned preferences. Never written into the shared dashboard. */
const HGPersonal = window.HGPersonal = {
  key: 'nuvio_personal_controls_v1', uid: null, data: {}, pending: null, failed: false,
  clean(v) {
    v = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    const ids = (a) => [...new Set((Array.isArray(a) ? a : []).filter((s) => typeof s === 'string'))].slice(0, 100);
    return { favorites: ids(v.favorites).slice(0, 12), hiddenPersons: ids(v.hiddenPersons), active: v.active === true,
      cards: v.cards && typeof v.cards === 'object' && !Array.isArray(v.cards) ? v.cards : {}, order: ids(v.order),
      modes: v.modes && typeof v.modes === 'object' && !Array.isArray(v.modes) ? v.modes : {},
      rate: Number.isFinite(+v.rate) && +v.rate >= 0 ? Math.min(+v.rate, 100000) : 0,
      currency: typeof v.currency === 'string' ? v.currency.slice(0, 8) : 'TRY',
      readAlerts: ids(v.readAlerts), meters: ids(v.meters).slice(0, 12), battery: typeof v.battery === 'string' ? v.battery : '', charging: typeof v.charging === 'string' ? v.charging : '' };
  },
  async load(h) {
    const uid = h.user && h.user.id; if (!uid) return;
    if (uid === this.uid && this.pending) return this.pending;
    this.uid = uid; this.data = this.clean({}); this.failed = false;
    this.pending = h.callWS({ type: 'frontend/get_user_data', key: this.key }).then((r) => {
      if (uid === this.uid) this.data = this.clean(r && r.value);
    }).catch(() => { if (uid === this.uid) this.failed = true; });
    return this.pending;
  },
  async save(h, patch) {
    if (this.failed || !h.user || h.user.id !== this.uid) throw new Error('Account changed or preferences unavailable');
    const uid = this.uid, pending = this.pending, next = this.clean({ ...this.data, ...patch });
    await h.callWS({ type: 'frontend/set_user_data', key: this.key, value: next });
    if (this.uid !== uid || this.pending !== pending) throw new Error('Account changed while saving');
    this.data = next; HGL.notify();
  },
  apply(cards) {
    if (!this.data.active) return cards;
    return HGL.sort(cards.map((c) => {
      const p = this.data.cards[c._k]; if (!p) return c;
      return { ...c, ...(typeof p.visible === 'boolean' ? { _hid: !p.visible } : {}), ...(['s', 'l'].includes(p.size) ? { span: p.size === 'l' ? 'full' : 1, _personalSize: true } : {}) };
    }), (c) => c._k, this.data.order);
  },
  steps(h, rows) {
    if (!Array.isArray(rows) || rows.length > 12) return [];
    if (rows.some((r) => !r || !/^(light|switch)\.[a-z0-9_]+$/.test(r.e) || !['on', 'off'].includes(r.state))) return [];
    return rows.filter((r) => r && /^(light|switch)\.[a-z0-9_]+$/.test(r.e) && ['on', 'off'].includes(r.state)).map((r) => ({ e: r.e, state: r.state, available: H.ok(h.states[r.e]) }));
  },
  room(h, a) {
    const lights = a.lights || [], doors = (a.sec && a.sec.door) || [];
    return { on: lights.filter((e) => h.states[e] && h.states[e].state === 'on').length,
      lightMissing: lights.filter((e) => !H.ok(h.states[e])).length,
      open: doors.filter((e) => h.states[e] && h.states[e].state === 'on').length,
      missing: doors.filter((e) => !H.ok(h.states[e])).length, contacts: doors.length };
  },
  days(now, count = 14) { const end = new Date(now); end.setHours(0, 0, 0, 0); return Array.from({ length: count }, (_, i) => { const d = new Date(end); d.setDate(d.getDate() - count + i); const to = new Date(d); to.setDate(to.getDate() + 1); return { from: +d, to: +to }; }); },
  total(stats, ids, from, to) { const v = ids.map((id) => HGDashboard.energyDelta(stats[id] || [], from, to)); return ids.length && v.every((x) => x != null) ? v.reduce((a, b) => a + b, 0) : null; }
};

class HGControlCard extends HGBase {
  defaults() { return { title: hgT('controlx.title') }; }
  ents() { return Object.keys(this._hass.states); }
  _extraSig() { return [HGPersonal.data, this._tab || 'favorites', window.HGLiving ? HGLiving.page(this)?._notif : null, Math.floor(Date.now() / 60000)]; }
  _changed() { if (this._editFav || this._configMode || this._energySettings || this._tab === 'profile' || this._tab === 'tablet' || this._tab === 'exit' || this._livingConfirm) return false; return super._changed(); }
  connectedCallback() { super.connectedCallback(); this._net = () => this.rerender(); window.addEventListener('online', this._net); window.addEventListener('offline', this._net); }
  disconnectedCallback() { window.removeEventListener('online', this._net); window.removeEventListener('offline', this._net); }
  css() { return U(`ha-card.glass{padding:var(--s3);height:auto;min-height:250px;font-size:16px;line-height:1.45}button,input,select{font:inherit}.cx-note,small{font-size:13px}.cx-tabs,.cx-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.cx-tabs button,.cx-actions button,.cx-btn{min-height:44px;padding:8px 16px;border-radius:14px;background:var(--hg-tile-bg)}.cx-tabs [aria-pressed=true],.cx-primary{background:var(--hg-accent)!important;color:var(--hg-on-accent)!important}.cx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px}.cx-box{padding:16px;border-radius:18px;background:var(--hg-tile-bg);min-width:0}.cx-row{display:flex;align-items:center;gap:10px;min-height:48px;border-bottom:1px solid var(--hg-glass-bd);padding:6px 0}.cx-row[hidden]{display:none}.cx-row span{flex:1;min-width:0;overflow-wrap:anywhere}.cx-row small,.cx-note{display:block;opacity:.7;white-space:normal;line-height:1.5}.cx-row button{min-width:44px;min-height:44px}.cx-row input[type=checkbox]{width:22px;height:22px;flex:none}.cx-row ha-icon{--mdc-icon-size:22px;width:22px;height:22px;flex:none}.cx-row > button{display:inline-flex;align-items:center;justify-content:center;flex:none;width:44px;padding:0}.cx-row .cx-select{flex:0 0 140px;max-width:160px;min-width:0}.cx-row select{max-width:160px}.cx-field{display:grid;gap:6px;margin:12px 0}.cx-field input,.cx-field select,.cx-search{min-height:44px;padding:8px;border:1px solid var(--hg-glass-bd);border-radius:12px;background:var(--hg-tile-bg);color:inherit;box-sizing:border-box;width:100%}.cx-list{max-height:420px;overflow:auto}.cx-plot{width:100%;height:210px}.cx-status{min-height:24px;margin:10px 0;white-space:normal}.cx-value{font-size:30px;font-weight:300}.cx-modal{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.75);display:grid;place-items:center;padding:20px}.cx-dialog{background:var(--hg-card-bg,#20252f);border:1px solid var(--hg-glass-bd);color:var(--hg-text,#fff);max-width:560px;width:100%;max-height:85vh;overflow:auto;padding:24px;border-radius:22px}.cx-dialog ul{padding-left:20px;line-height:1.8}.cx-cards .cx-row{display:grid;grid-template-columns:minmax(0,1fr) 44px 140px 140px;gap:8px}.cx-cards .cx-select{width:100%;max-width:none}.cx-cards .cx-select select{width:100%;max-width:none}@media(max-width:700px){.cx-cards .cx-row{grid-template-columns:repeat(2,minmax(0,1fr))}.cx-cards .cx-row>button{justify-self:end}}h3{margin:0 0 12px}.cx-note{margin:10px 0}.cx-row > button.living-text{width:auto;min-width:112px;padding:8px 12px;white-space:nowrap}.living-modal{margin:0;border:0;max-width:none;max-height:none;width:100%;height:100%;box-sizing:border-box;color:inherit}.cx-mobile-nav{display:none}@media(max-width:700px){.cx-tabs{display:none}.cx-mobile-nav{display:grid;gap:6px;margin-bottom:16px}.cx-mobile-nav select{font:inherit;min-height:48px;box-sizing:border-box;width:100%;padding:8px 12px;border:1px solid var(--hg-glass-bd);border-radius:14px;background:var(--hg-tile-bg);color:inherit}}button:disabled{opacity:.45}`); }
  t(k) { return HG_CONTROL_TEXT[k]; }
  _options(filter, selected = '') { return Object.entries(this._hass.states).filter(([e, s]) => filter(e, s)).sort((a, b) => H.name(this._hass, a[0]).localeCompare(H.name(this._hass, b[0]))).map(([e]) => `<option value="${H.esc(e)}" ${selected === e ? 'selected' : ''}>${H.esc(H.name(this._hass, e))}</option>`).join(''); }
  _checks(name, ids, filter) { return `<input class="cx-search" data-search placeholder="${hgT('common.search')}" aria-label="${hgT('common.search')}"><div class="cx-list">${Object.entries(this._hass.states).filter(([e, s]) => filter(e, s)).map(([e]) => `<label class="cx-row" data-find="${H.esc(H.name(this._hass, e).toLocaleLowerCase())}"><input type="checkbox" name="${name}" value="${H.esc(e)}" ${ids.includes(e) ? 'checked' : ''}><span>${H.esc(H.name(this._hass, e))}</span></label>`).join('')}</div>`; }
  _fav() {
    const h = this._hass, p = HGPersonal.data;
    return `<div class="cx-actions"><button data-act="edit-favorites">${this.t('edit_favorites')}</button></div>${this._editFav ? `<div class="cx-box">${this._checks('favorites', p.favorites, (e) => /^(light|switch|fan|climate|cover|media_player)\./.test(e))}<p class="cx-note">${this.t('limit')}</p><button class="cx-btn cx-primary" data-act="save-favorites">${hgT('common.save')}</button></div>` : `<div class="cx-grid">${p.favorites.map((e) => { const s = h.states[e]; return `<div class="cx-box cx-row"><button data-act="details" data-e="${H.esc(e)}" aria-label="${H.esc(H.name(h, e))}">${H.icon(s && s.attributes.icon || 'mdi:star-outline')}</button><span><b>${H.esc(H.name(h, e))}</b><small>${s ? H.esc(H.stateLabel(s.state)) : hgT('common.unavailable')}</small></span>${/^(light|switch)\./.test(e) ? `<button data-act="toggle" data-e="${H.esc(e)}" ${H.ok(s) ? '' : 'disabled'} aria-label="${H.esc(H.name(h, e))} ${s && s.state === 'on' ? hgT('common.off_masc') : hgT('common.on_masc')}">${H.icon('mdi:power')}</button>` : ''}</div>`; }).join('') || `<p class="cx-note">${this.t('favorites_empty')}</p>`}</div>`}`;
  }
  _modes() {
    const modes = ['home', 'away', 'movie', 'sleep'], p = HGPersonal.data, selected = this._mode || 'home', steps = HGPersonal.steps(this._hass, p.modes[selected]);
    return `<div class="cx-grid">${modes.map((m) => `<div class="cx-box"><h3>${this.t('mode_' + m)}</h3><p>${(p.modes[m] || []).length} ${this.t('steps')}</p><div class="cx-actions"><button data-act="preview" data-mode="${m}" ${!(p.modes[m] || []).length ? 'disabled' : ''}>${this.t('preview')}</button><button data-act="configure" data-mode="${m}">${this.t('configure')}</button></div></div>`).join('')}</div>${this._configMode ? `<div class="cx-box" style="margin-top:16px"><h3>${this.t('mode_' + selected)}</h3><p class="cx-note">${this.t('mode_help')}</p><div class="cx-list">${Object.keys(this._hass.states).filter((e) => /^(light|switch)\./.test(e)).map((e) => `<label class="cx-row"><span>${H.esc(H.name(this._hass, e))}</span><select name="step" data-e="${H.esc(e)}"><option value="">${this.t('no_change')}</option>${['on', 'off'].map((s) => `<option value="${s}" ${steps.some((x) => x.e === e && x.state === s) ? 'selected' : ''}>${s === 'on' ? hgT('common.on_masc') : hgT('common.off_masc')}</option>`).join('')}</select></label>`).join('')}</div><button class="cx-btn cx-primary" data-act="save-mode">${hgT('common.save')}</button></div>` : ''}`;
  }
  async _energyLoad() {
    const key = JSON.stringify([((HGL.data.wiz || {}).homeEnergy), HGPersonal.data.meters, Math.floor(Date.now() / 300000)]);
    if (this._energyBusy || this._energyKey === key) return;
    this._energyBusy = true;
    try {
      const prefs = await this._hass.callWS({ type: 'energy/get_prefs' }).catch(() => ({}));
      const chosen = (HGL.data.wiz || {}).homeEnergy;
      const ids = chosen ? [chosen] : [...new Set((prefs.energy_sources || []).filter((s) => s.type === 'grid').flatMap((s) => (s.flow_from || []).map((f) => f.stat_energy_from)).filter(Boolean))];
      const meters = HGPersonal.data.meters.length ? HGPersonal.data.meters : [...new Set((prefs.device_consumption || []).map((x) => x.stat_consumption).filter(Boolean))];
      if (!ids.length) { this._energy = { missing: true }; return; }
      const now = new Date(), days = HGPersonal.days(now), start = new Date(days[0].from); start.setDate(start.getDate() - 1);
      const stats = await this._hass.callWS({ type: 'recorder/statistics_during_period', start_time: start.toISOString(), end_time: now.toISOString(), period: 'hour', statistic_ids: [...new Set([...ids, ...meters])], types: ['sum'], units: { energy: 'kWh' } });
      const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
      this._energy = { days: days.map((d) => ({ ...d, value: HGPersonal.total(stats, ids, d.from, d.to) })), devices: meters.map((e) => ({ e, value: HGDashboard.energyDelta(stats[e] || [], +midnight, +now) })).sort((a, b) => (b.value ?? -1) - (a.value ?? -1)) };
    } catch (e) { this._energy = { error: true }; }
    finally { this._energyKey = key; this._energyBusy = false; if (this.isConnected) this.rerender(); }
  }
  _energyHtml() {
    this._energyLoad(); const r = this._energy, p = HGPersonal.data, fmt = (x) => x == null ? '—' : H.fmt(x, 2), days = r && r.days || [];
    const bars = this._weekly ? [0, 7].map((i) => ({ from: days[i] && days[i].from, value: days.length === 14 && days.slice(i, i + 7).every((d) => d.value != null) ? days.slice(i, i + 7).reduce((s, d) => s + d.value, 0) : null })) : days.slice(-7);
    const max = Math.max(1, ...bars.map((d) => d.value || 0)), sum = bars.length && bars.every((d) => d.value != null) ? bars.reduce((s, d) => s + d.value, 0) : null;
    return `<div class="cx-actions"><button data-act="period">${this._weekly ? this.t('daily') : this.t('weekly')}</button><button data-act="refresh-energy">${hgT('dashboardx.refresh')}</button><button data-act="energy-settings">${this.t('tariff')}</button></div>${!r ? hgT('common.loading') : r.error ? hgT('dashboardx.energy_error') : r.missing ? hgT('dashboardx.energy_choose') : `<div class="cx-grid"><div class="cx-box"><h3>${this._weekly ? this.t('last_weeks') : this.t('last_days')}</h3><svg class="cx-plot" viewBox="0 0 560 210" role="img" aria-label="${this.t('history')}">${bars.map((d, i) => { const w = 520 / bars.length, height = (d.value || 0) / max * 135, date = d.from ? new Date(d.from).toLocaleDateString(HG_LOC(), { day: 'numeric', month: 'short' }) : ''; return `<g><title>${H.esc(date)}: ${fmt(d.value)} kWh</title><rect x="${20 + i * w}" y="${165 - height}" width="${w - 12}" height="${height || 2}" rx="5" fill="${d.value == null ? 'gray' : 'var(--hg-accent)'}"/><text x="${20 + i * w}" y="${155 - height}" fill="currentColor" font-size="12">${fmt(d.value)}</text><text x="${20 + i * w}" y="190" fill="currentColor" font-size="11">${H.esc(date)}</text></g>`; }).join('')}</svg><p>${this.t('total')}: <b>${fmt(sum)} kWh</b></p>${p.rate > 0 ? `<p>${this.t('estimate')}: <b>${sum == null ? '—' : H.fmt(sum * p.rate, 2)} ${H.esc(p.currency)}</b></p>` : ''}<p class="cx-note">${this.t('history_help')}</p></div><div class="cx-box"><h3>${this.t('top_devices')}</h3>${(r.devices || []).map((d) => `<div class="cx-row"><span>${H.esc(H.name(this._hass, d.e))}</span><b>${fmt(d.value)} kWh</b></div>`).join('') || `<p class="cx-note">${this.t('meters_help')}</p>`}<p class="cx-note">${this.t('device_note')}</p></div></div>`}${this._energySettings ? `<div class="cx-box"><label class="cx-field">${this.t('rate')}<input type="number" min="0" step="0.0001" name="rate" value="${p.rate}"></label><label class="cx-field">${this.t('currency')}<input name="currency" maxlength="8" value="${H.esc(p.currency)}"></label><p class="cx-note">${this.t('estimate_help')}</p><h3>${this.t('meters')}</h3>${this._checks('meters', p.meters, (e, s) => e.startsWith('sensor.') && s.attributes.device_class === 'energy' && ['Wh', 'kWh', 'MWh'].includes(s.attributes.unit_of_measurement))}<button class="cx-btn cx-primary" data-act="save-energy">${hgT('common.save')}</button></div>` : ''}`;
  }
  _tablet() {
    const h = this._hass, p = HGPersonal.data, b = h.states[p.battery], c = h.states[p.charging], online = navigator.onLine !== false, connected = h.connected !== false && (!h.connection || h.connection.connected !== false);
    const valid = b && H.ok(b) && b.state.trim() !== '' && Number.isFinite(+b.state) && +b.state >= 0 && +b.state <= 100;
    return `<div class="cx-grid"><div class="cx-box"><h3>${this.t('connection')}</h3><p>${this.t('browser')}: <b>${online ? this.t('online') : this.t('offline')}</b></p><p>${hgT('controlx.server')}: <b>${connected ? this.t('online') : this.t('offline')}</b></p>${!online || !connected ? `<p class="cx-note">${this.t('connection_lost')}</p>` : ''}</div><div class="cx-box"><h3>${this.t('tablet_battery')}</h3><b class="cx-value">${valid ? H.fmt(+b.state, 0) + '%' : '—'}</b><p>${c && H.ok(c) ? (c.state === 'on' ? this.t('charging') : this.t('not_charging')) : this.t('charging_unknown')}</p>${b && b.last_updated ? `<small class="cx-note">${this.t('last_update')}: ${H.esc(new Date(b.last_updated).toLocaleString(HG_LOC()))}</small>` : ''}${valid && +b.state <= 20 ? `<p>${this.t('battery_low')}</p>` : ''}<p class="cx-note">${this.t('tablet_help')}</p></div></div><div class="cx-box" style="margin-top:12px"><label class="cx-field">${this.t('battery_sensor')}<select name="battery"><option value="">${this.t('none')}</option>${this._options((e, s) => e.startsWith('sensor.') && s.attributes.device_class === 'battery' && s.attributes.unit_of_measurement === '%', p.battery)}</select></label><label class="cx-field">${this.t('charging_sensor')}<select name="charging"><option value="">${this.t('none')}</option>${this._options((e, s) => e.startsWith('binary_sensor.') && s.attributes.device_class === 'battery_charging', p.charging)}</select></label><button class="cx-btn cx-primary" data-act="save-tablet">${hgT('common.save')}</button></div>`;
  }
  _profile() {
    const p = this._profileDraft || HGPersonal.data;
    const list = HGL.sort(HGDashboard.catalog().map((c) => ({ c, k: c._k })), (x) => x.k, p.order);
    return `<p class="cx-note">${this.t('personal_help')}</p><label class="cx-row"><input type="checkbox" name="personal-active" ${p.active ? 'checked' : ''}><span>${this.t('personal_active')}</span></label><div class="cx-box cx-cards"><h3>${this.t('home_cards')}</h3>${list.map(({ c, k }, i) => { const pref = p.cards[k] || {}; return `<div class="cx-row" data-card="${H.esc(k)}"><span>${H.esc(c.title || c.entity || c.type)}</span><button data-act="personal-up" data-k="${H.esc(k)}" ${i ? '' : 'disabled'} aria-label="${hgT('lookr.move_up')}">${H.icon('mdi:arrow-up')}</button><span class="cx-select"><select name="visible" aria-label="${this.t('visibility')}">${[['', this.t('inherit')], ['show', this.t('show')], ['hide', this.t('hide')]].map(([v, l]) => `<option value="${v}" ${v === (typeof pref.visible === 'boolean' ? pref.visible ? 'show' : 'hide' : '') ? 'selected' : ''}>${l}</option>`).join('')}</select></span><span class="cx-select"><select name="size" aria-label="${this.t('size')}">${[['', this.t('inherit')], ['s', hgT('dashboardx.half')], ['l', hgT('dashboardx.full')]].map(([v, l]) => `<option value="${v}" ${v === (pref.size || '') ? 'selected' : ''}>${l}</option>`).join('')}</select></span></div>`; }).join('')}</div><div class="cx-box" style="margin-top:12px"><h3>${this.t('visible_people')}</h3>${Object.keys(this._hass.states).filter((e) => e.startsWith('person.')).map((e) => `<label class="cx-row"><input type="checkbox" name="person" value="${H.esc(e)}" ${p.hiddenPersons.includes(e) ? '' : 'checked'}><span>${H.esc(H.name(this._hass, e))}</span></label>`).join('')}<p class="cx-note">${this.t('people_help')}</p></div><button class="cx-btn cx-primary" data-act="save-profile">${hgT('common.save')}</button>`;
  }
  render() {
    if (HGPersonal.failed) return `<ha-card class="glass"><p class="cx-note">${this.t('load_failed')}</p></ha-card>`;
    const tabs = ['favorites', 'modes', 'energy', 'tablet', 'profile', ...(window.HGLiving ? HGLiving.tabs : [])], tab = this._tab || 'favorites';
    const body = window.HGLiving && HGLiving.tabs.includes(tab) ? HGLiving.html(this, tab) : tab === 'favorites' ? this._fav() : tab === 'modes' ? this._modes() : tab === 'energy' ? this._energyHtml() : tab === 'tablet' ? this._tablet() + (window.HGLiving ? HGLiving.tabletHtml(this) : '') : this._profile();
    const preview = this._preview, steps = preview ? HGPersonal.steps(this._hass, this._previewSteps || HGPersonal.data.modes[preview]) : [];
    return `<ha-card class="glass"><label class="cx-mobile-nav">${hgT('page.sections')}<select data-control-section>${tabs.map((t) => `<option value="${t}" ${t === tab ? 'selected' : ''}>${window.HGLiving && HGLiving.tabs.includes(t) ? HGLiving.text(t) : this.t(t)}</option>`).join('')}</select></label><div class="cx-tabs" role="group" aria-label="${this.t('title')}">${tabs.map((t) => `<button data-act="tab" data-tab="${t}" aria-pressed="${tab === t}">${window.HGLiving && HGLiving.tabs.includes(t) ? HGLiving.text(t) : this.t(t)}</button>`).join('')}</div><div class="cx-status" role="status">${H.esc(this._message || '')}</div>${body}${window.HGLiving ? HGLiving.confirmHtml(this) : ''}${preview ? `<dialog class="cx-modal living-modal mode-modal" aria-label="${this.t('preview')}"><div class="cx-dialog" role="dialog" aria-modal="true" aria-label="${this.t('preview')}"><h3>${this.t('mode_' + preview)}</h3><p>${this.t('before_run')}</p><ul>${steps.map((s) => `<li>${H.esc(H.name(this._hass, s.e))} → ${s.state === 'on' ? hgT('common.on_masc') : hgT('common.off_masc')}${s.available ? '' : ' · ' + hgT('common.unavailable')}</li>`).join('')}</ul><p class="cx-note">${this.t('partial_help')}</p><div class="cx-actions"><button data-act="execute" class="cx-primary" ${this._running || !steps.length || steps.some((s) => !s.available) ? 'disabled' : ''}>${this._running ? hgT('common.loading') : this.t('execute')}</button><button data-act="cancel-preview" ${this._running ? 'disabled' : ''}>${hgT('common.cancel')}</button></div></div></dialog>` : ''}</ha-card>`;
  }
  afterRender() { const nav = this.shadowRoot.querySelector('[data-control-section]'); if (nav) nav.onchange = () => this.onAct('tab', { dataset: { tab: nav.value } }); if (window.HGLiving) HGLiving.bind(this); for (const input of this.shadowRoot.querySelectorAll('[data-search]')) input.oninput = () => { const q = input.value.toLocaleLowerCase(); for (const row of input.nextElementSibling.querySelectorAll('[data-find]')) row.hidden = !row.dataset.find.includes(q); }; }
  _profileCollect() {
    const p = JSON.parse(JSON.stringify(this._profileDraft || HGPersonal.data)), R = this.shadowRoot;
    p.active = R.querySelector('[name=personal-active]').checked; p.cards = { ...p.cards };
    for (const row of R.querySelectorAll('[data-card]')) { const v = row.querySelector('[name=visible]').value, size = row.querySelector('[name=size]').value; p.cards[row.dataset.card] = { ...(v ? { visible: v === 'show' } : {}), ...(size ? { size } : {}) }; }
    if (this._profileOrderChanged) p.order = [...R.querySelectorAll('[data-card]')].map((x) => x.dataset.card);
    p.hiddenPersons = [...R.querySelectorAll('[name=person]:not(:checked)')].map((x) => x.value); return p;
  }
  async onAct(a, b) {
    if (this._running || this._saving) return;
    if (a.startsWith('living-') && window.HGLiving) return HGLiving.act(this, a, b);
    const R = this.shadowRoot, h = this._hass, checked = (n) => [...R.querySelectorAll(`[name=${n}]:checked`)].map((x) => x.value);
    this._message = '';
    if (a === 'tab') { this._tab = b.dataset.tab; this._preview = null; this._profileDraft = null; this._profileOrderChanged = false; this._livingConfirm = null; return this.rerender(); }
    if (a === 'details') return H.fire(this, 'hass-more-info', { entityId: b.dataset.e });
    if (a === 'toggle') { const e = b.dataset.e; if (!HGPersonal.data.favorites.includes(e) || !/^(light|switch)\./.test(e) || !H.ok(h.states[e])) return; try { await h.callService(e.split('.')[0], h.states[e].state === 'on' ? 'turn_off' : 'turn_on', { entity_id: e }); } catch (e) { this._message = this.t('failed'); } return this.rerender(); }
    if (a === 'edit-favorites') this._editFav = !this._editFav;
    if (a === 'configure') { this._mode = b.dataset.mode; this._configMode = true; }
    if (a === 'preview') { this._preview = b.dataset.mode; this._previewUid = h.user?.id; this._previewSteps = HGPersonal.steps(h, HGPersonal.data.modes[this._preview]); }
    if (a === 'cancel-preview') { this._preview = null; this._previewSteps = null; }
    if (a === 'period') this._weekly = !this._weekly;
    if (a === 'energy-settings') this._energySettings = !this._energySettings;
    if (a === 'refresh-energy') this._energyKey = null;
    if (a === 'personal-up') { this._profileOrderChanged = true; this._profileDraft = this._profileCollect(); const order = this._profileDraft.order, i = order.indexOf(b.dataset.k); if (i > 0) [order[i - 1], order[i]] = [order[i], order[i - 1]]; }
    if (a === 'execute') {
      if (this._previewSteps && this._previewUid !== h.user?.id) return;
      const rows = HGPersonal.steps(h, this._previewSteps || HGPersonal.data.modes[this._preview]); if (!rows.length || rows.some((s) => !s.available)) return;
      this._running = true; this.rerender(); let done = 0;
      try { for (const s of rows) { const live = this._hass; if (live.user?.id !== h.user?.id || !H.ok(live.states[s.e])) throw new Error('Unavailable'); await h.callService(s.e.split('.')[0], s.state === 'on' ? 'turn_on' : 'turn_off', { entity_id: s.e }); done++; } this._message = this.t('completed'); }
      catch (e) { this._message = this.t('failed') + ` (${done}/${rows.length})`; }
      this._running = false; this._preview = null;
    }
    let patch;
    if (a === 'save-favorites') { const favorites = checked('favorites'); if (favorites.length > 12) { this._message = this.t('limit'); return this.rerender(); } patch = { favorites }; this._editFav = false; }
    if (a === 'save-mode') { const rows = [...R.querySelectorAll('[name=step]')].filter((x) => x.value).map((x) => ({ e: x.dataset.e, state: x.value })); if (rows.length > 12) { this._message = this.t('limit'); return this.rerender(); } patch = { modes: { ...HGPersonal.data.modes, [this._mode || 'home']: rows } }; this._configMode = false; }
    if (a === 'save-energy') { const rate = Number(R.querySelector('[name=rate]').value), meters = checked('meters'); if (!Number.isFinite(rate) || rate < 0 || rate > 100000 || meters.length > 12) { this._message = this.t('invalid'); return this.rerender(); } patch = { rate, currency: R.querySelector('[name=currency]').value.trim(), meters }; this._energyKey = null; this._energySettings = false; }
    if (a === 'save-tablet') patch = { battery: R.querySelector('[name=battery]').value, charging: R.querySelector('[name=charging]').value };
    if (a === 'save-profile') patch = this._profileCollect();
    if (patch) { this._saving = true; try { await HGPersonal.save(h, patch); this._message = this.t('saved'); if (a === 'save-profile') return location.reload(); } catch (e) { this._message = this.t('failed'); } finally { this._saving = false; } }
    this.rerender();
  }
}
hgReg('hg-control-card', HGControlCard, hgTLazy('controlx.title'), hgTLazy('controlx.description'));
