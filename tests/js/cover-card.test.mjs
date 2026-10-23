/* #36: cover without current_position (gate, garage door): word state instead of 0 % / 100 % and the bar; icon by device_class. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../../src/parts/cards/cover-card.part.js', import.meta.url), 'utf8');
const T = { open: 'Open', closed: 'Closed', opening: 'Opening', closing: 'Closing' };
const G = {
  window: {}, HGBase: class {}, HG_NV_CSS: '', U: (x) => x, hgT: (k) => k, hgTLazy: (k) => k, hgStub: () => null, hgReg: () => {}, hgDragVal: () => {},
  H: { st: (h, e) => h.states[e], ok: (s) => s.state !== 'unavailable', name: () => 'Gate', t: (h, s) => T[s.state] || s.state, esc: (x) => String(x), call: () => {}, haptic: () => {} },
  hgUI: { header: (n, o) => `<hd ic="${o.icon}" sub="${o.sub}">`, big: (v, o) => `<big>${v}${o.unit}</big>`, progress: (v) => `<bar>${v}</bar>`, iconBtn: (i, a) => `<b data-a="${a}">` },
};
const { C, icon } = new Function(...Object.keys(G), src + '; return { C: HGCoverCard, icon: hgCoverIcon };')(...Object.values(G));
const card = (attributes, state) => { const c = new C(); c._config = { entity: 'cover.x' }; c._hass = { states: { 'cover.x': { state, attributes } } }; return c.render(); };

test('no current_position: word state, no percentage, no bar', () => {
  for (const [st, w] of Object.entries(T)) {
    const html = card({ device_class: 'gate', supported_features: 11 }, st);
    assert.ok(html.includes(`>${w}</div>`), st); assert.ok(!html.includes('<big>'), st); assert.ok(!html.includes('<bar>'), st);
    assert.equal(/class="cv-st mv"/.test(html), st === 'opening' || st === 'closing', st + ' moving pulse');
  }
});
test('with current_position: percentage and bar as before', () => {
  const html = card({ current_position: 40, supported_features: 15 }, 'open');
  assert.ok(html.includes('<big>40%</big>')); assert.ok(html.includes('<bar>40</bar>')); assert.ok(!html.includes('cv-st'));
});
test('icon follows device_class, open icon while open or moving', () => {
  assert.equal(icon('gate', 'closed'), 'mdi:gate'); assert.equal(icon('gate', 'opening'), 'mdi:gate-open');
  assert.equal(icon('garage', 'closed'), 'mdi:garage'); assert.equal(icon('garage', 'open'), 'mdi:garage-open');
  assert.equal(icon('door', 'closed'), 'mdi:door-closed'); assert.equal(icon(undefined, 'closed'), 'mdi:window-shutter');
  assert.equal(icon('weird', 'open'), 'mdi:window-shutter-open');
  assert.match(card({ device_class: 'garage' }, 'closed'), /ic="mdi:garage"/);
});
