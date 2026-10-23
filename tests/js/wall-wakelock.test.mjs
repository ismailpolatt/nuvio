/* #38: the screensaver asks for the screen wake lock again when the page becomes visible (browsers release it when hidden). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../../src/parts/hg-wall.part.js', import.meta.url), 'utf8');
const i = src.indexOf('  wakeLock() {'), M = '/* ekran może zgasnąć wg systemu */ } },', j = src.indexOf(M, i) + M.length;
const body = src.slice(i, j).trim().replace(/,$/, '');
const make = (doc, nav) => new Function('document', 'navigator', `return { active: true, _wl: null, _wlq: false, ${body} };`)(doc, nav);
const fakeNav = () => { const n = { calls: 0, wakeLock: { request: () => { n.calls++; const l = { released: false, ev: {}, addEventListener: (k, f) => { l.ev[k] = f; }, release: () => { l.released = true; l.ev.release && l.ev.release(); } }; n.last = l; return Promise.resolve(l); } } }; return n; };
const tick = () => new Promise((r) => setTimeout(r, 0));

test('wake lock is requested again after the browser released it', async () => {
  const doc = { hidden: false }, nav = fakeNav(), W = make(doc, nav);
  W.wakeLock(); await tick(); assert.equal(nav.calls, 1); assert.ok(W._wl);
  W.wakeLock(); await tick(); assert.equal(nav.calls, 1, 'no second request while held');
  nav.last.release(); assert.equal(W._wl, null, 'released by the browser (page hidden)');
  doc.hidden = true; W.wakeLock(); await tick(); assert.equal(nav.calls, 1, 'not while hidden');
  doc.hidden = false; W.wakeLock(); await tick(); assert.equal(nav.calls, 2, 'requested again when visible');
});
test('no request when the screensaver is not active or the API is missing', async () => {
  const nav = fakeNav(), W = make({ hidden: false }, nav); W.active = false; W.wakeLock(); await tick(); assert.equal(nav.calls, 0);
  const W2 = make({ hidden: false }, {}); assert.doesNotThrow(() => W2.wakeLock());
});
test('visibilitychange re-requests while the screensaver is active', () => {
  assert.match(src, /visibilitychange', \(\) => \{ if \(!document\.hidden\) \{ this\.last = Date\.now\(\); this\.arm\(\); if \(this\.active\) this\.wakeLock\(\); \} \}/);
});
