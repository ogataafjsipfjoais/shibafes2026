"""WebKit / iPad-like smoke test for the crowdfunding S-320 flight scene.
Does not bypass the production CSP. Models come from the festival website assets.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright
import functools, threading, json

ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/crowdfunding/'
try:
 with sync_playwright() as pw:
  browser=pw.webkit.launch(headless=True)
  context=browser.new_context(
   viewport={'width':1024,'height':768},device_scale_factor=2,
   is_mobile=True,has_touch=True,reduced_motion='no-preference',
   user_agent='Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
   bypass_csp=False
  )
  page=context.new_page()
  logs=[]
  page.on('pageerror',lambda error:logs.append('pageerror: '+str(error)))
  page.on('console',lambda message:logs.append('console: '+message.text) if message.type=='error' else None)
  page.goto(url,wait_until='domcontentloaded',timeout=45000)
  assert page.locator('h1').is_visible(),'Hero invisible'
  assert page.locator('.reward-list article').count()==3,'Rewards lost'
  assert page.locator('a[href*="camp-fire.jp"]').count()>=8,'Direct CAMPFIRE links missing'
  page.locator('#pilot-stage').scroll_into_view_if_needed()
  try:
   page.locator('#pilot-stage.is-ready').wait_for(state='attached',timeout=60000)
  except Exception:
   status=page.locator('#pilot-loading').inner_text()
   raise AssertionError('WebKit flight 3D did not initialize: '+status+'; '+str(logs))
  aircraft=page.evaluate('window.TBTVenueFlight.aircraft')
  assert aircraft=='s320-mobile.glb','iPad WebKit did not use optimized festival model: '+str(aircraft)
  assert page.locator('#pilot-begin').is_enabled(),'WebKit takeoff disabled'
  page.locator('#pilot-begin').click()
  page.locator('#pilot-hud').wait_for(state='visible',timeout=10000)
  page.locator('#pilot-quit').click()
  page.locator('#flight').scroll_into_view_if_needed()
  page.locator('#flight-stage.has-fallback').wait_for(state='attached',timeout=7000)
  assert not logs,f'WebKit JS errors: {logs}'
  print(json.dumps({'engine':'webkit','device':'iPad-like 1024x768','csp':'enforced','aircraft':aircraft,'pilot':'ready','touchScroll':'safe'},ensure_ascii=False))
  context.close();browser.close()
finally:
 server.shutdown()
