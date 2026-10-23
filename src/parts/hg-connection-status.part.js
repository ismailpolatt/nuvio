/* Read-only WebSocket liveness. A pong confirms the server, never a physical sensor. */
const HGConnection = window.HGConnection = {
  records:new Map(),version:0,
  record(h){const uid=h.user?.id||'';if(!this.records.has(uid))this.records.set(uid,{at:0,latency:null,failed:false,busy:false,ticket:0});return this.records.get(uid);},
  status(h,online=navigator.onLine!==false,now=Date.now()){const r=this.record(h);if(!online)return 'disconnected';if(h.connected===false||h.connection?.connected===false)return 'reconnecting';if(r.failed)return 'reconnecting';if(r.at&&now-r.at<=90000)return 'connected';return r.busy?'checking':'unverified';},
  async probe(page,force=false){const h=page._hass;if(!h?.user?.id||!h.callWS||navigator.onLine===false||h.connected===false||h.connection?.connected===false)return;
    const r=this.record(h);if(r.busy||(!force&&Date.now()-(r.attempt||0)<60000))return;const uid=h.user.id,conn=h.connection,ticket=++r.ticket,started=Date.now();r.attempt=started;r.busy=true;this.version++;let timer;
    const current=()=>page._hass?.user?.id===uid&&page._hass?.connection===conn&&r.ticket===ticket;
    try{await Promise.race([h.callWS({type:'ping'}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Timeout')),8000);})]);if(current()){r.at=Date.now();r.latency=r.at-started;r.failed=false;}}
    catch(e){if(current())r.failed=true;}
    finally{clearTimeout(timer);if(r.ticket===ticket)r.busy=false;this.version++;this.paint(page);}
  },
  paint(page){if(!page.shadowRoot||!page._hass)return;const state=this.status(page._hass),warn=['disconnected','reconnecting','unverified'].includes(state);let el=page.shadowRoot.querySelector('[data-connection-banner]');
    if(!el){el=document.createElement('div');el.dataset.connectionBanner='';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.style.cssText='position:fixed;inset:auto 16px 76px;z-index:1001;padding:10px 16px;border-radius:14px;background:#6b441b;color:#fff;font:14px/1.5 sans-serif;box-shadow:0 4px 18px #0006;pointer-events:none;';page.shadowRoot.appendChild(el);}
    el.hidden=!warn;el.textContent=warn?HG_EXPERIENCE_TEXT[state]+' · '+HG_EXPERIENCE_TEXT.connection_help:'';
  },
  bind(page){if(!page._hass||!page.isConnected)return;const conn=page._hass.connection;
    if(page._connectionBind&&page._connectionBind.conn!==conn)this.unbind(page);
    if(!page._connectionBind){const tick=()=>{if(!page.isConnected||page._hgHidden||document.hidden)return;this.probe(page);this.paint(page);},offline=()=>this.paint(page),ready=()=>{this.record(page._hass).attempt=0;tick();},lost=()=>{this.record(page._hass).failed=true;this.version++;this.paint(page);};
      const timer=setInterval(tick,15000);page._connectionBind={conn,tick,offline,ready,lost,timer};window.addEventListener('online',ready);window.addEventListener('offline',offline);document.addEventListener('visibilitychange',tick);conn?.addEventListener?.('ready',ready);conn?.addEventListener?.('disconnected',lost);conn?.addEventListener?.('reconnect-error',lost);tick();
    }else this.paint(page);
  },
  unbind(page){const b=page._connectionBind;if(!b)return;clearInterval(b.timer);window.removeEventListener('online',b.ready);window.removeEventListener('offline',b.offline);document.removeEventListener('visibilitychange',b.tick);b.conn?.removeEventListener?.('ready',b.ready);b.conn?.removeEventListener?.('disconnected',b.lost);b.conn?.removeEventListener?.('reconnect-error',b.lost);page._connectionBind=null;},
  html(card){const h=card._hass,r=this.record(h),t=HG_EXPERIENCE_TEXT,state=this.status(h),ids=[...new Set([...(HGPersonal.data.favorites||[]),HGPersonal.data.battery,HGPersonal.data.charging].filter(Boolean))];
    return `<section class="cx-box" style="margin-bottom:12px"><h3>${t.connection}</h3><p role="status"><b>${t[state]}</b></p><p>${t.verified}: ${r.at?H.esc(new Date(r.at).toLocaleString(HG_LOC())):'—'} · ${t.latency}: ${r.latency==null?'—':r.latency+' ms'}</p><p class="cx-note">${t.connection_help}</p><button class="cx-btn" data-act="experience-probe" ${r.busy?'disabled':''}>${t.retry}</button><h3 style="margin-top:16px">${t.data_time}</h3>${ids.map(e=>{const s=h.states[e],stamp=Date.parse(s?.last_reported||s?.last_updated);return `<div class="cx-row"><span>${H.esc(s?H.name(h,e):e)}<small>${H.ok(s)?Number.isFinite(stamp)?H.esc(new Date(stamp).toLocaleString(HG_LOC())):'—':hgT('common.unavailable')}</small></span></div>`;}).join('')||`<p>${t.empty}</p>`}</section>`;
  }
};
