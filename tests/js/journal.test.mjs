import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParts } from './harness.mjs';
function setup() {
  const window = {}, writes = [], store = new Map();
  const { HGJournal: j } = loadParts(['hg-journal.part.js'], { window, hgTO: (o,m) => Object.assign(o,m), hgT: (s) => s }, ['HGJournal']);
  const h = (id) => ({ user: { id }, callWS: async (q) => {
    assert.ok(q.type.startsWith('frontend/')); assert.equal(q.key, 'nuvio_action_journal_v1');
    if (q.type === 'frontend/get_user_data') return { value: store.get(id) };
    writes.push(q); store.set(id, q.value);
  } });
  return { j, window, writes, store, h };
}
const event = { source: 'room', targets: [{ e: 'light.room', action: 'turn_off' }], accepted: 1, failed: false };
const row = (id, patch={}) => ({ ...event, id, at: new Date().toISOString(), ...patch });

test('a new journal is empty and loading it never changes preferences or calls a device', async () => {
  const { j, h, writes } = setup(); await j.load(h('one'));
  assert.deepEqual(j.rows, []); assert.equal(writes.length, 0);
});

test('concurrent appends are serialized, retained separately from preferences and sanitized', async () => {
  const { j, h, store } = setup(), account = h('one'); await j.load(account);
  await Promise.all([j.record(account, { ...event, secret: 'must not be stored' }), j.record(account, { ...event, source: 'favorites' })]);
  assert.equal(j.rows.length, 2); assert.equal(store.get('one').length, 2);
  assert.ok(j.rows.every((r) => !('secret' in r)));
});

test('malformed results are discarded and the journal retains at most 100 unique records', () => {
  const { j } = setup(), rows = Array.from({length:110}, (_,i) => row(String(i)));
  assert.equal(j.clean(rows).length, 100);
  assert.equal(j.clean([row('a'),row('a')]).length, 1);
  for (const patch of [{ targets: [{ e: 'lock.front', action: 'unlock' }] }, { accepted: 2 }, { accepted: -1 }, { failed: 'true' }, { at: 'not a date' }]) assert.deepEqual(j.clean([row('bad',patch)]), []);
});

test('partial results are not labelled successful and zero-command results stay distinct', () => {
  const { j } = setup();
  assert.equal(j.status({...event, failed:true}), 'partial');
  assert.equal(j.status({...event, accepted:0, failed:true}), 'failed');
  assert.equal(j.status({...event, accepted:0}), 'skipped');
});

test('switching accounts clears old rows and ignores late responses from the old account', async () => {
  const { j, h } = setup(); let release;
  const old = j.load({ user:{id:'one'}, callWS: () => new Promise((r)=>{release=r;}) });
  await j.load(h('two')); release({value:[row('old')]}); await old;
  assert.equal(j.uid,'two'); assert.deepEqual(j.rows,[]);
});

test('a previous account completion cannot write or display a log under the current account', async () => {
  const { j, h, writes } = setup(); await j.load(h('two'));
  assert.equal(await j.record(h('one'),event), false); assert.equal(writes.length,0);
});

test('failed fresh reads never overwrite existing history with an empty journal', async () => {
  const { j, h, writes } = setup(); await j.load(h('one'));
  assert.equal(await j.record({user:{id:'one'},callWS:async()=>{throw Error('offline');}},event),false);
  assert.equal(j.error,true); assert.equal(writes.length,0);
});

test('append merges the newest server history and late account switch does not replace current rows', async () => {
  const { j, h, store } = setup(), account=h('one'); await j.load(account);
  store.set('one',[row('other-tab')]); await j.record(account,event);
  assert.equal(j.rows.length,2);
  let release;
  const save=j.record({user:{id:'one'},callWS:async(q)=> q.type==='frontend/get_user_data'?{value:j.rows}:new Promise((r)=>{release=r;})},event);
  while (!release) await new Promise((r)=>setImmediate(r));
  await j.load(h('two')); release(); assert.equal(await save,false); assert.deepEqual(j.rows,[]);
});
