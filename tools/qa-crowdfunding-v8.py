"""Full-screen four-gate flight QA: real pointer play, accessible skip and fallback."""
import functools,json,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-artifacts'
OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/crowdfunding/'
results=[]
GATES=[(.63,.50),(.17,.32),(.85,.65),(.22,.40)]
try:
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-angle=swiftshader','--use-gl=angle'])
        for width,height in [(375,667),(375,812),(768,1024),(1440,900)]:
            ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,ignore_https_errors=True,reduced_motion='no-preference')
            page=ctx.new_page()
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            resp=page.goto(url,wait_until='domcontentloaded',timeout=55000)
            assert resp and resp.status==200,f'HTML not available: {width}x{height}'
            page.wait_for_function('window.TBTFlight !== undefined',timeout=30000)
            start=page.locator('#start')
            assert start.is_visible(),f'No intro at {width}'
            cta=page.locator('#takeoff')
            box=cta.bounding_box()
            assert box and box['height']>=44,f'Insufficient takeoff target: {width}'
            assert box['y']>=0 and box['y']+box['height']<=height+1,f'Takeoff outside initial screen: {width} {box}'
            assert page.locator('.small-donate').is_visible(),f'Support link hidden: {width}'
            overflow=page.evaluate('document.documentElement.scrollWidth - innerWidth')
            assert overflow<=1,f'Horizontal overflow {width}: {overflow}'
            page.screenshot(path=str(OUT/f'gate-{width}x{height}-intro.png'))
            ready=page.evaluate('TBTFlight.ready')
            assert ready,f'Three.js/WebGL scene not ready on {width}x{height}'
            cta.click()
            assert page.locator('#hud').is_visible(),f'HUD unavailable at {width}'
            assert page.evaluate('TBTFlight.mode')=='flying',f'Not flying at {width}'
            stage=page.locator('#scene').bounding_box()
            def steer(point):
                x,y=point
                page.mouse.move(stage['x']+stage['width']*x,stage['y']+stage['height']*y,steps=5)
            # Every viewport verifies real pointer steering and an actual gate collision.
            steer(GATES[0])
            page.wait_for_function('TBTFlight.passed >= 1',timeout=25000)
            assert page.locator('#chapter-title').inner_text().startswith('180.67m'),f'Gate 1 narrative missing: {width}'
            page.screenshot(path=str(OUT/f'gate-{width}x{height}-flight.png'))
            if width==1440:
                # The desktop test completes all four gates by actual pointer movement.
                for i in range(1,4):
                    steer(GATES[i])
                    page.wait_for_function(f'TBTFlight.passed >= {i+1}',timeout=32000)
                page.wait_for_function('TBTFlight.mode === "complete"',timeout=12000)
                assert page.locator('#finale').is_visible(),'Four gates did not lead to finale'
                assert page.locator('#replay').is_visible(),'Replay absent'
                page.screenshot(path=str(OUT/f'gate-{width}x{height}-finale.png'))
                page.locator('#replay').click()
                assert page.evaluate('TBTFlight.mode')=='flying','Replay did not reset'
                assert page.evaluate('TBTFlight.passed')==0,'Replay did not reset counters'
            else:
                page.locator('#pause').click()
                assert page.locator('#pause-panel').is_visible(),'Pause panel absent'
                page.locator('#resume').click()
                assert page.locator('#hud').is_visible(),'Pause did not resume'
                page.locator('#skip').click()
                assert page.locator('#finale').is_visible(),'Skip did not open finale'
            assert page.locator('#finale .primary-btn').count()==1,'Final support CTA missing'
            assert not errors,f'JavaScript errors at {width}: {errors}'
            result={'viewport':f'{width}x{height}','webgl':ready,'passed':4 if width==1440 else 1,'supportVisible':True,'overflow':overflow,'pageErrors':errors}
            print(json.dumps(result,ensure_ascii=False),flush=True)
            results.append(result)
            ctx.close()
        # Reduced-motion visitors must get an actual, readable non-WebGL route.
        ctx=browser.new_context(viewport={'width':375,'height':812},reduced_motion='reduce')
        page=ctx.new_page()
        page.goto(url,wait_until='domcontentloaded',timeout=50000)
        page.wait_for_function('window.TBTFlight !== undefined',timeout=25000)
        assert not page.evaluate('TBTFlight.ready'),'Reduced motion should not initialize animation'
        page.locator('#takeoff').click()
        assert page.locator('#info').is_visible(),'Reduced-motion story fallback unavailable'
        page.locator('#return-flight').click()
        assert page.locator('#finale').is_visible(),'Cannot reach support with reduced motion'
        ctx.close()
        # CDN failure must not strand visitors with a nonworking takeoff.
        ctx=browser.new_context(viewport={'width':375,'height':812})
        page=ctx.new_page()
        page.route('**/assets/crowdfunding/vendor/three-r128.min.js',lambda route:route.abort())
        page.goto(url,wait_until='domcontentloaded',timeout=50000)
        page.wait_for_function('window.TBTFlight !== undefined',timeout=25000)
        assert not page.evaluate('TBTFlight.ready'),'Forced engine asset outage unexpectedly initialized 3D'
        page.locator('#takeoff').click()
        assert page.locator('#info').is_visible(),'No fallback when vendored Three.js is missing'
        assert page.locator('#info a[href*="camp-fire.jp"]').count()>=1,'Fallback lost support link'
        ctx.close()
        browser.close()
finally:
    server.shutdown()
(OUT/'four-gates-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('FOUR GATES CHROMIUM PASS: four gates, steering, restart, touch-sized UI, skip, reduced motion and CDN fallback')
