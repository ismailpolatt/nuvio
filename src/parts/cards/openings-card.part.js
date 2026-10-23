/* --- drzwi i okna (otwarcia) --- */
const HG_OPEN_DC = ['door', 'window', 'garage_door', 'opening'];
class HGOpeningsCard extends HGBase {
  defaults() { return { title: null, entities: [], only_open: false }; }
  _list() { const c = this._config, h = this._hass; return (c.entities && c.entities.length ? c.entities : hgEnts(h, ['binary_sensor'], HG_OPEN_DC)); }
  ents() { return this._hass ? this._list() : (this._config.entities || []); }
  css() { return HG_G14_CSS; }
  _known(e) { const s=this._hass.states[e]; return ['on','off'].includes(s?.state) && (!window.HGDataQuality || HGDataQuality.assess(this._hass,e).status==='recent'); }
  _unknown(e) { return window.HG_SUITE_TEXT ? HG_SUITE_TEXT[HGDataQuality.assess(this._hass,e).status] : hgT('common.unavailable'); }

  render() { const c = this._config, h = this._hass, xs = this._list(), op = xs.filter((e) => this._known(e) && h.states[e].state === 'on'), missing=xs.filter(e=>!this._known(e));
    if (!xs.length) return `<ha-card class="glass"><div class="ph"><b>${hgT('cards.openings.no_opening_sensors')}</b>${hgT('cards.openings.pick_door_and_window')}</div></ha-card>`;
    const ic = (e, on) => { if(!this._known(e))return 'mdi:help-circle-outline'; const dc = h.states[e].attributes.device_class; return dc === 'window' ? (on ? 'mdi:window-open-variant' : 'mdi:window-closed-variant') : dc === 'garage_door' ? (on ? 'mdi:garage-open' : 'mdi:garage') : (on ? 'mdi:door-open' : 'mdi:door-closed'); };
    const L = [...op, ...missing, ...(c.only_open ? [] : xs.filter((e) => this._known(e) && !op.includes(e)))];
    if (xs.length === 1) { const e = xs[0], on = op.length > 0, s = h.states[e]; return `<ha-card class="glass"><button style="all:unset;cursor:pointer;display:flex;flex-direction:column;gap:10px" data-act="more" data-e="${H.esc(e)}">${hgHead(ic(e, on), c.title || (s ? H.name(h,e) : e), H.esc(window.HGDataQuality ? HGDataQuality.label(h,e) : hgAgo14(s?.last_changed)), on)}<span class="big">${!this._known(e) ? this._unknown(e) : on ? hgT('cards.openings.open') : hgT('cards.openings.closed')}</span></button></ha-card>`; }
    return `<ha-card class="glass">${hgHead(op.length ? 'mdi:door-open' : 'mdi:door-closed-lock', c.title || hgT('cards.openings.doors_and_windows'), missing.length ? hgT('suite.contacts_unknown', { open: op.length, missing: missing.length }) : op.length ? hgT('cards.openings.open_count', { count: op.length }) : hgT('cards.openings.all_closed'), !op.length && !missing.length, `<span class="cnt${op.length ? ' al' : ''}">${op.length}/${xs.length}</span>`)}
      <div class="ls">${L.length ? L.map((e) => { const on = this._known(e) && h.states[e].state === 'on'; return `<button class="li${on ? ' al' : ''}" style="all:unset;display:flex;align-items:center;gap:10px;min-height:40px;cursor:pointer" data-act="more" data-e="${H.esc(e)}">${H.icon(ic(e, on))}<span class="nm">${H.esc(h.states[e] ? H.name(h,e) : e)}</span><span class="vl">${!this._known(e) ? this._unknown(e) : on ? hgT('common.state_open') : `<span class="hide-s">${H.esc(hgAgo14(h.states[e].last_changed))}</span>`}</span></button>`; }).join('') : `<div class="ph">${hgT('cards.openings.nothing_is_open')}</div>`}</div></ha-card>`; }
  onAct(a, t) { if (a === 'more') hgMore(this, t.dataset.e); }
  getGridOptions() { return { columns: 6, rows: 4 }; }
}
hgReg('hg-openings-card', HGOpeningsCard, hgTLazy('cards.openings.picker_name'), hgTLazy('cards.openings.picker_description'));
