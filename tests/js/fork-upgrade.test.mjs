import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadParts} from './harness.mjs';
import {readFileSync} from 'node:fs';
test('fork home settings join the v2.22 draft without writing or closing before Done',async()=>{
 let writes=0,refreshes=0,deferred=0,looks=0;
 const HGDraft={defer:(page,options)=>{assert.equal(options.reload,true);deferred++;}},HGL={data:{wiz:{hiddenPersons:['person.hidden']}},set(){},save:async()=>{writes++;}};
 const {HGDashboard:d}=loadParts(['hg-dashboardx.part.js'],{window:{HGDraft},HGDraft,HGL,HGBase:class{},hgReg(){},hgTLazy:x=>x,hgT:x=>x},['HGDashboard']);
 d.draft={order:['a'],hidden:[],size:{},conf:{}};
 await d.act({_canEdit:()=>true,_eSheetEl:{querySelector:()=>({value:'sensor.energy'})},_eLook:()=>looks++,_eToast(){},_eSheet:()=>{throw Error('Must remain open');},_eRefresh:()=>refreshes++},{dataset:{}},'home-save');
 assert.equal(writes,0);assert.equal(refreshes,0);assert.equal(deferred,1);assert.equal(looks,1);assert.equal(HGL.data.wiz.homeEnergy,'sensor.energy');assert.deepEqual(HGL.data.wiz.hiddenPersons,['person.hidden']);
});
test('user-visible fork version is X.Y.Z while cache fingerprints remain internal',()=>{
 const pkg=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8'));assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
 const source=readFileSync(new URL('../../src/parts/hg-edit.part.js',import.meta.url),'utf8'),start=source.indexOf('  _eAboutHtml() {')+'  _eAboutHtml() {'.length,body=source.slice(start,source.indexOf('\n  _eLook()',start)).replace(/\},\s*$/,'');
 const html=new Function('HG_BUILD','H','hgT',body)(pkg.version+'+cache-fingerprint',{esc:String,icon:()=>''},x=>x);
 assert.ok(html.includes('<code>'+pkg.version+'</code>'));assert.ok(!html.includes('cache-fingerprint'));
});
