import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParts } from './harness.mjs';
function setup(wiz = {}) {
  const layout = { hidden: [], order: [], conf: {}, size: {} }, HGL = { data: { wiz }, get: () => layout, set: (k, v) => Object.assign(layout, v), save: async () => 'ha', sort: (xs, key, order) => [...xs].sort((a, b) => { const rank = (x) => order.includes(key(x)) ? order.indexOf(key(x)) : 999; return rank(a) - rank(b); }) };
  const out = loadParts(['hg-dashboardx.part.js'], { window: {}, HGBase: class { rerender() {} }, hgReg() {}, hgTLazy: (k) => k, hgT: (k) => k, HGL }, ['HGDashboard', 'HGDailyEnergyCard']);
  return { ...out, HGL, layout };
}
const state = (value, dc, unit) => ({ state: value, attributes: { device_class: dc, unit_of_measurement: unit } });
test('home health distinguishes open, offline and low battery without treating zero or unknown as healthy', () => {
  const { HGDashboard } = setup();
  const h = { states: { 'binary_sensor.contact': state('on', 'window'), 'binary_sensor.lost': state('unavailable', 'door'), 'sensor.zero': state('0', 'battery', '%'), 'sensor.unknown': state('unknown', 'battery', '%'), 'sensor.normal': state('70', 'battery', '%'), 'sensor.voltage': state('2.7', 'battery', 'V'), 'sensor.hidden': state('0', 'battery', '%') }, entities: { 'sensor.hidden': { hidden: true } } };
  const rows = HGDashboard.health(h);
  assert.equal(rows.length, 4); assert.equal(rows.find((x) => x.e === 'sensor.zero').kind, 'battery');
  assert.equal(rows.find((x) => x.e === 'sensor.unknown').kind, 'offline');
  assert.equal(HGDashboard.health(h, ['sensor.zero']).length, 3);
  h.entities['sensor.zero'] = { entity_category: 'diagnostic' };
  assert.equal(HGDashboard.health(h).find((x) => x.e === 'sensor.zero').kind, 'battery');
});
test('night schedule handles midnight, day ranges, equal and invalid times', () => {
  const { HGDashboard: x } = setup(), at = (h, m = 0) => new Date(2026, 9, 22, h, m);
  assert.equal(x.nightRange(at(23), '23:00', '07:00'), true);
  assert.equal(x.nightRange(at(2), '23:00', '07:00'), true);
  assert.equal(x.nightRange(at(7), '23:00', '07:00'), false);
  assert.equal(x.nightRange(at(12), '10:00', '14:00'), true);
  assert.equal(x.nightRange(at(12), '12:00', '12:00'), false);
  assert.equal(x.nightRange(at(12), '99:00', '07:00'), false);
});
test('recorded energy needs a baseline and sample; missing/reset data never becomes zero consumption', () => {
  const { HGDashboard: x } = setup();
  const rows = [{ end: 100, sum: 10 }, { end: 200, sum: 10.5 }, { end: 300, sum: 12 }];
  assert.equal(x.energyDelta(rows, 100, 300), 2);
  assert.equal(x.energyDelta(rows, 50, 300), null);
  assert.equal(x.energyDelta(rows, 300, 400), null);
  assert.equal(x.energyDelta([{ end: 100, sum: 10 }, { end: 200, sum: 0 }], 100, 200), null);
  assert.equal(x.energyDelta([{ end: 100, sum: 10 }, { end: 200, sum: 10 }], 100, 200), 0);
});
test('personalization can show an optional card, move it and save without deleting other preferences', async () => {
  const { HGDashboard: x, HGL, layout } = setup({ hiddenPersons: ['person.example'] });
  x.cards = [{ title: 'A' }, { title: 'B', home_optional: true }]; x.draft = structuredClone(layout);
  let refreshed = false; const page = { _canEdit: () => true, _keys: () => ['a', 'b'], _eLook() {}, _eSheetEl: { querySelector: () => ({ value: '' }) }, _hass: {}, _eToast() {}, _eSheet() {}, _eRefresh: () => { refreshed = true; } };
  await x.act(page, { dataset: { k: 'b' } }, 'home-toggle');
  await x.act(page, { dataset: { k: 'b' } }, 'home-up');
  await x.act(page, { dataset: { k: 'b' } }, 'home-size');
  await x.act(page, { dataset: {} }, 'home-save');
  assert.equal(layout.conf.b.home_visible, true); assert.deepEqual(layout.order, ['b', 'a']); assert.equal(layout.size.b, 'l');
  assert.deepEqual(HGL.data.wiz.hiddenPersons, ['person.example']); assert.equal(refreshed, true);
});
test('daily energy gives a setup state when no Home Assistant energy source exists', async () => {
  const { HGDailyEnergyCard } = setup(); const card = new HGDailyEnergyCard();
  card.isConnected = true; card._config = {}; card._hass = { callWS: async () => ({ energy_sources: [] }) };
  await card._load(); assert.deepEqual(card._result, { missing: true }); assert.equal(card._loading, false);
});
test('room filtering keeps thermostat slots and contact chips in their control groups', () => {
  const { HGDashboard: x } = setup(), sections = [['light', 'lights'], ['sens', 'sensors'], ['sw', 'switches']];
  assert.equal(x.roomGroup('lights', '', sections), 'light');
  assert.equal(x.roomGroup('other', '<div data-ac="climate.example"></div>', sections), 'clim');
  assert.equal(x.roomGroup('other', '<ha-card class="glass chips">', sections), 'sens');
  assert.equal(x.roomGroup('switches', '', sections), 'devices');
});
test('daily energy uses the selected meter, requests kWh sums and compares the same local time', async () => {
  const { HGDailyEnergyCard } = setup({ homeEnergy: 'sensor.example' }), card = new HGDailyEnergyCard();
  card.isConnected = true; card._config = {};
  card._hass = { callWS: async (q) => {
    assert.equal(q.type, 'recorder/statistics_during_period'); assert.deepEqual(q.units, { energy: 'kWh' }); assert.deepEqual(q.statistic_ids, ['sensor.example']);
    const now = new Date(q.end_time), today = new Date(now); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const same = new Date(now); same.setDate(same.getDate() - 1);
    return { 'sensor.example': [{ end: +yesterday, sum: 100 }, { end: +same, sum: 102 }, { end: +today, sum: 110 }, { end: +now, sum: 113 }] };
  } };
  await card._load(); assert.equal(card._result.today, 3); assert.equal(card._result.yesterday, 2);
});
