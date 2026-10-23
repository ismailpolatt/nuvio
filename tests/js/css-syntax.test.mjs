/* Stray "};" inside a CSS rule (issue #34): the browser drops everything up to the next block, including the following rule. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const dir = new URL('../../src/parts/', import.meta.url);
const files = (u) => readdirSync(u, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(new URL(d.name + '/', u)) : d.name.endsWith('.part.js') ? [new URL(d.name, u)] : []));
/* ${...} interpolations removed (nested braces once), then a declaration right after "};" on a CSS line */
const strip = (l) => l.replace(/\$\{(?:[^{}]|\{[^{}]*\})*\}/g, 'X');
test('no declarations after a closed CSS rule ("}; prop:")', () => {
  const bad = [];
  for (const f of files(dir)) readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    const s = strip(l); if (/^\s*(?:[.:#@*\[]|[a-z][a-z0-9-]*[\s.:#\[{,>])[^`]*\{[^{}]*\}\s*;\s*[a-z-]+\s*:[^:]/i.test(s) && !/=>|\breturn\b|\bconst\b|\bif\s*\(/.test(s)) bad.push(f.pathname.split('/src/')[1] + ':' + (i + 1));
  });
  assert.deepEqual(bad, []);
});
test('wall clock: the next event row keeps full opacity (#34)', () => {
  const s = readFileSync(new URL('hg-wall.part.js', dir), 'utf8');
  assert.match(s, /\.nw-e li\.nx \.nw-et, \.nw-k li\.nx \.nw-et\{ opacity:1; \}/);
  assert.doesNotMatch(s, /text-transform:uppercase; \}; /);
});
