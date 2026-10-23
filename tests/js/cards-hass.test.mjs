/* #16: component cards in .cmslot slots (stack, grid, HA card added in the editor) get every hass update,
   not only when the host card rerenders (the host's entity list does not include the container's children) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParts, fixture } from './harness.mjs';

const EN = fixture('en');
const stub = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.iterator ? function* () {} : k === 'length' ? 0 : k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : stub()), apply: () => stub(), construct: () => stub() });
function mk() {
  const store = {}, window = new EventTarget();
  class El { constructor() { this.isConnected = false; } attachShadow() { return (this.shadowRoot = { addEventListener() {}, appendChild() {}, querySelectorAll: () => [] }); } dispatchEvent() {} }
  const g = { window, document: stub(), navigator: { languages: ['en'], language: 'en' }, location: { pathname: '/nuvio/x', search: '' },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    HTMLElement: El, customElements: { get() {}, define() {} }, matchMedia: stub(), requestAnimationFrame: () => 0, setInterval: () => 0, MutationObserver: class { observe() {} },
    CustomEvent, Event, fetch: () => Promise.reject(new Error('offline')), getComputedStyle: stub() };
  return loadParts(['hg-i18n.part.js', 'hg-select.part.js', 'hg-oss.part.js', 'hg-core.part.js'], g, ['HGBase'], { EN, MANIFEST: [{ code: 'en', name: 'English', locale: 'en-GB', file: null }], text: [['import.meta.url', 'undefined']] });
}

test('host card forwards hass to slotted component cards even when its own entities did not change', () => {
  const { HGBase } = mk();
  const host = new HGBase(); host._update = () => {};   /* no rerender of the host (its entities are unchanged) */
  const got = [], kid = { parentElement: {}, set hass(h) { got.push(h); } }, gone = { parentElement: null, set hass(h) { throw new Error('detached card updated'); } };
  host._cmM = new Map([['a', kid], ['b', gone]]);
  const h1 = { states: {} }, h2 = { states: { 'light.salon': { state: 'on' } } };
  host.hass = h1; host.hass = h2;
  assert.deepEqual(got, [h1, h2]);
  assert.equal(host.hass, h2);
});
