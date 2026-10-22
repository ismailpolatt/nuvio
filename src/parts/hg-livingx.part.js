const HG_LIVING_TEXT = hgTO({}, { suggestions: 'living.suggestions', exit: 'living.exit', notices: 'living.notices', automations: 'living.automations', quick_title: 'living.quick_title', quick_help: 'living.quick_help', lights: 'living.lights', climate: 'living.climate', switches: 'living.switches', sensors: 'living.sensors', full_room: 'living.full_room', details: 'living.details', suggestions_help: 'living.suggestions_help', rule_window_climate: 'living.rule_window_climate', rule_humidity: 'living.rule_humidity', rule_battery: 'living.rule_battery', no_suggestions: 'living.no_suggestions', exit_help: 'living.exit_help', no_exit_items: 'living.no_exit_items', preview_off: 'living.preview_off', exit_confirm: 'living.exit_confirm', command_help: 'living.command_help', confirm: 'living.confirm', commands_sent: 'living.commands_sent', action_failed: 'living.action_failed', notices_help: 'living.notices_help', notification: 'living.notification', priority_0: 'living.priority_0', priority_1: 'living.priority_1', priority_2: 'living.priority_2', priority_3: 'living.priority_3', read: 'living.read', mark_read: 'living.mark_read', no_alerts: 'living.no_alerts', tablet_profile: 'living.tablet_profile', tablet_help: 'living.tablet_help', edit_lock: 'living.edit_lock', locked_help: 'living.locked_help', large_touch: 'living.large_touch', landscape: 'living.landscape', portrait: 'living.portrait', automation_help: 'living.automation_help', area: 'living.area', all: 'living.all', unassigned: 'living.unassigned', filter: 'living.filter', last_run: 'living.last_run', enable: 'living.enable', disable: 'living.disable', no_automations: 'living.no_automations', auto_confirm: 'living.auto_confirm' });
/* Daily-use tools: derived from current HA state, with explicit actions only. */
const HGLiving = window.HGLiving = {
  tabs: ['suggestions', 'exit', 'notices', 'automations'],
  text(k) { return HG_LIVING_TEXT[k]; },
  visible(h, e) { const r = (h.entities || {})[e] || {}; return !!h.states[e] && !r.hidden && !r.hidden_by && !r.disabled_by && r.entity_category !== 'config'; },
  model(h) { return HGAreas.model(h, ((HGL.data.wiz || {}).areas || {})); },
  area(h, e) { const r = (h.entities || {})[e] || {}, d = (h.devices || {})[r.device_id] || {}; return r.area_id || d.area_id || ''; },
  state(h, e) { const s = h.states[e]; return !H.ok(s) ? hgT('common.unavailable') : H.stateLabel(s.state) + (s.attributes.unit_of_measurement ? ' ' + s.attributes.unit_of_measurement : ''); },
  contact(s) { return s && ['door', 'window', 'opening', 'garage_door'].includes(s.attributes.device_class); },
  suggestions(h) {
    const out = [];
    for (const a of this.model(h).list) {
      const contacts = (a.ents || []).filter((e) => this.visible(h, e) && this.contact(h.states[e]) && h.states[e].state === 'on');
      const climates = (a.ents || []).filter((e) => this.visible(h, e) && e.startsWith('climate.') && H.ok(h.states[e]) && ['heating', 'cooling'].includes(h.states[e].attributes.hvac_action));
      if (contacts.length && climates.length) out.push({ kind: 'window_climate', room: a.name, es: [...contacts, ...climates] });
      const ref = a.hum, value = ref && H.ok(h.states[ref.e]) ? HGAreas.val(h, ref) : null;
      if (value != null && value > 70 && value <= 100) out.push({ kind: 'humidity', room: a.name, es: [ref.e] });
    }
    for (const r of HGDashboard.health(h).filter((r) => r.kind === 'battery')) out.push({ kind: 'battery', room: '', es: [r.e] });
    return out;
  },
  exitRows(h) {
    return Object.keys(h.states).filter((e) => this.visible(h, e) && (
      /^(light|switch)\./.test(e) && h.states[e].state === 'on' ||
      e.startsWith('binary_sensor.') && this.contact(h.states[e]) && h.states[e].state !== 'off' ||
      e.startsWith('climate.') && H.ok(h.states[e]) && h.states[e].state !== 'off' ||
      e.startsWith('media_player.') && h.states[e].state === 'playing'
    )).sort((a, b) => H.name(h, a).localeCompare(H.name(h, b)));
  },
  offTargets(h, ids) {
    if (!Array.isArray(ids) || !ids.length || ids.length > 50 || new Set(ids).size !== ids.length) throw new Error('Invalid selection');
    if (ids.some((e) => !/^(light|switch)\.[a-z0-9_]+$/.test(e) || !this.visible(h, e) || !H.ok(h.states[e]) || !['on', 'off'].includes(h.states[e].state))) throw new Error('Unavailable selection');
    return ids.filter((e) => h.states[e].state === 'on');
  },
  async turnOff(h, ids, current = () => h) {
    const rows = this.offTargets(h, ids); let done = 0;
    for (const e of rows) {
      const live = current();
      if (live.user?.id !== h.user?.id || !this.visible(live, e) || !H.ok(live.states[e])) return { done, total: rows.length, failed: true };
      if (live.states[e].state === 'off') continue;
      try { await h.callService(e.split('.')[0], 'turn_off', { entity_id: e }); done++; }
      catch (err) { return { done, total: rows.length, failed: true }; }
    }
    return { done, total: rows.length, failed: false };
  },
  alerts(h, page) {
    const rows = HGDashboard.health(h).map((r) => {
      const s = h.states[r.e], stamp = s.last_changed || s.state;
      return { ...r, key: JSON.stringify([r.e, r.kind, stamp]), title: H.name(h, r.e), text: this.state(h, r.e), priority: { alert: 0, open: 1, battery: 2, offline: 3 }[r.kind] };
    });
    for (const [id, n] of Object.entries((page && page._notif) || {})) rows.push({ key: JSON.stringify(['notification', id, n.created_at || '', n.message || '']), title: n.title || HG_LIVING_TEXT.notification, text: n.message || '', priority: 1 });
    return rows.sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
  },
  page(card) { let n = card; while (n) { if (n._config && n._config.view && n._panelEl) return n; n = n.getRootNode && n.getRootNode().host; } return null; },
  tabletKey(h) { return 'nuvio:tablet-profile:' + (h.user && h.user.id || '') + ':' + location.pathname.split('/').filter(Boolean)[0]; },
  tabletPrefs(h) { try { const p = JSON.parse(localStorage.getItem(this.tabletKey(h)) || '{}') || {}, ids = (xs) => Array.isArray(xs) ? xs.filter((s) => typeof s === 'string').slice(0,100) : []; return { locked: p.locked === true, large: p.large === true, landscape: ids(p.landscape), portrait: ids(p.portrait) }; } catch (e) { return {}; } },
  tabletHere() { return navigator.maxTouchPoints > 0 && window.innerWidth >= 600 && window.innerWidth <= 1600; },
  orientation() { return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait'; },
  tabletLocked(page) { return !!(this.tabletHere() && this.tabletPrefs(page._hass || {}).locked); },
  tabletApply(cards, page) {
    if (!this.tabletHere()) return cards;
    const p = this.tabletPrefs(page._hass), hidden = p[this.orientation()];
    return Array.isArray(hidden) ? cards.map((c) => hidden.includes(c._k) ? { ...c, _hid: true } : c) : cards;
  },
  tabletHtml(card) {
    const p = this.tabletPrefs(card._hass), keys = HGDashboard.cards.map((c) => `${String(c.type || '').replace('custom:', '')}|${c._hgid || c.entity || (c.entities && c.entities[0]) || c.title || c.area || ''}`);
    return `<div class="cx-box" style="margin-top:12px"><h3>${HG_LIVING_TEXT.tablet_profile}</h3><p class="cx-note">${HG_LIVING_TEXT.tablet_help}</p><label class="cx-row"><input type="checkbox" name="living-lock" ${p.locked ? 'checked' : ''}><span>${HG_LIVING_TEXT.edit_lock}</span></label><label class="cx-row"><input type="checkbox" name="living-large" ${p.large ? 'checked' : ''}><span>${HG_LIVING_TEXT.large_touch}</span></label><div class="cx-grid">${['landscape', 'portrait'].map((o) => `<div><h3>${HG_LIVING_TEXT[o]}</h3>${HGDashboard.cards.map((c, i) => `<label class="cx-row"><input type="checkbox" name="living-${o}" value="${H.esc(keys[i])}" ${!(p[o] || []).includes(keys[i]) ? 'checked' : ''}><span>${H.esc(c.title || c.entity || c.type)}</span></label>`).join('')}</div>`).join('')}</div><button class="cx-btn cx-primary" data-act="living-tablet-save">${hgT('common.save')}</button></div>`;
  },
  html(card, tab) {
    const h = card._hass, details = (e) => `<button class="cx-btn" data-act="details" data-e="${H.esc(e)}" aria-label="${HG_LIVING_TEXT.details}">${H.icon('mdi:information-outline')}</button>`;
    if (tab === 'suggestions') {
      const rows = this.suggestions(h);
      return `<p class="cx-note">${HG_LIVING_TEXT.suggestions_help}</p><div class="cx-grid">${rows.map((r) => `<div class="cx-box"><h3>${H.esc(r.room || H.name(h, r.es[0]))}</h3><p>${HG_LIVING_TEXT['rule_' + r.kind]}</p>${r.es.map((e) => `<div class="cx-row"><span>${H.esc(H.name(h, e))}<small>${H.esc(this.state(h, e))}</small></span>${details(e)}</div>`).join('')}</div>`).join('') || `<p>${HG_LIVING_TEXT.no_suggestions}</p>`}</div>`;
    }
    if (tab === 'exit') {
      const rows = this.exitRows(h);
      return `<p class="cx-note">${HG_LIVING_TEXT.exit_help}</p><div class="cx-actions"><button data-act="living-refresh">${hgT('dashboardx.refresh')}</button></div><div class="cx-list">${rows.map((e) => `<label class="cx-row">${/^(light|switch)\./.test(e) ? `<input type="checkbox" name="living-off" value="${H.esc(e)}">` : ''}<span>${H.esc(H.name(h, e))}<small>${H.esc(this.state(h, e))}</small></span>${details(e)}</label>`).join('') || `<p>${HG_LIVING_TEXT.no_exit_items}</p>`}</div><button class="cx-btn cx-primary" data-act="living-exit-preview">${HG_LIVING_TEXT.preview_off}</button>`;
    }
    if (tab === 'notices') {
      const rows = this.alerts(h, this.page(card)), read = HGPersonal.data.readAlerts || [];
      return `<p class="cx-note">${HG_LIVING_TEXT.notices_help}</p>${rows.map((r, i) => `<div class="cx-row"><span><b>${HG_LIVING_TEXT['priority_' + r.priority]} · ${H.esc(r.title)}</b><small>${H.esc(r.text).slice(0, 2000)}</small></span>${r.e ? details(r.e) : ''}<button class="living-text" data-act="living-read" data-key="${H.esc(r.key)}" ${read.includes(r.key) ? 'disabled' : ''}>${(read.includes(r.key) ? HG_LIVING_TEXT.read : HG_LIVING_TEXT.mark_read)}</button></div>`).join('') || `<p>${HG_LIVING_TEXT.no_alerts}</p>`}`;
    }
    const rows = Object.keys(h.states).filter((e) => e.startsWith('automation.') && this.visible(h, e)), areas = h.areas || {}, selected = card._autoArea || '';
    return `<p class="cx-note">${HG_LIVING_TEXT.automation_help}</p><label class="cx-field">${HG_LIVING_TEXT.area}<select data-living-area><option value="">${HG_LIVING_TEXT.all}</option><option value="_none" ${selected === '_none' ? 'selected' : ''}>${HG_LIVING_TEXT.unassigned}</option>${Object.entries(areas).map(([id, a]) => `<option value="${H.esc(id)}" ${selected === id ? 'selected' : ''}>${H.esc(a.name)}</option>`).join('')}</select></label><button class="cx-btn" data-act="living-filter">${HG_LIVING_TEXT.filter}</button><div class="cx-list">${rows.filter((e) => !selected || (this.area(h, e) || '_none') === selected).sort((a, b) => H.name(h, a).localeCompare(H.name(h, b))).map((e) => { const s = h.states[e], when = Date.parse(s.attributes.last_triggered); return `<div class="cx-row"><span>${H.esc(H.name(h, e))}<small>${H.esc(this.state(h, e))} · ${HG_LIVING_TEXT.last_run}: ${Number.isFinite(when) ? H.esc(new Date(when).toLocaleString(HG_LOC())) : '—'}</small></span>${details(e)}${h.user && h.user.is_admin ? `<button class="living-text" data-act="living-auto-preview" data-e="${H.esc(e)}" ${!H.ok(s) ? 'disabled' : ''}>${(s.state === 'on' ? HG_LIVING_TEXT.disable : HG_LIVING_TEXT.enable)}</button>` : ''}</div>`; }).join('') || `<p>${HG_LIVING_TEXT.no_automations}</p>`}</div>`;
  },
  confirmHtml(card) {
    const p = card._livingConfirm; if (!p) return '';
    const h = card._hass;
    return `<dialog class="cx-modal living-modal" aria-label="${HG_LIVING_TEXT.confirm}"><div class="cx-dialog" role="dialog" aria-modal="true" aria-label="${HG_LIVING_TEXT.confirm}"><h3>${HG_LIVING_TEXT.confirm}</h3><p>${(p.kind === 'off' ? HG_LIVING_TEXT.exit_confirm : HG_LIVING_TEXT.auto_confirm)}</p><ul>${p.es.map((e) => `<li>${H.esc(H.name(h, e))} → ${(p.kind === 'off' || p.service === 'turn_off' ? hgT('common.off_masc') : hgT('common.on_masc'))}</li>`).join('')}</ul><p class="cx-note">${HG_LIVING_TEXT.command_help}</p><div class="cx-actions"><button data-act="living-execute" ${card._running ? 'disabled' : ''}>${HG_LIVING_TEXT.confirm}</button><button data-act="living-cancel" ${card._running ? 'disabled' : ''}>${hgT('common.cancel')}</button></div></div></dialog>`;
  },
  bind(card) {
    const modal = card.shadowRoot.querySelector('.living-modal');
    if (modal && !modal.open) { modal.showModal(); modal.oncancel = (e) => { e.preventDefault(); if (!card._running) { card._livingConfirm = null; card.rerender(); } }; }
    const area = card.shadowRoot.querySelector('[data-living-area]');
    if (area) area.onchange = () => { card._autoArea = area.value; card.rerender(); };
    if (!card._livingKey) {
      card._livingKey = (e) => {
        const dialog = card.shadowRoot.querySelector('.cx-dialog'); if (!dialog || !card._livingConfirm) return;
        if (e.key === 'Escape' && !card._running) { e.preventDefault(); e.stopPropagation(); card._livingConfirm = null; card.rerender(); }
        if (e.key === 'Tab') {
          const buttons = [...dialog.querySelectorAll('button:not(:disabled)')], i = buttons.indexOf(card.shadowRoot.activeElement);
          if ((e.shiftKey && i <= 0) || (!e.shiftKey && i === buttons.length - 1)) { e.preventDefault(); buttons[e.shiftKey ? buttons.length - 1 : 0]?.focus(); }
        }
      };
      card.shadowRoot.addEventListener('keydown', card._livingKey);
    }
    if (card._livingConfirm && card._livingFocus !== card._livingConfirm) card.shadowRoot.querySelector('[data-act=living-cancel]')?.focus();
    card._livingFocus = card._livingConfirm;
  },
  async act(card, action, b) {
    const h = card._hass, R = card.shadowRoot;
    try {
      if (action === 'living-cancel') card._livingConfirm = null;
      if (action === 'living-filter') card._autoArea = R.querySelector('[data-living-area]').value;
      if (action === 'living-read') {
        const keys = new Set(this.alerts(h, this.page(card)).map((r) => r.key));
        if (!keys.has(b.dataset.key)) return;
        card._saving = true;
        await HGPersonal.save(h, { readAlerts: [...(HGPersonal.data.readAlerts || []).filter((k) => keys.has(k) && k !== b.dataset.key), b.dataset.key].slice(-100) });
      }
      if (action === 'living-exit-preview') {
        const ids = [...R.querySelectorAll('[name=living-off]:checked')].map((x) => x.value);
        const es = this.offTargets(h, ids); if (!es.length) throw new Error('Empty');
        card._livingConfirm = { kind: 'off', es, uid: h.user.id };
      }
      if (action === 'living-auto-preview') {
        const e = b.dataset.e;
        if (!h.user.is_admin || !e.startsWith('automation.') || !this.visible(h, e) || !H.ok(h.states[e])) return;
        card._livingConfirm = { kind: 'auto', es: [e], service: h.states[e].state === 'on' ? 'turn_off' : 'turn_on', uid: h.user.id };
      }
      if (action === 'living-execute') {
        const p = card._livingConfirm; if (!p || p.uid !== h.user.id) return;
        card._running = true; card.rerender();
        if (p.kind === 'off') { const result = await this.turnOff(h, p.es, () => card._hass); card._message = (result.failed ? hgT('controlx.failed') : HG_LIVING_TEXT.commands_sent) + ` (${result.done}/${result.total})`; }
        else {
          const e = p.es[0];
          if (!h.user.is_admin || !e.startsWith('automation.') || !this.visible(h, e) || !H.ok(h.states[e]) || (h.states[e].state === 'on' ? 'turn_off' : 'turn_on') !== p.service) throw new Error('Changed');
          await h.callService('automation', p.service, { entity_id: e, ...(p.service === 'turn_off' ? { stop_actions: false } : {}) });
          card._message = HG_LIVING_TEXT.commands_sent;
        }
        card._livingConfirm = null;
      }
      if (action === 'living-tablet-save') {
        const prefs = { locked: R.querySelector('[name=living-lock]').checked, large: R.querySelector('[name=living-large]').checked };
        for (const o of ['landscape', 'portrait']) prefs[o] = [...R.querySelectorAll(`[name=living-${o}]:not(:checked)`)].map((x) => x.value);
        localStorage.setItem(this.tabletKey(h), JSON.stringify(prefs)); card._message = hgT('controlx.saved');
        const page = this.page(card); if (page) this.applyTouch(page);
      }
    } catch (err) { card._message = HG_LIVING_TEXT.action_failed; card._livingConfirm = null; }
    finally { card._running = false; card._saving = false; card.rerender(); }
  },
  applyTouch(page) {
    const prefs = this.tabletPrefs(page._hass || {}), large = this.tabletHere() && !!prefs.large;
    page.toggleAttribute('living-large', large);
    for (const card of page._cards || []) card.toggleAttribute('large-targets', large);
    const signature = JSON.stringify([prefs, this.orientation(), this.tabletHere(), page._hass?.user?.id]);
    const changed = page._livingTabletSig && signature !== page._livingTabletSig;
    page._livingTabletSig = signature;
    if (changed && page._built && page._config.view === 'dashboard') page._build();
  },
  openRoom(owner, area, config, opener) {
    if (owner._quickRoom) owner._quickRoom.remove();
    const el = document.createElement('hg-quick-room-card');
    el._owner = owner; el._opener = opener;
    el.setConfig({ area: area.id, areas: config.areas, path: config.room_path }); el.hass = owner._hass;
    owner._quickRoom = el; owner.shadowRoot.appendChild(el); el.shadowRoot.querySelector('[data-act=close]')?.focus();
  }
};

class HGQuickRoomCard extends HGBase {
  defaults() { return { areas: {} }; }
  ents() { return this.room()?.ents || []; }
  room() { return HGAreas.model(this._hass, this._config.areas).byId[this._config.area]; }
  connectedCallback() {
    super.connectedCallback();
    this._timer = setInterval(() => { if (!this._owner || !this._owner.isConnected) return this.remove(); this.hass = this._owner._hass; }, 1000);
    this._key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); }
      if (e.key === 'Tab') { const nodes = [...this.shadowRoot.querySelectorAll('button:not(:disabled),a[href]')], i = nodes.indexOf(this.shadowRoot.activeElement); if ((e.shiftKey && i <= 0) || (!e.shiftKey && i === nodes.length - 1)) { e.preventDefault(); nodes[e.shiftKey ? nodes.length - 1 : 0]?.focus(); } }
    };
    this.shadowRoot.addEventListener('keydown', this._key);
  }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._timer); this.shadowRoot.removeEventListener('keydown', this._key); }
  css() { return U(`:host{position:fixed;inset:0;z-index:9999;display:block;height:100%;font-size:16px}.quick-shade{position:absolute;inset:0;background:rgba(0,0,0,.65)}.quick-dialog{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(700px,calc(100vw - 32px));max-height:85dvh;overflow:auto;box-sizing:border-box;padding:24px;border-radius:24px;background:var(--hg-card-bg,#252831);color:var(--hg-text,#fff)}.quick-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.quick-head h2{margin:0}.quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px}.quick-section{background:var(--hg-tile-bg,rgba(255,255,255,.08));border-radius:16px;padding:12px}.quick-section h3{margin:0 0 8px;font-size:16px}.quick-row{display:flex;gap:8px;align-items:center;min-height:56px;border-bottom:1px solid rgba(255,255,255,.08)}.quick-row span{flex:1;min-width:0;overflow-wrap:anywhere}.quick-row small{display:block;opacity:.7}button{min-height:48px;min-width:48px;padding:8px 12px;font:inherit;border-radius:14px;background:var(--hg-tile-bg,rgba(255,255,255,.1))}button:disabled{opacity:.4}button:focus-visible{outline:2px solid var(--hg-accent,#8cc8ff)}ha-icon{width:22px;height:22px;--mdc-icon-size:22px}p{line-height:1.5}`); }
  render() {
    const a = this.room(), h = this._hass;
    if (!a) return `<div class="quick-dialog"><button data-act="close">${hgT('common.close')}</button><p>${hgT('common.unavailable')}</p></div>`;
    const groups = [['lights', (e) => e.startsWith('light.')], ['climate', (e) => e.startsWith('climate.')], ['switches', (e) => e.startsWith('switch.')], ['sensors', (e) => /^(sensor|binary_sensor)\./.test(e) && (HGLiving.contact(h.states[e]) || e === a.temp?.e || e === a.hum?.e)]];
    return `<div class="quick-shade" data-act="close"></div><section class="quick-dialog" role="dialog" aria-modal="true" aria-label="${H.esc(a.name)}"><div class="quick-head"><h2>${H.esc(a.name)}</h2><button data-act="close" aria-label="${hgT('common.close')}">${H.icon('mdi:close')}</button></div><p role="status">${H.esc(this._message || HG_LIVING_TEXT.quick_help)}</p><div class="quick-grid">${groups.map(([key, filter]) => { const es = (a.ents || []).filter((e) => HGLiving.visible(h, e) && filter(e)); return es.length ? `<div class="quick-section"><h3>${HG_LIVING_TEXT[key]}</h3>${es.map((e) => `<div class="quick-row"><span>${H.esc(H.name(h, e))}<small>${H.esc(HGLiving.state(h, e))}${e.startsWith('climate.') && h.states[e].attributes.current_temperature != null ? ' · ' + H.esc(String(h.states[e].attributes.current_temperature)) + '°' : ''}</small></span><button data-act="details" data-e="${H.esc(e)}" aria-label="${HG_LIVING_TEXT.details}">${H.icon('mdi:tune')}</button>${/^(light|switch)\./.test(e) ? `<button data-act="power" data-e="${H.esc(e)}" ${!H.ok(h.states[e]) || this._busy ? 'disabled' : ''} aria-label="${(h.states[e].state === 'on' ? hgT('common.off_masc') : hgT('common.on_masc'))}" aria-pressed="${h.states[e].state === 'on'}">${H.icon('mdi:power')}</button>` : ''}</div>`).join('')}</div>` : ''; }).join('')}</div><p><button data-act="full">${HG_LIVING_TEXT.full_room}</button></p></section>`;
  }
  close() { const opener = this._opener; this.remove(); if (opener?.isConnected) opener.focus(); }
  async onAct(act, b) {
    if (act === 'close') return this.close();
    if (act === 'full') { const path = `${this._config.path}?area=${encodeURIComponent(this._config.area)}`; this.close(); return H.navigate(path); }
    const e = b.dataset.e, a = this.room(), h = this._hass;
    if (!a || !(a.ents || []).includes(e) || !HGLiving.visible(h, e)) return;
    if (act === 'details') { const owner = this._owner; this.close(); return H.fire(owner, 'hass-more-info', { entityId: e }); }
    if (act === 'power' && !this._busy && /^(light|switch)\./.test(e) && H.ok(h.states[e])) {
      this._busy = true;
      try { await h.callService(e.split('.')[0], h.states[e].state === 'on' ? 'turn_off' : 'turn_on', { entity_id: e }); this._message = HG_LIVING_TEXT.commands_sent; }
      catch (err) { this._message = hgT('controlx.failed'); }
      finally { this._busy = false; this.rerender(); }
    }
  }
}
hgReg('hg-quick-room-card', HGQuickRoomCard, hgTLazy('living.quick_title'), hgTLazy('living.quick_help'));
