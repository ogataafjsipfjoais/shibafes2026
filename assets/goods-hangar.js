/* Native scrolling. Content is visible by default; motion only enhances already visible nodes. */
const root=document.querySelector('.hg-main');
const data=JSON.parse(document.getElementById('goods-data').textContent),catalog=new Map(data.products.map(p=>[p.id,p]));
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
const moving=()=>!reduce.matches&&document.documentElement.dataset.motion!=='off'&&!document.hidden;
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const money=value=>'¥'+new Intl.NumberFormat('ja-JP').format(value);
let kit=[],persistent=true,toastTimer=0,kitVisible=false;
const storageKey='tbt-flight-kit-2026-v1';
function restoreKit(){try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))kit=saved.slice(0,80).filter(r=>r&&catalog.has(r.id)&&Number.isInteger(r.quantity)&&r.quantity>0&&r.quantity<=20&&typeof r.variant==='string'&&(catalog.get(r.id).variants.length?catalog.get(r.id).variants.includes(r.variant):r.variant==='')).filter((r,i,all)=>all.findIndex(x=>x.id===r.id&&x.variant===r.variant)===i);}catch{persistent=false;}}
restoreKit();
function announce(text){const live=document.querySelector('.hg-live');live.textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>live.textContent='',3500);}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(kit));persistent=true;}catch{persistent=false;}}
function renderKit(){
 const container=document.querySelector('[data-kit-content]');if(!container)return;
 while(container.firstChild)container.removeChild(container.firstChild);
 const count=kit.reduce((sum,r)=>sum+r.quantity,0),dock=document.querySelector('.hg-kit-dock');dock.hidden=count===0||kitVisible;document.querySelector('[data-kit-count]').textContent=count;
 const note=document.querySelector('[data-storage-note]');note.hidden=false;note.textContent=persistent?'メモはこの端末のブラウザに保存されます。':'このブラウザでは保存できないため、メモはこのページを開いている間のみ有効です。';
 if(!kit.length){container.append(node('p','', 'まだキットは空です。商品詳細から、気になるものを追加してください。'));return;}
 const list=node('ul','hg-kit-list');let total=0;
 kit.forEach((record,index)=>{
  const p=catalog.get(record.id),row=node('li','hg-kit-row'),img=node('img');img.src=p.images[0].smallSrc||p.images[0].src;img.alt='';img.width=64;img.height=70;img.loading='lazy';
  const title=node('div');title.append(node('h3','',p.name),node('small','',(record.variant?record.variant+' / ':'')+money(p.price)+' / '+(p.status==='soldout'?'完売・会場で確認':'在庫は会場で確認')));
  const label=node('label','', '数量'),select=node('select');select.setAttribute('aria-label',p.name+(record.variant?' '+record.variant:'')+'の数量');
  for(let q=1;q<=20;q++){const option=node('option','',q);option.value=q;option.selected=q===record.quantity;select.append(option);}
  select.addEventListener('change',()=>{kit[index].quantity=Number(select.value);save();const focus=index;renderKit();document.querySelectorAll('.hg-kit-row select')[focus]?.focus();});label.append(select);
  const subtotal=p.price*record.quantity;total+=subtotal;
  const remove=node('button','hg-kit-remove','削除');remove.type='button';remove.setAttribute('aria-label',p.name+'を購入メモから削除');remove.addEventListener('click',()=>{kit.splice(index,1);save();renderKit();const next=document.querySelectorAll('.hg-kit-remove')[Math.min(index,kit.length-1)];if(next)next.focus();else{container.tabIndex=-1;container.focus();}announce('購入メモから削除しました。');});
  row.append(img,title,label,node('strong','',money(subtotal)),remove);list.append(row);
 });
 const sum=node('div','hg-kit-total');sum.append(node('span','', '参考価格の合計 / '+count+'点'),node('strong','',money(total)));
 const tools=node('div','hg-kit-tools'),copy=node('button','','購入メモをコピー'),print=node('button','','メモを印刷 / PDF');copy.type=print.type='button';
 const text=()=>['TBT芝浦祭2026 / FLIGHT KIT','購入予定メモ（注文・取り置きではありません）',...kit.map(r=>{const p=catalog.get(r.id);return p.name+(r.variant?' ['+r.variant+']':'')+' ×'+r.quantity+' '+money(p.price*r.quantity);}), '参考価格合計 '+money(total),'会場：豊洲キャンパス 教室棟3階303教室','在庫・価格・販売単位は会場でご確認ください。'].join('\n');
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text());announce('購入メモをコピーしました。');}catch{let field=tools.querySelector('textarea');if(!field){field=node('textarea');field.setAttribute('aria-label','コピー用の購入メモ');field.style.cssText='width:100%;min-height:180px;font-size:16px';tools.append(field);}field.value=text();field.focus();field.select();announce('メモを選択しました。端末のコピー操作をご利用ください。');}});
 print.addEventListener('click',()=>window.print());tools.append(copy,print,node('p','','実際の金額・在庫・販売条件は会場でご確認ください。'));
 container.append(list,sum,tools,node('p','hg-print-note','購入予定メモです。注文・取り置きではありません。豊洲キャンパス 教室棟3階303教室。'));
}
for(const form of document.querySelectorAll('.hg-add')){form.hidden=false;form.addEventListener('submit',event=>{
 event.preventDefault();const p=catalog.get(form.dataset.product);if(!p||p.status==='soldout')return;
 const variant=form.elements.variant?.value||'';if(p.variants.length&&!p.variants.includes(variant))return;
 const record=kit.find(r=>r.id===p.id&&r.variant===variant);
 if(record&&record.quantity>=20){announce('同じ商品の数量は20点までです。');return;}
 if(!record&&kit.length>=80){announce('メモに登録できる商品は80種類までです。');return;}
 if(record)record.quantity++;else kit.push({id:p.id,variant,quantity:1});save();renderKit();announce('FLIGHT KITに追加しました。');
 const button=form.querySelector('button'),dock=document.querySelector('.hg-kit-dock');if(moving()&&button.animate){button.animate([{transform:'scale(1)'},{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:260});dock.animate([{transform:'translateY(0)'},{transform:'translateY(-7px)'},{transform:'translateY(0)'}],{duration:360});}
});}
renderKit();
const filters=document.querySelector('.hg-filter');if(filters){filters.hidden=false;filters.addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(!button)return;filters.querySelectorAll('button').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));root.querySelectorAll('.hg-product').forEach(p=>p.hidden=button.dataset.filter!=='all'&&p.dataset.category!==button.dataset.filter);});}
// A small discovery surprise; product order, prices and stock remain unchanged.
const randomButton=document.querySelector('.hg-random');
if(randomButton){
 const candidates=Array.from(root.querySelectorAll('[data-product-id]')).filter(el=>catalog.get(el.dataset.productId)?.status!=='soldout');let previous=null;
 if(candidates.length){randomButton.hidden=false;randomButton.addEventListener('click',()=>{
  const pool=candidates.length>1?candidates.filter(el=>el!==previous):candidates;
  const chosen=pool[Math.floor(Math.random()*pool.length)];previous=chosen;
  filters?.querySelector('[data-filter="all"]')?.click();
  chosen.scrollIntoView({block:'center',behavior:moving()?'smooth':'auto'});
  const link=chosen.querySelector('.hg-detail-link');try{link.focus({preventScroll:true});}catch{link.focus();}
  announce(catalog.get(chosen.dataset.productId).name+'を見つけました。');
  if(moving()&&chosen.animate)chosen.animate([{opacity:.65,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:450});
 });}
}
const fortuneButton=document.querySelector('[data-fortune-draw]');
if(fortuneButton){
 const fortunes=[['大吉','絶好の追い風。気になったことへ、一歩踏み出してみよう。'],['中吉','ゆっくり上昇中。小さな工夫が、次の景色につながりそう。'],['小吉','発見の予感。いつもと違う角度から、機体を眺めてみよう。'],['吉','仲間となら、もっと遠くへ。今日の発見を誰かと分け合おう。'],['末吉','整備も大切な時間。ひと息ついたら、またあなたのペースで。']];
 const paperElement=document.querySelector('.hg-fortune-paper');
 const scratch=node('canvas','hg-scratch');scratch.width=480;scratch.height=360;scratch.hidden=true;scratch.setAttribute('aria-hidden','true');
 const revealButton=node('button','hg-scratch-reveal','削らずに結果を見る');revealButton.type='button';revealButton.hidden=true;
 const fortunePanel=node('div','hg-fortune-panel');paperElement.before(fortunePanel);fortunePanel.append(paperElement,revealButton);paperElement.append(scratch);
 let context=null,activePointer=null,previousPoint=null,pendingResult=null,scratchFrame=0,queuedPoint=null;
 // Reuse a small pool; no continuous animation loop or growing particle list.
 const chips=Array.from({length:10},()=>{const chip=node('i','hg-scratch-chip');chip.hidden=true;chip.setAttribute('aria-hidden','true');paperElement.append(chip);return chip;});
 let chipIndex=0,lastChipTime=0;const chipAnimations=new WeakMap();
 function stopChips(){for(const chip of chips){const animation=chipAnimations.get(chip);if(animation){animation.onfinish=null;animation.oncancel=null;animation.cancel();}chip.hidden=true;}}
 function scatter(p){
  if(!moving()||!scratch.animate)return;
  const now=performance.now();if(now-lastChipTime<65)return;lastChipTime=now;
  for(let i=0;i<2;i++){
   const chip=chips[chipIndex++%chips.length],old=chipAnimations.get(chip);if(old){old.onfinish=null;old.oncancel=null;old.cancel();}
   chip.style.left=(p.x/480*100)+'%';chip.style.top=(p.y/scratch.height*100)+'%';chip.hidden=false;
   const drift=(Math.random()-.5)*48,lift=12+Math.random()*20;
   const animation=chip.animate([{transform:'translate(0,0) rotate(0deg)',opacity:.85},{transform:'translate('+drift+'px,'+(-lift)+'px) rotate(100deg)',opacity:.7,offset:.4},{transform:'translate('+(drift*1.4)+'px,22px) rotate(210deg)',opacity:0}],{duration:380+Math.random()*120,easing:'ease-out'});
   chipAnimations.set(chip,animation);const hide=()=>{chip.hidden=true;};animation.onfinish=hide;animation.oncancel=hide;
  }
 }

 try{context=scratch.getContext('2d',{willReadFrequently:true});}catch{}
 function uncover(){if(scratchFrame)cancelAnimationFrame(scratchFrame);scratchFrame=0;queuedPoint=null;stopChips();scratch.hidden=true;revealButton.hidden=true;activePointer=null;previousPoint=null;if(pendingResult){pendingResult();pendingResult=null;}paperElement.setAttribute('aria-busy','false');}
 revealButton.addEventListener('click',uncover);
 function cover(result){
  pendingResult=result;result();
  if(!context){uncover();return;}
  try{
   scratch.height=Math.max(180,Math.round(480*paperElement.clientHeight/paperElement.clientWidth));const height=scratch.height;
   context.globalCompositeOperation='source-over';context.fillStyle='#173b55';context.fillRect(0,0,480,height);
   context.strokeStyle='#7894a3';context.lineWidth=1;
   for(let x=-height;x<480;x+=28){context.beginPath();context.moveTo(x,0);context.lineTo(x+height,height);context.stroke();}
   context.fillStyle='#faf8f2';context.textAlign='center';context.font='26px serif';context.fillText('飛 翔 御 籤',240,height*.42);context.font='18px sans-serif';context.fillText('ここを削って、今日の風を開く',240,height*.6);
   context.globalCompositeOperation='destination-out';context.lineWidth=56;context.lineCap='round';context.lineJoin='round';
   scratch.hidden=false;revealButton.hidden=false;
  }catch{uncover();}
 }
 function point(x,y){const b=scratch.getBoundingClientRect();return{x:(x-b.left)*480/b.width,y:(y-b.top)*scratch.height/b.height};}
 function eraseNow(x,y){if(scratch.hidden||!context)return;const p=point(x,y);context.beginPath();context.moveTo(previousPoint?.x??p.x,previousPoint?.y??p.y);context.lineTo(p.x,p.y);context.stroke();context.beginPath();context.arc(p.x,p.y,28,0,Math.PI*2);context.fill();
  // Tiny irregular erasures soften the perfectly round brush edge.
  for(let i=0;i<4;i++){const angle=Math.random()*Math.PI*2;context.beginPath();context.arc(p.x+Math.cos(angle)*29,p.y+Math.sin(angle)*29,1+Math.random()*3,0,Math.PI*2);context.fill();}
  scatter(p);previousPoint=p;}
 function flushScratch(){if(scratchFrame)cancelAnimationFrame(scratchFrame);scratchFrame=0;const p=queuedPoint;queuedPoint=null;if(p)eraseNow(p.x,p.y);}
 function erase(x,y){queuedPoint={x,y};if(!scratchFrame)scratchFrame=requestAnimationFrame(flushScratch);}
 function endScratch(){flushScratch();activePointer=null;previousPoint=null;if(scratch.hidden)return;try{const pixels=context.getImageData(0,0,480,scratch.height).data;let clear=0,total=0;for(let i=3;i<pixels.length;i+=64){total++;if(pixels[i]<80)clear++;}if(clear/total>.38)uncover();}catch{uncover();}}
 if('PointerEvent' in window){
  scratch.addEventListener('pointerdown',e=>{if(activePointer!==null||e.button!==0)return;activePointer=e.pointerId;try{scratch.setPointerCapture(e.pointerId);}catch{}erase(e.clientX,e.clientY);});
  scratch.addEventListener('pointermove',e=>{if(e.pointerId===activePointer)erase(e.clientX,e.clientY);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])scratch.addEventListener(type,e=>{if(e.pointerId===activePointer)endScratch();});
 }else{
  scratch.addEventListener('touchstart',e=>{if(activePointer!==null)return;e.preventDefault();const t=e.touches[0];if(t){activePointer=t.identifier;erase(t.clientX,t.clientY);}},{passive:false});
  scratch.addEventListener('touchmove',e=>{e.preventDefault();const t=Array.from(e.touches).find(t=>t.identifier===activePointer);if(t)erase(t.clientX,t.clientY);},{passive:false});
  scratch.addEventListener('touchend',endScratch);scratch.addEventListener('touchcancel',endScratch);
  scratch.addEventListener('mousedown',e=>{if(e.button===0){activePointer='mouse';erase(e.clientX,e.clientY);}});
  window.addEventListener('mousemove',e=>{if(activePointer==='mouse')erase(e.clientX,e.clientY);});window.addEventListener('mouseup',()=>{if(activePointer==='mouse')endScratch();});
 }
 let lastFortune=-1,drawing=false;
 fortuneButton.hidden=false;
 fortuneButton.addEventListener('click',async()=>{
  if(drawing)return;uncover();drawing=true;
  const options=fortunes.map((value,index)=>index).filter(index=>index!==lastFortune);
  lastFortune=options[Math.floor(Math.random()*options.length)];
  const [label,message]=fortunes[lastFortune],paper=document.querySelector('.hg-fortune-paper');
  const showResult=()=>{document.querySelector('[data-fortune-label]').textContent=label;document.querySelector('[data-fortune-message]').textContent=message;};
  fortuneButton.disabled=true;fortuneButton.textContent='風を読んでいます…';paper.setAttribute('aria-busy','true');
  try{
   if(moving()&&paper.animate){
    const draw=paper.animate([
     {transform:'perspective(900px) translateY(0) rotateZ(0) rotateY(0)',offset:0},
     {transform:'perspective(900px) translateY(-8px) rotateZ(-3deg) rotateY(0)',offset:.2},
     {transform:'perspective(900px) translateY(-8px) rotateZ(3deg) rotateY(0)',offset:.38},
     {transform:'perspective(900px) translateY(-18px) rotateZ(-2deg) rotateY(0)',offset:.55},
     {transform:'perspective(900px) translateY(-24px) rotateZ(0) rotateY(88deg)',opacity:.3,offset:1}
    ],{duration:750,easing:'ease-in-out',fill:'forwards'});
    try{await draw.finished;}catch{}finally{draw.cancel();}
   }
   cover(showResult);paper.setAttribute('aria-busy','false');
   if(moving()&&paper.animate){
    paper.classList.add('hg-fortune-reveal');
    const reveal=paper.animate([
     {transform:'perspective(900px) translateY(-24px) rotateY(-88deg)',opacity:.3},
     {transform:'perspective(900px) translateY(-5px) rotateY(5deg)',opacity:1,offset:.7},
     {transform:'perspective(900px) translateY(0) rotateY(0)',opacity:1}
    ],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
    try{await reveal.finished;}catch{}finally{reveal.cancel();}
   }
  }catch{uncover();showResult();}finally{
   paper.classList.remove('hg-fortune-reveal');paper.setAttribute('aria-busy','false');
   fortuneButton.disabled=false;fortuneButton.textContent='もう一度、引いてみる ↗';drawing=false;
  }
 });
}
const kitSection=document.querySelector('.hg-kit');
const hero=document.querySelector('.hg-hero'),hangar=document.querySelector('.hg-hangar'),feature=document.querySelector('.hg-feature');let raf=0,heroVisible=true,featureVisible=false;
function scrollFrame(){raf=0;if(!moving())return;
 if(hero&&heroVisible){const box=hero.getBoundingClientRect(),travel=Math.max(1,hero.offsetHeight-hangar.offsetHeight);const progress=Math.max(0,Math.min(1,-box.top/travel));hangar.style.setProperty('--door-progress',progress.toFixed(3));}
 if(feature&&featureVisible&&fine.matches){const b=feature.getBoundingClientRect();feature.style.setProperty('--parallax',Math.max(-25,Math.min(25,(innerHeight/2-b.top-b.height/2)*.04)).toFixed(1)+'px');}
}
const schedule=()=>{if(!raf&&moving()&&(heroVisible||featureVisible))raf=requestAnimationFrame(scrollFrame);};
function syncMotion(){if(moving()){document.documentElement.classList.add('hg-ready');schedule();}else{document.documentElement.classList.remove('hg-ready');if(root.getAnimations)root.getAnimations({subtree:true}).forEach(a=>a.cancel());if(raf)cancelAnimationFrame(raf);raf=0;}}
if(typeof IntersectionObserver==='function'){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===hero){heroVisible=entry.isIntersecting;schedule();}else if(entry.target===feature){featureVisible=entry.isIntersecting;schedule();}else if(entry.target===kitSection){kitVisible=entry.isIntersecting;document.querySelector('.hg-kit-dock').hidden=kitVisible||kit.length===0;}else if(entry.isIntersecting){if(moving()&&entry.target.animate)entry.target.animate([{opacity:.65,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});observer.unobserve(entry.target);}}},{threshold:.08});
 if(hero)observer.observe(hero);if(feature)observer.observe(feature);if(kitSection)observer.observe(kitSection);root.querySelectorAll('.hg-product,.hg-kit-heading,.hg-where-layout').forEach(n=>observer.observe(n));
}
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});window.addEventListener('tbt:motionchange',syncMotion);document.addEventListener('visibilitychange',syncMotion);window.addEventListener('pageshow',event=>{syncMotion();if(event.persisted){restoreKit();renderKit();}});window.addEventListener('storage',event=>{if(event.key===storageKey){restoreKit();renderKit();}});if(reduce.addEventListener)reduce.addEventListener('change',syncMotion);else reduce.addListener?.(syncMotion);syncMotion();
for(const surface of document.querySelectorAll('.hg-product-image')){let frame=0,px=0,py=0;surface.addEventListener('pointermove',event=>{if(!fine.matches||!moving())return;const b=surface.getBoundingClientRect();px=(event.clientX-b.left)/b.width-.5;py=(event.clientY-b.top)/b.height-.5;if(!frame)frame=requestAnimationFrame(()=>{frame=0;surface.style.setProperty('--tilt-x',(-py*5).toFixed(2)+'deg');surface.style.setProperty('--tilt-y',(px*5).toFixed(2)+'deg');});},{passive:true});surface.addEventListener('pointerleave',()=>{if(frame)cancelAnimationFrame(frame);frame=0;surface.style.removeProperty('--tilt-x');surface.style.removeProperty('--tilt-y');});}
const zoom=document.getElementById('hg-zoom');let zoomOpener=null;
if(typeof zoom.showModal==='function'){
 document.querySelectorAll('[data-zoom]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();zoomOpener=link;const img=zoom.querySelector('img');img.src=link.dataset.zoom;img.alt=link.dataset.alt;zoom.showModal();if(moving()&&zoom.animate)zoom.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:230});}));
 let closing=false;const close=async()=>{if(closing||!zoom.open)return;closing=true;if(moving()&&zoom.animate){try{await zoom.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(8px)'}],{duration:150}).finished;}catch{}}zoom.close();closing=false;zoomOpener?.focus();};zoom.addEventListener('cancel',event=>{event.preventDefault();close();});zoom.querySelector('button').addEventListener('click',close);zoom.addEventListener('click',event=>{if(event.target===zoom){const r=zoom.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});zoom.addEventListener('close',()=>zoomOpener?.focus());
}
