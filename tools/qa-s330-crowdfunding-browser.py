"""Visual regression and interaction checks for the S-330 project journal landing page."""
import functools,json,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
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
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,height in [(320,700),(375,667),(390,844),(768,1024),(1024,768),(1440,900),(1920,1080)]:
   context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
   page=context.new_page();errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   response=page.goto(url,wait_until='domcontentloaded',timeout=40000)
   assert response and response.status==200,f'Page not served {width}'
   title=page.locator('.cover h1')
   title.wait_for(state='visible')
   assert 'もう一度遠くへ' in title.inner_text(),f'Hero missing {width}'
   cover_cta=page.locator('.cover-actions a[href="https://camp-fire.jp/projects/990337/view"]')
   assert cover_cta.count()==1 and cover_cta.is_visible(),f'Hero support absent {width}'
   bounds=cover_cta.bounding_box()
   assert bounds and bounds['width']>=120 and bounds['height']>=43,f'CTA tap size {width}'
   assert bounds['y']>=0 and bounds['y']+bounds['height']<=height+1,f'Hero CTA not visible on load {width}x{height}: {bounds}'
   dimensions=page.evaluate("""() => ({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,cols:getComputedStyle(document.querySelector('.cover-main')).gridTemplateColumns,supportLinks:document.querySelectorAll('a[href="https://camp-fire.jp/projects/990337/view"]').length})""")
   assert dimensions['scrollWidth']<=dimensions['width']+1,f'Horizontal overflow {width}: {dimensions}'
   assert len(dimensions['cols'].split())==(1 if width<=780 else 2),f'Cover columns at {width}: {dimensions}'
   assert dimensions['supportLinks']>=4,f'Support links {width}'
   assert page.locator('.cover-photo img').evaluate('(img) => img.complete && img.naturalWidth > 0'),f'Hero image not loaded {width}'
   page.screenshot(path=str(OUT/f's330-{width}x{height}-first.png'))
   page.locator('.workbench-photos').scroll_into_view_if_needed()
   page.wait_for_function("""() => [...document.querySelectorAll('.cover-photo img,.workbench-photos img')].every(x=>x.complete && x.naturalWidth>0)""",timeout=25000)
   assert page.locator('.workbench-photos img').count()==3,f'Workshop photos missing {width}'
   assert page.locator('#history time').count()==3,f'Flight chronology incomplete {width}'
   assert page.locator('.pilot-entry').count()==2,f'Pilots missing {width}'
   assert '約29万円' in page.locator('#funding').inner_text(),f'Funding breakdown absent {width}'
   assert page.locator('a[href="./rewards/"]').count()==1,f'Reward guide not linked {width}'
   assert page.locator('#flight-experience').count()==0,f'Old 3D remained {width}'
   page.locator('#funding').scroll_into_view_if_needed()
   page.screenshot(path=str(OUT/f's330-{width}x{height}-funding.png'))
   assert not errors,f'Browser errors {width}: {errors}'
   results.append({'width':width,'height':height,'cta':bounds,'document':dimensions,'pageErrors':errors})
   print(json.dumps(results[-1],ensure_ascii=False),flush=True)
   context.close()
  browser.close()
finally:server.shutdown()
(OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('PASS: 8 desktop/tablet/phone viewports, support CTA in first screen, photography, funding facts, no overflow')