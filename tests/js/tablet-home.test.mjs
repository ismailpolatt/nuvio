import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../../src/parts/hg-page.part.js', import.meta.url), 'utf8');
const body = source.slice(source.indexOf('  _layout() {') + '  _layout() {'.length, source.indexOf('  _hasTiles2()')).trim().replace(/\}$/, '');
function layout(width, height, top = 0, enabled = true, touch = true) {
  const attrs = new Map(), styles = new Map();
  const page = { _config: { tablet_home: enabled, panel: {} }, getBoundingClientRect: () => ({ width, top }),
    _zoom: () => 1, _placeWx() {}, getAttribute: (k) => attrs.get(k), setAttribute: (k, v) => attrs.set(k, v),
    toggleAttribute: (k, v) => v ? attrs.set(k, '') : attrs.delete(k),
    style: { setProperty: (k, v) => styles.set(k, v), removeProperty: (k) => styles.delete(k) } };
  new Function('window', 'navigator', body).call(page, { innerWidth: width, innerHeight: height }, { maxTouchPoints: touch ? 1 : 0 });
  return { attrs, styles };
}
test('landscape overview uses the available height below the Home Assistant header', () => {
  const { attrs, styles } = layout(1120, 700, 48);
  assert.equal(attrs.get('mode'), 'wide'); assert.ok(attrs.has('tablet-home'));
  assert.equal(styles.get('--hg-home-h'), '652px'); assert.equal(styles.get('--hg-tgt'), '44px');
});
test('an open Home Assistant sidebar still allows the landscape home grid', () => {
  const { attrs } = layout(864, 700, 48);
  assert.equal(attrs.get('mode'), 'wide'); assert.ok(attrs.has('tablet-home')); assert.ok(attrs.has('tablet-home-tight'));
});
test('portrait, phones, short windows and an explicit opt-out keep the existing layouts', () => {
  for (const [w, h, on] of [[800, 1280, true], [390, 844, true], [1120, 500, true], [1120, 700, false], [1920, 1080, true]])
    assert.equal(layout(w, h, 0, on).attrs.has('tablet-home'), false, `${w}x${h}, enabled=${on}`);
});

const indBody = source.slice(source.indexOf('  _placeInd() {') + '  _placeInd() {'.length, source.indexOf('  _paintRail(force)')).trim().replace(/\}$/, '');
test('top navigation keeps the active tab visible after page changes without scrolling the page', () => {
  for (const [left, start, expected] of [[500, 0, 304], [20, 300, 16], [120, 0, 0]]) {
    const box = { classList: { contains: () => true }, scrollLeft: start, clientWidth: 300 }, act = { offsetLeft: left, offsetWidth: 100, offsetTop: 4, offsetHeight: 44 }, ind = { style: {} };
    const page = { _config: { navigation: 'top' }, getAttribute: () => 'tablet', _topEl: { querySelector: (s) => s === '.tabs' ? box : s === '.tab.act' ? act : ind } };
    new Function(indBody).call(page);
    assert.equal(box.scrollLeft, expected);
    assert.equal(ind.style.transform, `translate(${left}px, 4px)`);
  }
});
