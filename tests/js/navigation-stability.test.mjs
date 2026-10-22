import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../../src/parts/hg-page.part.js', import.meta.url), 'utf8');
test('top navigation does not fade all cards again when returning to a cached view', () => {
  let animated = false, ready = false;
  const nav = { prev: { view: 'dashboard', t: performance.now(), mode: 'wide' }, ready: () => { ready = true; } };
  const start = src.indexOf('  _enter() {') + '  _enter() {'.length;
  const body = src.slice(start, src.indexOf('  _animIn(')).trim().replace(/\}$/, '');
  const page = { _hass: {}, _config: { view: 'rooms', navigation: 'top' }, _paintTop() {}, _paintRail() {},
    getAttribute: () => 'wide', _panelEl: { animate() {} }, _animIn: () => { animated = true; } };
  new Function('HGNav', 'hgReduced', 'setTimeout', 'clearTimeout', body).call(page, nav, () => false, () => 0, () => {});
  assert.equal(animated, false); assert.equal(ready, true); assert.equal(nav.prev, null);
});
