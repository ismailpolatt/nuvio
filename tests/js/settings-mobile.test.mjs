/* 2.22.1: Settings on phones and narrow tablets: one full-width column, no horizontal overflow, stacked views table. Live check: tools/mobile_check.py. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const rd = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
const ed = rd('src/parts/hg-edit.part.js'), lr = rd('src/parts/hg-lookr.part.js');
test('narrow settings use one column with the sidebar and the page in the same row', () => {
  assert.match(ed, /@media \(max-width:820px\)\{ \.hge-sheet\.lkt\{ grid-template-columns:minmax\(0, 1fr\); grid-template-rows:auto minmax\(0, 1fr\) auto; \}\s*\.hge-sheet\.lkt > \.lk-side, \.hge-sheet\.lkt > \.lk-sc\{ grid-row:2; grid-column:1; \}/);
  assert.match(ed, /:host\(\[mode=phone\]\) \.hge-sheet\.lkt > \.lk-side, :host\(\[mode=phone\]\) \.hge-sheet\.lkt > \.lk-sc\{ grid-row:2; grid-column:1; \}/);
  assert.match(ed, /\.lkt \.lk-sc\{ overflow-x:hidden;/);
  assert.match(ed, /padding-bottom:max\(10px, env\(safe-area-inset-bottom\)\)/);
});
test('views table and pickers cannot push the page wider than the screen', () => {
  assert.match(lr, /\.rx-vx\{ grid-template-columns:repeat\(2, minmax\(0, 1fr\)\);/);
  assert.doesNotMatch(lr, /grid-template-columns:1fr 1fr/);
  assert.match(lr, /\.rx \.rx-fu > \.hgs-t, \.rx \.rx-add > input\{ flex:1 1 160px; width:auto; min-width:0; max-width:100%; \}/);
  assert.match(ed, /\.lkt \.lk-sc \.hgs-t\{ min-width:0; max-width:100%; \}/);
});
test('the live mobile check exists and covers iPhone, Android and tablet', () => {
  const t = rd('tools/mobile_check.py');
  for (const k of ["'iPhone 13'", "'width': 360, 'height': 780", "'width': 768, 'height': 1024", 'scrollWidth', 'elementFromPoint']) assert.ok(t.includes(k), k);
});
