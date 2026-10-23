/* Settings v2: sidebar pages, groups, legacy tab keys, every section reachable, search and keyboard wiring. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
const dir = new URL('../../src/parts/', import.meta.url);
const rd = (p) => readFileSync(new URL(p, dir), 'utf8');
const all = () => { const out = []; const walk = (u) => { for (const e of readdirSync(u, { withFileTypes: true })) { if (e.isDirectory()) walk(new URL(e.name + '/', u)); else if (e.name.endsWith('.js')) out.push(readFileSync(new URL(e.name, u), 'utf8')); } }; walk(dir); return out.join('\n'); };
const ed = rd('hg-edit.part.js');
const load = () => { const a = ed.indexOf('const HG_SET_PAGES'), b = ed.indexOf('\n', ed.indexOf('const hgSetPage')); const ctx = { window: {}, hgT: (k) => k }; vm.createContext(ctx); vm.runInContext(ed.slice(a, b) + '\nthis.P = HG_SET_PAGES(); this.G = HG_SET_GROUPS(); this.L = HG_SET_LEGACY; this.f = hgSetPage;', ctx); return ctx; };
const EXPECT = ['general', 'theme', 'bg', 'header', 'home', 'views', 'rooms', 'wall', 'security', 'assist', 'users', 'integrations', 'backup', 'about'];

test('sidebar has every page in a known group, in order', () => {
  const { P, G } = load();
  assert.deepEqual(JSON.parse(JSON.stringify(P.map((p) => p[0]))), EXPECT);
  for (const p of P) { assert.ok(G[p[3]], 'group ' + p[3]); assert.match(p[1], /^mdi:/); assert.equal(p[2], p[0] === 'home' ? 'dashboardx.personalize' : 'settings.pg.' + p[0]); }
});
test('old tab keys still open the right page and missing pages fall back', () => {
  const { f } = load();
  assert.equal(f('look'), 'theme'); assert.equal(f('head'), 'header'); assert.equal(f('bk'), 'backup');
  assert.equal(f('rooms'), 'rooms'); assert.equal(f(undefined), 'general');
  assert.equal(f('users', new Set(['general', 'theme'])), 'general');
});
test('every settings section is assigned to an existing page (no option lost)', () => {
  const src = all(), pages = new Set(EXPECT);
  const secs = [...src.matchAll(/<section[^>]*data-tab=[^>]*>/g)].map((m) => m[0]);
  assert.ok(secs.length >= 15, 'found ' + secs.length);
  const used = new Set();
  for (const s of secs) { const m = s.match(/data-pg="([a-z]+)"/); assert.ok(m, 'no data-pg: ' + s); assert.ok(pages.has(m[1]), m[1]); used.add(m[1]); }
  for (const p of EXPECT.filter((p) => p !== 'about')) assert.ok(used.has(p), 'empty page ' + p);
});
test('search, drill-down and keyboard navigation are wired', () => {
  assert.match(ed, /_eSetFind\(sh, q\)/);
  assert.match(ed, /name="lkq"/);
  const w = ed.slice(ed.indexOf('_eSetWire(S) {'), ed.indexOf('_eAboutHtml('));
  for (const k of ['Escape', 'ArrowDown', 'ArrowUp', 'Home', 'End']) assert.ok(w.includes(k), k);
  assert.match(ed, /role="tab"/); assert.match(ed, /role="tabpanel"/);
  assert.match(ed, /a === 'lkback'/);
  assert.match(rd('hg-page.part.js'), /this\._lkTab = 'rooms'; this\._lkDD = 'page';/);
});
test('per-climate detection is a collapsible advanced block', () => {
  assert.match(rd('hg-lookr.part.js'), /<details class="lk-adv"\$\{src \? ' open' : ''\}>/);
});
test('search matches word prefixes of visible text, ignores CSS and diacritics', () => {
  const a = ed.indexOf('const hgSetNorm'), b = ed.indexOf('\nconst hgSetText'); const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(ed.slice(a, b) + '\nthis.W = hgSetWords; this.M = hgSetMatch;', ctx); const { W, M } = ctx;
  assert.equal(M('Assist Skrót klawiszowy Podpowiedzi spinner opinion pipeline', W('pin')), false);
  assert.equal(M('Blokada PIN-em', W('pin')), true);
  assert.equal(M('PIN i blokady', W('PIN blok')), true);
  assert.equal(M('Wygaszacz ścienny', W('scien')), true);
  assert.equal(M('Złoto', W('zloto')), true);
  assert.equal(M('Économiseur d’écran', W('econom')), true);
  assert.equal(M('anything', W('')), false);
  assert.match(ed, /STYLE\|SCRIPT\|TEMPLATE\|OPTION/, 'style text excluded');
});
