"""Fail deployment on broken local links, accidental PHP exposure or invalid SEO metadata."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
import json,sys
root=Path(sys.argv[1]).resolve();errors=[];pages=list(root.rglob('*.html'))
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.metas={};self.h1=0;self.canonical=[];self.ld=False;self.jsons=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1':self.h1+=1
  if tag=='meta':self.metas[a.get('name',a.get('http-equiv',''))]=a.get('content','')
  if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href',''))
  if tag in ('a','link','script','img'):
   for k in ('src','href'):
    if a.get(k,'').startswith('/shibafes2026/'):self.links.append(a[k])
  if tag=='img' and a.get('src') and 'alt' not in a:errors.append('Image missing alt')
  if tag=='script' and a.get('type')=='application/ld+json':self.ld=True
 def handle_endtag(self,tag):
  if tag=='script':self.ld=False
 def handle_data(self,data):
  if self.ld:self.jsons.append(data)
for p in pages:
 page=Page();page.feed(p.read_text())
 if page.h1!=1:errors.append(str(p)+': expected one H1')
 if len(page.canonical)!=1 or not page.canonical[0].startswith('https://teambirdmantrial.jp/shibafes2026/'):errors.append(str(p)+': canonical')
 if not page.metas.get('description') or 'noindex' in page.metas.get('robots',''):errors.append(str(p)+': search metadata')
 if "object-src 'none'" not in page.metas.get('Content-Security-Policy',''):errors.append(str(p)+': CSP')
 for data in page.jsons:json.loads(data)
 for link in page.links:
  target=root/unquote(urlsplit(link).path.removeprefix('/shibafes2026/'))
  if target.is_dir():target=target/'index.html'
  if not target.is_file():errors.append(str(p.relative_to(root))+': '+link)
for name in ('assets/s320-desktop.glb','assets/s320-mobile.glb','models/toyosu-city-2023.glb'):
 if not (root/name).is_file():errors.append('Missing 3D model '+name)
config=json.loads((root/'content/simulator-public-config.json').read_text())
if not list(root.rglob('*.php')):
 for key in ('statusUrl','rankingUrl'):
  if not config[key].endswith('.json'):errors.append('Static endpoint '+key)
 for name in ('simulator-status.json','simulator-ranking.json'):
  if json.loads((root/'content'/name).read_text()).get('sourceAvailable') is not False:errors.append('Snapshot state '+name)
assert not errors,'\n'.join(errors)
print('PASS:',len(pages),'pages, local links/assets, SEO metadata, JSON, security policy, model preservation')
