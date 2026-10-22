import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadParts } from './harness.mjs';

function setup(wiz = {}) {
  const HGL = { data: { wiz }, save: async () => 'ha' };
  const src = readFileSync(new URL('../../src/parts/hg-oss.part.js', import.meta.url), 'utf8');
  const helper = src.slice(src.indexOf('const hgVisiblePersons ='), src.indexOf('const HG_DASH ='));
  const visible = new Function('HGL', helper + ';return hgVisiblePersons;')(HGL);
  const { HGRoomsX } = loadParts(['hg-lookr.part.js'], { window: { __hgDryRun: true }, HGL, hgT: (k) => k, H: {} }, ['HGRoomsX']);
  const { HGFamilyCard } = loadParts(['cards/family-card.part.js'], { HGBase: class {}, hgReg() {}, hgTLazy: (k) => k, hgVisiblePersons: visible }, ['HGFamilyCard']);
  return { HGL, HGRoomsX, HGFamilyCard, visible };
}

test('existing layouts keep everyone visible; explicit hidden list filters without mutating', () => {
  const { visible } = setup(); const list = ['person.alpha', 'person.beta'];
  assert.deepEqual(visible(list), list);
  assert.deepEqual(visible(list, { hiddenPersons: ['person.beta', 'person.deleted'] }), ['person.alpha']);
  assert.deepEqual(list, ['person.alpha', 'person.beta']);
  assert.deepEqual(visible(list, { hiddenPersons: 'invalid' }), list);
  assert.deepEqual(visible(list, { hiddenPersons: list }), []);
});

test('family discovery and explicit card selection both respect the display preference', () => {
  const { HGFamilyCard } = setup({ hiddenPersons: ['person.beta'] });
  const card = new HGFamilyCard(); card._config = {}; card._hass = { states: { 'person.alpha': {}, 'person.beta': {}, 'sensor.example': {} } };
  assert.deepEqual(card.list(), ['person.alpha']);
  card._config.persons = ['person.beta']; assert.deepEqual(card.list(), []);
});

test('settings toggle saves, preserves unrelated preferences and supports hiding everyone', async () => {
  const { HGL, HGRoomsX, visible } = setup({ phone: ['dashboard'], hub: false });
  const page = { _hass: { states: { 'person.alpha': {}, 'person.beta': {} } }, _config: {}, _eLook() {}, _eToast() {} };
  HGRoomsX.hd = { hub: false, hiddenPersons: [], fuel: [], wx: {}, vx: {}, phone: ['dashboard'], hubPos: 'left' };
  for (const e of ['person.alpha', 'person.beta']) await HGRoomsX.act(page, { dataset: { e } }, 'rx-person');
  assert.equal(HGRoomsX.hdirty, true);
  await HGRoomsX.act(page, { dataset: {} }, 'rx-hsave');
  assert.deepEqual(visible(['person.alpha', 'person.beta']), []);
  assert.deepEqual(HGL.data.wiz.phone, ['dashboard']); assert.equal(HGL.data.wiz.hub, false);
  assert.deepEqual(Object.keys(page._hass.states), ['person.alpha', 'person.beta']);
  // Reopen the saved preference and show one person again.
  HGRoomsX.hd = { hub: false, hiddenPersons: [...HGL.data.wiz.hiddenPersons], fuel: [], wx: {}, vx: {}, phone: [], hubPos: 'left' };
  await HGRoomsX.act(page, { dataset: { e: 'person.alpha' } }, 'rx-person');
  await HGRoomsX.act(page, { dataset: {} }, 'rx-hsave');
  assert.deepEqual(visible(['person.alpha', 'person.beta']), ['person.alpha']);
});
