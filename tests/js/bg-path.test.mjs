/* built-in backgrounds must not keep the address of the device that saved them (http://192.168.x.x/..., Nabu Casa, other domain):
   they are saved as a path (/hacsfiles/nuvio/nuvio-bg-*.webp) and any saved address is rewritten to the current bundle base on load */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const P = new URL('../../src/parts/', import.meta.url), read = (f) => readFileSync(new URL(f, P), 'utf8');
const oss = read('hg-oss.part.js');
const grab = (name) => { const m = oss.match(new RegExp('const ' + name + ' = window\\.' + name + ' = [\\s\\S]*?;\\n')); assert.ok(m, name); return m[0]; };
const load = (asset, href) => {
  const ctx = { window: {}, location: new URL(href), URL };
  vm.createContext(ctx); vm.runInContext(`const HG_ASSET = ${JSON.stringify(asset)};\n${grab('HG_ASSET_P')}${grab('hgBgFix')}this.P = HG_ASSET_P; this.fix = hgBgFix;`, ctx); return ctx;
};
test('bundle base without the server address when same origin, full address for another server', () => {
  assert.equal(load('http://100.106.138.67/hacsfiles/nuvio/', 'http://100.106.138.67/dashboard-nuvio/0').P, '/hacsfiles/nuvio/');
  assert.equal(load('https://ha.example.org/local/nuvio/', 'https://ha.example.org/x').P, '/local/nuvio/');
  assert.equal(load('https://cdn.jsdelivr.net/gh/kczepiec/nuvio@v2.21.3/dist/', 'https://ha.example.org/x').P, 'https://cdn.jsdelivr.net/gh/kczepiec/nuvio@v2.21.3/dist/');
});
test('saved built-in background from another address is rewritten to the current base', () => {
  const { fix } = load('https://home.example.org/hacsfiles/nuvio/', 'https://home.example.org/d');
  assert.equal(fix('http://100.106.138.67/hacsfiles/nuvio/nuvio-bg-nad-mgla-wide.webp'), '/hacsfiles/nuvio/nuvio-bg-nad-mgla-wide.webp');
  assert.equal(fix('http://100.106.138.67:8123/hacsfiles/nuvio/nuvio-bg-nad-mgla-portrait.webp?v=2'), '/hacsfiles/nuvio/nuvio-bg-nad-mgla-portrait.webp');
  assert.equal(fix('/local/nuvio/nuvio-bg-kuchnia-wide.webp'), '/hacsfiles/nuvio/nuvio-bg-kuchnia-wide.webp');
  assert.equal(fix('/hacsfiles/nuvio/nuvio-bg-default-wide.webp'), '/hacsfiles/nuvio/nuvio-bg-default-wide.webp');
  // legacy folders (< 0.3.4)
  assert.equal(fix('http://x/hacsfiles/home-glass/assets/bg/las-wide.webp'), '/hacsfiles/nuvio/nuvio-bg-las-wide.webp');
  assert.equal(fix('/assets/backgrounds/las-wide.webp'), '/hacsfiles/nuvio/nuvio-bg-las-wide.webp');
});
test('uploaded and custom images are left untouched', () => {
  const { fix } = load('https://home.example.org/hacsfiles/nuvio/', 'https://home.example.org/d');
  for (const u of ['/api/image/serve/abc123/original', 'https://images.example.com/photo.webp', '/local/photos/garden.webp', '', null, undefined])
    assert.equal(fix(u), u);
});
test('every built-in background source uses the path base and every reader normalizes', () => {
  assert.match(oss, /const b = HG_ASSET_P \+ 'nuvio-bg-' \+ id;/);
  assert.match(oss, /v: HG_ASSET_P \+ 'nuvio-bg-default-wide\.webp', v2p: HG_ASSET_P \+ 'nuvio-bg-default-portrait/);
  assert.match(read('hg-looks.part.js'), /v: HG_ASSET_P \+ 'nuvio-bg-' \+ id \+ '-wide\.webp', v2p: HG_ASSET_P/);
  assert.doesNotMatch(read('hg-wallglass.part.js'), /HG_ASSET \+ 'nuvio-bg-/);
  const ed = read('hg-edit.part.js');
  assert.match(ed, /const mig = \(u\) => \(typeof hgBgFix === 'function' \? hgBgFix\(u\) : u\);/);
  assert.match(ed, /const fx = \(u\) => String\(typeof hgBgFix === 'function' \? hgBgFix\(u\) : u\)/);
  assert.match(read('hg-wallglass.part.js'), /hgBgFix\(B\.img\)/);
  // CDN fallback still works for path-based URLs
  assert.match(oss, /u\.startsWith\(HG_ASSET_P\) \? HG_ASSET_P/);
});
