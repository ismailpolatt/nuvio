/* ===== blokada widoku PIN-em (#17): wybrane widoki (np. Kamery) pytają o PIN przed pokazaniem treści.
   Ten sam PIN co blokada wygaszacza (zapisany tylko skrót). To wygoda (dzieci, goście przy tablecie), nie zabezpieczenie:
   dane widoku i tak są w Home Assistant, a kto ma konto HA, zobaczy je w innym dashboardzie. Odblokowanie trzyma się w tej karcie przeglądarki przez 5 minut. ===== */
const HGVLock = window.__hgVLock || (window.__hgVLock = {
  KEEP: 5 * 60000, SK: 'nuvio:vlock-open',
  list() { const w = (window.__hgL && window.__hgL.data && window.__hgL.data.wall) || {}; return Array.isArray(w.vlock) ? w.vlock.filter((v) => typeof v === 'string' && /^[a-z0-9_-]{1,40}$/.test(v)) : []; },
  pinH() { return window.HGWall ? HGWall.get().pinH : ''; },
  on(view) { return !!view && !!this.pinH() && this.list().includes(view); },
  _open() { try { return JSON.parse(sessionStorage.getItem(this.SK) || '{}') || {}; } catch (e) { return {}; } },
  isOpen(view) { const t = this._open()[view]; return !!t && Date.now() - t < this.KEEP; },
  mark(view) { const o = this._open(); if (view) o[view] = Date.now(); else for (const k of Object.keys(o)) delete o[k]; try { sessionStorage.setItem(this.SK, JSON.stringify(o)); } catch (e) { /* bez pamięci sesji: PIN przy każdym wejściu */ } },
  /* wywoływane przy pokazaniu widoku (budowa, podłączenie, powrót z ukrycia) */
  guard(page) { const c = page && page._config, v = c && c.view;
    if (!this.on(v) || page._editing || this.isOpen(v)) { if (page && page.hasAttribute('vlocked')) page.removeAttribute('vlocked'); if (this.el && this.page === page) this.close(); return; }
    page.setAttribute('vlocked', ''); this.page = page; this.view = v; if (!this.el) this.show(); },
  show() { const W = window.HGWall; if (!W) return; const n = W.get().pinN;
    const el = this.el = document.createElement('div'); el.className = 'nw pin vl'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', hgT('vlock.title')); el.tabIndex = -1;
    el.innerHTML = `<style>${HG_WALL_SS}.nw.vl{ cursor:default; background:rgba(5,7,11,.82); -webkit-backdrop-filter:blur(24px); backdrop-filter:blur(24px); }</style>`;
    const pp = W.padEl(hgT('vlock.title'), hgT('vlock.back')); el.appendChild(pp);
    pp.querySelector('.nw-pt > span:not(.nw-li)').textContent = hgT('vlock.enter_pin');
    this._pin = ''; this._n = n;
    pp.addEventListener('pointerdown', (e) => { e.stopPropagation(); const b = e.target.closest('button'); if (!b) return; e.preventDefault(); b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120); this.key(b.dataset.k); });
    el.addEventListener('keydown', (e) => { e.stopPropagation(); if (/^[0-9]$/.test(e.key)) this.key(e.key); else if (e.key === 'Backspace') this.key('del'); else if (e.key === 'Escape') this.key('lock'); });
    document.body.appendChild(el); try { el.popover = 'manual'; el.showPopover(); } catch (e) { /* z-index wystarczy */ }
    this.dots(); requestAnimationFrame(() => { el.classList.add('in'); el.focus({ preventScroll: true }); }); },
  dots(st) { const d = this.el && this.el.querySelector('.nw-dots'); if (!d) return; const N = Math.max(this._n || 4, this._pin.length);
    d.className = 'nw-dots' + (st ? ' ' + st : ''); d.innerHTML = Array.from({ length: N }, (_, i) => `<i class="${i < this._pin.length ? 'on' : ''}" style="--i:${i}"></i>`).join(''); },
  msg(t) { const s = this.el && this.el.querySelector('.nw-pt small'); if (s) { s.textContent = t || ''; s.classList.toggle('err', !!t); } },
  key(k) { if (!this.el) return;
    if (k === 'lock') return this.leave();
    const wait = (this._ban || 0) - Date.now(); if (wait > 0) return this.msg(hgT('wall.try_again_in', { seconds: Math.ceil(wait / 1000) }));
    if (k === 'del') { this._pin = this._pin.slice(0, -1); this.msg(''); return this.dots(); }
    if (!/^[0-9]$/.test(k) || this._pin.length >= 8) return;
    this._pin += k; this.msg(''); this.dots(); if (this._pin.length < this._n) return;
    if (HGWall.hash(this._pin) === this.pinH()) { this._bad = 0; this.mark(this.view); const p = this.page; this.close(); if (p) p.removeAttribute('vlocked'); return; }
    this._bad = (this._bad || 0) + 1; this._pin = ''; this.dots('bad');
    if (this._bad >= 5) { const s = 30 * Math.pow(2, Math.min(4, Math.floor(this._bad / 5) - 1)); this._ban = Date.now() + s * 1000; this.msg(hgT('wall.too_many_attempts', { seconds: s })); } else this.msg(hgT('wall.wrong_pin')); },
  /* rezygnacja: poprzedni widok (albo pierwszy widok dashboardu) */
  leave() { const p = this.page; this.close(); const seg = location.pathname.split('/');
    if (history.length > 1) history.back(); else { history.replaceState(null, '', '/' + seg[1]); window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: true } })); }
    if (p) setTimeout(() => { if (p.isConnected && !p._hgHidden && p._ownPath && p._ownPath()) this.guard(p); }, 600); },
  close() { const el = this.el; this.el = null; this._pin = ''; if (el) { try { el.hidePopover(); } catch (e) { /* */ } el.remove(); } },
  /* ---- ustawienia: sekcja w Trybie tabletu (ten sam PIN) ---- */
  html(views) { const L = this.list(), has = !!this.pinH();
    const rows = views.map(([v, n]) => `<button type="button" class="wl-sw" role="switch" data-hge="wl-vlock" data-v="${H.esc(v)}" aria-checked="${L.includes(v)}"><span>${H.esc(n)}<small>${L.includes(v) ? hgT('vlock.locked') : hgT('vlock.open')}</small></span><i aria-hidden="true"></i></button>`).join('');
    return `<div class="wl-f" role="group" aria-labelledby="vl-h"><span id="vl-h">${hgT('vlock.settings_title')}<b class="wl-beta">${hgT('wall.beta')}</b></span>
      <small class="lk-hn">${has ? hgT('vlock.settings_hint') : hgT('vlock.needs_pin')}</small>${has ? '' : this.pinHtml()}${rows}</div>`; },
  /* widoki do wyboru: włączone w dashboardzie, bez Panelu (blokada strony startowej zamknęłaby cały dashboard) */
  views() { const V = window.HGLookX && HGLookX.views ? HGLookX.views() : { order: [], on: new Set() }, CU = ((window.__hgL && window.__hgL.data && window.__hgL.data.wiz) || {}).custom || [];
    const nm = (v) => { const c = CU.find((x) => x.p === v); if (c) return c.n || v; const d = typeof HG_VIEW_DEF !== 'undefined' && HG_VIEW_DEF.find((x) => x[0] === v); return d ? String(d[1]) : v; };
    return V.order.filter((v) => v !== 'dashboard' && V.on.has(v)).map((v) => [v, nm(v)]); },
  /* bez PIN-u: pole do ustawienia PIN-u od razu tutaj (ten sam zapis co w blokadzie wygaszacza) */
  pinHtml() { return `<div class="wl-pin vl-pin"><span class="hs-s">${H.icon('mdi:dialpad')}<input class="hs-in" name="wl-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="new-password" placeholder="••••" aria-label="${hgT('wall.new_pin')}"></span><button type="button" class="wl-tb" data-hge="wl-pin">${H.icon('mdi:content-save-outline')}<span>${hgT('common.save')}</span></button></div>`; },
  toggle(v) { const L = this.list(), i = L.indexOf(v); if (i >= 0) L.splice(i, 1); else L.push(v); HGWall.set({ vlock: L }); },
});
window.HGVLock = HGVLock;
