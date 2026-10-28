"""Build a minimal deployment from the current page/asset dependency graph."""
import argparse,json,re,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--target',choices=['pages','production'],required=True);parser.add_argument('--output',required=True);args=parser.parse_args()
out=Path(args.output).resolve()
if out==ROOT or ROOT in out.parents and out.name!='dist':raise SystemExit('Use a separate output folder or ignored dist/')
if out.exists() and any(out.iterdir()):raise SystemExit('Output must be empty')
out.mkdir(parents=True,exist_ok=True)
# Restrict matching to real paths. Walk referenced HTML, JS imports, CSS urls and JSON assets.
allfiles={p.relative_to(ROOT).as_posix():p for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts and 'dist' not in p.parts}
assets={p:src for p,src in allfiles.items() if p.startswith(('assets/','models/'))}
selected={p for p in allfiles if p.endswith('/index.html') or p in ('index.html','sitemap.xml','favicon-aircraft-20261028.svg','content/simulator-public-config.json','content/simulator-status.json','content/simulator-ranking.json','content/shop-source.json')}
if args.target=='production':selected.update(p for p in allfiles if p.endswith('.php') or p=='.htaccess')
# Scene selects the S320 model with a runtime template string.
selected.update(('assets/s320-desktop.glb','assets/s320-mobile.glb'))
queue=list(selected);seen=set();byname={}
for p in assets:byname.setdefault(Path(p).name,[]).append(p)
while queue:
 name=queue.pop()
 if name in seen:continue
 seen.add(name);src=allfiles[name]
 if src.suffix not in ('.html','.js','.css','.json','.php'):continue
 text=src.read_text()
 for token in set(re.findall(r'[A-Za-z0-9_./-]+\.(?:js|css|webp|avif|png|jpg|svg|glb|woff2|json)',text)):
  token=token.removeprefix('/shibafes2026/').removeprefix('./')
  matches=[token] if token in assets else byname.get(Path(token).name,[])
  for match in matches:
   if match not in selected:selected.add(match);queue.append(match)
for name in sorted(selected):
 dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(allfiles[name],dest)
 if dest.suffix=='.html':
  text=dest.read_text();assert 'noindex' not in text
  dest.write_text(text)
if args.target=='pages':
 config=json.loads((out/'content/simulator-public-config.json').read_text());config.update(statusUrl='/shibafes2026/content/simulator-status.json',rankingUrl='/shibafes2026/content/simulator-ranking.json');(out/'content/simulator-public-config.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
 for name in ('simulator-status.json','simulator-ranking.json'):
  p=out/'content'/name;data=json.loads(p.read_text());data['sourceAvailable']=False;p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 (out/'.nojekyll').touch()
original=sum(p.stat().st_size for p in allfiles.values());deployed=sum(p.stat().st_size for p in out.rglob('*') if p.is_file())
print(json.dumps({'target':args.target,'files':len(selected),'sourceBytes':original,'deployBytes':deployed,'savedBytes':original-deployed},ensure_ascii=False))
