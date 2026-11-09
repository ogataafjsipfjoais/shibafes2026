"""Chromium test: first-screen support, real interactive S-320, story and tactile financing."""
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
  for width,height in ((375,812),(375,667),(768,1024),(1440,900)):
   context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='no-preference')
   page=context.new_page()
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   response=page.goto(url,wait_until='domcontentloaded',timeout=40000)
   assert response and response.status==200,f'Page response failed: {width}x{height}'
   page.locator('#main-title').wait_for(state='visible')
   page.wait_for_function("document.fonts.status === 'loaded'",timeout=25000)
   cta=page.locator('.flight-beat[data-flight-beat="0"] a[href*="camp-fire.jp"]').first
   assert cta.is_visible(),f'First-screen CTA missing {width}x{height}'
   box=cta.bounding_box()
   assert box and box['height']>=44 and box['width']>=140,f'CTA too small {width}: {box}'
   visible=box['y']>=0 and box['y']+box['height']<=height+1
   assert visible,f'CTA outside initial viewport {width}x{height}: {box}'
   page.wait_for_timeout(900)
   overflow=page.evaluate("document.documentElement.scrollWidth - innerWidth")
   assert overflow<=1,f'Horizontal overflow {width}: {overflow}'
   poster=page.locator('.flight-poster')
   assert poster.evaluate("img=>img.complete&&img.naturalWidth>0"),f'Fallback image missing {width}'
   page.screenshot(path=str(OUT/f'next-flight-{width}x{height}-hero.png'))
   def beat_at(position):
    page.evaluate("""p=>{
      const el=document.querySelector('#flight-experience');
      const distance=Math.max(1,el.offsetHeight-innerHeight);
      window.scrollTo({top:el.offsetTop+distance*p,behavior:'instant'});
    }""",position)
    page.wait_for_timeout(650)
    return page.locator('.flight-beat.is-current').get_attribute('data-flight-beat')
   middle=beat_at(.50)
   end=beat_at(.89)
   assert middle=='1' and end=='2',f'3D narrative phases fail {width}: {middle},{end}'
   page.wait_for_function("""() => {
      let el=document.querySelector('#flight-experience');
      return el.classList.contains('flight-ready')||el.classList.contains('flight-fallback')
   }""",timeout=30000)
   state=page.locator('#flight-experience').get_attribute('class')
   launched=False
   if 'flight-ready' in state:
    button=page.locator('#flight-launch')
    button.click(timeout=7000)
    page.wait_for_timeout(3200)
    launched=page.locator('#flight-launch-message').evaluate("el=>el.classList.contains('is-shown')")
    assert launched,f'Launch did not complete {width}'
   else:
    assert page.locator('.flight-poster').is_visible(),'No accessible 3D fallback'
   page.screenshot(path=str(OUT/f'next-flight-{width}x{height}-flight.png'))
   # Visitor-driven distance interaction, including the real record's endpoint.
   page.locator('#distance-experience').scroll_into_view_if_needed(timeout=15000)
   scale=page.locator('#flight-distance-slider')
   assert scale.count()==1,f'Flight distance control missing {width}'
   scale.fill('47')
   middle_distance=float(page.locator('#flight-distance-output').evaluate('el => el.value'))
   assert 84<middle_distance<86,f'Distance not calculated from the real record {width}: {middle_distance}'
   scale.fill('100')
   page.wait_for_timeout(80)
   assert page.locator('#distance-experience').evaluate("e=>e.classList.contains('is-complete')"),f'Distance finale did not unlock {width}'
   assert page.locator('#distance-next').get_attribute('tabindex')=='0',f'Support action not keyboard reachable {width}'
   assert 'ここで、記録は止まった' in page.locator('#distance-message').inner_text(),f'Emotional transition missing {width}'
   page.screenshot(path=str(OUT/f'next-flight-{width}x{height}-distance.png'))
   page.locator('#assembly').scroll_into_view_if_needed(timeout=15000)
   page.wait_for_timeout(400)
   for key,expect in [('platform','約7.7'),('returns','約4'),('materials','約29')]:
    page.locator(f'[data-fund="{key}"]').click(timeout=5000)
    got=page.locator('#fund-amount').inner_text()
    assert expect in got,f'Fund option failed {width}: {key} => {got}'
    assert page.locator(f'[data-fund="{key}"]').get_attribute('aria-pressed')=='true','Accessible state not updated'
   page.screenshot(path=str(OUT/f'next-flight-{width}x{height}-funding.png'))
   assert page.locator('a[href="./rewards/#return-mail"]').count()==1,'Rewards mail anchor absent'
   assert page.locator('a[href="./rewards/#return-visit"]').count()==1,'Real reward experience anchor absent'
   assert page.locator('a[href*="camp-fire.jp"]').count()>=4,'Not enough support paths'
   assert not errors,f'JavaScript page errors {width}: {errors}'
   result={'viewport':f'{width}x{height}','firstScreenCTA':visible,'cta':box,'overflow':overflow,'middleBeat':middle,'finalBeat':end,'3D':state,'launchCompleted':launched,'fundsInteractive':True,'pageErrors':errors}
   results.append(result)
   print(json.dumps(result,ensure_ascii=False),flush=True)
   context.close()
  browser.close()
finally: server.shutdown()
(OUT/'next-flight-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('PASS V7: 4 viewport sizes / first-screen support / scroll-3D / launch / budget / no overflow')
