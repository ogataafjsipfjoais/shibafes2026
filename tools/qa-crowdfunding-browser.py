"""Headless real-browser QA for the crowdfunding S-320 3D experience."""
import functools
import json
import os
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-artifacts'
OUT.mkdir(exist_ok=True)

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/crowdfunding/'
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(375,812),(375,667),(1440,900)]:
        context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='no-preference')
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(url,wait_until='domcontentloaded',timeout=40000)
        page.wait_for_timeout(1800)
        button=page.locator('.flight-beat[data-flight-beat="0"] a[href*="camp-fire.jp"]').first
        assert button.count()==1,f'Missing first-screen support button at {width}x{height}'
        bounds=button.bounding_box()
        assert bounds is not None,f'First-screen support button not visible at {width}x{height}'
        visible=0 <= bounds['y'] and bounds['y']+bounds['height'] <= height+1
        overhang=page.evaluate("""() => ({
          width:window.innerWidth, scrollWidth:document.documentElement.scrollWidth,
          offenders:Array.from(document.querySelectorAll('body *')).filter(el=>{
            const r=el.getBoundingClientRect();
            return r.width>0 && (r.right>innerWidth+2 || r.left < -2);
          }).slice(0,15).map(el=>({tag:el.tagName,cls:String(el.className).slice(0,75),text:(el.textContent||'').slice(0,35),left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)}))
        })""")
        overflow=overhang['scrollWidth'] > overhang['width'] + 1
        poster=page.locator('.flight-poster')
        poster_loaded=poster.evaluate('(img) => img.complete && img.naturalWidth > 0')
        page.screenshot(path=str(OUT/f'crowdfunding-{width}x{height}-first.png'))
        # Programmatic scrolling checks real scroll-linked story switching.
        def goto_progress(progress):
            page.evaluate("""progress => {
              const el=document.querySelector('#flight-experience');
              const max=Math.max(1,el.getBoundingClientRect().height-innerHeight);
              window.scrollTo({top:el.offsetTop+max*progress,behavior:'instant'});
            }""",progress)
            page.wait_for_timeout(600)
            return page.locator('.flight-beat.is-current').get_attribute('data-flight-beat')
        mid=goto_progress(.50)
        last=goto_progress(.88)
        page.screenshot(path=str(OUT/f'crowdfunding-{width}x{height}-third.png'))
        # 3D model may fall back on browsers without GPU/CDN. Record which occurred.
        try:
            page.wait_for_function("document.querySelector('#flight-experience').classList.contains('flight-ready') || document.querySelector('#flight-experience').classList.contains('flight-fallback')",timeout=25000)
            scene_state=page.locator('#flight-experience').get_attribute('class')
        except Exception:
            scene_state='UNRESOLVED'
        launch_verified=False
        if 'flight-ready' in scene_state:
            launch=page.locator('#flight-launch')
            assert launch.is_visible(), f'3D launch control hidden at {width}x{height}'
            hit=launch.evaluate("""e => {
              const r=e.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;
              const target=document.elementFromPoint(x,y);
              const rect=document.getElementById('flight-experience').getBoundingClientRect();
              return {button:{x:r.x,y:r.y,w:r.width,h:r.height},center:{x,y},target:target&&{tag:target.tagName,cls:target.className,id:target.id},scrollY,root:{top:rect.top,bottom:rect.bottom},style:{position:getComputedStyle(e).position,pointerEvents:getComputedStyle(e).pointerEvents},lenis:!!window.Lenis};
            }""")
            print(json.dumps(dict(width=width,launchHit=hit),ensure_ascii=False),flush=True)
            launch.click(timeout=7000)
            page.wait_for_timeout(3500)
            launch_verified=page.locator('#flight-launch-message').evaluate("e => e.classList.contains('is-shown')")
            page.screenshot(path=str(OUT/f'crowdfunding-{width}x{height}-launched.png'))
        result=dict(width=width,height=height,firstButton=bounds,ctaVisibleInitially=visible,horizontalOverflow=overflow,overhang=overhang,posterLoaded=poster_loaded,midBeat=mid,finalBeat=last,flightState=scene_state,launchVerified=launch_verified,pageErrors=errors)
        results.append(result)
        print(json.dumps(result,ensure_ascii=False))
        assert visible, f'CTA outside first viewport: {width}x{height}'
        assert not overflow, f'Horizontal overflow: {width}x{height}'
        assert poster_loaded, f'Fallback image not loaded: {width}x{height}'
        assert mid=='1' and last=='2', f'Flight beats did not change on scroll at {width}x{height}: {mid}/{last}'
        assert launch_verified, f'3D launch animation did not finish at {width}x{height}'
        assert not errors, f'JavaScript page errors: {errors}'
        context.close()
    browser.close()
server.shutdown()
(OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('PASS: three actual viewport sizes, CTA first-screen, no overflow, image loaded, phase transitions, no page errors')
