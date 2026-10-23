/* Monthly targets use recorder sums in the Home Assistant time zone. */
const HG_BUDGET_TEXT = hgTO({}, { title:'budget.title', help:'budget.help', target:'budget.target', unit:'budget.unit', off:'budget.off', configure:'budget.configure', used:'budget.used', remaining:'budget.remaining', over:'budget.over', forecast:'budget.forecast', no_forecast:'budget.no_forecast', incomplete:'budget.incomplete', stale:'budget.stale', rate_needed:'budget.rate_needed', normal:'budget.normal', near:'budget.near', exceeded:'budget.exceeded', risk:'budget.risk', as_of:'budget.as_of', source:'budget.source', threshold:'budget.threshold', note:'budget.note' });
const HGBudget = window.HGBudget = {
  clean(v) {
    v = v && typeof v === 'object' ? v : {};
    return { target: typeof v.target === 'number' && Number.isFinite(v.target) && v.target >= 0 && v.target <= 1e9 ? v.target : 0,
      unit: v.unit === 'money' ? 'money' : 'kWh', threshold: typeof v.threshold === 'number' && v.threshold >= 1 && v.threshold <= 100 ? v.threshold : 80 };
  },
  window(h, now = Date.now()) {
    const tz = HGStats.tz(h), [y,m] = HGStats.key(new Date(now), tz).split('-').map(Number);
    const boundary = (year, month) => { const base = Date.UTC(year, month, 1); let t = base; for (let i=0;i<4;i++) t = base - HGStats.offset(t, tz); return t; };
    return { start: boundary(y,m-1), end: boundary(y,m), now, tz };
  },
  measure(stats, ids, w) {
    if (!ids.length) return { incomplete:true };
    const points = ids.map(id => (stats[id] || []).map(r => ({ t: typeof r.end === 'number' ? r.end : Date.parse(r.end), v:r.sum }))
      .filter(r => Number.isFinite(r.t) && typeof r.v === 'number' && Number.isFinite(r.v) && r.t <= w.now).sort((a,b)=>a.t-b.t));
    const at = Math.min(...points.map(p => p.at(-1)?.t ?? -Infinity));
    if (!Number.isFinite(at) || at <= w.start) return { incomplete:true };
    let kwh = 0;
    for (const p of points) {
      const base = p.find(r => r.t === w.start), end = p.find(r => r.t === at);
      if (!base || !end) return { incomplete:true };
      const range = p.filter(r => r.t >= w.start && r.t <= at);
      if (range.some((r,i) => i && (r.t-range[i-1].t > 3600001 || r.v < range[i-1].v))) return { incomplete:true };
      kwh += end.v-base.v;
    }
    const stale = w.now-at > 2*3600000, elapsed = at-w.start;
    return { kwh, at, stale, forecast: !stale && elapsed >= 86400000 ? kwh/elapsed*(w.end-w.start) : null };
  },
  view(result, pref, rate) {
    const b = this.clean(pref), factor = b.unit === 'money' ? rate > 0 && Number.isFinite(rate) ? rate : null : 1;
    if (!b.target) return { status:'off' };
    if (factor == null) return { status:'rate_needed' };
    if (!result || result.incomplete) return { status:'incomplete' };
    const used = result.kwh*factor, forecast = result.forecast == null ? null : result.forecast*factor;
    return { used, forecast, remaining: Math.max(0,b.target-used), over:Math.max(0,used-b.target), percent:used/b.target*100,
      status:used >= b.target ? 'exceeded' : used >= b.target*b.threshold/100 ? 'near' : forecast != null && forecast > b.target ? 'risk' : 'normal' };
  },
  key(h, p) { return JSON.stringify([h.user?.id, (HGL.data.wiz||{}).homeEnergy, p.budget, Math.floor(Date.now()/300000)]); },
  async load(card) {
    const h = card._hass, p = HGPersonal.data, key = this.key(h,p);
    if (card._budgetKey === key) return;
    card._budgetKey = key; card._budgetResult = null; card._budgetBusy = true;
    const current = () => this.key(card._hass,HGPersonal.data) === key && card._budgetKey === key;
    try {
      const prefs = await h.callWS({type:'energy/get_prefs'}).catch(()=>({}));
      if (!current()) return;
      const chosen = (HGL.data.wiz||{}).homeEnergy;
      const ids = chosen ? [chosen] : [...new Set((prefs.energy_sources||[]).filter(s=>s.type==='grid').flatMap(s=>(s.flow_from||[]).map(f=>f.stat_energy_from)).filter(Boolean))];
      if (!ids.length) { card._budgetResult={missing:true}; return; }
      const w = this.window(h);
      const stats = await h.callWS({type:'recorder/statistics_during_period', start_time:new Date(w.start-3600000).toISOString(), end_time:new Date(w.now).toISOString(), period:'hour', statistic_ids:ids, types:['sum'], units:{energy:'kWh'}});
      if (current()) card._budgetResult = {...this.measure(stats,ids,w), ids, w};
    } catch(e) { if(current()) card._budgetResult={error:true}; }
    finally { if(current()) {card._budgetBusy=false; if(card.isConnected) card.rerender();} }
  },
  html(card) {
    const p=HGPersonal.data, b=this.clean(p.budget), t=HG_BUDGET_TEXT, h=card._hass;
    if(b.target) this.load(card);
    const r=card._budgetKey===this.key(h,p) ? card._budgetResult : null, v=this.view(r,b,p.rate), unit=b.unit==='money' ? H.esc(p.currency) : 'kWh';
    const fmt=x=>H.fmt(x,2)+' '+unit;
    return `<section class="cx-box" style="margin-bottom:16px"><h3>${t.title}</h3><p class="cx-note">${t.help}</p><div class="cx-actions"><button data-act="budget-settings" aria-expanded="${!!card._budgetSettings}">${t.configure}</button></div>${!b.target ? `<p>${t.off}</p>` : card._budgetBusy ? `<p role="status">${hgT('common.loading')}</p>` : r?.error ? `<p role="alert">${hgT('dashboardx.energy_error')}</p>` : r?.missing ? `<p>${hgT('dashboardx.energy_choose')}</p>` : `<p role="status"><b>${t[v.status]}</b></p>${v.used != null ? `<progress style="width:100%;height:12px" max="100" value="${Math.min(100,v.percent)}" aria-label="${t.used}"></progress><div class="cx-grid"><p>${t.used}<br><b class="cx-value">${fmt(v.used)}</b><br>/ ${fmt(b.target)}</p><p>${v.over>0?t.over:t.remaining}<br><b class="cx-value">${fmt(v.over>0?v.over:v.remaining)}</b></p><p>${t.forecast}<br><b>${v.forecast==null?'—':fmt(v.forecast)}</b></p></div>${r.stale?`<p>${t.stale}</p>`:v.forecast==null?`<p class="cx-note">${t.no_forecast}</p>`:''}<small>${t.as_of}: ${H.esc(new Date(r.at).toLocaleString(HG_LOC(),{timeZone:r.w.tz}))}</small><p class="cx-note">${t.source}: ${r.ids.map(e=>H.esc(h.states[e]?H.name(h,e):e)).join(', ')}</p>`:''}`}<p class="cx-note">${t.note}</p>${card._budgetSettings?`<label class="cx-field">${t.target}<input name="budget-target" type="number" min="0" max="1000000000" step="any" value="${b.target}"></label><label class="cx-field">${t.unit}<select name="budget-unit"><option value="kWh" ${b.unit==='kWh'?'selected':''}>kWh</option><option value="money" ${b.unit==='money'?'selected':''}>${H.esc(p.currency)}</option></select></label><label class="cx-field">${t.threshold}<input name="budget-threshold" type="number" min="1" max="100" step="1" value="${b.threshold}"></label><p class="cx-note">${t.rate_needed}</p><button class="cx-btn cx-primary" data-act="save-budget">${hgT('common.save')}</button>`:''}</section>`;
  }
};
