const hgZoneName = (hass, st) => {
  if (st === 'home') return (H.st(hass, 'zone.home') || { attributes: {} }).attributes.friendly_name || hgT('common.at_home');
  if (st === 'not_home') return hgT('cards.people.away'); if (st === 'unknown' || st === 'unavailable') return hgT('cards.people.unknown_location'); return st;
};

/* --- lista osób + strefy --- */
class HGPeopleCard extends HGBase {
  defaults() { return { title: hgT('common.household'), icon: 'mdi:account-group-outline', persons: [], zones: [] }; }
  ents() { return hgVisiblePersons(this._config.persons).concat(this._config.zones); }
  _extraSig() { return Math.floor(Date.now() / 60000); }
  css() {
    return U(`
ha-card.glass{ display:flex; flex-direction:column; gap:var(--s1); overflow:auto; padding:var(--s3) var(--s3); }
.lst{ display:flex; flex-direction:column; gap:2u; margin-top:4u; }
.p{ display:flex; align-items:center; gap:var(--s2); padding:var(--s1) var(--s1); margin:0 -8u; border-radius:var(--r-sm); text-align:left; width:calc(100% + 16u); min-height:max(calc(var(--k) * 50), var(--hg-tgt, 0px)); }
.p:hover{ background:rgba(255,255,255,.45); }
.p .av{ width:34u; height:34u; border-radius:var(--r-sm); background:center/cover #9aa3ad; flex:none; display:flex; align-items:center; justify-content:center; color:#fff; font-size:var(--fs-md); font-weight:400;
  box-shadow: 0 0 0 2u rgba(255,255,255,.85); }
.p.home .av{ box-shadow: 0 0 0 2u var(--hg-accent); }
.p .tx{ min-width:0; flex:1; display:flex; flex-direction:column; gap:3u; }
.p b{ display:block; font-size:var(--fs-md); font-weight:400; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.p span{ display:block; font-size:var(--fs-sm); color:#5A5E64; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.p span ha-icon{ width:10u; height:10u; vertical-align:-1u; margin-right:3u; }
.p span em{ font-style:normal; color:#8A8E94; }
.sec{ font-size:var(--fs-xs); color:#6A6E74; margin-top:8u; text-transform:uppercase; letter-spacing:.06em; }
.zs{ display:flex; flex-wrap:wrap; gap:5u; }
.z{ display:inline-flex; align-items:center; gap:4u; padding:0 var(--s1); height:max(calc(var(--k) * 24), var(--hg-tgt, 0px)); border-radius:var(--r-sm); background:rgba(255,255,255,.7); font-size:var(--fs-sm); }
.z i{ font-style:normal; min-width:14u; height:14u; border-radius:var(--r-sm); background:#E4E5E7; display:inline-flex; align-items:center; justify-content:center; font-size:var(--fs-xs); }
.z.has i{ background:var(--hg-accent); color:var(--hg-on-accent); }
`);
  }
  render() {
    const c = this._config, h = this._hass;
    const rows = hgVisiblePersons(c.persons).map((e) => {
      const s = H.st(h, e); if (!s) return '';
      const home = s.state === 'home', since = new Date(s.last_changed);
      return `<button class="p lr ${home ? 'home' : ''}" data-act="more" data-e="${e}" title="${H.esc(s.attributes.friendly_name)} – ${hgT('cards.people.details')}">${hgAvatar(h, e, 'av')}
        <div class="tx"><b>${H.esc(s.attributes.friendly_name)}</b><span title="${H.lv(hgT('cards.people.last_changed'), `${H.esc(since.toLocaleString(HG_LOC()))}`)}">${H.icon(home ? 'mdi:home-outline' : s.state === 'not_home' ? 'mdi:map-marker-outline' : 'mdi:map-marker-radius-outline')}${H.esc(hgZoneName(h, s.state))} <em>· ${hgRel(since)}</em></span></div></button>`;
    }).join('');
    const zs = c.zones.map((z) => { const s = H.st(h, z); if (!s) return ''; const n = Number(s.state) || 0;
      return `<button class="z ${n ? 'has' : ''}" data-act="more" data-e="${z}" title="${H.lv(H.esc(s.attributes.friendly_name), `${n} ${hgT('cards.people.people')}`)}">${H.esc(s.attributes.friendly_name)}<i>${n}</i></button>`; }).join('');
    return `<ha-card class="glass"><div class="hd">${H.icon(c.icon, 'ic')}<span class="tt">${H.esc(c.title)}</span></div>
      <div class="lst">${rows}</div>${zs ? `<div class="sec">${hgT('cards.people.zones')}</div><div class="zs">${zs}</div>` : ''}</ha-card>`;
  }
  onAct(a, el) { if (a === 'more') H.fire(this, 'hass-more-info', { entityId: el.dataset.e }); }
}
hgReg('hg-people-card', HGPeopleCard, hgTLazy('cards.people.picker_name'), hgTLazy('cards.people.picker_description'));
