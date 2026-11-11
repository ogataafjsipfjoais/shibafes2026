"""WebKit / iPad-like smoke test for the crowdfunding S-320 flight scene.
Does not bypass the production CSP. Models come from the festival website assets.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright
import functools, threading, json, ssl, tempfile, subprocess

ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
# Production GitHub Pages uses HTTPS and upgrade-insecure-requests. Test on HTTPS too;
# otherwise WebKit upgrades local HTTP asset requests and causes false TLS errors.
tls=tempfile.TemporaryDirectory(prefix='tbt-webkit-')
cert=Path(tls.name)/'cert.pem'
key=Path(tls.name)/'key.pem'
subprocess.run([
 'openssl','req','-x509','-nodes','-days','1','-newkey','rsa:2048',
 '-keyout',str(key),'-out',str(cert),
 '-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'
],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
context_ssl=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context_ssl.load_cert_chain(str(cert),str(key))
server.socket=context_ssl.wrap_socket(server.socket,server_side=True)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'https://127.0.0.1:{server.server_port}/crowdfunding/'
try:
 with sync_playwright() as pw:
  browser=pw.webkit.launch(headless=True)
  context=browser.new_context(
   viewport={'width':1024,'height':768},device_scale_factor=2,
   is_mobile=True,has_touch=True,reduced_motion='no-preference',
   user_agent='Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
   bypass_csp=False,ignore_https_errors=True
  )
  page=context.new_page()
  logs=[]
  page.on('pageerror',lambda error:logs.append('pageerror: '+str(error)))
  page.on('console',lambda message:logs.append('console: '+message.text) if message.type=='error' else None)
  page.goto(url,wait_until='domcontentloaded',timeout=45000)
  assert page.locator('h1').is_visible(),'Hero invisible'
  assert page.locator('.reward-list article').count()==3,'Rewards lost'
  assert page.locator('a[href*="camp-fire.jp"]').count()>=8,'Direct CAMPFIRE links missing'
  # The real model loads automatically before an iPad user taps or scrolls.
  assert page.evaluate('window.scrollY')==0,'Automatic setup changed scroll position'
  try:
   page.locator('#pilot-stage.is-ready').wait_for(state='attached',timeout=60000)
  except Exception:
   status=page.locator('#pilot-loading').inner_text()
   raise AssertionError('WebKit automatic 3D preload failed: '+status+'; '+str(logs))
  before_start=page.evaluate('window.TBTVenueFlight')
  assert before_start['mode']=='preview' and abs(before_start['modelYaw']-3.141592653589793)<.001,'Wrong aircraft heading or premature takeoff'
  assert page.evaluate('window.scrollY')==0,'Model loading should not scroll to the game'
  page.locator('#pilot-stage').scroll_into_view_if_needed()
  try:
   page.locator('#pilot-stage.is-ready').wait_for(state='attached',timeout=60000)
  except Exception:
   status=page.locator('#pilot-loading').inner_text()
   raise AssertionError('WebKit flight 3D did not initialize: '+status+'; '+str(logs))
  aircraft=page.evaluate('window.TBTVenueFlight.aircraft')
  assert aircraft=='s320-mobile.glb','iPad WebKit did not use optimized festival model: '+str(aircraft)
  assert page.locator('#pilot-begin').count()==0,'Old click-to-launch button still exists'
  page.locator('#pilot-hud').wait_for(state='visible',timeout=10000)
  mode=page.evaluate('window.TBTVenueFlight.mode')
  assert mode in ('takeoff','flying','holding','looping'),f'WebKit takeoff did not start automatically: {mode}'
  page.locator('#pilot-quit').click()
  assert page.evaluate('window.TBTVenueFlight.mode')=='stopped','WebKit stop action broken'
  page.locator('#rewards').scroll_into_view_if_needed()
  assert page.locator('canvas').count()==1,'Second 3D viewer remains on WebKit'
  assert page.locator('.record-sources a').count()==3,'Official team links missing on WebKit'
  assert page.locator('#pilot-repeat').count()==0 and page.locator('#pilot-finish').count()==0,'Replay button or finish overlay remains'
  assert page.locator('#pilot-support').get_attribute('href')=='https://camp-fire.jp/projects/990337/view','Cannot support from the flying scene'
  assert not logs,f'WebKit JS errors: {logs}'
  print(json.dumps({'engine':'webkit','device':'iPad-like 1024x768','csp':'enforced','aircraft':aircraft,'pilot':'ready','touchScroll':'safe','single3D':True},ensure_ascii=False))
  context.close();browser.close()
finally:
 server.shutdown()
 tls.cleanup()
