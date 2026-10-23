import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParts } from './harness.mjs';

function setup(timers={}) {
  const store = new Map(), navigator = { maxTouchPoints: 1 }, window = { innerWidth: 864, innerHeight: 700 };
  const H = { ok: (s) => !!s && !['unknown', 'unavailable'].includes(s.state), name: (h, e) => h.states[e]?.attributes.friendly_name || e, stateLabel: (s) => s };
  const p = { data: { readAlerts: [] }, save: async (h, patch) => { p.data = { ...p.data, ...patch }; } };
  const x = loadParts(['hg-livingx.part.js'], { setTimeout:timers.setTimeout||(()=>0),clearTimeout:timers.clearTimeout||(()=>{}),window, navigator, location: { pathname: '/dashboard-test/kontrol' },
    localStorage: { getItem: (k) => store.get(k), setItem: (k, v) => store.set(k, v) },
    H, HGL: { data: { wiz: {} } }, HGPersonal: p, HGBase: class { rerender() {} },
    HGAreas: { model: (h) => h.model || { list: [] }, val: (h, ref) => h.states[ref.e].state === 'unavailable' ? null : +h.states[ref.e].state },
    HGDashboard: { health: (h) => h.health || [] }, hgTO: (o, m) => Object.assign(o, m), hgReg() {}, hgTLazy: (s) => s, hgT: (s) => s
  }, ['HGLiving', 'HGQuickRoomCard']);
  return { ...x, store, navigator, window, p };
}
const s = (state, attributes = {}) => ({ state, attributes });

test('suggestions require an open contact and actual heating/cooling in the same room; unknown humidity stays unknown', () => {
  const { HGLiving: l } = setup(), h = { states: { 'binary_sensor.window': s('on', { device_class: 'window' }), 'climate.room': s('heat', { hvac_action: 'idle' }), 'sensor.humidity': s('unavailable', { device_class: 'humidity' }) }, model: { list: [{ name: 'Room', ents: ['binary_sensor.window', 'climate.room'], hum: { e: 'sensor.humidity' } }] } };
  assert.deepEqual(l.suggestions(h), []);
  h.states['climate.room'].attributes.hvac_action = 'heating';
  assert.equal(l.suggestions(h)[0].kind, 'window_climate');
  h.model.list = [{ name: 'First', ents: ['binary_sensor.window'] }, { name: 'Second', ents: ['climate.room'] }];
  assert.deepEqual(l.suggestions(h), []);
});

test('quick room feedback resets per command, blocks duplicate pending requests, and old expiry cannot clear a newer result',async()=>{
 const tasks=[],cleared=[];const {HGQuickRoomCard:C}=setup({setTimeout:(fn,ms)=>{tasks.push({fn,ms});return tasks.length;},clearTimeout:id=>cleared.push(id)}),q=new C();let resolve,calls=0;
 q._hass={user:{id:'one'},states:{'switch.washer':s('off')},callService:()=>{calls++;return new Promise(r=>resolve=r);}};q.room=()=>({ents:['switch.washer']});
 const button={dataset:{e:'switch.washer'}},first=q.onAct('power',button);assert.equal(q._message,'living.command_sending');assert.equal(q._commandBusy,true);await q.onAct('power',button);assert.equal(calls,1);
 resolve();await first;assert.equal(q._message,'living.command_sent');assert.equal(tasks[0].ms,3500);
 const second=q.onAct('power',button);assert.ok(cleared.includes(1));assert.equal(q._message,'living.command_sending');tasks[0].fn();assert.equal(q._message,'living.command_sending');resolve();await second;tasks[1].fn();assert.equal(q._message,'');
 q._hass.callService=async()=>{throw Error('offline');};await q.onAct('power',button);assert.equal(q._message,'living.command_failed');assert.equal(tasks[2].ms,6000);tasks[2].fn();assert.equal(q._message,'');
});

test('exit preview preserves unknown contacts and excludes hidden entities; no selection is inferred', () => {
  const { HGLiving: l } = setup(), h = { states: { 'light.on': s('on'), 'light.hidden': s('on'), 'binary_sensor.contact': s('unavailable', { device_class: 'door' }), 'binary_sensor.closed': s('off', { device_class: 'window' }), 'lock.door': s('unlocked') }, entities: { 'light.hidden': { hidden_by: 'user' } } };
  assert.deepEqual(l.exitRows(h), ['binary_sensor.contact', 'light.on']);
  assert.throws(() => l.offTargets(h, []));
  assert.throws(() => l.offTargets(h, ['lock.door']));
  assert.throws(() => l.offTargets(h, ['light.hidden']));
});

test('turn-off validates every target before calling services and stops after the first failure', async () => {
  const { HGLiving: l } = setup(), calls = [], h = { states: { 'light.one': s('on'), 'switch.two': s('on'), 'switch.three': s('on') }, callService: async (...q) => { calls.push(q); if (q[2].entity_id === 'switch.two') throw Error('failed'); } };
  await assert.rejects(l.turnOff(h, ['light.one', 'light.missing'])); assert.equal(calls.length, 0);
  const result = await l.turnOff(h, ['light.one', 'switch.two', 'switch.three']);
  assert.deepEqual(result, { done: 1, total: 3, failed: true }); assert.equal(calls.length, 2);
  assert.ok(calls.every((q) => q[1] === 'turn_off'));
});

test('quick room power cannot control an entity outside the opened room or an unavailable entity', async () => {
  const { HGQuickRoomCard } = setup(), q = new HGQuickRoomCard(), calls = [];
  q._hass = { states: { 'light.in': s('on'), 'light.out': s('on'), 'switch.lost': s('unavailable') }, callService: async (...x) => calls.push(x) };
  q.room = () => ({ ents: ['light.in', 'switch.lost'] });
  await q.onAct('power', { dataset: { e: 'light.out' } });
  await q.onAct('power', { dataset: { e: 'switch.lost' } }); assert.equal(calls.length, 0);
  await q.onAct('power', { dataset: { e: 'light.in' } }); assert.equal(calls.length, 1); assert.equal(calls[0][1], 'turn_off');
});

test('tablet masks are browser/account/orientation scoped and never reveal shared hidden cards or affect phones', () => {
  const { HGLiving: l, store, window } = setup(), h = { user: { id: 'one' } }, cards = [{ _k: 'a' }, { _k: 'b', _hid: true }];
  store.set(l.tabletKey(h), JSON.stringify({ landscape: ['a'], portrait: [] }));
  assert.ok(l.tabletApply(cards, { _hass: h })[0]._hid); assert.ok(!cards[0]._hid);
  assert.ok(!l.tabletApply(cards, { _hass: { user: { id: 'two' } } })[0]._hid);
  window.innerWidth = 700; window.innerHeight = 1000;
  assert.ok(!l.tabletApply(cards, { _hass: h })[0]._hid); assert.ok(l.tabletApply(cards, { _hass: h })[1]._hid);
  window.innerWidth = 390; assert.equal(l.tabletApply(cards, { _hass: h }), cards);
});

test('read alerts recur on a new event and sort critical before connection failures', () => {
  const { HGLiving: l } = setup(), h = { states: { 'binary_sensor.smoke': { ...s('on'), last_changed: 'first' }, 'sensor.lost': s('unavailable') }, health: [{ e: 'sensor.lost', kind: 'offline' }, { e: 'binary_sensor.smoke', kind: 'alert' }] };
  const first = l.alerts(h); assert.equal(first[0].priority, 0); assert.equal(first[1].priority, 3);
  h.states['binary_sensor.smoke'].last_changed = 'second'; assert.notEqual(l.alerts(h)[0].key, first[0].key);
});

test('cached home rebuilds once when local tablet visibility or orientation changes', () => {
  const { HGLiving: l, store, window } = setup(); let builds = 0;
  const page = { _hass: { user: { id: 'one' } }, _built: true, _config: { view: 'dashboard' }, toggleAttribute() {}, _build: () => builds++ };
  l.applyTouch(page); l.applyTouch(page); assert.equal(builds, 0);
  store.set(l.tabletKey(page._hass), JSON.stringify({ landscape: ['a'] }));
  l.applyTouch(page); l.applyTouch(page); assert.equal(builds, 1);
  window.innerWidth = 700; window.innerHeight = 1000;
  l.applyTouch(page); l.applyTouch(page); assert.equal(builds, 2);
});

test('automation preview is command-free, changed state blocks execution, disabling preserves running actions', async () => {
  const { HGLiving: l } = setup(), calls = [], h = { user: { id: 'one', is_admin: true }, states: { 'automation.sample': s('on') }, callService: async (...x) => calls.push(x) }, card = { _hass: h, shadowRoot: {}, rerender() {} };
  await l.act(card, 'living-auto-preview', { dataset: { e: 'automation.sample' } }); assert.equal(calls.length, 0);
  h.states['automation.sample'].state = 'off'; await l.act(card, 'living-execute', {}); assert.equal(calls.length, 0);
  h.states['automation.sample'].state = 'on'; await l.act(card, 'living-auto-preview', { dataset: { e: 'automation.sample' } }); await l.act(card, 'living-execute', {});
  assert.deepEqual(calls[0], ['automation', 'turn_off', { entity_id: 'automation.sample', stop_actions: false }]);
  h.user.is_admin = false; card._livingConfirm = null; await l.act(card, 'living-auto-preview', { dataset: { e: 'automation.sample' } }); assert.equal(card._livingConfirm, null);
});

test('confirmation cannot be executed by a different account', async () => {
  const { HGLiving: l } = setup(), calls = [], card = { _hass: { user: { id: 'two' }, states: { 'light.one': s('on') }, callService: async (...q) => calls.push(q) }, _livingConfirm: { uid: 'one', kind: 'off', es: ['light.one'] }, shadowRoot: {}, rerender() {} };
  await l.act(card, 'living-execute', {}); assert.equal(calls.length, 0);
});

test('turn-off stops if the live HA snapshot changes account between steps', async () => {
  const { HGLiving: l } = setup(), calls = [], h = { user: { id: 'one' }, states: { 'light.one': s('on'), 'light.two': s('on') }, callService: async (...q) => calls.push(q) };
  const result = await l.turnOff(h, ['light.one', 'light.two'], () => calls.length ? { ...h, user: { id: 'two' } } : h);
  assert.equal(calls.length, 1); assert.equal(result.failed, true);
});

test('confirmation uses the native modal layer and cancellation never calls a device service', () => {
  const { HGLiving: l } = setup(); let opens = 0, repaints = 0;
  const modal = { open: false, showModal() { this.open = true; opens++; } }, root = { querySelector: (q) => q === '.living-modal' ? modal : null, addEventListener() {} };
  const card = { shadowRoot: root, _livingConfirm: { kind: 'auto', es: [] }, rerender: () => repaints++ };
  l.bind(card); l.bind(card); assert.equal(opens, 1);
  modal.oncancel({ preventDefault() {} }); assert.equal(card._livingConfirm, null); assert.equal(repaints, 1);
});

test('read state saves account preferences without dismissing the original alert', async () => {
  const { HGLiving: l, p } = setup(), h = { states: { 'sensor.lost': s('unavailable') }, health: [{ e: 'sensor.lost', kind: 'offline' }] };
  const key = l.alerts(h)[0].key, card = { _hass: h, shadowRoot: {}, rerender() {} };
  l.page = () => null;
  await l.act(card, 'living-read', { dataset: { key } });
  assert.deepEqual(p.data.readAlerts, [key]); assert.equal(l.alerts(h).length, 1);
});
