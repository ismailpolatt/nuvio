/* 2.21.4: {time}/{date} in the view header, tab badges from Look settings, hidden empty sidebar, yield thresholds. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const rd = (p) => readFileSync(new URL('../../src/parts/' + p, import.meta.url), 'utf8');
/* one top-level const statement, cut from the part file */
const grab = (src, name, end = '\n};') => { const i = src.indexOf('const ' + name + ' = '); assert.ok(i >= 0, name); const eol = src.indexOf('\n', i);
  return src.slice(i, src.slice(i, eol).trimEnd().endsWith(';') ? eol : src.indexOf(end, i) + end.length); };
const run = (code, extra = {}) => { const ctx = Object.assign({ window: {} }, extra); vm.createContext(ctx); vm.runInContext(code, ctx); return ctx.window; };

test('{time} and {date} follow HA time_format and locale', () => {
  const W = run(grab(rd('hg-page.part.js'), 'hgClockFill'), { HG_LOC: () => 'en-GB' });
  const d = new Date(2026, 9, 22, 19, 5);
  assert.equal(W.hgClockFill('Hi {time}', { locale: { time_format: '24' } }, d), 'Hi 19:05');
  assert.match(W.hgClockFill('{time}', { locale: { time_format: '12' } }, d), /07:05\s?pm/i);
  assert.match(W.hgClockFill('{date}', {}, d), /Thursday.*22.*October/);
  assert.equal(W.hgClockFill('No clock', {}, d), 'No clock');
});
test('badge option: mode + domain, custom entity list, invalid input dropped', () => {
  const W = run(grab(rd('hg-lookr.part.js'), 'hgBadgeOpt', ' };'));
  assert.deepEqual({ ...W.hgBadgeOpt('on:light') }, { m: 'on', d: 'light' });
  assert.deepEqual({ ...W.hgBadgeOpt('active:media_player') }, { m: 'active', d: 'media_player' });
  assert.deepEqual([...W.hgBadgeOpt('on:@', 'light.a, switch.b  bad').e], ['light.a', 'switch.b']);
  assert.equal(W.hgBadgeOpt('on:@', ''), null);
  assert.equal(W.hgBadgeOpt(''), null);
  assert.equal(W.hgBadgeOpt('x:light'), null);
});
test('strategy: badge resolved from wiz.vx, sidebar hidden only with railHide and no rail views', () => {
  const s = rd('hg-oss.part.js');
  assert.match(s, /const tabBadge = \(p\) =>/);
  assert.match(s, /const railOff = !!\(wiz && wiz\.railHide\);\n  const rail = railOff \? \[\]/, 'railHide hides the rail regardless of per-view switches');
  assert.match(s, /menu: \[\.\.\.\(railOff \? V\.slice\(5\)/, 'views beyond the top tabs stay reachable from the profile menu');
  const p = rd('hg-page.part.js');
  assert.match(p, /toggleAttribute\('norail'/);
  assert.match(p, /_navParam\(\)/);
  assert.match(p, /HGVLock\.page === this && HGVLock\.el\) return;/, 'settings param respects the PIN lock');
});
test('yield thresholds: comma, order, kWh vs kWh per kW', () => {
  const y = rd('cards/yield-card.part.js');
  const W = run(grab(y, 'hgYieldNum').replace('const hgYieldNum', 'window.hgYieldNum = globalThis.hgYieldNum') + '\n' + grab(y, 'hgYieldTh'));
  const th = (c, cap) => { const r = W.hgYieldTh(c, cap); return [r.good, r.poor, r.abs]; };
  assert.deepEqual(th({}, 10), [3.5, 1.5, false]);
  assert.deepEqual(th({ good: '3,5', poor: '2' }, 10), [3.5, 2, false]);
  assert.deepEqual(th({ good: 1, poor: 3 }, 10), [3, 1, false], 'swapped when entered the wrong way round');
  assert.deepEqual(th({ good: 20, poor: 10 }, 10), [20, 10, true], 'daily kWh entered next to reference power');
  assert.deepEqual(th({ good: 20, poor: 10 }, null), [20, 10, true], 'no reference power: thresholds in kWh');
  assert.deepEqual(th({}, null), [3.5, 1.5, false], 'no reference power, no thresholds: relative');
});
test('editor number options accept a decimal comma', () => {
  const W = run(grab(rd('hg-edit.part.js'), 'hgOptVal').replace('const hgOptVal', 'window.hgOptVal'));
  assert.equal(W.hgOptVal({ t: 'num' }, '3,5'), 3.5);
  assert.equal(W.hgOptVal({ t: 'num' }, ' 2 '), 2);
  assert.equal(W.hgOptVal({ t: 'num' }, 'abc'), undefined);
});
