import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadParts} from './harness.mjs';
const setup=(fetch=async()=>({ok:false}))=>loadParts(['shared/version-check.part.js'],{window:{},HG_BUILD:'2.23.3+current',HG_ASSET:'/hacsfiles/nuvio/',fetch},['HGVersion']).HGVersion;
test('reload warning ignores older loader versions and invalid data while accepting new cores',()=>{
 const v=setup();assert.equal(v.reload('2.19.0+old'),null);assert.equal(v.reload('2.23.3+current'),null);assert.equal(v.reload('2.23.4+new'),'2.23.4');assert.equal(v.reload('2.23.3+rebuilt'),'2.23.3');assert.equal(v.reload('v3.0.0'),'3.0.0');for(const bad of [null,'','<script>','__HG_BUILD__','2.23'])assert.equal(v.reload(bad),null);
});
test('active manifest, never loader text, supplies the server build and invalid responses are ignored',async()=>{
 const calls=[],v=setup(async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({build:'2.23.3+current',core:'nuvio-core.abc123.js'})};});
 assert.equal(await v.server(),'2.23.3+current');assert.match(calls[0].url,/nuvio-version\.json\?nocache=/);assert.equal(calls[0].options.cache,'no-store');assert.equal(await setup().server(),null);
 assert.equal(await setup(async()=>({ok:true,json:async()=>({build:'2.23.4+new',core:'https://bad/core.js'})})).server(),null);
});
