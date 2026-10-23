/* Settings draft: edits stay in memory, no save and no reload until Done; Cancel discards; one save, at most one reload. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const rd = (p) => readFileSync(new URL('../../src/parts/' + p, import.meta.url), 'utf8');
const ed = rd('hg-edit.part.js'), oss = rd('hg-oss.part.js'), lr = rd('hg-lookr.part.js');
const load = () => { const a = ed.indexOf('const HGDraft'), b = ed.indexOf('const HG_SET_PAGES'); const calls = [];
  const ctx = { window: {}, HG_DASH: () => 'dashboard-nuvio', HGLookX: { pend: 1, kpend: true, cv: 1, dash: 1 } }; vm.createContext(ctx);
  vm.runInContext(ed.slice(a, b) + '\nthis.D = HGDraft;', ctx); const h = { callWS: async (m) => { calls.push(m); } }; return { D: ctx.D, ctx, h, calls }; };

test('a deferred edit writes nothing until commit', async () => {
  const { D, h, calls } = load(), page = {};
  assert.equal(D.pending(page), false);
  D.defer(page); assert.equal(D.pending(page), true); assert.equal(calls.length, 0);
  assert.equal(await D.commit(page, h), 'build', 'no reload needed'); assert.equal(D.pending(page), false);
});
test('several reload-needing edits give one save and one reload', async () => {
  const { D, h, calls } = load(), page = {};
  D.defer(page, { reload: true }); D.defer(page, { reload: true, dash: { strategy: { a: 1 } } }); D.defer(page, { dash: { strategy: { a: 2 } } });
  assert.equal(calls.length, 0);
  assert.equal(await D.commit(page, h), 'reload');
  assert.equal(calls.length, 1); assert.equal(calls[0].type, 'lovelace/config/save'); assert.deepEqual(calls[0].config.strategy.a, 2);
  assert.equal(await D.commit(page, h), 'build', 'second commit is a no-op'); assert.equal(calls.length, 1);
});
test('cancel discards the draft and the settings state', async () => {
  const { D, ctx, h, calls } = load(), page = {};
  D.defer(page, { reload: true, dash: {} }); D.discard(page);
  assert.equal(D.pending(page), false); assert.equal(ctx.HGLookX.pend, null); assert.equal(ctx.HGLookX.kpend, false);
  assert.equal(await D.commit(page, h), 'build'); assert.equal(calls.length, 0);
});
test('settings actions no longer save or reload on each change', () => {
  for (const [n, s] of [['oss', oss], ['lookr', lr]]) {
    const act = s.slice(s.indexOf('async act(page'));
    assert.doesNotMatch(act.slice(0, act.indexOf('\n  },')), /location\.reload\(\)\, 600|lovelace\/config\/save/, n);
  }
  assert.doesNotMatch(lr.slice(lr.indexOf("a === 'rx-hsave'"), lr.indexOf("a === 'rx-ga'")), /HGL\.save/);
  assert.match(oss, /HGDraft\.defer\(page, \{ reload: true, dash: nc \}\)/);
});
test('edit mode: dirty includes the draft, Cancel asks, leaving the page warns, Done commits once', () => {
  assert.match(ed, /_eDirty\(\) \{ return this\._editing && \(this\._eSnap !== JSON\.stringify\(HGL\.data\) \|\| HGDraft\.pending\(this\)\); \}/);
  assert.match(ed, /a === 'cancel'\) return !this\._eDirty\(\) \|\| window\.confirm/);
  assert.match(ed, /addEventListener\('beforeunload', this\._eUnload\)/);
  assert.match(ed, /HGDraft\.discard\(this\); \}/);
  assert.match(ed, /how = await HGDraft\.commit\(this, this\._hass\)/);
});
test('screensaver, PIN and Assist settings do not autosave during edit mode', () => {
  for (const f of ['hg-wall.part.js', 'hg-assist.part.js']) assert.match(rd(f), /if \(HGL\.editing\) return; clearTimeout\(this\._sv\)/, f);
  assert.doesNotMatch(lr.slice(lr.indexOf("a === 'rx-save'"), lr.indexOf("const H2 = this.hd")), /HGL\.save/);
});
