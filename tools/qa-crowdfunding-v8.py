"""Chromium QA: one S-320 automatic flight scene, concise records and support on 4 viewports."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from pathlib import Path
import functools,json,threading

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-artifacts';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/crowdfunding/'
results=[]
try:
 with sync_playwright() as play:
  browser=play.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-angle=swiftshader','--use-gl=angle'])
  for width,height in [(375,667),(375,812),(768,1024),(1440,900)]:
   ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='no-preference',bypass_csp=True)
   page=ctx.new_page();errors=[];console=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
   resp=page.goto(URL,wait_until='domcontentloaded',timeout=45000)
   assert resp and resp.status==200,f'HTML unavailable: {width}'
   assert page.locator('h1').is_visible(),f'Hero hidden: {width}'
   assert page.locator('h1').inner_text().replace('\n','')=='次の機体は、あなたの支援で飛ぶ。',f'Wrong headline: {width}'
   assert page.locator('.hero-photo').evaluate('img=>img.complete&&img.naturalWidth>0'),f'Hero photo failed: {width}'
   assert page.locator('.sitebar .support-small').is_visible(),f'Immediate support access missing: {width}'
   assert page.locator('#takeoff').count()==0,f'Click-gated takeoff remains at {width}'
   overflow=page.evaluate('document.documentElement.scrollWidth-innerWidth')
   assert overflow<=1,f'Horizontal overflow {width}: {overflow}'
   page.screenshot(path=str(OUT/f'scroll-{width}x{height}-hero.png'))
   # Optional pilot experience: the real S-320 starts on a reconstructed Lake Biwa launch tower.
   if width in (375,1440):
    # Eager loading means the actual aircraft must be ready with no click or scroll.
    assert page.evaluate('window.scrollY') == 0,'Hero should remain in view before pilot loads'
    page.wait_for_function('window.TBTVenueFlight && TBTVenueFlight.ready',timeout=45000)
    preflight=page.evaluate('TBTVenueFlight')
    assert preflight['mode']=='preview' and preflight['passed']==0,'Takeoff should not auto-start'
    assert abs(preflight['modelYaw']-3.141592653589793)<.001,'Aircraft nose still points opposite the -Z flight direction'
    assert page.evaluate('window.scrollY') == 0,'Automatic loading must not scroll the page'
    page.locator('#pilot-stage').scroll_into_view_if_needed()
    page.wait_for_function('window.TBTVenueFlight && ["takeoff","flying","holding","looping"].includes(TBTVenueFlight.mode)',timeout=12000)
    assert page.locator('#pilot-begin').count()==0,'Takeoff button must not exist'
    assert page.locator('#pilot-hud').is_visible(),'Automatic flight HUD not visible'
    page.wait_for_function('window.TBTVenueFlight !== undefined',timeout=10000)
    page.wait_for_function('TBTVenueFlight.ready || TBTVenueFlight.mode === "unavailable"',timeout=45000)
    pilot=page.evaluate('TBTVenueFlight')
    assert pilot['ready'],f'Lake Biwa pilot could not initialize: {width} {pilot}; '+page.locator('#pilot-loading').inner_text()+' errors='+str(errors)
    assert pilot['aircraft'].endswith('s320-mobile.glb' if width<760 else 's320-desktop.glb'),f'Wrong pilot model: {pilot}'
    page.wait_for_function("parseFloat(getComputedStyle(document.querySelector('#pilot-canvas')).opacity) > 0.98",timeout=5000)
    page.screenshot(path=str(OUT/f'pilot-{width}x{height}-deck.png'))
    assert page.evaluate('TBTVenueFlight.mode') in ('takeoff','flying','holding','looping'),'Flight failed to auto-start after scrolling into view'
    assert page.locator('#pilot-repeat').count()==0,'Old replay button unexpectedly shown'
    assert page.locator('#pilot-finish').count()==0,'Blocking finish overlay unexpectedly shown'
    assert page.locator('#pilot-support').get_attribute('href')=='https://camp-fire.jp/projects/990337/view','Persistent support link missing'
    canvas_box=page.locator('#pilot-canvas').bounding_box()
    assert canvas_box,'Pilot canvas absent'
    if width==375:
     # Actual manual steering remains available; autoplay resumes after idle.
     page.mouse.move(canvas_box['x']+canvas_box['width']*.50,canvas_box['y']+canvas_box['height']*.48,steps=6)
    page.wait_for_function('TBTVenueFlight.passed >= 1',timeout=23000)
    assert page.locator('#pilot-story-title').inner_text().startswith('180.67m'),'First gate story did not change'
    page.screenshot(path=str(OUT/f'pilot-{width}x{height}-flight.png'))
    if width==1440:
     # Hands-free continuation must pass all 4 gates, then take off again.
     # No clicking, fake time, or artificial gate state injection.
     page.wait_for_function('TBTVenueFlight.passed >= 4',timeout=85000)
     assert page.locator('#pilot-hud').is_visible(),'4th gate hid the in-flight support HUD'
     page.screenshot(path=str(OUT/f'pilot-{width}x{height}-fourth-gate.png'))
     page.wait_for_function('TBTVenueFlight.loops >= 1',timeout=17000)
     restarted=page.evaluate('TBTVenueFlight')
     assert restarted['passed'] < 4 and restarted['mode'] in ('takeoff','flying','holding'),'Automatic replay did not reset gate sequence'
     assert page.locator('#pilot-hud').is_visible(),'In-flight HUD missing on next lap'
     page.wait_for_function('TBTVenueFlight.loops >= 1 && TBTVenueFlight.passed >= 1',timeout=24000)
     page.screenshot(path=str(OUT/f'pilot-{width}x{height}-second-flight.png'))
    page.locator('#pilot-quit').click()
    assert page.evaluate('TBTVenueFlight.mode')=='stopped','Pilot did not stop without a click-gated restart'
   # Duplicate S-320 scroll viewer and repeated chapters have been removed.
   assert page.locator('canvas').count()==1,f'Duplicate WebGL canvas at {width}'
   assert page.locator('#flight-stage').count()==0,f'Repeated 3D exhibit at {width}'
   assert page.locator('script[src*="scroll-flight-v1.js"]').count()==0,f'Old viewer loaded at {width}'
   assert page.locator('.chapter').count()==0,f'Repeated story chapters at {width}'
   assert page.locator('.record-sources a').count()==3,f'Original named sources missing at {width}'
   assert page.locator('#pilot-support').get_attribute('href')=='https://camp-fire.jp/projects/990337/view','In-flight support CTA must lead to CAMPFIRE'
   page.locator('#rewards').scroll_into_view_if_needed()
   assert page.locator('.reward-list article').count()==3,f'Rewards missing at {width}'
   page.screenshot(path=str(OUT/f'scroll-{width}x{height}-rewards.png'))
   page.locator('#support').scroll_into_view_if_needed()
   assert page.locator('#support .action-primary').is_visible(),f'Support finale invisible: {width}'
   assert page.locator('a[href*="camp-fire.jp"]').count()>=3
   assert not errors,f'JavaScript errors at {width}: {errors}'
   current=page.evaluate('window.TBTVenueFlight')
   results.append({'viewport':f'{width}x{height}','model':current['aircraft'],'pilotReady':current['ready'],'oneCanvas':True,'sources':3,'overflow':overflow,'errors':errors})
   print(json.dumps(results[-1],ensure_ascii=False),flush=True)
   ctx.close()
  # Reduced motion never forces animated WebGL or clicks to see the content.
  ctx=browser.new_context(viewport={'width':375,'height':812},reduced_motion='reduce',bypass_csp=True)
  page=ctx.new_page();page.goto(URL,wait_until='domcontentloaded',timeout=45000)
  page.locator('#pilot-stage').scroll_into_view_if_needed()
  page.wait_for_function('window.TBTVenueFlight !== undefined')
  assert page.evaluate('TBTVenueFlight.mode')=='unavailable','Reduced motion must avoid animated 3D'
  assert page.locator('.pilot-poster').is_visible(),'Static Lake Biwa fallback image missing'
  assert page.locator('.record-sources a').count()==3,'Official story sources lost for reduced-motion visitors'
  assert page.locator('canvas').count()==1,'Duplicate canvas for reduced-motion visitors'
  ctx.close()
  # iPad Safari-like touch environment: enforce real production CSP (no bypass).
  # This specifically catches the Meshopt WASM CSP issue concealed by older tests.
  ipad=browser.new_context(
   viewport={'width':1024,'height':768},
   device_scale_factor=2,
   has_touch=True,
   is_mobile=False,
   bypass_csp=False,
   user_agent='Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1'
  )
  ipad_page=ipad.new_page()
  ipad_errors=[]
  ipad_console=[]
  ipad_page.on('pageerror',lambda e:ipad_errors.append(str(e)))
  ipad_page.on('console',lambda m:ipad_console.append(m.text) if m.type=='error' else None)
  ipad_page.goto(URL,wait_until='domcontentloaded',timeout=45000)
  ipad_page.locator('#pilot-stage').scroll_into_view_if_needed()
  # Locators do not require injecting page eval blocked by CSP.
  ipad_page.locator('#pilot-stage.is-ready').wait_for(state='attached',timeout=60000)
  assert ipad_page.locator('#pilot-begin').count()==0,'Touch device still has click-to-takeoff button'
  ipad_page.locator('#pilot-hud').wait_for(state='visible',timeout=10000)
  assert ipad_page.evaluate('window.TBTVenueFlight.mode') in ('takeoff','flying','holding','looping'),'iPad-like scene did not auto-launch'
  aircraft=ipad_page.evaluate('window.TBTVenueFlight.aircraft')
  assert aircraft=='s320-mobile.glb',f'iPad did not use low-memory festival model: {aircraft}'
  ipad_page.screenshot(path=str(OUT/'pilot-ipad-csp-enforced.png'))
  ipad_page.locator('#pilot-quit').click()
  ipad_page.locator('#rewards').scroll_into_view_if_needed()
  assert ipad_page.locator('canvas').count()==1,'iPad must have only one WebGL scene'
  assert ipad_page.locator('.record-sources a').count()==3,'Official record sources unavailable on iPad'
  assert not ipad_errors,f'iPad-like uncaught JS errors: {ipad_errors} console={ipad_console}'
  print(json.dumps({'viewport':'1024x768 touch iPad-like','model':aircraft,'CSP':'enforced','pilot':'ready','scroll3d':'static to avoid dual contexts'},ensure_ascii=False),flush=True)
  ipad.close()
  browser.close()
finally:
 server.shutdown()
(OUT/'scroll-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('S-320 INFINITE FLIGHT CHROMIUM PASS: real S-320 automatic four-gate replay, manual control, support and mobile scroll')
