/* ===== Style pulpitu (2.16): gotowe zestawy wyglądu w Ustawienia > Wygląd, każdy z miniaturą pulpitu.
   Styl ustawia akcent, tło i przyciemnienie (te same pola co sekcje poniżej, więc można je potem zmienić) oraz zapisuje HGL.data.app.look,
   od którego zależą tokeny szkła (wypełnienie kart, panelu i kafli, rozmycie) i zaokrąglenia. Tokeny szkła działają tylko z rozmyciem:
   przy rozmyciu wyłączonym (Wydajność) zostaje gęste wypełnienie z motywu, żeby tekst był czytelny. Kolory przez '#' + … i rgb+a(…): tokenizer motywu ich nie zmienia. */
const HG_LK_C = (r, g, b, a) => 'rgb' + `a(${r},${g},${b},${a})`;
const HG_LK_X = (s) => '#' + s;
const HG_LK_BG = (id) => ({ kind: 'image', v: HG_ASSET_P + 'nuvio-bg-' + id + '-wide.webp', v2p: HG_ASSET_P + 'nuvio-bg-' + id + '-portrait.webp' });
const HG_LK_GR = (a, b) => ({ kind: 'gradient', v: HG_LK_X(a), v2: HG_LK_X(b) });
/* g = [jasny, ciemny] wypełnienie szkła [karta, kafel, panel]; r = zaokrąglenia [--r-lg, --r-md, --r-sm]; bl = rozmycie szkła */
const HG_LOOKS = [
  { k: 'nuvio', n: hgTLazy('looks.styles.nuvio.name'), d: hgTLazy('looks.styles.nuvio.description'), acc: '63D71E', bg: null, th: 'dom-w-lesie', dim: 0.4,
    g: [[HG_LK_C(234,238,243,.66), HG_LK_C(255,255,255,.52), HG_LK_C(210,218,226,.30)], [HG_LK_C(255,255,255,.13), HG_LK_C(255,255,255,.12), HG_LK_C(16,22,30,.34)]], def: true },
  { k: 'frost', n: hgTLazy('looks.styles.frost.name'), d: hgTLazy('looks.styles.frost.description'), acc: '4C9BFF', bg: HG_LK_BG('nad-mgla'), th: 'nad-mgla', dim: 0.3, bl: '26px',
    g: [[HG_LK_C(244,248,252,.76), HG_LK_C(255,255,255,.64), HG_LK_C(226,234,244,.40)], [HG_LK_C(205,222,255,.17), HG_LK_C(215,228,255,.15), HG_LK_C(18,28,44,.40)]] },
  { k: 'midnight', n: hgTLazy('looks.styles.midnight.name'), d: hgTLazy('looks.styles.midnight.description'), acc: 'A78BFA', bg: HG_LK_GR('2A1E63', '07081A'), dim: 0.3,
    g: [[HG_LK_C(240,236,255,.70), HG_LK_C(250,248,255,.56), HG_LK_C(220,212,250,.32)], [HG_LK_C(168,150,255,.14), HG_LK_C(178,160,255,.12), HG_LK_C(14,12,40,.42)]] },
  { k: 'sunset', n: hgTLazy('looks.styles.sunset.name'), d: hgTLazy('looks.styles.sunset.description'), acc: 'FF9F43', bg: HG_LK_BG('zachod-slonca'), th: 'zachod-slonca', dim: 0.35,
    g: [[HG_LK_C(255,244,236,.70), HG_LK_C(255,250,246,.56), HG_LK_C(250,226,210,.32)], [HG_LK_C(255,206,170,.14), HG_LK_C(255,214,184,.12), HG_LK_C(40,20,14,.38)]] },
  { k: 'forest', n: hgTLazy('looks.styles.forest.name'), d: hgTLazy('looks.styles.forest.description'), acc: '3DDC97', bg: HG_LK_BG('mglisty-las'), th: 'mglisty-las', dim: 0.4,
    g: [[HG_LK_C(236,246,240,.70), HG_LK_C(248,255,251,.56), HG_LK_C(214,232,222,.32)], [HG_LK_C(180,255,214,.12), HG_LK_C(190,255,222,.11), HG_LK_C(10,26,18,.40)]] },
  { k: 'ocean', n: hgTLazy('looks.styles.ocean.name'), d: hgTLazy('looks.styles.ocean.description'), acc: '2EC4D6', bg: HG_LK_BG('domek-nad-woda'), th: 'domek-nad-woda', dim: 0.35,
    g: [[HG_LK_C(234,246,248,.70), HG_LK_C(246,253,255,.56), HG_LK_C(208,230,236,.32)], [HG_LK_C(160,236,255,.13), HG_LK_C(170,240,255,.12), HG_LK_C(8,26,34,.40)]] },
  { k: 'pastel', n: hgTLazy('looks.styles.pastel.name'), d: hgTLazy('looks.styles.pastel.description'), acc: 'FF6FAE', bg: HG_LK_BG('jasny-salon'), th: 'jasny-salon', dim: 0.25, r: ['36px', '26px', '20px'],
    g: [[HG_LK_C(255,255,255,.74), HG_LK_C(255,255,255,.62), HG_LK_C(255,240,246,.36)], [HG_LK_C(255,214,232,.14), HG_LK_C(255,222,238,.12), HG_LK_C(36,18,28,.38)]] },
  { k: 'graphite', n: hgTLazy('looks.styles.graphite.name'), d: hgTLazy('looks.styles.graphite.description'), acc: 'F5C542', bg: HG_LK_GR('2C2E33', '111215'), dim: 0.2, bl: '6px', r: ['18px', '13px', '10px'],
    g: [[HG_LK_C(246,247,249,.88), HG_LK_C(255,255,255,.80), HG_LK_C(230,232,236,.60)], [HG_LK_C(52,54,60,.80), HG_LK_C(74,76,84,.56), HG_LK_C(22,23,26,.62)]] },
];
const HG_LK_CSS = `
.lk-lks{ display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; }
@media (max-width:760px){ .lk-lks{ grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; } }
.lk-lk{ all:unset; box-sizing:border-box; cursor:pointer; display:flex; flex-direction:column; gap:8px; min-width:0; padding:6px 6px 8px; border-radius:18px; -webkit-tap-highlight-color:transparent;
  transition:background var(--hg-t-base, .2s) var(--hg-ease-out, ease), transform var(--hg-t-base, .2s) var(--hg-ease-out, ease); }
.lk-lk:hover{ background:var(--hg-hover-fill, color-mix(in srgb, currentColor 6%, transparent)); } .lk-lk:active{ transform:scale(.98); }
.lk-lk:focus-visible{ outline:2px solid var(--hg-accent); outline-offset:2px; }
.lk-lp{ position:relative; display:block; aspect-ratio:16 / 10; border-radius:14px; overflow:hidden; isolation:isolate; background:var(--bg) center / cover no-repeat;
  box-shadow:inset 0 0 0 1px color-mix(in srgb, currentColor 10%, transparent); transition:box-shadow var(--hg-t-base, .2s) var(--hg-ease-out, ease); }
.lk-lk[aria-checked=true] .lk-lp{ box-shadow:0 0 0 2px var(--hg-tile-bg), 0 0 0 4px var(--hg-accent); }
.lk-lp::before{ content:''; position:absolute; inset:0; background:var(--dim); }
.lk-lp span{ display:block; box-sizing:border-box; margin:0; padding:0; } .lk-lp > span{ position:absolute; }
.lk-lp .lkp-r{ left:5%; top:12%; bottom:12%; width:7%; border-radius:999px; background:var(--g); box-shadow:inset 0 1px 0 color-mix(in srgb, white 30%, transparent); }
.lk-lp .lkp-r::before{ content:''; position:absolute; left:50%; top:16%; width:46%; aspect-ratio:1; border-radius:50%; transform:translateX(-50%); background:var(--a); }
.lk-lp .lkp-h{ left:17%; top:12%; width:34%; height:6%; border-radius:999px; background:color-mix(in srgb, var(--ink) 85%, transparent); }
.lk-lp .lkp-h2{ top:21%; width:22%; height:4%; opacity:.6; }
.lk-lp .lkp-p{ left:17%; right:5%; top:32%; bottom:12%; padding:4%; border-radius:var(--rr); background:var(--p); display:grid; grid-template-columns:repeat(3, 1fr); grid-template-rows:repeat(2, 1fr); gap:8%;
  -webkit-backdrop-filter:var(--hg-bfo, blur(var(--bl))); backdrop-filter:var(--hg-bfo, blur(var(--bl))); }
.lk-lp .lkp-p span{ border-radius:calc(var(--rr) * .6); background:var(--t); box-shadow:inset 0 1px 0 color-mix(in srgb, white 30%, transparent); }
.lk-lp .lkp-p span:first-child{ background:var(--a); } .lk-lp .lkp-p span:first-child::after{ content:''; display:block; margin:14% 0 0 14%; width:22%; aspect-ratio:1; border-radius:50%; background:var(--on); opacity:.75; }
.lk-ll{ display:flex; align-items:center; gap:6px; min-width:0; padding:0 4px; font-size:13px; font-weight:600; } .lk-ll ha-icon{ --mdc-icon-size:16px; width:16px; height:16px; color:var(--hg-accent-tx, var(--hg-accent)); flex:none; }
.lk-ll span{ display:flex; flex-direction:column; min-width:0; } .lk-ll small{ font-size:11.5px; font-weight:400; opacity:.65; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
@media (prefers-reduced-motion:reduce){ .lk-lk, .lk-lp{ transition:none; } .lk-lk:active{ transform:none; } }
`;
const HGLooks = window.HGLooks = {
  get(k) { return HG_LOOKS.find((x) => x.k === k) || null; },
  /* tokeny wybranego stylu dla HGApp.apply: { r: kształt (zawsze), light / dark: szkło (tylko z rozmyciem) }; styl domyślny = brak zmian */
  vars(k) { const L = this.get(k); if (!L || L.def) return null; const gl = ([c, t, p]) => Object.assign({ '--hg-glass-bg': c, '--hg-tile-bg': t, '--hg-panel-bg': p }, L.bl ? { '--hg-glass-blur': L.bl } : {});
    return { r: L.r ? { '--r-lg': L.r[0], '--r-md': L.r[1], '--r-sm': L.r[2], '--hg-radius': L.r[0], '--hg-radius-in': L.r[1] } : {}, light: gl(L.g[0]), dark: gl(L.g[1]) }; },
  thumb(L) { const b = L.bg; if (L.th) return `url("${HG_ASSET}nuvio-bg-${L.th}-thumb.webp")`; return b ? `linear-gradient(160deg, ${b.v}, ${b.v2})` : 'none'; },
  html(page) { const A = HGApp.get(), cur = A.look && this.get(A.look) ? A.look : 'nuvio', dk = document.documentElement.getAttribute('data-hg-scheme') === 'dark', T = (x) => HGApp.tokens(HG_LK_X(x.acc));
    const ck = H.icon('mdi:check-circle'), card = (L) => { const g = L.g[dk ? 1 : 0], t = T(L), on = cur === L.k, rr = L.r ? L.r[0] : '31px';
      const st = `--bg:${this.thumb(L)};--a:${HG_LK_X(L.acc)};--on:${t.light['--hg-on-accent']};--g:${g[0]};--t:${g[1]};--p:${g[2]};--bl:${L.bl ? parseFloat(L.bl) / 4 : 3.5}px;--rr:calc(${rr} / 3.2);--ink:${dk ? HG_LK_X('FFFFFF') : HG_LK_X('1C1C1E')};--dim:${dk ? HG_LK_C(6, 8, 12, (L.dim * 0.55).toFixed(2)) : 'transparent'}`;
      return `<button type="button" class="lk-lk" role="radio" data-hge="lk-look" data-v="${L.k}" aria-checked="${on}" style="${H.esc(st)}"><span class="lk-lp" aria-hidden="true"><span class="lkp-r"></span><span class="lkp-h"></span><span class="lkp-h lkp-h2"></span><span class="lkp-p">${'<span></span>'.repeat(6)}</span></span>
        <span class="lk-ll">${on ? ck : ''}<span>${H.esc(L.n)}<small>${H.esc(L.d)}</small></span></span></button>`; };
    return `<section class="lk-g" data-tab="look" data-pg="theme"><style>${HG_LK_CSS}</style><h4>${H.icon('mdi:palette-swatch-outline')}${hgT('looks.dashboard_style')}</h4>
      <small class="lk-hn">${hgT('looks.a_ready_made_set')}</small>
      <div class="lk-lks" role="radiogroup" aria-label="${H.esc(hgT('looks.dashboard_style'))}">${HG_LOOKS.map(card).join('')}</div></section>`; },
  act(page, b, a) { if (a !== 'lk-look') return; const L = this.get(b.dataset.v); if (!L) return;
    page._eApp((A) => { if (L.def) delete A.look; else A.look = L.k; A.accent = HG_LK_X(L.acc); if (L.bg) A.bg = Object.assign({}, L.bg); else delete A.bg; A.dim = L.dim; });
    page._eToast(hgT('looks.style_toast', { name: L.n })); return page._eLook(); },
};
