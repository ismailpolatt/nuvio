/* #35: the screensaver and "Lock screen" close every view unlocked with the PIN; after waking, the current view asks again. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const rd = (p) => readFileSync(new URL('../../src/parts/' + p, import.meta.url), 'utf8');
const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const load = () => { const ctx = { window: {}, sessionStorage: store(), hgT: (k) => k }; ctx.window.__hgL = { data: { wall: { vlock: ['kamery', 'test'] } } };
  ctx.window.HGWall = { get: () => ({ pinH: 'x' }) }; vm.createContext(ctx); vm.runInContext(rd('hg-vlock.part.js') + '\nthis.V = HGVLock;', ctx); return ctx.V; };

test('mark() without a view closes every unlocked view', () => {
  const V = load();
  V.mark('kamery'); V.mark('test');
  assert.equal(V.isOpen('kamery'), true); assert.equal(V.isOpen('test'), true);
  V.mark();
  assert.equal(V.isOpen('kamery'), false); assert.equal(V.isOpen('test'), false);
});
test('screensaver show (not the settings preview) and lockNow relock views, wake guards the current page', () => {
  const s = rd('hg-wall.part.js');
  assert.match(s, /show\(test\) \{[^\n]*\n[^\n]*\n\s*if \(!test && window\.HGVLock\) HGVLock\.mark\(\);/);
  assert.match(s, /lockNow\(\) \{[^\n]*\n[^\n]*this\.flag\(true\); clearTimeout\(this\._lk\); if \(window\.HGVLock\) HGVLock\.mark\(\);/);
  assert.match(s, /if \(window\.HGVLock && pg && pg\.isConnected\) HGVLock\.guard\(pg\);\n\s*this\.arm\(\); \},/);
  assert.match(s, /a === 'wl-test'[^\n]*this\.show\(true\)/, 'settings preview does not relock');
});
