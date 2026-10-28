"""Static catalog: edit content/goods-catalog.json, then python3 work/build-goods-hangar.py."""
import json,html,re,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent/'shibafes2026'
if not ROOT.is_dir(): ROOT=Path(__file__).resolve().parents[1]
def fingerprint(source_name, prefix, replacements=()):
 text=(ROOT/'assets'/source_name).read_text()
 for pattern,value in replacements:text=re.sub(pattern,lambda m:value,text)
 name=prefix+'-'+hashlib.sha256(text.encode()).hexdigest()[:12]+'.'+source_name.rsplit('.',1)[1]
 (ROOT/'assets'/name).write_text(text)
 return name
SHARED_ASSET=fingerprint('site-chrome-20261027.js','site-chrome-goods')
shared_pattern=r"site-chrome-20261027\.js(?:\?[^'\"`]+)?"
BOOTSTRAP_ASSET=fingerprint('site-chrome-bootstrap-20261027.js','site-bootstrap-goods',[(shared_pattern,SHARED_ASSET)])
MAIN_ASSET='index-goods-20261027.js'
# Preserve the bundler's circular module graph: Scene/AccessWalk import the entry's exports.
# A renamed entry must never let a scene import (and mount) the legacy entry a second time.
scene_names={'Scene-browserfix-20261026.js':'Scene-goods-20261027.js','AccessWalkScene-browserfix-20261026.js':'AccessWalkScene-goods-20261027.js'}
for source,destination in scene_names.items():
 text=(ROOT/'assets'/source).read_text().replace('index-browserfix-20261026.js',MAIN_ASSET)
 for old_name,new_name in scene_names.items():text=text.replace(old_name,new_name)
 (ROOT/'assets'/destination).write_text(text)
text=re.sub(shared_pattern,lambda m:SHARED_ASSET,(ROOT/'assets/index-browserfix-20261026.js').read_text())
for old_name,new_name in scene_names.items():text=text.replace(old_name,new_name)
(ROOT/'assets'/MAIN_ASSET).write_text(text)
GOODS_JS=fingerprint('goods-hangar.js','goods-hangar')
GOODS_CSS=fingerprint('goods-hangar.css','goods-hangar')
for page in ROOT.rglob('index.html'):
 text=page.read_text()
 text=re.sub(r'assets/(?:index-browserfix-20261026|index-goods-[a-f0-9]{12}|index-goods-20261027)\.js(?:\?[^\"\s]+)?',lambda m:'assets/'+MAIN_ASSET,text)
 text=re.sub(r'assets/(?:site-chrome-bootstrap-20261027|site-bootstrap-goods-[a-f0-9]{12})\.js(?:\?[^\"\s]+)?',lambda m:'assets/'+BOOTSTRAP_ASSET,text)
 page.write_text(text)

BASE='/shibafes2026/'
DATA=json.loads((ROOT/'content/goods-catalog.json').read_text())
E=lambda x:html.escape(str(x),quote=True)
STATUSES={'available':'販売中','low':'残りわずか','soldout':'完売','unconfirmed':'販売状況は会場で確認'}
products=DATA['products'];ids=set()
for p in products:
 assert re.fullmatch(r'[a-z0-9-]{1,60}',p['id']) and p['id'] not in ids,'Invalid/duplicate product ID'
 ids.add(p['id']);assert type(p['price']) is int and 0<=p['price']<=1000000
 assert p['status'] in STATUSES and isinstance(p['variants'],list)
 assert p['images'] and len(p['images'])<=12
 for im in p['images']:
  assert re.fullmatch(r'/shibafes2026/assets/goods/[A-Za-z0-9_.-]+\.(webp|avif|png|jpg)',im['src']) and (ROOT/im['src'].removeprefix(BASE)).is_file()
  if im.get('smallSrc'):assert re.fullmatch(r'/shibafes2026/assets/goods/[A-Za-z0-9_.-]+\.webp',im['smallSrc']) and (ROOT/im['smallSrc'].removeprefix(BASE)).is_file()
  assert type(im['width']) is int and type(im['height']) is int and im['width']>0 and im['height']>0
 assert len(p['variants'])==len(set(p['variants']))
reference=(ROOT/'ranking/index.html').read_text()
def shared(which):
 start=f'<!-- SHARED_{which}_BEGIN -->';end=f'<!-- SHARED_{which}_END -->'
 return reference.split(start,1)[1].split(end,1)[0].replace('/shibafes2026/prepare','/shibafes2026/goodss/')
header=shared('HEADER');footer=shared('FOOTER')
def image(p,cls='',eager=False,index=0):
 im=p['images'][index]
 sizes='(max-width: 640px) 44vw, (max-width: 1000px) 44vw, 28vw' if cls=='hg-catalog-thumb' else '(max-width: 640px) 30vw, 22vw' if cls=='hg-hero-thumb' else '(max-width: 640px) 88vw, (max-width: 1000px) 44vw, 40vw'
 responsive=(f' srcset="{E(im["smallSrc"])} {im["smallWidth"]}w, {E(im["src"])} {im["width"]}w" sizes="{sizes}"' if im.get('smallSrc') else '')
 return f'<img class="{E(cls)}" src="{E(im["src"])}"{responsive} width="{im["width"]}" height="{im["height"]}" alt="{E(im["alt"])}" loading="{"eager" if eager else "lazy"}" decoding="async">'
def status(p):return f'<span class="hg-stock" data-stock="{E(p["status"])}">{STATUSES[p["status"]]}</span>'
def price(p):return f'¥{p["price"]:,}'
def add(p):
 options=''.join(f'<option value="{E(v)}">{E(v)}</option>' for v in p['variants'])
 selection=f'<label>バリエーション<select name="variant" required><option value="">選択してください</option>{options}</select></label>' if options else ''
 return f'<form class="hg-add" hidden data-product="{E(p["id"])}">{selection}<button class="hg-button" type="submit" {"disabled" if p["status"]=="soldout" else ""}>{"完売" if p["status"]=="soldout" else "購入メモに追加 ＋"}</button></form>'
def shell(title,body,path,detail=False):
 url='https://teambirdmantrial.jp'+path
 product=next((p for p in products if path==BASE+'goodss/'+p['id']+'/'),None)
 description=(product['name']+'。'+product['description']+' 芝浦祭2026のTBT公式グッズ。参考価格・仕様・購入場所をご案内します。') if product else '芝浦祭2026のTBT公式グッズ。トレカ・ステッカー・トートバッグ・クリアファイルを紹介。豊洲キャンパス教室棟3階303教室で販売、会場用の購入メモも作れます。'
 if product:title=product['name']+'（'+product['sourceId']+'）'
 crumbs=[{'@type':'ListItem','position':1,'name':'芝浦祭2026 TBT','item':'https://teambirdmantrial.jp'+BASE},{'@type':'ListItem','position':2,'name':'TBT公式グッズ','item':'https://teambirdmantrial.jp'+BASE+'goodss/'}]
 if product:crumbs.append({'@type':'ListItem','position':3,'name':product['name'],'item':url})
 structured=json.dumps({'@context':'https://schema.org','@graph':[{'@type':'WebPage','name':title,'description':description,'url':url,'inLanguage':'ja'},{'@type':'BreadcrumbList','itemListElement':crumbs}]},ensure_ascii=False).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
 payload=json.dumps(DATA,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
 return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"><meta name="referrer" content="strict-origin-when-cross-origin"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>{E(title)}｜芝浦祭2026 TBT</title><meta name="description" content="{E(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="{url}"><meta property="og:title" content="{E(title)}｜芝浦祭2026 TBT"><meta property="og:description" content="{E(description)}"><meta property="og:type" content="website"><meta property="og:url" content="{url}"><meta property="og:image" content="https://teambirdmantrial.jp/shibafes2026/assets/ogp.png"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">{structured}</script><meta name="theme-color" content="#102e49"><link rel="icon" href="{BASE}favicon-aircraft-20261028.svg"><link rel="stylesheet" href="{BASE}assets/site-chrome-20261027.css"><link rel="stylesheet" href="{BASE}assets/{GOODS_CSS}"><noscript><link rel="stylesheet" href="{BASE}assets/site-chrome-noscript-20261027.css"></noscript><script type="module" src="{BASE}assets/{BOOTSTRAP_ASSET}"></script><script type="module" src="{BASE}assets/{GOODS_JS}"></script></head><body class="goods-page"><div id="site-header-root">{header}</div><main id="main" class="hg-main" data-detail="{str(detail).lower()}">{body}</main><div id="site-footer-root">{footer}</div><a class="hg-kit-dock" href="#{'flight-kit' if not detail else 'detail-kit'}" hidden>FLIGHT KIT <span data-kit-count>0</span><span aria-hidden="true">↗</span></a><p class="hg-live" role="status" aria-live="polite"></p><dialog id="hg-zoom" aria-label="商品画像の拡大"><button class="hg-zoom-close" type="button">閉じる ×</button><img alt=""></dialog><script type="application/json" id="goods-data">{payload}</script></body></html>'''
def kit(id='flight-kit'):
 return f'''<section class="hg-kit hg-section" id="{id}"><div class="hg-section-top"><span>04 / FLIGHT KIT</span><span>会場で使える、購入メモ。</span></div><div class="hg-kit-heading"><h2>今日の発見を、<br>ひとつに。</h2><p>気になるものを、あなたのフライトキットに。<br>注文・取り置きではありません。<br>在庫とお支払いは会場でご確認ください。</p></div><div class="hg-kit-content" data-kit-content><p>商品詳細から「購入メモに追加」を選ぶと、ここに一覧が表示されます。</p></div><noscript><p>購入メモにはJavaScriptが必要です。商品情報はこのままご覧いただけます。</p></noscript><p class="hg-kit-storage" data-storage-note hidden>メモはこの端末のブラウザに保存されます。</p></section>'''
def where():return '''<section class="hg-where hg-section" id="where"><div class="hg-section-top"><span>05 / WHERE TO BUY</span><span>SEE YOU IN TOYOSU.</span></div><div class="hg-where-layout"><div><p class="hg-kicker">あなたの次の目的地</p><h2>教室棟<span>3F</span><br><span class="hg-room-line"><b>303</b><small>教室へ。</small></span></h2></div><div><p>芝浦工業大学 豊洲キャンパス<br>教室棟3階・303教室</p><p class="hg-dates">2026.10.31 <small>SAT</small><br>— 11.01 <small>SUN</small></p><p class="hg-muted">物販の販売時間・販売条件は会場でご確認ください。</p><a class="hg-button" href="/shibafes2026/access/">展示教室への行き方 ↗</a></div></div></section>'''
featured=next((p for p in products if p['featured']),products[0])
hero=f'''<section class="hg-hero" id="hangar"><div class="hg-hangar"><div class="hg-hero-meta"><span>TBT OFFICIAL GOODS 2026</span><span>TOYOSU / HANGAR 303</span></div><div class="hg-hangar-ribs" aria-hidden="true"></div><div class="hg-hero-title"><p class="hg-kicker">A LITTLE PIECE OF OUR DREAM.</p><h1>空への想いを、<br><span>持ち帰ろう。</span></h1><p>ここで出会うのは、空へ挑む日々のかけら。<br>あなたの毎日に連れ出したいものを、見つけよう。</p></div><div class="hg-hero-exhibit" aria-label="TBTグッズの掲載デザイン"><figure class="hg-hero-object hg-object-a">{image(products[0],cls='hg-hero-thumb',eager=True)}<figcaption>01 / AIRCRAFT ARCHIVE</figcaption></figure><figure class="hg-hero-object hg-object-b">{image(featured,cls='hg-hero-thumb',eager=True)}<figcaption>02 / CARRY THE DREAM</figcaption></figure><figure class="hg-hero-object hg-object-c">{image(products[-1],cls='hg-hero-thumb',eager=True)}<figcaption>03 / ENGINEERING NOTES</figcaption></figure></div><div class="hg-door hg-door-left" aria-hidden="true"><span>HANGAR<br><b>20</b></span></div><div class="hg-door hg-door-right" aria-hidden="true"><span>COLLECTION<br><b>26</b></span></div><a class="hg-scroll" href="#collection"><span class="hg-scroll-pc">↓ スクロールして、格納庫の中へ</span><span class="hg-scroll-touch">↑ 上にスワイプして、格納庫の中へ</span></a><span class="hg-hero-coordinate" aria-hidden="true">35°39′N / 139°47′E<br>DESIGNED TO TAKE OFF.</span></div></section>'''
items=''
for i,p in enumerate(products):
 items+=f'''<article class="hg-product" data-product-id="{p['id']}" data-category="{E(p['category'])}"><div class="hg-product-meta"><span>ITEM / {i+1:02}</span><span>{E(p['category'])}</span></div><a class="hg-product-image" href="{BASE}goodss/{p['id']}/" aria-label="{E(p['name'])}の詳細">{image(p,cls='hg-catalog-thumb')}<span class="hg-image-label">DESIGN PREVIEW</span><span class="hg-discover" aria-hidden="true">見る ↗</span></a><div class="hg-product-title"><h3><a href="{BASE}goodss/{p['id']}/">{E(p['name'])}</a></h3><span>{price(p)}</span></div>{status(p)}<p>{E(p['description'])}</p><a class="hg-detail-link" href="{BASE}goodss/{p['id']}/">詳細・購入メモへ <span>↗</span></a></article>'''
filters=''.join(f'<button type="button" data-filter="{E(cat)}" aria-pressed="false">{E(cat)}</button>' for cat in dict.fromkeys(p['category'] for p in products))
collection=f'''<section class="hg-collection hg-section" id="collection"><div class="hg-section-top"><span>01 / GOODS COLLECTION</span><span>DISCOVER YOUR NEXT FAVORITE.</span></div><div class="hg-collection-heading"><h2>挑戦のかけらを、<br><em>日常へ。</em></h2><div><p>翼の線、機体の記憶、チームのしるし。<br>小さなグッズにも、空への想いを込めて。</p><p class="hg-data-notice">{E(DATA['notice'])}<br>画像は掲載デザインです。商品ごとの販売単位は会場でご確認ください。</p></div></div><div class="hg-filter" aria-label="商品カテゴリー" hidden><button type="button" data-filter="all" aria-pressed="true">すべて <small>08</small></button>{filters}</div><button class="hg-random" type="button" hidden>ひとつ、出会ってみる <span aria-hidden="true">↗</span></button><div class="hg-product-grid">{items}</div></section>'''
feature=f'''<section class="hg-feature hg-section" id="featured"><div class="hg-section-top"><span>02 / FEATURED GOODS</span><span>THE DREAM, IN YOUR HANDS.</span></div><div class="hg-feature-layout"><div class="hg-feature-art"><span class="hg-feature-word" aria-hidden="true">CARRY<br>THE<br>DREAM.</span>{image(featured)}<span class="hg-art-caption">掲載デザイン / 実物の形状を示す写真ではありません</span></div><div class="hg-feature-copy"><p class="hg-kicker">FROM THE HANGAR, TO YOUR EVERYDAY.</p><h2>飛ぶ夢を、<br>連れ出そう。</h2><h3>{E(featured['name'])}</h3><p>{E(featured['description'])}</p><dl><div><dt>DESIGN</dt><dd>機体のモチーフと、TBTのタイポグラフィ。</dd></div><div><dt>MATERIAL / SIZE</dt><dd>素材・サイズは確認中。会場でご確認ください。</dd></div></dl><p class="hg-feature-price">{price(featured)}</p><a class="hg-button" href="{BASE}goodss/{featured['id']}/">このグッズを詳しく見る ↗</a></div></div></section>'''
omikuji='''<section class="hg-omikuji hg-section" aria-labelledby="omikuji-title"><div><p class="hg-kicker">TBT / FLIGHT FORTUNE</p><h2 id="omikuji-title">今日の風を、<br>ひとつ引こう。</h2><p>空へ挑むあなたに、格納庫から小さなことばを。</p><button class="hg-button" type="button" data-fortune-draw hidden>おみくじを引く ↗</button><noscript><p>おみくじにはJavaScriptが必要です。今日も、あなたらしい一歩を。</p></noscript></div><div class="hg-fortune-paper" aria-live="polite" aria-atomic="true"><span class="hg-fortune-seal" aria-hidden="true">飛翔御籤</span><p data-fortune-label>あなたの一歩に、追い風を。</p><p data-fortune-message>どんな風に出会えるかは、引いてからのお楽しみ。</p><small>遊びとしてお楽しみください。景品・割引はありません。</small></div></section>'''
body=hero+collection+feature+omikuji+kit()+where()
(ROOT/'goodss/index.html').write_text(shell('TBT OFFICIAL GOODS｜空への想いを、持ち帰ろう。',body,BASE+'goodss/'))
for p in products:
 heading=''.join('<span>'+E(line)+'</span>' for line in p.get('headingLines',[p['name']]))
 gallery=''.join(f'<a class="hg-gallery-image" href="{E(im["src"])}" data-zoom="{E(im["src"])}" data-alt="{E(im["alt"])}">{image(p,eager=i==0,index=i)}<span>画像を拡大 ＋</span></a>' for i,im in enumerate(p['images']))
 specs=''.join(f'<div><dt>{E(k)}</dt><dd>{E(v)}</dd></div>' for k,v in p['specs'])
 detail=f'''<section class="hg-detail hg-section"><a class="hg-back" href="{BASE}goodss/#collection">← コレクションに戻る</a><div class="hg-detail-layout"><div class="hg-gallery">{gallery}<p class="hg-muted">{E(p['imageNote'])}</p></div><div class="hg-detail-copy"><p class="hg-kicker">{E(p['category'])} / {E(p['sourceId'])}</p><h1 aria-label="{E(p['name'])}">{heading}</h1><p>{E(p['description'])}</p><p class="hg-detail-price">{price(p)}<small>参考価格</small></p>{status(p)}<dl class="hg-specs">{specs}</dl>{add(p)}<p class="hg-muted">購入メモは注文・取り置きではありません。<br>サイズ・色などのバリエーションは会場でご確認ください。</p><a class="hg-detail-link" href="#where">購入場所を確認する ↘</a></div></div></section>'''+kit('detail-kit')+where()
 folder=ROOT/'goodss'/p['id'];folder.mkdir(exist_ok=True);(folder/'index.html').write_text(shell(p['name'],detail,BASE+'goodss/'+p['id']+'/',True))
print(f'Built catalog + {len(products)} product pages from goods-catalog.json')
