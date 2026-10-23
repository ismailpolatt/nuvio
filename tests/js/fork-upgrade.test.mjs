import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadParts} from './harness.mjs';
test('fork home settings join the v2.22 draft without writing or closing before Done',async()=>{
 let writes=0,refreshes=0,deferred=0,looks=0;
 const HGDraft={defer:(page,options)=>{assert.equal(options.reload,true);deferred++;}},HGL={data:{wiz:{hiddenPersons:['person.hidden']}},set(){},save:async()=>{writes++;}};
 const {HGDashboard:d}=loadParts(['hg-dashboardx.part.js'],{window:{HGDraft},HGDraft,HGL,HGBase:class{},hgReg(){},hgTLazy:x=>x,hgT:x=>x},['HGDashboard']);
 d.draft={order:['a'],hidden:[],size:{},conf:{}};
 await d.act({_canEdit:()=>true,_eSheetEl:{querySelector:()=>({value:'sensor.energy'})},_eLook:()=>looks++,_eToast(){},_eSheet:()=>{throw Error('Must remain open');},_eRefresh:()=>refreshes++},{dataset:{}},'home-save');
 assert.equal(writes,0);assert.equal(refreshes,0);assert.equal(deferred,1);assert.equal(looks,1);assert.equal(HGL.data.wiz.homeEnergy,'sensor.energy');assert.deepEqual(HGL.data.wiz.hiddenPersons,['person.hidden']);
});
