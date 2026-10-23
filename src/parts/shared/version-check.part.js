/* The manifest identifies the active core; a cached loader may advertise an older build. */
const HGVersion = window.HGVersion = {
  parse(v){const m=/^v?(\d+)\.(\d+)\.(\d+)(?:\+([a-zA-Z0-9.-]+))?$/.exec(String(v||''));return m?{parts:m.slice(1,4).map(Number),build:m[0].replace(/^v/,'')}:null;},
  reload(server,running=HG_BUILD){const a=this.parse(server),b=this.parse(running);if(!a||!b)return null;for(let i=0;i<3;i++){if(a.parts[i]<b.parts[i])return null;if(a.parts[i]>b.parts[i])return a.build.split('+')[0];}return a.build!==b.build?a.build.split('+')[0]:null;},
  async server(){const r=await fetch(HG_ASSET+'nuvio-version.json?nocache='+Date.now(),{cache:'no-store'});if(!r.ok)return null;const j=await r.json();return this.parse(j?.build) && /^nuvio-core\.[0-9a-f]+\.js$/.test(j?.core||'')?j.build:null;}
};
