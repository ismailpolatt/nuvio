/* 2.21.0-beta.1: the view PIN lock switches used data-hge="vl-t", but the settings sheet routes only wl-* actions to HGWall.act,
   so a click did nothing. Every action rendered by the wall tablet section (and the view lock inside it) must be routed and handled. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const P = new URL('../../src/parts/', import.meta.url);
const read = (f) => readFileSync(new URL(f, P), 'utf8');
const files = readdirSync(P).filter((f) => /^hg-(wall|vlock).*\.part\.js$/.test(f));
const acts = new Set(); for (const f of files) for (const m of read(f).matchAll(/data-hge="([a-z][a-z0-9-]*)"/g)) acts.add(m[1]);

test('the settings sheet routes wl-* actions to HGWall.act', () => {
  assert.match(read('hg-edit.part.js'), /a\.startsWith\('wl-'\) && window\.HGWall\) return HGWall\.act\(this, b, a\)/);
});
test('every wall / view lock action is routed (wl- prefix)', () => {
  assert.ok(acts.has('wl-vlock'), 'view lock switch action');
  for (const a of acts) assert.ok(a.startsWith('wl-'), a + ' is never routed to HGWall.act');
});
test('the view lock switch is handled, and asks for a PIN instead of doing nothing', () => {
  const w = read('hg-wall.part.js');
  assert.match(w, /a === 'wl-vlock'/);
  assert.match(w, /if \(!HGVLock\.pinH\(\)\) \{ p\._eToast\(hgT\('vlock\.needs_pin'\)\)/);
  assert.doesNotMatch(read('hg-vlock.part.js'), /data-hge="wl-vlock"[^>]*disabled/);
});
