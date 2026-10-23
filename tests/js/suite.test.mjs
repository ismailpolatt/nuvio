import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadParts} from './harness.mjs';

function setup(){
 const store=new Map(),writes=[],values=new Map(),configs=new Map(),dialogs=[],frames=[],window={addEventListener(){},dispatchEvent(){},open(){throw Error('Must not open a new window');}},navigator={onLine:true};
 const document={createElement(tag){assert.equal(tag,'dialog');const srcs=[],frame={set src(v){srcs.push(v);},srcs},title={textContent:''};frames.push(frame);const d={open:false,attributes:{},setAttribute(k,v){this.attributes[k]=v;},querySelector:q=>q==='iframe'?frame:title,querySelectorAll:()=>[],showModal(){this.open=true;},close(){this.open=false;},remove(){this.removed=true;}};dialogs.push(d);return d;}};
 const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const H={ok:s=>!!s&&!['unknown','unavailable'].includes(s.state),esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),name:(h,e)=>h.states[e]?.attributes?.friendly_name||e,icon:s=>s,fmt:(v,n)=>Number(v).toFixed(n),stateLabel:s=>s};
 const HGL={KEY:'nuvio_layout',data:{s:{}},editing:false,notify(){},sort:(xs)=>xs};
 const HGShared={URL:'nuvio-shared',put:(h,config)=>h.callWS({type:'lovelace/config/save',url_path:'nuvio-shared',config})};
 const HGLang={KEY:'nuvio:lang',ok:x=>['tr','en'].includes(x)};
 const globals={window,navigator,document,localStorage,H,HGL,HGShared,HGLang,HGBase:class{disconnectedCallback(){}},HGDashboard:{catalog:()=>[]},HGAreas:{model:()=>({list:[]})},location:{pathname:'/dashboard-test/kontrol'},hgReg(){},hgTO:(o,m)=>Object.assign(o,m),hgTLazy:x=>x,hgT:(k,o)=>k+(o?JSON.stringify(o):''),HG_LOC:()=> 'en-GB',HG_BUILD:'2.23.1+test',CustomEvent:class{}};
 const x=loadParts(['shared/stats.part.js','hg-controlx.part.js','hg-livingx.part.js','hg-journal.part.js','hg-budget.part.js','hg-experience.part.js','hg-tablet-profile.part.js','hg-connection-status.part.js','hg-backup.part.js','cards/openings-card.part.js','hg-suite.part.js'],{...globals,hgHead:(ic,title,sub)=>title+' '+sub,hgAgo14:()=>'',hgMore(){}},['HGPersonal','HGJournal','HGTablet','HGFullBackup','HGDataQuality','HGApps','HGAppsCard','HGSuite','HGOpeningsCard']);
 const h={user:{id:'one',is_admin:true},states:{},entities:{},panels:{},callService(){throw Error('No device services allowed');},async callWS(q){
   if(q.type==='frontend/get_user_data')return {value:values.get(q.key)??null};
   if(q.type==='lovelace/config')return structuredClone(configs.get(q.url_path));
   writes.push(structuredClone(q));if(h.fail?.(q))throw Error('Write failure');
   if(q.type==='frontend/set_user_data')values.set(q.key,structuredClone(q.value));
   else if(q.type==='lovelace/config/save')configs.set(q.url_path,structuredClone(q.config));
   else throw Error('Unexpected command');return {};
 }};
 x.HGPersonal.uid='one';x.HGPersonal.data=x.HGPersonal.clean({});
 configs.set('dashboard-test',{strategy:{type:'custom:nuvio'}});
 configs.set('nuvio-shared',{nuvio_shared:1,own:['one'],data:{s:{},wiz:{hiddenPersons:['person.hidden']}},views:[]});
 const card={_hass:h,rerender(){},shadowRoot:{querySelector:()=>null}};
 return {...x,h,card,values,configs,writes,store,navigator,dialogs,frames,H};
}
const stamp=(age=0)=>new Date(Date.now()-age).toISOString();

test('data distinguishes unavailable, missing, future and old timestamps; unchanged values can have recent reports',()=>{
 const {HGDataQuality:q,h}=setup();
 h.states={'sensor.old':{state:'23',attributes:{},last_updated:stamp(48*3600000)},'sensor.fresh':{state:'23',attributes:{},last_updated:stamp(48*3600000),last_reported:stamp()},'sensor.no':{state:'0',attributes:{}},'sensor.future':{state:'1',attributes:{},last_updated:stamp(-3600000)},'sensor.off':{state:'unavailable',attributes:{},last_updated:stamp()}};
 assert.equal(q.assess(h,'sensor.old').status,'stale');assert.equal(q.assess(h,'sensor.fresh').status,'recent');assert.equal(q.assess(h,'sensor.no').status,'undated');assert.equal(q.assess(h,'sensor.future').status,'undated');assert.equal(q.assess(h,'sensor.off').status,'unavailable');assert.equal(q.assess(h,'sensor.missing').status,'unavailable');
 const html=q.html({_hass:h});assert.match(html,/suite.last_value/);assert.ok(!html.includes('data-quality="stale">23'));
});
test('application links use registered safe panels and respect panel and user admin permissions',()=>{
 const {HGApps:a,h}=setup();h.panels={hacs:{title:'HACS',require_admin:true},d5369777_music_assistant:{title:'Music Assistant'},'45df7312_zigbee2mqtt':{title:'Zigbee2MQTT',require_admin:true},blueprint_studio:{title:'Blueprint Studio',require_admin:true},'javascript:bad':{title:'Music Assistant'}};
 assert.deepEqual(a.list(h).map(x=>x.path),['/hacs','/d5369777_music_assistant','/45df7312_zigbee2mqtt','/blueprint_studio']);assert.match(a.html(h),/data-act="app-open"/);assert.doesNotMatch(a.html(h),/target=|href=/);
 h.user.is_admin=false;assert.deepEqual(a.list(h).map(x=>x.id),['music']);h.panels={};assert.equal(a.list(h)[0].path,null);
});
test('complete backup round trips all fork preferences, shared layout and local profiles but never arbitrary storage',async()=>{
 const {HGFullBackup:b,HGPersonal:p,HGJournal:j,h,card,store,values}=setup();
 values.set(p.key,{favorites:['light.one'],hiddenPersons:['person.hidden'],modes:{home:[{e:'light.one',state:'off'}]},budget:{target:250},experience:{tasks:[{id:'x',title:'Filter',due:'2026-11-01'}]}});
 values.set(j.key,[{id:'a',at:stamp(),source:'mode',targets:[{e:'light.one',action:'turn_off'}],accepted:1,failed:false}]);
 store.set('nuvio:tablet-profile:one:dashboard-test',JSON.stringify({layout:{landscape:{order:['a'],sizes:{a:'l'}}},portrait:['b']}));store.set('hassTokens','never export');
 const raw=await b.snapshot(card),o=b.parse(JSON.stringify(raw));
 assert.equal(o.data.personal.budget.target,250);assert.equal(o.data.personal.experience.tasks.length,1);assert.equal(o.data.journal.length,1);assert.deepEqual(o.data.local.tablet.layout.landscape.order,['a']);assert.equal(o.data.shared.nuvio_shared,1);assert.ok(!JSON.stringify(o).includes('never export'));
 assert.equal(b.summary(o,h).steps,1);assert.ok(b.summary(o,h).missing.includes('light.one'));
});
test('invalid schema, unsafe keys, malformed modes and authentication storage are rejected before any writes',async()=>{
 const {HGFullBackup:b,card,writes}=setup();const raw=await b.snapshot(card);
 for(const mutate of [o=>o.schema=99,o=>delete o.data.personal,o=>o.data.personal={modes:{home:[{e:'script.reset',state:'on'}]}},o=>o.data.local.preferences.hassTokens='x',o=>o.data.shared.nuvio_shared=0]){const o=structuredClone(raw);mutate(o);assert.throws(()=>b.parse(JSON.stringify(o)));}
 assert.throws(()=>b.parse('{"__proto__":{},"format":"nuvio-complete"}'));assert.throws(()=>b.parse('x'.repeat(4000001)));assert.equal(writes.length,0);
});
test('import is preview-only until explicit checkbox and matching account; non-admin export is blocked',async()=>{
 const {HGSuite:s,HGFullBackup:b,card,writes}=setup();card._backupPreview=await b.snapshot(card);card._backupUid='one';
 await s.act(card,'suite-restore',{});assert.equal(writes.length,0);
 card.shadowRoot.querySelector=()=>({checked:true});card._hass.user.id='two';await s.act(card,'suite-restore',{});assert.equal(writes.length,0);
 card._hass.user.is_admin=false;await assert.rejects(b.snapshot(card));assert.equal(writes.length,0);
});
test('restore targets current dashboard, preserves target access mapping, and never executes modes',async()=>{
 const {HGFullBackup:b,card,values,configs,writes,store,HGPersonal:p}=setup(),o=await b.snapshot(card);
 o.source.dashboard='some-other-dashboard';o.data.shared.own=['foreign'];o.data.personal={favorites:['light.one'],modes:{home:[{e:'light.one',state:'on'}]}};
 await b.restore(card,o,'one');assert.equal(values.get(p.key).modes.home[0].state,'on');assert.deepEqual(configs.get('nuvio-shared').own,['one']);
 assert.ok(writes.every(q=>q.type==='frontend/set_user_data'||q.type==='lovelace/config/save'));assert.ok(writes.filter(q=>q.type==='lovelace/config/save').every(q=>['nuvio-shared','dashboard-test'].includes(q.url_path)));assert.ok(store.has('nuvio:complete-undo:one:dashboard-test'));
});
test('mid-restore failure rolls back earlier account writes and reports rollback failures separately',async()=>{
 const {HGFullBackup:b,card,values,h,HGPersonal:p,HGJournal:j}=setup();values.set(p.key,{favorites:['light.before']});const o=await b.snapshot(card);o.data.personal={favorites:['light.after']};let failed=false;
 h.fail=q=>q.type==='frontend/set_user_data'&&q.key===j.key&&!failed&&(failed=true);
 await assert.rejects(b.restore(card,o,'one'),/suite.restore_failed/);assert.deepEqual(values.get(p.key),{favorites:['light.before']});
 h.fail=q=>q.type==='frontend/set_user_data';await assert.rejects(b.restore(card,o,'one'),/suite.rollback_failed/);
});
test('backup captures fresh server preferences and rejects an account change during the read',async()=>{
 const {HGFullBackup:b,card,h,values,HGPersonal:p}=setup();p.data.favorites=['light.cached'];values.set(p.key,{favorites:['light.fresh']});assert.deepEqual((await b.snapshot(card)).data.personal.favorites,['light.fresh']);
 const old=h.callWS;h.callWS=async q=>{const r=await old(q);if(q.type==='lovelace/config')card._hass={...h,user:{id:'two',is_admin:true}};return r;};await assert.rejects(b.snapshot(card),/suite.account_changed/);
});
test('strategy defaults hide duplicate HA chrome but permit explicit overrides and keep the applications page',()=>{
 const src=readFileSync(new URL('../../src/parts/hg-oss.part.js',import.meta.url),'utf8');assert.match(src,/kiosk_mode: \{ hide_header: true, hide_sidebar: true, \.\.\.\(opt.kiosk_mode \|\| \{\}\) \}/);assert.match(src,/view\('uygulamalar'/);
});
test('door card never calls missing or stale contacts closed, including only-open mode',()=>{
 const {HGOpeningsCard:C,h}=setup(),c=new C();c._hass=h;c._config={entities:['binary_sensor.missing','binary_sensor.old','binary_sensor.closed'],only_open:true};
 h.states={'binary_sensor.old':{state:'off',attributes:{},last_updated:stamp(48*3600000)},'binary_sensor.closed':{state:'off',attributes:{},last_updated:stamp()}};
 const html=c.render();assert.ok(!html.includes('cards.openings.all_closed'));assert.match(html,/suite.contacts_unknown/);assert.match(html,/suite.stale/);assert.match(html,/suite.unavailable/);assert.ok(!html.includes('data-e="binary_sensor.closed"'));
 c._config.entities=['binary_sensor.missing'];assert.ok(!c.render().includes('cards.openings.closed'));
});
test('failure saving dashboard rolls back account, shared and local profile changes',async()=>{
 const {HGFullBackup:b,HGPersonal:p,card,h,values,configs,store}=setup();values.set(p.key,{favorites:['light.before']});const o=await b.snapshot(card);o.data.personal={favorites:['light.after']};o.data.local.tablet.large=true;o.data.shared.data.wiz={hiddenPersons:['person.after']};
 let once=false;h.fail=q=>q.type==='lovelace/config/save'&&q.url_path==='dashboard-test'&&!once&&(once=true);
 await assert.rejects(b.restore(card,o,'one'),/suite.restore_failed/);assert.deepEqual(values.get(p.key),{favorites:['light.before']});assert.deepEqual(configs.get('nuvio-shared').data.wiz.hiddenPersons,['person.hidden']);assert.equal(store.has('nuvio:tablet-profile:one:dashboard-test'),false);
});
test('failed source read blocks backup rather than creating an incomplete snapshot',async()=>{
 const {HGFullBackup:b,card,h,writes}=setup(),old=h.callWS;h.callWS=q=>q.type==='frontend/get_user_data'?Promise.reject(Error('Read failed')):old(q);
 await assert.rejects(b.snapshot(card),/Read failed/);assert.equal(writes.length,0);
});
test('application opens in an owned dialog without navigation and state updates do not reload its frame',()=>{
 const {HGAppsCard:C,h,dialogs,frames}=setup(),c=new C();c._hass=h;c.shadowRoot={appendChild(){}};h.panels={music_assistant:{title:'Music Assistant'},hacs:{title:'HACS',require_admin:true}};
 let focused=0;const opener={dataset:{app:'music'},isConnected:true,focus(){focused++;}};
 c.onAct('app-open',opener);assert.equal(dialogs.length,1);assert.equal(dialogs[0].open,true);assert.deepEqual(frames[0].srcs,['/music_assistant']);
 c.render();c._hass={...h,states:{'sensor.new':{state:'1'}}};c.render();c.onAct('app-open',opener);assert.equal(dialogs.length,1);assert.deepEqual(frames[0].srcs,['/music_assistant']);
 c.onAct('app-open',{dataset:{app:'hacs'}});assert.deepEqual(frames[0].srcs,['/music_assistant','/hacs']);assert.equal(dialogs.length,1);
 c.onAct('app-close',{});assert.equal(dialogs[0].removed,true);assert.equal(c._appDialog,null);assert.equal(focused,1);
});
test('application permission loss, account change and disconnect close embedded sessions',()=>{
 const {HGAppsCard:C,h,dialogs}=setup(),c=new C();c._hass=h;c.shadowRoot={appendChild(){}};h.panels={hacs:{title:'HACS',require_admin:true}};
 c.onAct('app-open',{dataset:{app:'hacs'}});h.user={id:'two',is_admin:false};c.render();assert.equal(dialogs[0].removed,true);
 c.onAct('app-open',{dataset:{app:'hacs'}});assert.equal(dialogs.length,1);
 h.user={id:'one',is_admin:true};c.onAct('app-open',{dataset:{app:'hacs'}});delete h.panels.hacs;c.render();assert.equal(dialogs[1].removed,true);
 h.panels.hacs={title:'HACS'};c.onAct('app-open',{dataset:{app:'hacs'}});c.disconnectedCallback();assert.equal(dialogs[2].removed,true);
});
test('dialog cancellation returns to the dashboard and unknown application IDs do nothing',()=>{
 const {HGAppsCard:C,h,dialogs}=setup(),c=new C();c._hass=h;c.shadowRoot={appendChild(){}};h.panels={music_assistant:{title:'Music Assistant'}};
 c.onAct('app-open',{dataset:{app:'javascript:bad'}});assert.equal(dialogs.length,0);
 c.onAct('app-open',{dataset:{app:'music'}});let prevented=false;dialogs[0].oncancel({preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(dialogs[0].removed,true);
});
test('embedded sidebar suppression waits for HA shadow roots, reuses styles and cleans polling',()=>{
 const {HGApps:a}=setup(),styles=[],props=new Map();let tick,stopped=false,ready=false;
 const drawerRoot={querySelector:()=>styles.find(x=>x.root==='drawer'),appendChild(s){styles.push({...s,root:'drawer'});}},root={querySelector:s=>s==='ha-drawer'?{shadowRoot:drawerRoot}:styles.find(x=>x.root==='main'),appendChild(s){styles.push({...s,root:'main'});}};
 const main={shadowRoot:root,style:{getPropertyValue:k=>props.get(k),setProperty:(k,v)=>props.set(k,v)}};
 const frame={isConnected:true,contentDocument:{hidden:false,querySelector:()=>ready?{shadowRoot:{querySelector:()=>main}}:null,createElement:()=>({dataset:{}})}};
 const stop=a.chrome(frame,fn=>{tick=fn;return 7;},id=>{assert.equal(id,7);stopped=true;});assert.equal(styles.length,0);ready=true;tick();assert.equal(styles.length,2);assert.match(styles[0].textContent,/ha-sidebar/);assert.equal(props.get('--mdc-drawer-width'),'0px');assert.equal(props.get('--ha-sidebar-width'),'0px');assert.match(styles[1].textContent,/padding-inline-start:0/);tick();assert.equal(styles.length,2);stop();assert.equal(stopped,true);tick();assert.equal(styles.length,2);
});
test('embedded sidebar suppression tolerates cross-origin or removed frames without touching the parent',()=>{
 const {HGApps:a}=setup();let tick;const frame={isConnected:true,get contentDocument(){throw Error('Blocked origin');}};
 const stop=a.chrome(frame,fn=>{tick=fn;return 1;},()=>{});assert.doesNotThrow(()=>tick());frame.isConnected=false;assert.doesNotThrow(()=>tick());stop();
});

test('personal application lists validate IDs, preserve empty lists, and respect current account and panel permissions',()=>{
 const {HGApps:a,HGPersonal:p,h}=setup();h.panels={internal:{},terminal:{title:'Terminal',require_admin:true},map:{title:'Map'},'javascript:bad':{title:'Unsafe'},'dashboard-test':{title:'Self'}};
 assert.deepEqual(a.available(h).map(x=>x.path),['/map','/terminal']);
 p.data=p.clean({apps:[{id:'panel:terminal',title:'My terminal'},{id:'panel:terminal'},{id:'panel:javascript:bad'},{id:'panel:map',title:'Map'}]});
 assert.equal(p.data.apps.length,2);assert.deepEqual(a.list(h).map(x=>x.title),['My terminal','Map']);
 h.user.is_admin=false;assert.deepEqual(a.list(h).map(x=>x.path),['/map']);
 h.user.id='two';assert.deepEqual(a.list(h).map(x=>x.id),['music']);
 h.user.id='one';p.data.apps=[];assert.deepEqual(a.list(h),[]);assert.match(a.html(h),/suite.apps_empty/);
});

test('application editor cancels without writes, saves only account data, and complete backup retains preferences',async()=>{
 const {HGAppsCard:C,HGPersonal:p,HGFullBackup:b,h,writes,card}=setup();h.panels={terminal:{title:'Terminal'}};
 const c=new C();c._hass=h;c.rerender=()=>{};let selected='panel:terminal';c.shadowRoot={querySelectorAll:()=>[],querySelector:()=>({value:selected})};
 await c.onAct('app-manage',{});await c.onAct('app-add',{dataset:{}});assert.equal(c._appsDraft.at(-1).id,'panel:terminal');
 await c.onAct('app-cancel',{});assert.equal(writes.length,0);assert.equal(p.data.apps,null);
 await c.onAct('app-manage',{});await c.onAct('app-add',{dataset:{}});await c.onAct('app-add',{dataset:{}});assert.equal(c._appsDraft.length,5);
 await c.onAct('app-up',{dataset:{index:'4'}});await c.onAct('app-remove',{dataset:{index:'0'}});await c.onAct('app-save',{dataset:{}});
 assert.equal(writes.length,1);assert.equal(writes[0].type,'frontend/set_user_data');assert.equal(writes[0].key,p.key);assert.equal(p.data.apps.length,4);
 const raw=await b.snapshot(card);assert.deepEqual(b.parse(JSON.stringify(raw)).data.personal.apps,p.data.apps);
});

test('application drafts cannot write after account switch and titles are escaped in cards and dialog tabs',async()=>{
 const {HGApps:a,HGAppsCard:C,HGPersonal:p,h,writes,dialogs}=setup();h.panels={map:{title:'Map'}};p.data.apps=[{id:'panel:map',title:'<img onerror=bad>'}];
 assert.match(a.html(h),/&lt;img/);assert.doesNotMatch(a.html(h),/<img/);
 const c=new C();c._hass=h;c.rerender=()=>{};c.shadowRoot={appendChild(){},querySelectorAll:()=>[]};c._openApp('panel:map');assert.match(dialogs[0].innerHTML,/&lt;img/);assert.doesNotMatch(dialogs[0].innerHTML,/<img/);c._closeApp();
 await c.onAct('app-manage',{});h.user.id='two';await c.onAct('app-save',{dataset:{}});assert.equal(writes.length,0);
});

test('mobile and Companion use authenticated native SPA navigation without an iframe or new window; access checks remain',()=>{
 const {HGApps:a,HGAppsCard:C,h,navigator,dialogs,H}=setup(),paths=[];H.navigate=path=>paths.push(path);h.panels={hacs:{title:'HACS',require_admin:true}};
 const c=new C();c._hass=h;navigator.userAgent='Mozilla Android';c._openApp('hacs');assert.deepEqual(paths,['/hacs']);assert.equal(dialogs.length,0);
 h.user.is_admin=false;c._openApp('hacs');assert.equal(paths.length,1);
 h.user.is_admin=true;navigator.userAgent='Desktop';h.auth={external:{}};assert.equal(a.native(h),true);c._openApp('hacs');assert.equal(paths.length,2);assert.equal(dialogs.length,0);
});
