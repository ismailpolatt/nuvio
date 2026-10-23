import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../../src/parts/hg-edit.part.js',import.meta.url),'utf8');
const body=src.slice(src.indexOf('const HG_TILE_KIND ='),src.indexOf('/* typy wyświetlania'));
const rows=new Function('H','hgNorm','HG_LOC',body+';return hgPickerRows;')({name:(h,e)=>h.states[e].attributes.friendly_name||e},s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),()=> 'tr-TR');
const setup=()=>({states:{'sensor.bill_estimate':{state:'38.37',attributes:{friendly_name:'Elektrik Faturası'}},'sensor.room':{state:'unavailable',attributes:{friendly_name:'İstanbul Sıcaklık'}},'light.room':{state:'off',attributes:{friendly_name:'Oda Işık'}}},entities:{},areas:{}});
test('picker finds exact IDs with mixed case, clipboard marks and a stale type filter',()=>{
 const h=setup();assert.deepEqual(rows(h,{query:' SENSOR.BILL_ESTIMATE\u200b ',filter:'light'}).map(x=>x.e),['sensor.bill_estimate']);assert.equal(rows(h,{query:'faturasi'})[0].e,'sensor.bill_estimate');assert.equal(rows(h,{query:'sicaklik'})[0].e,'sensor.room');
});
test('replacement search keeps existing and unavailable entities selectable',()=>{
 const h=setup();assert.equal(rows(h,{query:'sensor.bill_estimate',replacement:{},shown:new Set(['sensor.bill_estimate'])})[0].block,null);assert.equal(rows(h,{query:'sensor.room',replacement:{}})[0].s.state,'unavailable');
});
test('explicit search reveals hidden diagnostics and explains duplicates or incompatible slots',()=>{
 const h=setup();h.entities['sensor.bill_estimate']={hidden_by:'user',entity_category:'diagnostic'};
 assert.ok(!rows(h).some(x=>x.e==='sensor.bill_estimate'));assert.equal(rows(h,{query:'sensor.bill_estimate'})[0].hidden,true);
 assert.equal(rows(h,{query:'sensor.bill_estimate',replacement:{doms:['script']}})[0].block,'incompatible');assert.equal(rows(h,{query:'sensor.bill_estimate',replacement:{flt:()=>false}})[0].block,'incompatible');
 assert.equal(rows(h,{query:'sensor.bill_estimate',replacement:{excl:['sensor.bill_estimate']}})[0].block,'duplicate');assert.equal(rows(h,{query:'sensor.bill_estimate',shown:new Set(['sensor.bill_estimate'])})[0].block,'duplicate');
});
test('default browsing excludes duplicates and disabled states while exact search shows the reason',()=>{
 const h=setup();h.entities['sensor.bill_estimate']={disabled_by:'user'};
 assert.ok(!rows(h).some(x=>x.e==='sensor.bill_estimate'));assert.equal(rows(h,{query:'sensor.bill_estimate'})[0].block,'disabled');assert.equal(rows(h,{query:'not-present'}).length,0);
 assert.ok(!rows(h,{shown:new Set(['light.room'])}).some(x=>x.e==='light.room'));
});
