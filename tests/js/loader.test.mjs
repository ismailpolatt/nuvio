import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORE = 'nuvio-core.abc123.js', FILE = 'nuvio-locale-fr.0123abcd.json';
const render = () => {
  const r = spawnSync(process.env.PYTHON || 'python3', ['-c', "import sys; import tools.build as b; sys.stdout.write(b.LOADER.replace('__V__','1.0.0+abc123').replace('__CORE__','" + CORE + "'))"], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); return r.stdout;
};
let n = 0;
/* runs the real LOADER in a temp dir; returns the event order, the preload record and the fetched urls */
async function run({ stored, languages, version = { build: 'x', core: CORE, locales: { fr: FILE } }, versionFails = false, catalogFails = false, core = CORE }) {
  const dir = mkdtempSync(join(tmpdir(), 'nuvio-loader-'));
  writeFileSync(join(dir, 'package.json'), '{"type":"module"}'); writeFileSync(join(dir, 'nuvio.js'), render());
  const order = [], urls = [];
  globalThis.__order = order;
  writeFileSync(join(dir, core), "globalThis.__order.push('core');");
  const g = globalThis, saved = {};
  const set = (k, v) => { saved[k] = Object.getOwnPropertyDescriptor(g, k); Object.defineProperty(g, k, { value: v, configurable: true, writable: true }); };
  set('window', g); set('navigator', { languages }); set('localStorage', { getItem: (k) => (k === 'nuvio:lang' && stored != null ? stored : null) });
  set('fetch', async (u) => {
    u = String(u); urls.push(u);
    if (u.includes('nuvio-version.json')) { if (versionFails) return { ok: false, status: 500 }; return { ok: true, json: async () => version }; }
    order.push('fetch:' + u.split('/').pop()); if (catalogFails) return { ok: false, status: 404 }; return { ok: true, json: async () => ({ m: { name: 'F', locale: 'fr-FR' }, t: [] }) };
  });
  delete g.__nuvioLoader; delete g.__nuvioI18nPre;
  try {
    await import(pathToFileURL(join(dir, 'nuvio.js')).href + '?n=' + ++n);
    for (let i = 0; i < 50 && !order.includes('core'); i++) await new Promise((r) => setTimeout(r, 10));
    const pre = g.__nuvioI18nPre; return { order, pre, urls, preJson: pre && pre.p ? await pre.p : undefined };
  } finally { for (const k of Object.keys(saved)) { if (saved[k]) Object.defineProperty(g, k, saved[k]); else delete g[k]; } delete g.__order; delete g.__nuvioLoader; delete g.__nuvioI18nPre; }
}
test('stored fr: catalog fetched before core import, file from nuvio-version.json', async () => {
  const r = await run({ stored: 'fr', languages: ['en-US'] });
  assert.ok(r.pre, 'preload exposed'); assert.equal(r.pre.code, 'fr'); assert.equal(r.pre.file, FILE);
  assert.ok(r.order.indexOf('fetch:nuvio-locale-fr.0123abcd.json') >= 0 && r.order.indexOf('fetch:nuvio-locale-fr.0123abcd.json') < r.order.indexOf('core'), r.order.join());
  assert.equal(r.preJson.m.locale, 'fr-FR');
});
test('no stored language, navigator en-US: no preload', async () => {
  const r = await run({ languages: ['en-US'] }); assert.equal(r.pre, undefined); assert.deepEqual(r.order, ['core']);
});
test('navigator fr-FR falls back to the bare language', async () => {
  const r = await run({ languages: ['fr-FR'] }); assert.equal(r.pre.code, 'fr');
});
test('stored language unknown to the build: back to detection', async () => {
  const r = await run({ stored: 'xx-garbage', languages: ['fr'] }); assert.equal(r.pre.code, 'fr');
  const r2 = await run({ stored: 'constructor', languages: ['en'] }); assert.equal(r2.pre, undefined);
});
test('stored en: no preload even if the browser is French', async () => {
  const r = await run({ stored: 'en', languages: ['fr'] }); assert.equal(r.pre, undefined);
});
test('nuvio-version.json unavailable: no preload, own core still loads', async () => {
  const r = await run({ stored: 'fr', languages: ['fr'], versionFails: true }); assert.equal(r.pre, undefined); assert.deepEqual(r.order, ['core']);
});
test('stale loader: newer core from nuvio-version.json, catalog from its file', async () => {
  const core2 = 'nuvio-core.def456.js';
  const r = await run({ stored: 'fr', languages: ['en'], version: { build: 'y', core: core2, locales: { fr: 'nuvio-locale-fr.ffffffff.json' } }, core: core2 });
  assert.equal(r.pre.file, 'nuvio-locale-fr.ffffffff.json'); assert.ok(r.urls.some((u) => u.endsWith('nuvio-locale-fr.ffffffff.json')));
});
test('catalog fetch failure resolves p to null', async () => {
  const r = await run({ stored: 'fr', languages: ['fr'], catalogFails: true }); assert.equal(r.pre.file, FILE); assert.equal(r.preJson, null);
});
