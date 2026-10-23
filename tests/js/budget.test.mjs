import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadParts} from './harness.mjs';
function setup(){
 const window={},HGL={data:{wiz:{}},notify(){}},globals={window,HGL,HGBase:class{rerender(){}},hgReg(){},hgTLazy:s=>s,hgTO:(o,m)=>Object.assign(o,m),hgT:s=>s};
 const x=loadParts(['shared/stats.part.js','hg-controlx.part.js','hg-budget.part.js'],globals,['HGStats','HGPersonal','HGBudget','HGControlCard']);
 x.HGPersonal.data=x.HGPersonal.clean({});return {...x,HGL};
}
const hour=3600000, start=Date.parse('2026-10-01T00:00:00Z'), w={start,end:Date.parse('2026-11-01T00:00:00Z'),now:start+48*hour};
const rows=(count,scale=1)=>Array.from({length:count+1},(_,i)=>({end:start+i*hour,sum:100+i*scale}));
test('budget defaults are disabled and preference saves preserve unrelated settings',async()=>{
 const {HGPersonal:p,HGBudget:b}=setup(); assert.deepEqual(b.clean({target:-1,unit:'bad',threshold:101}),{target:0,unit:'kWh',threshold:80});
 assert.equal(b.clean({target:NaN}).target,0);assert.equal(b.clean({target:Infinity}).target,0);
 const h={user:{id:'one'},callWS:async q=>q.type==='frontend/get_user_data'?{value:{favorites:['light.one'],rate:2}}:null};
 await p.load(h);await p.save(h,{budget:{target:200,unit:'money',threshold:90}});
 assert.deepEqual(p.data.favorites,['light.one']);assert.equal(p.data.rate,2);assert.equal(p.data.budget.target,200);
});
test('calendar month follows HA time zone independently from browser and covers leap February',()=>{
 const {HGBudget:b}=setup(),h={config:{time_zone:'Europe/Istanbul'}};
 const r=b.window(h,Date.parse('2026-09-30T22:00:00Z'));
 assert.equal(new Date(r.start).toISOString(),'2026-09-30T21:00:00.000Z');assert.equal(new Date(r.end).toISOString(),'2026-10-31T21:00:00.000Z');
 const leap=b.window({config:{time_zone:'UTC'}},Date.parse('2028-02-15T12:00:00Z'));assert.equal((leap.end-leap.start)/86400000,29);
 const dst=b.window({config:{time_zone:'Europe/Berlin'}},Date.parse('2026-03-20T00:00:00Z'));assert.equal((dst.end-dst.start)/hour,743);
});
test('monthly import sums meters at the same timestamp and forecasts from recorded hours',()=>{
 const {HGBudget:b}=setup();const r=b.measure({a:rows(48),b:rows(47,2)},['a','b'],w);
 assert.equal(r.kwh,141);assert.equal(r.at,start+47*hour);assert.equal(r.forecast,2232);
});
test('zero consumption is valid while missing baseline, missing hour and falling sums are incomplete',()=>{
 const {HGBudget:b}=setup();assert.equal(b.measure({a:rows(48,0)},['a'],w).kwh,0);
 for(const a of [[],rows(48).slice(1),rows(48).filter((_,i)=>i!==20),rows(48).map((r,i)=>i===20?{...r,sum:0}:r)]) assert.equal(b.measure({a},['a'],w).incomplete,true);
 assert.equal(b.measure({a:rows(48)},['a','missing'],w).incomplete,true);
});
test('early and stale data never produce month-end forecasts',()=>{
 const {HGBudget:b}=setup();assert.equal(b.measure({a:rows(8)},['a'],{...w,now:start+8*hour}).forecast,null);
 const r=b.measure({a:rows(40)},['a'],w);assert.equal(r.stale,true);assert.equal(r.forecast,null);assert.equal(r.kwh,40);
});
test('budget distinguishes warning, exceedance, forecast risk, tariff setup and disabled state',()=>{
 const {HGBudget:b}=setup(),p={target:100,threshold:80,unit:'kWh'};
 assert.equal(b.view(null,p,0).status,'incomplete');assert.equal(b.view({kwh:0,forecast:0},p,0).status,'normal');
 assert.equal(b.view({kwh:80,forecast:90},p,0).status,'near');assert.equal(b.view({kwh:20,forecast:110},p,0).status,'risk');
 const over=b.view({kwh:110,forecast:120},p,0);assert.equal(over.status,'exceeded');assert.equal(over.over,10);assert.equal(over.remaining,0);
 assert.equal(b.view({kwh:10},{...p,unit:'money'},0).status,'rate_needed');
 assert.equal(b.view({kwh:10,forecast:30},{...p,unit:'money'},3).forecast,90);
 assert.equal(b.view({}, {target:0},0).status,'off');
});
test('late recorder responses are ignored after an account switch',async()=>{
 const {HGBudget:b,HGPersonal:p,HGL}=setup();HGL.data.wiz.homeEnergy='sensor.main';let release;const calls=[];
 const c={_hass:{user:{id:'one'},config:{time_zone:'UTC'},callWS:async q=>{calls.push(q);return q.type==='energy/get_prefs'?{}:new Promise(r=>release=r);}}};
 const job=b.load(c);while(!release)await new Promise(r=>setImmediate(r));c._hass={...c._hass,user:{id:'two'}};release({});await job;
 assert.equal(c._budgetResult,null);assert.equal(calls[1].units.energy,'kWh');assert.deepEqual(calls[1].statistic_ids,['sensor.main']);
});
test('budget target validation rejects bad input without saving or controlling devices',async()=>{
 const {HGControlCard:C}=setup(),c=new C();let called=false;c._hass={callWS:async()=>{called=true}};
 c.shadowRoot={querySelectorAll:()=>[],querySelector:q=>({value:q.includes('target')?'-5':q.includes('threshold')?'80':'kWh'})};
 await c.onAct('save-budget',{});assert.equal(called,false);assert.equal(c._message,'controlx.invalid');
});
