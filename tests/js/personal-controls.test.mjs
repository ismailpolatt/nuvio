import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParts } from './harness.mjs';
function setup(journal) {
  const HGL = { data: { wiz: {} }, notify() {}, sort: (xs, key, order) => [...xs].sort((a, b) => (order.includes(key(a)) ? order.indexOf(key(a)) : 999) - (order.includes(key(b)) ? order.indexOf(key(b)) : 999)) };
  const H = { ok: (s) => !!s && !['unknown', 'unavailable'].includes(s.state), name: (h, e) => e };
  const globals = { HGJournal: journal, window: journal ? { HGJournal: journal } : {}, HGBase: class { rerender() {} }, HGL, H, hgTO: (o, map) => Object.assign(o, map), hgReg() {}, hgTLazy: (s) => s, hgT: (s) => s };
  const x = loadParts(['hg-controlx.part.js'], globals, ['HGPersonal', 'HGControlCard']);
  x.HGPersonal.data = x.HGPersonal.clean({}); return { ...x, HGL };
}
test('account preferences switch accounts without carrying favorites and save through user data only', async () => {
  const { HGPersonal: p } = setup(), calls = [];
  const account = (id) => ({ user: { id }, callWS: async (q) => { calls.push(q); return { value: { favorites: [`light.${id}`] } }; } });
  await p.load(account('one')); assert.deepEqual(p.data.favorites, ['light.one']);
  await p.load(account('two')); assert.deepEqual(p.data.favorites, ['light.two']);
  await assert.rejects(p.save(account('one'), { favorites: [] }));
  await p.save(account('two'), { active: true });
  assert.equal(calls.at(-1).type, 'frontend/set_user_data'); assert.equal(calls.at(-1).value.active, true);
  assert.equal(calls.some((x) => x.type.includes('lovelace')), false);
});
test('failed preference read blocks saving instead of overwriting server preferences with defaults', async () => {
  const { HGPersonal: p } = setup(); const h = { user: { id: 'one' }, callWS: async () => { throw Error('offline'); } };
  await p.load(h); assert.equal(p.failed, true); await assert.rejects(p.save(h, { favorites: [] }));
});

test('an old account save completing after account switch cannot replace the new account preferences', async () => {
  const { HGPersonal: p } = setup(); let release;
  const one = { user: { id: 'one' }, callWS: async (q) => q.type === 'frontend/get_user_data' ? { value: { favorites: ['light.one'] } } : new Promise((r) => { release = r; }) };
  await p.load(one);
  const save = p.save(one, { favorites: ['light.old'] });
  await p.load({ user: { id: 'two' }, callWS: async () => ({ value: { favorites: ['light.two'] } }) });
  release(); await assert.rejects(save);
  assert.equal(p.uid, 'two'); assert.deepEqual(p.data.favorites, ['light.two']);
});

test('saving visibility without a move inherits shared ordering; an explicit move saves the displayed order', () => {
  const { HGPersonal: p, HGControlCard } = setup(), c = new HGControlCard();
  p.data.cards = { retained: { visible: false } };
  const rows = ['second', 'first'].map((key) => ({ dataset: { card: key }, querySelector: () => ({ value: '' }) }));
  c.shadowRoot = { querySelector: () => ({ checked: true }), querySelectorAll: (q) => q === '[data-card]' ? rows : [] };
  assert.deepEqual(c._profileCollect().order, []);
  assert.deepEqual(c._profileCollect().cards.retained, { visible: false });
  c._profileOrderChanged = true; assert.deepEqual(c._profileCollect().order, ['second', 'first']);
});

test('executing a mode uses exactly the previewed steps even if the saved mode changes meanwhile', async () => {
  const { HGPersonal: p, HGControlCard } = setup(), c = new HGControlCard(), calls = [];
  c.shadowRoot = {}; c._hass = { user: { id: 'one' }, states: { 'light.one': { state: 'on' }, 'light.two': { state: 'on' } }, callService: async (...q) => calls.push(q) };
  p.data.modes.home = [{ e: 'light.one', state: 'off' }];
  await c.onAct('preview', { dataset: { mode: 'home' } });
  p.data.modes.home = [{ e: 'light.two', state: 'off' }];
  await c.onAct('execute', {});
  assert.deepEqual(calls, [['light', 'turn_off', { entity_id: 'light.one' }]]);
});
test('personal home overlay can show optional cards, hide others and reorder without changing shared cards', () => {
  const { HGPersonal: p } = setup(); const cards = [{ _k: 'a', _hid: false }, { _k: 'b', _hid: true }];
  p.data = p.clean({ active: true, order: ['b', 'a'], cards: { a: { visible: false }, b: { visible: true, size: 'l' } } });
  const out = p.apply(cards); assert.equal(out[0]._k, 'b'); assert.equal(out[0]._hid, false); assert.equal(out[0].span, 'full'); assert.equal(out[1]._hid, true);
  assert.equal(cards[1]._hid, true); p.data.active = false; assert.equal(p.apply(cards), cards);
});
test('mode preview never calls a service and execution stops after first failure', async () => {
  const { HGPersonal: p, HGControlCard } = setup(), calls = [];
  p.data.modes.home = [{ e: 'light.one', state: 'off' }, { e: 'switch.two', state: 'on' }, { e: 'light.three', state: 'on' }];
  const c = new HGControlCard(); c.shadowRoot = {}; c._hass = { states: { 'light.one': { state: 'on' }, 'switch.two': { state: 'off' }, 'light.three': { state: 'off' } }, callService: async (...x) => { calls.push(x); if (calls.length === 2) throw Error('failed'); } };
  await c.onAct('preview', { dataset: { mode: 'home' } }); assert.equal(calls.length, 0); assert.equal(c._preview, 'home');
  await c.onAct('execute', {}); assert.equal(calls.length, 2); assert.deepEqual(calls[0], ['light', 'turn_off', { entity_id: 'light.one' }]); assert.match(c._message, /1\/3/);
});
test('mode validation rejects unsupported actions and unavailable targets prevent all service calls', async () => {
  const { HGPersonal: p, HGControlCard } = setup();
  const h = { states: { 'light.one': { state: 'unavailable' } }, callService: async () => { throw Error('Must not run'); } };
  assert.deepEqual(p.steps(h, [{ e: 'lock.front', state: 'on' }]), []);
  assert.deepEqual(p.steps(h, [{ e: 'light.one', state: 'toggle' }]), []);
  p.data.modes.away = [{ e: 'light.one', state: 'off' }]; const c = new HGControlCard(); c.shadowRoot = {}; c._hass = h; c._preview = 'away';
  await c.onAct('execute', {}); assert.equal(c._running, undefined);
});
test('room summary distinguishes zero open contacts from unavailable sensors', () => {
  const { HGPersonal: p } = setup(); const h = { states: { 'light.one': { state: 'on' }, 'light.two': { state: 'unknown' }, 'binary_sensor.door': { state: 'off' }, 'binary_sensor.window': { state: 'unavailable' } } };
  assert.deepEqual(p.room(h, { lights: ['light.one', 'light.two'], sec: { door: ['binary_sensor.door', 'binary_sensor.window'] } }), { on: 1, lightMissing: 1, open: 0, missing: 1, contacts: 2 });
});
test('energy day windows use complete local days across month boundaries and rate validation preserves zero', () => {
  const { HGPersonal: p } = setup(), days = p.days(new Date(2026, 10, 2, 14));
  assert.equal(days.length, 14); assert.equal(new Date(days.at(-1).to).getDate(), 2); assert.equal(new Date(days[0].from).getHours(), 0);
  assert.equal(p.clean({ rate: 0 }).rate, 0); assert.equal(p.clean({ rate: -5 }).rate, 0); assert.equal(p.clean({ favorites: ['a', 'a'] }).favorites.length, 1);
});


test('mode journal records partial completion once and previews create no records', async () => {
  const records = [], calls = [], journal = { record: (h, r) => records.push(r) };
  const { HGPersonal: p, HGControlCard } = setup(journal), c = new HGControlCard();
  p.data.modes.home = [{ e: 'light.one', state: 'off' }, { e: 'switch.two', state: 'on' }, { e: 'light.three', state: 'on' }];
  c.shadowRoot = {}; c._hass = { user: { id: 'one' }, states: { 'light.one': { state: 'on' }, 'switch.two': { state: 'off' }, 'light.three': { state: 'off' } }, callService: async (...q) => { calls.push(q); if (calls.length === 2) throw Error('failed'); } };
  await c.onAct('preview', { dataset: { mode: 'home' } }); assert.equal(records.length, 0); assert.equal(calls.length, 0);
  await c.onAct('execute', {});
  assert.equal(calls.length, 2); assert.equal(records.length, 1);
  assert.deepEqual(records[0], { source: 'mode', targets: [{ e: 'light.one', action: 'turn_off' }, { e: 'switch.two', action: 'turn_on' }, { e: 'light.three', action: 'turn_on' }], accepted: 1, failed: true });
});

test('favorite journal distinguishes accepted and failed commands without repeating the service', async () => {
  const records = [], calls = [], { HGPersonal: p, HGControlCard } = setup({ record: (h, r) => records.push(r) }), c = new HGControlCard();
  p.data.favorites = ['light.one']; c.shadowRoot = {};
  c._hass = { states: { 'light.one': { state: 'on' } }, callService: async (...q) => { calls.push(q); if (calls.length === 2) throw Error('failed'); } };
  await c.onAct('toggle', { dataset: { e: 'light.one' } }); await c.onAct('toggle', { dataset: { e: 'light.one' } });
  assert.equal(calls.length, 2); assert.equal(records.length, 2);
  assert.equal(records[0].accepted, 1); assert.equal(records[0].failed, false);
  assert.equal(records[1].accepted, 0); assert.equal(records[1].failed, true);
});
