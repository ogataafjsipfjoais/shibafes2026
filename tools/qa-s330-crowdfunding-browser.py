"""Real-browser checks for the independent S-330 crowdfunding landing page."""
import functools
import json
import threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
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
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,height in [(375,812),(375,667),(768,1024),(1440,900)]:
   context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
   page=context.new_page()
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   response=page.goto(url,wait_until='domcontentloaded',timeout=40000)
   assert response and response.status==200,f'Page did not load: {width}x{height}'
   title=page.locator('.hero h1')
   title.wait_for(state='visible')
   assert 'もう一度遠くへ' in title.inner_text(),f'S-330 story absent: {width}'
   cta=page.locator('.hero-actions a[href="https://camp-fire.jp/projects/990337/view"]').first
   assert cta.count()==1,f'Hero support CTA missing: {width}'
   box=cta.bounding_box()
   assert box and box['width']>=120 and box['height']>=43,f'CTA too small: {width}'
   assert box['y']>=0 and box['y']+box['height']<=height+1,f'CTA outside first viewport: {width}x{height}'
   info=page.evaluate("""() => ({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.hero-inner')).gridTemplateColumns,photos:[...document.querySelectorAll('.hero-photo img,.story-history img')].map(img=>({src:img.getAttribute('src'),ok:img.complete&&img.naturalWidth>0})),donateLinks:document.querySelectorAll('a[href="https://camp-fire.jp/projects/990337/view"]').length})""")
   assert info['scrollWidth']<=info['width']+1,f'Horizontal overflow {width}: {info}'
   assert len(info['columns'].split())==(1 if width<=780 else 2),f'Incorrect columns at {width}: {info}'
   assert all(x['ok'] for x in info['photos']),f'Unloaded campaign photos: {info["photos"]}'
   assert info['donateLinks']>=3,f'No strategic donation links: {width}'
   assert '約29万円' in page.locator('#funding').inner_text(),f'Funding info missing: {width}'
   assert page.locator('a[href="./rewards/"]').count()==1,f'Catalog link absent: {width}'
   assert page.locator('#flight-experience').count()==0,'Old 3D exhibition remained'
   page.screenshot(path=str(OUT/f's330-{width}x{height}-first.png'))
   page.locator('#funding').scroll_into_view_if_needed()
   page.screenshot(path=str(OUT/f's330-{width}x{height}-funding.png'))
   assert not errors,f'Browser errors at {width}: {errors}'
   result={'width':width,'height':height,'heroCTA':box,'layout':info,'errors':errors}
   results.append(result)
   print(json.dumps(result,ensure_ascii=False),flush=True)
   context.close()
  browser.close()
finally: server.shutdown()
(OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('PASS S-330 browser: real photos, desktop split, responsive, first-screen CTA, funding links, no overflow')