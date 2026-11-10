"""Chromium viewport QA for the simplified TBT crowdfunding page."""
import functools,json,threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-artifacts';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/crowdfunding/'
results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,height in [(375,667),(375,812),(768,1024),(1440,900)]:
   context=browser.new_context(viewport=dict(width=width,height=height),device_scale_factor=1,reduced_motion='no-preference')
   page=context.new_page()
   errors=[]
   page.on('pageerror',lambda err:errors.append(str(err)))
   response=page.goto(url,wait_until='domcontentloaded',timeout=40000)
   assert response and response.status==200,f'HTML load failed: {width}x{height}'
   page.wait_for_function("document.fonts.status === 'loaded'",timeout=25000)
   cta=page.locator('.flight-beat[data-flight-beat="0"] a[href*="camp-fire.jp"]').first
   assert cta.is_visible(),f'Initial CTA hidden at {width}'
   box=cta.bounding_box()
   assert box and box['height']>=44 and box['width']>=140,f'CTA too small: {width} {box}'
   assert box['y']>=0 and box['y']+box['height']<=height+1,f'CTA below the first screen: {width}x{height}: {box}'
   overflow=page.evaluate('document.documentElement.scrollWidth - innerWidth')
   assert overflow<=1,f'Horizontal overflow at {width}: {overflow}'
   poster=page.locator('.flight-poster')
   assert poster.evaluate('img=>img.complete&&img.naturalWidth>0'),f'Hero poster missing at {width}'
   font=page.locator('#main-title').evaluate('el=>parseFloat(getComputedStyle(el).fontSize)')
   assert font>=35,f'Hero text too small: {font}'
   page.screenshot(path=str(OUT/f'clarity-{width}x{height}-hero.png'))
   def beat_at(position):
    page.evaluate("""p=>{
     const root=document.getElementById('flight-experience');
     const length=Math.max(1,root.offsetHeight-innerHeight);
     window.scrollTo({top:root.offsetTop+length*p,behavior:'instant'});
    }""",position)
    page.wait_for_timeout(600)
    return page.locator('.flight-beat.is-current').get_attribute('data-flight-beat')
   mid,last=beat_at(.50),beat_at(.87)
   assert (mid,last)==('1','2'),f'3D story phases broken at {width}: {mid}/{last}'
   page.wait_for_function("""() => {
    const root=document.getElementById('flight-experience');
    return root.classList.contains('flight-ready')||root.classList.contains('flight-fallback')
   }""",timeout=30000)
   stage=page.locator('#flight-experience').get_attribute('class')
   launched=False
   if 'flight-ready' in stage:
    page.locator('#flight-launch').click(timeout=7000)
    page.wait_for_timeout(3350)
    launched=page.locator('#flight-launch-message').evaluate("el=>el.classList.contains('is-shown')")
    assert launched,f'Interactive launch did not finish at {width}'
   else:
    assert poster.is_visible(),f'3D fallback image hidden at {width}'
   page.screenshot(path=str(OUT/f'clarity-{width}x{height}-3d.png'))
   page.locator('#record').scroll_into_view_if_needed()
   record=page.locator('.record-quote')
   assert record.is_visible() and float(record.evaluate('el=>parseFloat(getComputedStyle(el).fontSize)'))>=19,f'Record text illegible at {width}'
   page.screenshot(path=str(OUT/f'clarity-{width}x{height}-record.png'))
   page.locator('#funding').scroll_into_view_if_needed()
   assert page.locator('.funding-row').count()==3,f'Funding needs three clear rows at {width}'
   assert page.locator('.funding-total').is_visible(),f'Funding goal not visible at {width}'
   page.screenshot(path=str(OUT/f'clarity-{width}x{height}-funding.png'))
   assert page.locator('a[href="./rewards/"]').count()>=1,f'Published rewards link missing at {width}'
   assert page.locator('a[href*="camp-fire.jp"]').count()>=3,f'Actual support links missing at {width}'
   assert not errors,f'JavaScript errors at {width}: {errors}'
   result={'viewport':f'{width}x{height}','firstScreenCTA':True,'fontPx':font,'overflowPx':overflow,'3D':stage,'middleBeat':mid,'finalBeat':last,'launchCompleted':launched,'jsErrors':errors}
   print(json.dumps(result,ensure_ascii=False),flush=True)
   results.append(result)
   context.close()
  context=browser.new_context(viewport=dict(width=375,height=812),reduced_motion='reduce')
  page=context.new_page()
  page.goto(url,wait_until='domcontentloaded',timeout=40000)
  assert page.locator('.flight-beat[data-flight-beat="0"] a[href*="camp-fire.jp"]').is_visible(),'Reduced-motion support CTA hidden'
  assert page.locator('.flight-poster').is_visible(),'Reduced-motion static image missing'
  context.close()
  browser.close()
finally:
 server.shutdown()
(OUT/'clarity-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('CLARITY V8 PASS: all four viewports, first-screen CTA, 3D launch, readable text, funding, no overflow or errors')
