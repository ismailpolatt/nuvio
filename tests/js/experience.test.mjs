import {test} from 'node:test';import assert from 'node:assert/strict';import {loadParts} from './harness.mjs';
function setup(){const store=new Map(),window={innerWidth:864,innerHeight:700,addEventListener(){},removeEventListener(){}},navigator={onLine:true,maxTouchPoints:1},HGL={data:{wiz:{}},notify(){},sort:(xs,key,order=[])=>[...xs].sort((a,b)=>(order.includes(key(a))?order.indexOf(key(a)):999)-(order.includes(key(b))?order.indexOf(key(b)):999))},document={hidden:false,addEventListener(){},removeEventListener(){}};
 const H={ok:s=>!!s&&!['unknown','unavailable'].includes(s.state),name:(h,e)=>h.states[e]?.attributes?.friendly_name||e,fmt:(v,n)=>Number(v).toFixed(n),esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),icon:s=>s,stateLabel:s=>s};
 const HGDashboard={catalog:()=>[{_k:'a',title:'A'},{_k:'b',title:'B'},{_k:'new',title:'New'}],health:()=>[]},globals={window,navigator,document,H,HGL,HGDashboard,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},location:{pathname:'/dashboard-test/kontrol'},HGAreas:{model:h=>h.model||{list:[]}},HGBase:class{rerender(){}},hgReg(){},hgTO:(o,m)=>Object.assign(o,m),hgTLazy:s=>s,hgT:s=>s,HG_LOC:()=> 'en-GB'};
 const x=loadParts(['shared/stats.part.js','hg-controlx.part.js','hg-livingx.part.js','hg-budget.part.js','hg-experience.part.js','hg-tablet-profile.part.js','hg-connection-status.part.js'],globals,['HGPersonal','HGControlCard','HGLiving','HGExperience','HGTablet','HGConnection']);
 x.HGPersonal.data=x.HGPersonal.clean({});return {...x,window,navigator,store};}
const now=Date.parse('2026-10-23T12:00:00Z'),s=(state,attributes={},stamp=now)=>({state,attributes,last_updated:new Date(stamp).toISOString()});
function card(p,values={}){const writes=[],h={user:{id:'one'},config:{time_zone:'Europe/Istanbul'},states:{'sensor.room':s('24')},callWS:async q=>{writes.push(q);return {};},callService:()=>{throw Error('No physical commands allowed');}};p.uid='one';const c={_hass:h,rerender(){},shadowRoot:{querySelector:q=>({value:values[q]??'',checked:false}),querySelectorAll:()=>[]}};return {c,writes};}
test('maintenance sanitizes invalid dates, duplicate ids and limits records without dropping preferences',()=>{
 const {HGExperience:e,HGPersonal:p}=setup(),tasks=[{id:'bad',title:'Bad',due:'2026-02-30'},...Array.from({length:60},(_,i)=>({id:String(i),title:'Task',due:'2026-10-23',days:30,last:'wrong'}))];
 assert.equal(e.clean({tasks}).tasks.length,50);assert.equal(e.date('2028-02-29'),true);assert.equal(e.date('2026-02-29'),false);
 const v=p.clean({budget:{target:300},favorites:['light.one'],experience:{tasks}});assert.equal(v.experience.tasks.length,50);assert.deepEqual(v.favorites,['light.one']);assert.equal(v.budget.target,300);
});
test('maintenance creates account-owned records and rejects changed accounts before save',async()=>{
 const {HGPersonal:p,HGExperience:e}=setup(),{c,writes}=card(p,{'[name=task-title]':'Filter','[name=task-due]':'2026-11-01','[name=task-days]':'30','[name=task-entity]':''});
 p.data.favorites=['light.one'];await e.act(c,'experience-task-add',{});assert.equal(writes.length,0);await e.act(c,'experience-task-save',{});assert.equal(writes.length,1);assert.equal(writes[0].type,'frontend/set_user_data');assert.equal(p.data.experience.tasks[0].title,'Filter');assert.deepEqual(p.data.favorites,['light.one']);
 await e.act(c,'experience-task-add',{});c._hass.user.id='two';await e.act(c,'experience-task-save',{});assert.equal(writes.length,1);
});
test('completion retains one-time history and reschedules repeats from completion in HA time zone',async()=>{
 const {HGPersonal:p,HGExperience:e}=setup(),{c}=card(p);p.data.experience=e.clean({tasks:[{id:'once',title:'Battery',due:'2026-01-01',days:0},{id:'repeat',title:'Filter',due:'2026-01-01',days:30}]});
 await e.act(c,'experience-task-done',{dataset:{id:'once'}});assert.equal(p.data.experience.tasks[0].done,true);
 await e.act(c,'experience-task-done',{dataset:{id:'repeat'}});const r=p.data.experience.tasks.find(r=>r.id==='repeat');assert.equal(r.due,e.plusDays(e.today(c._hass),30));assert.equal(r.done,false);
});
test('maintenance deletion requires matching explicit confirmation and account',async()=>{
 const {HGPersonal:p,HGExperience:e}=setup(),{c,writes}=card(p);p.data.experience=e.clean({tasks:[{id:'a',title:'A',due:'2026-10-23'}]});
 await e.act(c,'experience-task-remove',{dataset:{id:'a'}});assert.equal(writes.length,0);
 await e.act(c,'experience-task-remove-preview',{dataset:{id:'a'}});await e.act(c,'experience-task-remove',{dataset:{id:'a'}});assert.equal(p.data.experience.tasks.length,0);
});
test('sensor maintenance distinguishes low battery, unavailable and old timestamps; fresh reports win',()=>{
 const {HGExperience:e}=setup(),h={states:{'sensor.low':s('0',{device_class:'battery',unit_of_measurement:'%'}),'sensor.old':s('20',{},now-48*3600000),'sensor.fresh':{...s('20',{},now-48*3600000),last_reported:new Date(now).toISOString()},'sensor.offline':s('unavailable'),'sensor.invalid':s('-5',{device_class:'battery',unit_of_measurement:'%'}),'sensor.hidden':s('unavailable')},entities:{'sensor.hidden':{hidden_by:'user'}}};
 assert.deepEqual(e.sensorRows(h,now).map(r=>[r.e,r.kind]),[['sensor.low','battery'],['sensor.offline','offline'],['sensor.old','old']]);
});
test('comfort converts Fahrenheit, distinguishes missing/old data and checks room-local open-contact HVAC',()=>{
 const {HGExperience:e}=setup(),h={states:{'sensor.t':s('77',{unit_of_measurement:'°F'}),'sensor.h':s('50'),'binary_sensor.window':s('on',{device_class:'window'}),'climate.room':s('heat',{hvac_action:'heating'})},model:{list:[{id:'r',name:'Room',temp:{e:'sensor.t'},hum:{e:'sensor.h'},ents:['sensor.t','sensor.h','binary_sensor.window','climate.room']}]}};
 let r=e.comfort(h,now)[0];assert.equal(r.temp,25);assert.ok(r.flags.includes('window_hvac'));assert.ok(!r.flags.includes('in_range'));
 h.states['binary_sensor.window'].state='off';r=e.comfort(h,now)[0];assert.deepEqual(r.flags,['in_range']);
 h.states['sensor.t'].last_updated=new Date(now-48*3600000).toISOString();r=e.comfort(h,now)[0];assert.equal(r.temp,null);assert.ok(r.flags.includes('missing'));
 h.states['sensor.h'].state='';assert.equal(e.comfort(h,now)[0].hum,null);
});
test('comfort threshold settings validate ranges and cannot save a stale-account form',async()=>{
 const {HGPersonal:p,HGExperience:e}=setup(),{c,writes}=card(p,{'[name=tmin]':'30','[name=tmax]':'20','[name=hmin]':'30','[name=hmax]':'70'});
 await e.act(c,'experience-comfort-settings',{});await e.act(c,'experience-save-comfort',{});assert.equal(writes.length,0);
 c._hass.user.id='two';await e.act(c,'experience-save-comfort',{});assert.equal(writes.length,0);
});
test('pinned custom quick actions escape labels and only open a frozen command-free preview',async()=>{
 const {HGPersonal:p,HGControlCard:C,HGExperience:e}=setup(),c=new C();c._hass={user:{id:'one'},states:{'light.one':s('on')},callService:()=>{throw Error('Preview must not send commands');}};c.shadowRoot={};p.data.modes.home=[{e:'light.one',state:'off'}];p.data.experience=e.clean({modePrefs:{home:{name:'<Film>',pinned:true}}});
 assert.match(e.shortcutHtml(c),/&lt;Film>/);assert.equal(e.modeName('away'),'controlx.mode_away');await c.onAct('preview',{dataset:{mode:'home'}});assert.equal(c._preview,'home');assert.equal(c._previewSteps[0].e,'light.one');
});
test('tablet orientation order and widths preserve legacy masks, shared hidden cards and new cards',()=>{
 const {HGTablet:t,HGLiving:l,store,window}=setup(),h={user:{id:'one'}},cards=[{_k:'a'},{_k:'b',_hid:true},{_k:'new'}];store.set(l.tabletKey(h),JSON.stringify({landscape:['a'],layout:{landscape:{order:['b','a'],sizes:{a:'l'}}}}));
 const out=l.tabletApply(cards,{_hass:h});assert.deepEqual(out.map(c=>c._k),['b','a','new']);assert.equal(out[0]._hid,true);assert.equal(out[1]._hid,true);assert.equal(out[1].span,'full');assert.equal(out[1]._personalSize,true);assert.equal(cards[0]._hid,undefined);
 window.innerHeight=1000;assert.deepEqual(l.tabletApply(cards,{_hass:h}).map(c=>c._k),['a','b','new']);window.innerWidth=390;assert.equal(l.tabletApply(cards,{_hass:h}),cards);
 assert.equal(t.clean({layout:{portrait:{sizes:{a:'evil'}}}}).layout.portrait.sizes.a,undefined);
});
test('tablet save refuses a draft made under a different account',()=>{
 const {HGTablet:t,HGPersonal:p,store}=setup(),{c}=card(p);c._tabletDraft=t.clean({});c._tabletDraftUid='old';assert.throws(()=>t.act(c,'living-tablet-save',{}));assert.equal(store.size,0);
});
test('connection probe uses ping only and distinguishes server freshness from sensor data',async()=>{
 const {HGConnection:n,navigator}=setup(),calls=[],h={user:{id:'one'},connection:{connected:true},callWS:async q=>calls.push(q)},page={_hass:h};
 assert.equal(n.status(h),'unverified');await n.probe(page,true);assert.deepEqual(calls,[{type:'ping'}]);assert.equal(n.status(h),'connected');assert.equal(n.status(h,true,n.record(h).at+91000),'unverified');navigator.onLine=false;assert.equal(n.status(h),'disconnected');navigator.onLine=true;h.connection.connected=false;assert.equal(n.status(h),'reconnecting');
});
test('late probe responses cannot mark a different account or connection as verified',async()=>{
 const {HGConnection:n}=setup();let release;const h={user:{id:'one'},connection:{connected:true},callWS:()=>new Promise(r=>release=r)},page={_hass:h};const promise=n.probe(page,true);page._hass={...h,user:{id:'two'}};release();await promise;assert.equal(n.record(h).at,0);assert.equal(n.record(page._hass).at,0);
});
test('failed connection checks show waiting, successful retries recover without device calls',async()=>{
 const {HGConnection:n}=setup(),h={user:{id:'one'},callWS:async()=>{throw Error('Network');}},page={_hass:h};await n.probe(page,true);assert.equal(n.status(h),'reconnecting');h.callWS=async()=>{};await n.probe(page,true);assert.equal(n.status(h),'connected');
});
test('connection lifecycle attaches once and removes WebSocket listeners on detach',async()=>{
 const {HGConnection:n}=setup(),listeners=new Set(),conn={connected:true,addEventListener:(k,v)=>listeners.add(v),removeEventListener:(k,v)=>listeners.delete(v)},page={_hass:{user:{id:'one'},connection:conn,callWS:async()=>{}},isConnected:true};n.bind(page);n.bind(page);assert.equal(listeners.size,2);n.unbind(page);assert.equal(listeners.size,0);assert.equal(page._connectionBind,null);await new Promise(r=>setImmediate(r));
});
test('new control sections and full tablet forms render with the complete feature set',()=>{
 const {HGControlCard:C,HGPersonal:p}=setup(),c=new C();c._hass={user:{id:'one'},states:{},config:{time_zone:'UTC'}};
 c._tab='maintenance';assert.match(c.render(),/experience-task-add/);c._tab='comfort';assert.match(c.render(),/experience-comfort-settings/);c._tab='tablet';assert.match(c.render(),/data-tablet-orientation/);assert.match(c.render(),/experience-probe/);
});

test('custom mode labels and pins save with steps while preserving maintenance records',async()=>{
 const {HGControlCard:C,HGPersonal:p,HGExperience:e}=setup(),{c:base,writes}=card(p),c=new C();Object.assign(c,base);p.data.experience=e.clean({tasks:[{id:'a',title:'Filter',due:'2026-11-01'}]});
 c.shadowRoot={querySelectorAll:()=>[{value:'off',dataset:{e:'light.one'}}],querySelector:q=>q.includes('name]')?{value:'Cinema'}:{checked:true}};
 await c.onAct('configure',{dataset:{mode:'movie'}});assert.match(c._modes(),/mode-name/);await c.onAct('save-mode',{});
 assert.equal(writes.length,1);assert.equal(p.data.experience.modePrefs.movie.name,'Cinema');assert.equal(p.data.experience.modePrefs.movie.pinned,true);assert.equal(p.data.experience.tasks.length,1);assert.equal(p.data.modes.movie[0].state,'off');
});

test('tablet collect saves per-orientation widths and keeps unknown hidden preferences',()=>{
 const {HGTablet:t,HGPersonal:p,HGLiving:l,store}=setup(),{c}=card(p);c._tabletFormUid='one';c._tabletDraft=t.clean({portrait:['future'],layout:{portrait:{order:['b','a']}}});c._tabletDraftUid='one';
 const row={dataset:{tabletCard:'a'},querySelector:q=>q.includes('visible')?{checked:false}:{value:'l'}};
 c.shadowRoot={querySelector:()=>({checked:true}),querySelectorAll:q=>q.includes('landscape')?[row]:[]};t.act(c,'living-tablet-save',{});
 const saved=JSON.parse(store.get(l.tabletKey(c._hass)));assert.deepEqual(saved.landscape,['a']);assert.deepEqual(saved.portrait,['future']);assert.equal(saved.layout.landscape.sizes.a,'l');assert.deepEqual(saved.layout.portrait.order,['b','a']);
 c._hass.user.id='two';assert.throws(()=>t.collect(c));
});
