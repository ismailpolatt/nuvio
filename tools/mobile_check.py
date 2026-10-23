#!/usr/bin/env python3
"""Mobile layout check for Nuvio Settings (read-only).

Opens a live Home Assistant dashboard with Nuvio, enters edit mode, opens every
Settings page on phone and tablet sizes, opens every collapsible block, scrolls
each page to the bottom and fails if anything overflows the viewport
(right edge > viewport width, left edge < 0, horizontal scroll) or if the
bottom action bar is covered.

Writes nothing to Home Assistant: config saves, user data writes and service
calls are dropped in the page before they reach the WebSocket.

  NUVIO_URL=https://ha.example NUVIO_TOKEN_FILE=~/.ha_token \\
  python3 tools/mobile_check.py [--dist dist/] [--shots DIR] [--only iphone,android,tablet]

--dist serves the local build instead of the files on the server.
Exit code 1 when any page fails. Needs: pip install playwright;
playwright install webkit chromium
(or NUVIO_CHROME=/path/to/chrome for an installed Chrome).
"""
import argparse, json, os, re, sys
from playwright.sync_api import sync_playwright

PROFILES = {
    'iphone': ('webkit', 'iPhone 13', None),
    'android': ('chromium', None, {'viewport': {'width': 360, 'height': 780}, 'device_scale_factor': 3, 'is_mobile': True, 'has_touch': True}),
    'tablet': ('webkit', None, {'viewport': {'width': 768, 'height': 1024}, 'device_scale_factor': 2, 'is_mobile': True, 'has_touch': True}),
}
BLOCK = """(()=>{const S=WebSocket.prototype.send;WebSocket.prototype.send=function(d){try{const m=JSON.parse(d);if(m&&/save|set_user_data|call_service|delete|create|update/.test(m.type||'')){(window.__nvBlk=window.__nvBlk||[]).push(m.type);return;}}catch(e){}return S.call(this,d)}})()"""
GP = "(()=>{const o=[];const w=(r)=>{for(const n of r.querySelectorAll('*')){if(n.tagName==='NUVIO-PAGE')o.push(n);if(n.shadowRoot)w(n.shadowRoot)}};w(document);return o.find(p=>p.isConnected&&p._built)})()"
# every visible element of the settings sheet (shadow roots included) must stay inside the viewport
PROBE = """(tol)=>{const p=%s, S=p._eSheetEl, sh=S&&S.querySelector('.hge-sheet.lk'); if(!sh) return {err:'no sheet'};
 const vw=window.innerWidth, bad=[]; const all=[]; const w=(r)=>{for(const n of r.querySelectorAll('*')){all.push(n); if(n.shadowRoot) w(n.shadowRoot);}}; w(sh);
 for(const n of all){ const cs=getComputedStyle(n); if(cs.display==='none'||cs.visibility==='hidden') continue; const r=n.getBoundingClientRect(); if(!r.width||!r.height) continue;
   if(n.closest&&n.closest('[data-pg]')&&!n.closest('[data-pg]').offsetParent) continue;
   if(r.right>vw+tol||r.left<-tol){ let cl=false; for(let a=n.parentElement;a&&a!==sh;a=a.parentElement){ if(a.classList.contains('hs-sc')) break; const ox=getComputedStyle(a).overflowX; if(ox==='hidden'||ox==='clip'){ const ar=a.getBoundingClientRect(); if(ar.right<=vw+tol&&ar.left>=-tol){ cl=true; break; } } } if(cl) continue; const nm=(x)=>x.tagName.toLowerCase()+'.'+[...x.classList].join('.'); let pa=n.parentElement||(n.getRootNode().host), ch=[]; for(let i=0;i<3&&pa;i++){ch.push(nm(pa)); pa=pa.parentElement;} bad.push((nm(n)+' < '+ch.join(' < ')).slice(0,140)+' ['+Math.round(r.left)+','+Math.round(r.right)+']'); } }
 const sc=sh.querySelector('.hs-sc'); const de=document.scrollingElement;
 const ov=[]; for(const n of all){ if(n.scrollWidth>n.clientWidth+tol && n.clientWidth>0){ const ox=getComputedStyle(n).overflowX; if(ox==='auto'||ox==='scroll') ov.push((n.tagName.toLowerCase()+'.'+[...n.classList].join('.')).slice(0,60)+' '+n.scrollWidth+'>'+n.clientWidth); } }
 if(de.scrollWidth>de.clientWidth+tol) ov.push('document '+de.scrollWidth+'>'+de.clientWidth);
 const ok=[...sh.querySelectorAll('.hs-f button, .hs-ft button, footer button')].pop(); let cover='';
 if(ok){ const r=ok.getBoundingClientRect(); if(r.bottom>window.innerHeight+tol) cover='action bar below viewport ('+Math.round(r.bottom)+'>'+window.innerHeight+')'; else { const root=ok.getRootNode(); const hit=root.elementFromPoint? root.elementFromPoint(r.left+r.width/2, r.top+r.height/2):null; if(hit&&hit!==ok&&!ok.contains(hit)) cover='action bar covered by '+hit.tagName.toLowerCase()+'.'+[...hit.classList].join('.'); } }
 return {bad:[...new Set(bad)].slice(0,12), nbad:bad.length, ov:ov.slice(0,6), cover, sc: sc? [sc.scrollTop, sc.scrollHeight, sc.clientHeight]:null};}""" % GP

def run(url, token, prof, dist, shots, out):
    eng, dev, opts = PROFILES[prof]
    with sync_playwright() as p:
        bt = getattr(p, eng); b = bt.launch(**({'args': ['--no-sandbox'], **({'executable_path': os.environ['NUVIO_CHROME']} if os.environ.get('NUVIO_CHROME') else {})} if eng == 'chromium' else {}))
        kw = dict(p.devices[dev]) if dev else dict(opts)
        kw.pop('default_browser_type', None)
        ctx = b.new_context(locale='pl-PL', service_workers='block', **kw)
        ctx.add_init_script("localStorage.setItem('hassTokens',JSON.stringify({access_token:%s,token_type:'Bearer',expires_in:1800,hassUrl:%s,clientId:%s,expires:Date.now()+86400000*30,refresh_token:''}));" % (json.dumps(token), json.dumps(url), json.dumps(url + '/')))
        ctx.add_init_script(BLOCK)
        if dist:
            def serve(route):
                fn = route.request.url.split('/hacsfiles/nuvio/')[1].split('?')[0]
                f = os.path.join(dist, fn)
                if os.path.exists(f): return route.fulfill(status=200, content_type='application/json' if fn.endswith('.json') else 'text/javascript', body=open(f, 'rb').read())
                route.continue_()
            ctx.route(re.compile(r'.*/hacsfiles/nuvio/(nuvio\.js|nuvio-core\.[0-9a-f]+\.js|nuvio-version\.json|nuvio-locale-[a-z]+\.[0-9a-f]+\.json).*'), serve)
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
        pg.goto(url + '/dashboard-nuvio/0'); pg.wait_for_function('window.__nuvioL && window.__nuvioL.loaded', timeout=120000); pg.wait_for_timeout(5000)
        ev = lambda js: pg.evaluate('(()=>{const p=' + GP + ';' + js + '})()')
        ev("p._editEnter();p._lkTab='general';p._lkDD='nav';p._eLook()"); pg.wait_for_timeout(2500)
        keys = ev("return [...p._eSheetEl.querySelectorAll('.lk-tabs [role=tab]')].map(b=>b.dataset.k)")
        phone = ev("return getComputedStyle(p._eSheetEl.querySelector('.lk-side')).display!=='none' && p._eSheetEl.querySelector('.hge-sheet.lk').getBoundingClientRect().width<821")
        res = []
        def check(name):
            worst = None
            for step in range(40):
                r = pg.evaluate(PROBE, 1.5)
                if r.get('nbad') or r.get('ov') or r.get('cover') or r.get('err'): worst = r; break
                sc = r['sc']
                if not sc or sc[0] + sc[2] >= sc[1] - 2: break
                ev("const s=p._eSheetEl.querySelector('.hge-sheet.lk .hs-sc');s.scrollTop+=s.clientHeight*0.8"); pg.wait_for_timeout(250)
            ok = worst is None; res.append({'profile': prof, 'page': name, 'ok': ok, **({} if ok else {'detail': worst})})
            print(('PASS ' if ok else 'FAIL ') + prof + ' ' + name + ('' if ok else ' ' + json.dumps(worst, ensure_ascii=False)), flush=True)
        if phone:
            check('nav-list')
            if shots: pg.screenshot(path=os.path.join(shots, f'{prof}-nav.png'))
        for k in keys:
            ev("p._eSheetEl.querySelector('#lkt-%s').click()" % k); pg.wait_for_timeout(1200)
            ev("for(const d of p._eSheetEl.querySelectorAll('.hge-sheet.lk [data-pg=%s] details'))d.open=true; const s=p._eSheetEl.querySelector('.hge-sheet.lk .hs-sc'); s.scrollTop=0" % k); pg.wait_for_timeout(500)
            if shots: pg.screenshot(path=os.path.join(shots, f'{prof}-{k}.png'))
            check(k)
            if shots: pg.screenshot(path=os.path.join(shots, f'{prof}-{k}-end.png'))
            if phone: ev("const b=p._eSheetEl.querySelector('.lk-bk'); b&&b.click()"); pg.wait_for_timeout(400)
        n = pg.evaluate("(window.__nvBlk||[]).filter(t=>/save|set_user_data/.test(t)).length")
        res.append({'profile': prof, 'page': '(no writes)', 'ok': n == 0, 'blocked_writes': n})
        ev("p._editExit(false)"); b.close(); out.extend(res)
        if errs: print('page errors', prof, errs[:5])

def main():
    a = argparse.ArgumentParser(); a.add_argument('--dist'); a.add_argument('--shots'); a.add_argument('--only', default='iphone,android,tablet'); a.add_argument('--json')
    o = a.parse_args(); url = os.environ.get('NUVIO_URL', '').rstrip('/'); tf = os.path.expanduser(os.environ.get('NUVIO_TOKEN_FILE', ''))
    if not url or not tf or not os.path.exists(tf): sys.exit('set NUVIO_URL and NUVIO_TOKEN_FILE')
    token = open(tf).read().strip()
    if o.shots: os.makedirs(o.shots, exist_ok=True)
    out = []
    for pr in o.only.split(','): run(url, token, pr, o.dist, o.shots, out)
    if o.json: json.dump(out, open(o.json, 'w'), indent=1, ensure_ascii=False)
    bad = [r for r in out if not r['ok']]; print(f'{len(out) - len(bad)} passed, {len(bad)} failed'); sys.exit(1 if bad else 0)

if __name__ == '__main__': main()
