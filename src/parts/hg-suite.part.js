/* Panel shortcuts, current-account backup and honest state timestamps. No device services. */
const HG_SUITE_TEXT = window.HG_SUITE_TEXT = hgTO({}, {unavailable: 'suite.unavailable', undated: 'suite.undated', stale: 'suite.stale', recent: 'suite.recent', attention: 'suite.attention', all: 'suite.all', app_hacs: 'suite.app_hacs', app_music: 'suite.app_music', app_zigbee: 'suite.app_zigbee', app_blueprint: 'suite.app_blueprint', panel_available: 'suite.panel_available', panel_missing: 'suite.panel_missing', rollback_failed: 'suite.rollback_failed', restore_failed: 'suite.restore_failed', backup_layout: 'suite.backup_layout', backup_personal: 'suite.backup_personal', backup_tablet: 'suite.backup_tablet', backup_journal: 'suite.backup_journal', data: 'suite.data', backup: 'suite.backup'});
const HGDataQuality = window.HGDataQuality = {
  stamp(s) { const n = Date.parse(s?.last_reported || s?.last_updated); return Number.isFinite(n) ? n : null; },
  assess(h, e, now = Date.now()) {
    const s = h.states[e], stamp = this.stamp(s), age = stamp == null ? null : now - stamp;
    const hours = window.HGExperience ? HGExperience.prefs().staleHours : 24;
    const unavailable = !s || ['unknown', 'unavailable', ''].includes(String(s.state));
    const status = unavailable ? 'unavailable' : age == null || age < -300000 ? 'undated' : age > hours * 3600000 ? 'stale' : 'recent';
    return { e, status, stamp, age, value: s?.state, unit: s?.attributes?.unit_of_measurement || '' };
  },
  rows(h) {
    return Object.keys(h.states).filter(e => /^(sensor|binary_sensor|climate)\./.test(e) && HGLiving.visible(h, e))
      .map(e => this.assess(h, e)).sort((a,b) => ['unavailable','undated','stale','recent'].indexOf(a.status) - ['unavailable','undated','stale','recent'].indexOf(b.status) || H.name(h,a.e).localeCompare(H.name(h,b.e)));
  },
  label(h,e) { const q = this.assess(h,e); return HG_SUITE_TEXT[q.status] + (q.stamp == null ? '' : ' · ' + new Date(q.stamp).toLocaleString(HG_LOC())); },
  decorate(card,html){
    if(!card._hass || !card._config || /control|apps|health/.test(card._config.type||''))return html;
    const ids=card.ents().filter(e=>/^(sensor|binary_sensor|climate)\./.test(e)),bad=ids.map(e=>this.assess(card._hass,e)).filter(r=>r.status!=='recent');
    if(!bad.length || !html.includes('</ha-card>'))return html;
    const title=bad.map(r=>H.name(card._hass,r.e)+': '+this.label(card._hass,r.e)).join('\n');
    return html.replace('</ha-card>',`<span role="note" title="${H.esc(title)}" style="position:absolute;right:10px;bottom:5px;max-width:calc(100% - 20px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:10px/1.4 sans-serif;padding:2px 6px;border-radius:6px;background:#44321bee;color:#ffdc9d;pointer-events:auto;">${hgT('suite.data_warning',{total:bad.length})}</span></ha-card>`);
  },
  html(card) {
    const h = card._hass, rows = this.rows(h), filter = card._qualityFilter || 'attention', shown = rows.filter(r => filter === 'all' || r.status !== 'recent');
    return `${HGConnection.html(card)}<section class="cx-box"><h3>${hgT('suite.data')}</h3><p class="cx-note">${hgT('suite.data_help')}</p><p class="cx-note">${hgT('suite.threshold', { hours: HGExperience.prefs().staleHours })}</p><div class="cx-actions">${['attention','all'].map(f=>`<button data-act="suite-quality-filter" data-filter="${f}" aria-pressed="${filter===f}">${HG_SUITE_TEXT[f]} (${f==='all'?rows.length:rows.filter(r=>r.status!=='recent').length})</button>`).join('')}</div><div class="suite-quality">${shown.map(r=>`<button class="cx-row suite-quality-row" data-act="details" data-e="${H.esc(r.e)}"><span><b>${H.esc(H.name(h,r.e))}</b><small>${H.esc(this.label(h,r.e))}</small></span><span class="suite-value" data-quality="${r.status}">${r.status==='recent'?H.esc(r.value+' '+r.unit):'—'}${r.status==='stale'?`<small>${hgT('suite.last_value')}: ${H.esc(r.value+' '+r.unit)}</small>`:''}</span></button>`).join('')||`<p>${hgT('suite.no_issues')}</p>`}</div></section>`;
  }
};

const HGApps = window.HGApps = {
  native(h){return !!h.auth?.external || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'') || (navigator.maxTouchPoints>0 && window.innerWidth<=700);},
  endNative(){
    const s=this._nativeSession;if(!s)return;this._nativeSession=null;clearInterval(s.timer);s.observer?.disconnect();
    window.removeEventListener('location-changed',s.update);window.removeEventListener('popstate',s.update);
    s.root.removeAttribute('data-nuvio-app-shell');s.root.style.removeProperty('--nuvio-app-bar-height');s.style.remove();s.bar.remove();
  },
  openNative(h,app){
    let s=this._nativeSession;
    if(s && s.uid!==h.user?.id){this.endNative();s=null;}
    if(!s){
      const root=document.querySelector('home-assistant');if(!root)return H.navigate(app.path);
      const bar=document.createElement('div'),shadow=bar.attachShadow({mode:'open'}),style=document.createElement('style');
      style.textContent='home-assistant[data-nuvio-app-shell]{position:fixed!important;top:var(--nuvio-app-bar-height)!important;bottom:0!important;left:0!important;width:100%!important;height:calc(100% - var(--nuvio-app-bar-height))!important;min-height:0!important}';document.head.appendChild(style);
      s=this._nativeSession={root,bar,shadow,style,uid:h.user.id,back:location.pathname+location.search+location.hash,id:app.id,started:false,at:Date.now()};
      bar.style.cssText='position:fixed;inset:0 0 auto;z-index:2147483000;color:var(--primary-text-color,#fff);background:var(--primary-background-color,#171b24);font:14px/1.4 sans-serif;';
      const size=()=>{if(this._nativeSession!==s)return;root.style.setProperty('--nuvio-app-bar-height',Math.ceil(bar.getBoundingClientRect().height)+'px');};
      s.update=()=>{
        if(this._nativeSession!==s)return;
        const live=root.hass;if(!live || live.user?.id!==s.uid){this.endNative();return;}
        const apps=this.list(live).filter(p=>p.path),path='/'+location.pathname.split('/').filter(Boolean)[0],current=apps.find(p=>p.path===path);
        if(current){s.id=current.id;s.started=true;}else if(s.started || location.pathname!==s.back.split(/[?#]/)[0] || Date.now()-s.at>10000){this.endNative();return;}
        const active=apps.find(p=>p.id===s.id);if(!active){this.endNative();return;}
        const sig=JSON.stringify([apps,s.id]);if(sig!==s.sig){s.sig=sig;shadow.innerHTML=`<style>:host{display:block}header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;padding-top:max(8px,env(safe-area-inset-top))}b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}button{font:inherit;color:inherit;background:#ffffff16;border:0;border-radius:12px;min-height:44px;padding:8px 14px;flex:none;cursor:pointer}button:focus-visible{outline:2px solid #49a3ff}nav{display:flex;gap:6px;overflow-x:auto;padding:0 12px 8px;scrollbar-width:thin}nav button{white-space:nowrap}nav [aria-pressed=true]{background:#49a3ff;color:#081a2b}</style><header><b>${H.esc(active.title)}</b><button data-close>${H.esc(hgT('common.close'))}</button></header><nav aria-label="${H.esc(hgT('suite.apps'))}">${apps.map(p=>`<button data-app="${H.esc(p.id)}" aria-pressed="${p.id===s.id}">${H.esc(p.title)}</button>`).join('')}</nav>`;size();}
      };
      shadow.addEventListener('click',e=>{const b=e.composedPath().find(n=>n.dataset && ('app' in n.dataset || 'close' in n.dataset));if(!b)return;
        const live=root.hass;if(live?.user?.id!==s.uid){this.endNative();return;}
        if('close' in b.dataset){const back=s.back;this.endNative();H.navigate(back);return;}
        const target=this.list(live).find(p=>p.id===b.dataset.app && p.path);if(target)H.navigate(target.path);
      });
      document.body.appendChild(bar);root.setAttribute('data-nuvio-app-shell','');
      if(typeof ResizeObserver!=='undefined'){s.observer=new ResizeObserver(size);s.observer.observe(bar);}
      s.timer=setInterval(s.update,500);window.addEventListener('location-changed',s.update);window.addEventListener('popstate',s.update);
    }
    s.id=app.id;H.navigate(app.path);s.update();
  },
  clean(v) {
    if(!Array.isArray(v))return null;
    const seen=new Set();return v.filter(r=>r && typeof r.id==='string' && /^(hacs|music|zigbee|blueprint|panel:[a-zA-Z0-9_-]+)$/.test(r.id) && !seen.has(r.id) && seen.add(r.id)).slice(0,32).map(r=>({id:r.id,title:typeof r.title==='string'?r.title.trim().slice(0,60):''}));
  },
  available(h) {
    return Object.entries(h.panels||{}).filter(([path,p])=>/^[a-zA-Z0-9_-]+$/.test(path) && typeof p.title==='string' && p.title.trim() && (!p.require_admin || h.user?.is_admin) && path!==(this._nativeSession?.back||location.pathname).split('/').filter(Boolean)[0]).map(([path,p])=>({id:'panel:'+path,title:p.title,icon:/^mdi:[a-z0-9-]+$/.test(p.icon||'')?p.icon:'mdi:application-outline',admin:!!p.require_admin,path:'/'+path})).sort((a,b)=>a.title.localeCompare(b.title));
  },
  prefs(h){return HGPersonal.uid===h.user?.id?this.clean(HGPersonal.data.apps):null;},
  chrome(frame, every=setInterval, stop=clearInterval) {
    let closed=false;
    const apply=()=>{if(closed || frame.isConnected===false)return;try{
      const doc=frame.contentDocument;if(!doc || doc.hidden)return;
      const main=doc.querySelector('home-assistant')?.shadowRoot?.querySelector('home-assistant-main'),root=main?.shadowRoot;if(!root)return;
      const style=(r,css)=>{if(!r || r.querySelector('style[data-nuvio-app-chrome]'))return;const s=doc.createElement('style');s.dataset.nuvioAppChrome='';s.textContent=css;r.appendChild(s);};
      style(root,'ha-sidebar,[slot="sidebar"]{display:none!important}ha-drawer{--ha-sidebar-width:0px!important;--mdc-drawer-width:0px!important;--app-drawer-width:0px!important}');
      for(const k of ['--ha-sidebar-width','--mdc-drawer-width'])if(main.style.getPropertyValue(k)!=='0px')main.style.setProperty(k,'0px');
      const drawer=root.querySelector('ha-drawer');style(drawer?.shadowRoot,':host{--ha-sidebar-width:0px!important;--mdc-drawer-width:0px!important}.sidebar-shell,aside.mdc-drawer{display:none!important}.app-content{padding-inline-start:0!important}.mdc-drawer-app-content{margin-left:0!important;margin-inline-start:0!important}');
    }catch(e){/* Only same-origin embedded HA documents may be adjusted. */}};
    const timer=every(apply,500);apply();return ()=>{closed=true;stop(timer);};
  },
  groups: [
    ['hacs','HACS','mdi:store-outline', /(?:^|\s)hacs(?:\s|$)/i, true],
    ['music','Music Assistant','mdi:music-circle-outline', /music.?assistant/i, false],
    ['zigbee','Zigbee2MQTT','mdi:zigbee', /zigbee2mqtt/i, true],
    ['blueprint','Blueprint Studio','mdi:file-code-outline', /blueprint.?studio/i, true]
  ],
  defaults(h) {
    const panels = Object.entries(h.panels || {});
    return this.groups.filter(([, , , , admin])=>!admin || h.user?.is_admin).map(([id,title,icon,re,admin])=>{
      const matches = panels.filter(([path,p])=>re.test(path+' '+(p.title||'')) && (!p.require_admin || h.user?.is_admin));
      const found = matches.sort(([a],[b])=>Number(/manager/.test(a))-Number(/manager/.test(b)))[0];
      const path = found?.[0];
      return { id,title,icon,admin,path: path && /^[a-zA-Z0-9_-]+$/.test(path) ? '/'+path : null };
    });
  },
  list(h) {
    const prefs=this.prefs(h),defaults=this.defaults(h);if(prefs===null)return defaults;
    const all=[...defaults,...this.available(h)];return prefs.map(r=>{const p=all.find(p=>p.id===r.id);return p?{...p,title:r.title||p.title}:null;}).filter(Boolean);
  },
  html(h) {
    return `<style>${HG_SUITE_CSS}</style><div class="suite-app-toolbar"><p class="suite-hint">${hgT('suite.apps_personal')}</p><button data-act="app-manage">${H.icon('mdi:tune')}${hgT('suite.apps_manage')}</button></div><div class="suite-app-grid">${this.list(h).map(p=>`<section class="suite-app"><div class="suite-app-icon">${H.icon(p.icon)}</div><h3>${H.esc(p.title)}</h3><p>${H.esc(HG_SUITE_TEXT['app_'+p.id]||hgT('suite.apps_registered'))}</p><small>${HG_SUITE_TEXT[p.path?'panel_available':'panel_missing']}${p.admin?' · '+hgT('suite.admin'):''}</small>${p.path?`<button type="button" data-act="app-open" data-app="${H.esc(p.id)}">${hgT('suite.open_app')}${H.icon('mdi:arrow-right')}</button>`:`<span>${hgT('suite.not_configured')}</span>`}</section>`).join('')||`<p class="suite-hint">${hgT('suite.apps_empty')}</p>`}</div><p class="suite-hint">${hgT('suite.apps_help')}</p>`;
  }
};
class HGAppsCard extends HGBase {
  defaults(){return {};}
  ents(){return [];}
  _extraSig(){return [this._hass.panels,this._hass.user?.id,this._hass.user?.is_admin,HGPersonal.uid,HGPersonal.data.apps,HGPersonal.failed];}
  _changed(){return this._appsDraft && this._appsDraftUid===this._hass.user?.id?false:super._changed();}
  css(){return HG_SUITE_CSS+'ha-card.glass{padding:16px}';}
  render(){
    if(this._appDialog && (this._appUid!==this._hass.user?.id || this._appAdmin!==!!this._hass.user?.is_admin || !HGApps.list(this._hass).some(p=>p.id===this._appId && p.path===this._appPath)))this._closeApp();
    if(this._appsDraft && this._appsDraftUid!==this._hass.user?.id)this._appsDraft=null;
    return `<ha-card class="glass">${this._appsDraft?this._editor():HGApps.html(this._hass)}${this._appsMessage?`<p role="status" class="suite-hint">${H.esc(this._appsMessage)}</p>`:''}</ha-card>`;
  }
  _editor(){
    const h=this._hass,available=HGApps.available(h),all=[...HGApps.defaults(h),...available];
    return `<div class="suite-app-toolbar"><h3>${hgT('suite.apps_manage')}</h3><span>${hgT('suite.apps_personal')}</span></div><div class="suite-app-editor">${this._appsDraft.map((r,i)=>{const p=all.find(p=>p.id===r.id);return `<div class="suite-app-edit-row" data-app-row="${H.esc(r.id)}"><label>${hgT('suite.apps_name')}<input name="app-title" maxlength="60" value="${H.esc(r.title||p?.title||r.id)}"></label><button data-act="app-up" data-index="${i}" ${i===0?'disabled':''} aria-label="${hgT('lookr.move_up')}">${H.icon('mdi:arrow-up')}</button><button data-act="app-remove" data-index="${i}" aria-label="${hgT('suite.apps_remove')}">${H.icon('mdi:delete-outline')}</button></div>`;}).join('')}<label class="suite-app-field">${hgT('suite.apps_choose')}<select name="app-panel"><option value="">${hgT('suite.apps_choose')}</option>${available.filter(p=>!this._appsDraft.some(r=>r.id===p.id || all.find(x=>x.id===r.id)?.path===p.path)).map(p=>`<option value="${H.esc(p.id)}">${H.esc(p.title)}</option>`).join('')}</select></label><div class="suite-app-toolbar"><button data-act="app-add" ${this._appsDraft.length>=32?'disabled':''}>${hgT('suite.apps_add')}</button><button data-act="app-defaults">${hgT('suite.apps_defaults')}</button></div><p class="suite-hint">${hgT('suite.apps_access_help')}</p><div class="suite-app-toolbar"><button data-act="app-save" ${this._appsSaving?'disabled':''}>${hgT('common.save')}</button><button data-act="app-cancel" ${this._appsSaving?'disabled':''}>${hgT('common.cancel')}</button></div></div>`;
  }
  _collectApps(){for(const row of this.shadowRoot.querySelectorAll('[data-app-row]')){const r=this._appsDraft.find(x=>x.id===row.dataset.appRow);if(r)r.title=(row.querySelector('input')?.value||'').trim().slice(0,60);}}
  _closeApp(){this._appChromeCleanup?.();this._appChromeCleanup=null;const d=this._appDialog;this._appDialog=null;this._appId=this._appPath=this._appUid=null;if(d){d.close();d.remove();}if(this._appOpener?.isConnected)this._appOpener.focus();this._appOpener=null;}
  _openApp(id,opener){
    const apps=HGApps.list(this._hass).filter(p=>p.path),app=apps.find(p=>p.id===id),uid=this._hass.user?.id;
    if(!app || !uid)return;
    if(HGApps.native(this._hass)){this._closeApp();return HGApps.openNative(this._hass,app);}
    if(this._appDialog && this._appUid!==uid)this._closeApp();
    if(!this._appDialog){
      const d=document.createElement('dialog');d.className='suite-app-viewer';d.setAttribute('aria-label',app.title);
      d.innerHTML=`<header><b data-app-title></b><button type="button" data-act="app-close" autofocus aria-label="${H.esc(hgT('common.close'))}">${H.icon('mdi:close')}<span>${hgT('common.close')}</span></button></header><nav class="suite-app-tabs" aria-label="${H.esc(hgT('suite.apps'))}">${apps.map(p=>`<button type="button" data-act="app-open" data-app="${H.esc(p.id)}" aria-pressed="false">${H.esc(p.title)}</button>`).join('')}</nav><iframe class="suite-app-frame" allow="fullscreen" referrerpolicy="same-origin"></iframe>`;
      d.oncancel=e=>{e.preventDefault();this._closeApp();};
      // Outside the morph root: HA state updates must not reload the running application.
      this.shadowRoot.appendChild(d);this._appDialog=d;this._appOpener=opener;this._appUid=uid;this._appAdmin=!!this._hass.user?.is_admin;
    }
    const d=this._appDialog,f=d.querySelector('iframe');d.setAttribute('aria-label',app.title);d.querySelector('[data-app-title]').textContent=app.title;f.title=app.title;
    f.onload=()=>{if(this._appDialog!==d)return;this._appChromeCleanup?.();this._appChromeCleanup=HGApps.chrome(f);};
    if(this._appPath!==app.path)f.src=app.path;
    this._appId=id;this._appPath=app.path;
    for(const b of d.querySelectorAll('[data-app]'))b.setAttribute('aria-pressed',String(b.dataset.app===id));
    if(!d.open)d.showModal();
  }
  async onAct(a,b){
    if(a==='app-close')return this._closeApp();if(a==='app-open')return this._openApp(b.dataset.app,b);
    if(this._appsSaving)return;
    const h=this._hass,uid=h.user?.id;
    if(a==='app-manage'){
      await HGPersonal.load(h);if(this._hass.user?.id!==uid)return;
      if(HGPersonal.failed){this._appsMessage=hgT('controlx.load_failed');return this.rerender();}
      this._appsDraft=HGApps.prefs(h)??HGApps.defaults(h).map(p=>({id:p.id,title:''}));this._appsDraftUid=uid;this._appsMessage='';return this.rerender();
    }
    if(!this._appsDraft || this._appsDraftUid!==uid)return;
    if(a==='app-cancel'){this._appsDraft=null;this._appsMessage='';return this.rerender();}
    this._collectApps();const i=Number(b.dataset.index);
    if(a==='app-up' && Number.isInteger(i) && i>0 && i<this._appsDraft.length)[this._appsDraft[i-1],this._appsDraft[i]]=[this._appsDraft[i],this._appsDraft[i-1]];
    if(a==='app-remove' && Number.isInteger(i) && i>=0 && i<this._appsDraft.length)this._appsDraft.splice(i,1);
    if(a==='app-defaults')this._appsDraft=HGApps.defaults(h).map(p=>({id:p.id,title:''}));
    if(a==='app-add'){
      const id=this.shadowRoot.querySelector('[name=app-panel]')?.value,p=HGApps.available(h).find(p=>p.id===id),all=[...HGApps.defaults(h),...HGApps.available(h)];
      if(p && this._appsDraft.length<32 && !this._appsDraft.some(r=>r.id===id || all.find(x=>x.id===r.id)?.path===p.path))this._appsDraft.push({id,title:''});
    }
    if(a==='app-save'){
      this._appsSaving=true;
      try{await HGPersonal.save(h,{apps:HGApps.clean(this._appsDraft)});if(this._hass.user?.id===uid){this._appsDraft=null;this._appsMessage=hgT('controlx.saved');}}
      catch(e){if(this._hass.user?.id===uid)this._appsMessage=hgT('controlx.failed');}
      finally{this._appsSaving=false;}
    }
    this.rerender();
  }
  disconnectedCallback(){this._closeApp();super.disconnectedCallback();}
}
hgReg('hg-apps-card',HGAppsCard,hgTLazy('suite.apps'),hgTLazy('suite.apps_help'));

const HGFullBackup = window.HGFullBackup = {
  format: 'nuvio-complete', schema: 1,
  clone(v){return v == null ? v : JSON.parse(JSON.stringify(v));},
  dash(){return location.pathname.split('/').filter(Boolean)[0];},
  owner(card,uid){if(!uid || card._hass.user?.id!==uid || !card._hass.user.is_admin)throw Error(hgT('suite.account_changed'));},
  async user(h,key){const r=await h.callWS({type:'frontend/get_user_data',key});return r?.value ?? null;},
  local(h){const out={tablet:HGTablet.clean(HGLiving.tabletPrefs(h)),preferences:{}};
    // Explicit allowlist; never enumerate authentication storage or copy lock sessions.
    for(const k of ['home-glass:wall-here','home-glass:lang','home-glass:blur','home-glass:eco','home-glass:lite']){const v=localStorage.getItem(k);if(v!=null)out.preferences[k]=v;}return out;},
  async snapshot(card){const h=card._hass,uid=h.user?.id;this.owner(card,uid);
    if(HGL.editing)throw Error(hgT('suite.finish_edit'));
    await HGJournal.queue;
    const [personal,journal,userLayout,language,dashboard,shared] = await Promise.all([
      this.user(h,HGPersonal.key),this.user(h,HGJournal.key),this.user(h,HGL.KEY),this.user(h,HGLang.KEY),
      h.callWS({type:'lovelace/config',url_path:this.dash()}),
      h.callWS({type:'lovelace/config',url_path:HGShared.URL}).catch(e=>{if(e?.code==='not_found'||e?.code==='config_not_found')return null;throw e;})
    ]);
    this.owner(card,uid);
    return this.clone({format:this.format,schema:this.schema,nuvio:String(HG_BUILD).split('+')[0],exported:new Date().toISOString(),source:{dashboard:this.dash()},data:{dashboard,shared,userLayout,personal,journal,language,local:this.local(h)}});
  },
  parse(text){
    const bad=()=>{throw Error(hgT('suite.invalid_backup'));},ob=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
    if(typeof text!=='string'||text.length>4e6)bad();let o;
    try{o=JSON.parse(text.replace(/^\uFEFF/,''),(k,v)=>{if(['__proto__','prototype','constructor'].includes(k))bad();return v;});}catch(e){bad();}
    if(!ob(o)||o.format!==this.format||o.schema!==this.schema||!ob(o.data))bad();const d=o.data;
    if(['dashboard','shared','userLayout','personal','journal','language','local'].some(k=>!Object.prototype.hasOwnProperty.call(d,k)))bad();
    if(!ob(d.dashboard)||!String(d.dashboard.strategy?.type||'').match(/^custom:(nuvio|home-glass)$/)||!ob(d.local)||!ob(d.local.tablet)||!ob(d.local.preferences))bad();
    if(d.shared!=null&&(!ob(d.shared)||![true,1].includes(d.shared.nuvio_shared)||!ob(d.shared.data)))bad();
    for(const v of [d.userLayout,d.shared?.data])if(v!=null){if(!ob(v)||!ob(v.s))bad();HGBackup.parse(JSON.stringify({format:'nuvio-layout',schema:2,data:v}));}
    if(d.personal!=null&&!ob(d.personal)||d.journal!=null&&!Array.isArray(d.journal)||d.language!=null&&typeof d.language!=='string')bad();
    if(d.personal?.modes)for(const rows of Object.values(d.personal.modes)){if(!Array.isArray(rows)||rows.length>12||rows.some(r=>!r||!/^(light|switch)\.[a-z0-9_]+$/.test(r.e)||!['on','off'].includes(r.state)))bad();}
    if(d.journal!=null&&HGJournal.clean(d.journal).length!==d.journal.length)bad();
    const allowed=['home-glass:wall-here','home-glass:lang','home-glass:blur','home-glass:eco','home-glass:lite'];
    for(const [k,v] of Object.entries(d.local.preferences))if(!allowed.includes(k)||typeof v!=='string'||v.length>200)bad();
    if(d.language && !HGLang.ok(d.language))bad();
    d.personal=d.personal==null?null:HGPersonal.clean(d.personal);d.journal=d.journal==null?null:HGJournal.clean(d.journal);d.local.tablet=HGTablet.clean(d.local.tablet);
    return o;
  },
  summary(o,h){const d=o.data,layout=d.shared?.data||d.userLayout||{},m=d.personal?.modes||{},ents=new Set(HGBackup.ents(layout,h));
    for(const e of [...(d.personal?.favorites||[]),...(d.personal?.meters||[]),d.personal?.battery,d.personal?.charging,...Object.values(m).flatMap(rs=>rs.map(r=>r.e))].filter(Boolean))ents.add(e);
    return {cards:Object.values(layout.s||{}).reduce((n,v)=>n+(v.added||[]).length,0),steps:Object.values(m).reduce((n,r)=>n+r.length,0),tasks:d.personal?.experience?.tasks?.length||0,journal:d.journal?.length||0,missing:[...ents].filter(e=>!h.states[e])};},
  download(o){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}));a.href=url;a.download='nuvio-tam-yedek-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1000);},
  async restore(card,o,uid){this.owner(card,uid);o=this.parse(JSON.stringify(o));const before=await this.snapshot(card);this.owner(card,uid);
    card._backupUndo=before;
    // Keep a downloadable recovery snapshot on this browser before the first server mutation.
    localStorage.setItem('nuvio:complete-undo:'+uid+':'+this.dash(),JSON.stringify(before));
    const h=card._hass,d=o.data,b=before.data,applied=[];
    const set=async(key,value,previous)=>{this.owner(card,uid);applied.push(()=>h.callWS({type:'frontend/set_user_data',key,value:previous}));await h.callWS({type:'frontend/set_user_data',key,value});};
    try{
      await set(HGPersonal.key,d.personal,b.personal);await set(HGJournal.key,d.journal,b.journal);await set(HGL.KEY,d.userLayout,b.userLayout);await set(HGLang.KEY,d.language,b.language);
      if(d.shared){this.owner(card,uid);if(!b.shared)throw Error(hgT('suite.shared_missing'));const doc={...d.shared,own:b.shared.own||[]};applied.push(()=>HGShared.put(h,b.shared));await HGShared.put(h,doc);}
      this.owner(card,uid);
      const keys=['home-glass:wall-here','home-glass:lang','home-glass:blur','home-glass:eco','home-glass:lite'],tk=HGLiving.tabletKey(h),localBefore=new Map([tk,...keys].map(k=>[k,localStorage.getItem(k)]));
      applied.push(()=>{for(const [k,v]of localBefore)v==null?localStorage.removeItem(k):localStorage.setItem(k,v);});
      localStorage.setItem(tk,JSON.stringify(d.local.tablet));for(const k of keys){const v=d.local.preferences[k];v==null?localStorage.removeItem(k):localStorage.setItem(k,v);}
      this.owner(card,uid);applied.push(()=>h.callWS({type:'lovelace/config/save',url_path:this.dash(),config:b.dashboard}));await h.callWS({type:'lovelace/config/save',url_path:this.dash(),config:d.dashboard});
      HGPersonal.data=HGPersonal.clean(d.personal);HGJournal.rows=HGJournal.clean(d.journal);HGJournal.version++;HGL._p=null;HGLang._v=undefined;
      return true;
    }catch(e){let rollbackFailed=false;for(const undo of applied.reverse()){try{await undo();}catch(x){rollbackFailed=true;}}
      throw Error(HG_SUITE_TEXT[rollbackFailed?'rollback_failed':'restore_failed']);
    }
  },
  html(card){if(!card._hass.user?.is_admin)return `<p>${hgT('suite.admin')}</p>`;const o=card._backupPreview,s=o&&this.summary(o,card._hass);
    return `<style>${HG_SUITE_CSS}</style><section class="cx-box"><h3>${hgT('suite.backup')}</h3><p>${hgT('suite.backup_help')}</p><ul>${['backup_layout','backup_personal','backup_tablet','backup_journal'].map(k=>`<li>${HG_SUITE_TEXT[k]}</li>`).join('')}</ul><p class="cx-note">${hgT('suite.backup_scope')}</p><div class="cx-actions"><button class="cx-primary" data-act="suite-export" ${card._saving?'disabled':''}>${hgT('suite.export')}</button><label class="suite-file">${hgT('suite.import')}<input type="file" data-suite-file accept=".json,application/json" ${card._saving?'disabled':''}></label><button data-act="suite-recovery">${hgT('suite.recovery')}</button></div></section>${o?`<section class="cx-box" style="margin-top:12px"><h3>${hgT('suite.preview')}</h3><p>${H.esc(o.nuvio||'')} · ${H.esc(o.exported||'')}</p><p>${hgT('suite.backup_counts',{cards:s.cards,steps:s.steps,tasks:s.tasks,journal:s.journal})}</p><p>${hgT('suite.backup_missing',{total:s.missing.length})}</p><p class="cx-note">${hgT('suite.restore_help')}</p><label class="cx-row"><input type="checkbox" data-suite-confirm><span>${hgT('suite.confirm_restore')}</span></label><div class="cx-actions"><button data-act="suite-restore" ${card._saving?'disabled':''}>${hgT('suite.restore')}</button><button data-act="suite-cancel">${hgT('common.cancel')}</button></div></section>`:''}`;
  }
};

const HGSuite=window.HGSuite={
  async act(card,a,b){const uid=card._hass.user?.id;
    if(a==='suite-quality-filter'){card._qualityFilter=b.dataset.filter==='all'?'all':'attention';return card.rerender();}
    if(a==='suite-cancel'){card._backupPreview=null;return card.rerender();}
    if(a==='suite-restore'&&(!card._backupPreview||card._backupUid!==uid||!card.shadowRoot.querySelector('[data-suite-confirm]')?.checked))return;
    card._saving=true;
    try{
      if(a==='suite-export'){HGFullBackup.download(await HGFullBackup.snapshot(card));card._message=hgT('suite.exported');}
      if(a==='suite-recovery'){HGFullBackup.owner(card,uid);const v=card._backupUndo||JSON.parse(localStorage.getItem('nuvio:complete-undo:'+uid+':'+HGFullBackup.dash())||'null');if(!v)throw Error(hgT('suite.no_recovery'));HGFullBackup.download(HGFullBackup.parse(JSON.stringify(v)));}
      if(a==='suite-restore'){await HGFullBackup.restore(card,card._backupPreview,uid);card._backupPreview=null;card._message=hgT('suite.restored');setTimeout(()=>location.reload(),1200);}
    }catch(e){card._message=e.message||hgT('controlx.failed');}finally{card._saving=false;card.rerender();}
  },
  bind(card){const input=card.shadowRoot.querySelector('[data-suite-file]');if(input)input.onchange=async()=>{const f=input.files?.[0],uid=card._hass.user?.id;if(!f)return;try{HGFullBackup.owner(card,uid);if(f.size>4e6)throw Error(hgT('suite.invalid_backup'));const o=HGFullBackup.parse(await f.text());HGFullBackup.owner(card,uid);card._backupPreview=o;card._backupUid=uid;card._message='';}catch(e){card._backupPreview=null;card._message=e.message;}card.rerender();};}
};
HGLiving.tabs.push('data','backup');
const hgLivingTextBeforeSuite=HGLiving.text.bind(HGLiving),hgLivingHtmlBeforeSuite=HGLiving.html.bind(HGLiving);
HGLiving.text=k=>['data','backup'].includes(k)?HG_SUITE_TEXT[k]:hgLivingTextBeforeSuite(k);
HGLiving.html=(card,tab)=>tab==='data'?`<style>${HG_SUITE_CSS}</style>${HGDataQuality.html(card)}`:tab==='backup'?HGFullBackup.html(card):hgLivingHtmlBeforeSuite(card,tab);
const hgControlBindBeforeSuite=HGControlCard.prototype.afterRender;
HGControlCard.prototype.afterRender=function(){hgControlBindBeforeSuite.call(this);HGSuite.bind(this);};

const HG_SUITE_CSS=`
.suite-app-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}.suite-app-toolbar button,.suite-app-edit-row button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;min-width:44px;padding:8px 14px;border:0;border-radius:12px;background:var(--hg-tile-bg,#ffffff18);color:inherit;font:inherit;cursor:pointer}.suite-app-toolbar ha-icon,.suite-app-edit-row ha-icon{width:20px;height:20px;--mdc-icon-size:20px}.suite-app-toolbar svg,.suite-app-edit-row svg{width:20px;height:20px}.suite-app-editor{max-width:900px}.suite-app-edit-row{display:grid;grid-template-columns:minmax(0,1fr) 44px 44px;gap:10px;align-items:end;margin:12px 0}.suite-app-edit-row label,.suite-app-field{display:grid;gap:6px;font-size:14px}.suite-app-editor input,.suite-app-editor select{width:100%;box-sizing:border-box;min-height:44px;padding:10px 12px;border:1px solid var(--hg-glass-bd,#ffffff30);border-radius:12px;color:inherit;background:var(--hg-tile-bg,#ffffff18);font:inherit}.suite-app-field{margin:20px 0 12px}.suite-app-editor option{color:var(--primary-text-color);background:var(--primary-background-color)}.suite-app-editor button:disabled{opacity:.4}.suite-app-toolbar h3,.suite-app-toolbar p{margin:0}

.suite-app-viewer{position:fixed;inset:0;box-sizing:border-box;width:100%;height:100%;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:var(--primary-background-color,#171b24);color:var(--primary-text-color,#fff)}.suite-app-viewer[open]{display:grid;grid-template-rows:auto auto minmax(0,1fr)}.suite-app-viewer::backdrop{background:#0009}.suite-app-viewer header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 16px;padding-top:max(10px,env(safe-area-inset-top));font-size:17px}.suite-app-viewer button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:8px 16px;border:0;border-radius:12px;color:inherit;background:var(--hg-tile-bg,#ffffff18);font:inherit;cursor:pointer}.suite-app-viewer button:focus-visible{outline:2px solid var(--hg-accent,#49a3ff);outline-offset:-2px}.suite-app-viewer header svg,.suite-app-viewer header ha-icon{width:20px;height:20px;--mdc-icon-size:20px;flex:none}.suite-app-tabs{display:flex;gap:8px;overflow-x:auto;padding:4px 16px 12px;font-size:14px}.suite-app-tabs button{flex:none}.suite-app-tabs [aria-pressed=true]{background:var(--hg-accent,#49a3ff);color:var(--hg-on-accent,#fff)}.suite-app-frame{display:block;box-sizing:border-box;width:100%;height:100%;min-height:0;border:0;background:var(--primary-background-color,#171b24)}

ha-card.glass{box-sizing:border-box}.suite-app-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.suite-app{display:flex;flex-direction:column;align-items:flex-start;gap:12px;min-width:0;padding:24px;border-radius:22px;background:var(--ui-sec,var(--hg-tile-bg));box-shadow:var(--ui-rim,none)}.suite-app h3,.suite-app p{margin:0}.suite-app p,.suite-app small,.suite-hint{opacity:.75;line-height:1.5}.suite-app-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:var(--hg-accent-soft,#ffffff18)}.suite-app-icon ha-icon{--mdc-icon-size:30px}.suite-app button,.suite-file{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 16px;border-radius:12px;background:var(--hg-accent);color:var(--hg-on-accent);text-decoration:none;cursor:pointer}.suite-app button{margin-top:auto;font-size:14px;border:0}.suite-app button svg,.suite-app button ha-icon{width:18px;height:18px;--mdc-icon-size:18px;flex:none}.suite-app-icon svg{width:30px;height:30px}.suite-app button:focus-visible,.suite-file:focus-within{outline:2px solid currentColor;outline-offset:3px}.suite-file{position:relative}.suite-file input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}.suite-quality-row{width:100%;text-align:start;color:inherit;background:none;border:0;min-height:64px;cursor:pointer;gap:16px}.suite-quality-row>span:first-child{min-width:0;overflow-wrap:anywhere}.suite-quality-row small{display:block;opacity:.75;font-size:12px;line-height:1.5}.suite-value{text-align:end;max-width:45%;flex-shrink:0}.suite-value[data-quality=stale]{color:var(--warning-color,#ffce85)}@media(max-width:600px){.suite-app-grid{grid-template-columns:1fr}.suite-app{padding:18px}.suite-quality-row{align-items:flex-start}.suite-value{max-width:40%}}
`;
