import {distanceText,countFrame} from './distance-decimal-20261027.js';
export function createMotion(root){
 const hero=root.querySelector('.hr-hero'),lead=root.querySelector('.hr-lead'),pieces=root.querySelector('.hr-paper-pieces');
 const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let frame=0,scrollFrame=0,heroSeen=false;const jobs=new Map(),animations=new Set(),seen=new WeakSet();
 const allowed=()=>!document.hidden&&!media?.matches&&document.documentElement.dataset.motion!=='off';
 const inView=element=>{if(!element)return false;const rect=element.getBoundingClientRect();return rect.bottom>0&&rect.top<innerHeight};
 function play(element,frames,options,done){
  if(!allowed()||typeof element?.animate!=='function'){done?.();return null}
  try{const animation=element.animate(frames,options);animations.add(animation);const finish=()=>{animations.delete(animation);done?.()};animation.onfinish=finish;animation.oncancel=finish;return animation}catch{done?.();return null}
 }
 function finishCounters(){cancelAnimationFrame(frame);frame=0;jobs.forEach((job,element)=>{element.textContent=distanceText(job.end)});jobs.clear()}
 function stop(){finishCounters();Array.from(animations).forEach(animation=>animation.cancel());pieces?.replaceChildren()}
 function count(element,start,end){
  if(!allowed()||!inView(element)||end<start){element.textContent=distanceText(end);return}
  jobs.set(element,{start,end,at:performance.now()});if(!frame)frame=requestAnimationFrame(tick);
 }
 function tick(now){
  frame=0;if(!allowed()){finishCounters();return}
  jobs.forEach((job,element)=>{const t=Math.min(1,(now-job.at)/760);element.textContent=countFrame(job.start,job.end,1-Math.pow(1-t,3));if(t>=1||!element.isConnected)jobs.delete(element)});
  if(jobs.size)frame=requestAnimationFrame(tick);
 }
 function reveal(row){
  if(seen.has(row)||!inView(row))return;seen.add(row);
  if(!allowed())return;
  play(row,[{opacity:.55,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:460,easing:'cubic-bezier(.2,.7,.2,1)'});
  const value=row.querySelector('.hr-distance-value');if(value&&row.__hrCount)count(value,row.__hrStart||0,row.__hrDistance);
  const bar=row.querySelector('.hr-flight-bar>i');play(bar,[{transform:'scaleX(.2)'},{transform:'scaleX(1)'}],{duration:650,easing:'ease-out'});
 }
 function update(){
  scrollFrame=0;root.dataset.effects=allowed()?'on':'off';root.dataset.heroVisible=String(inView(hero));
  if(!allowed()){stop();return}
  if(!heroSeen&&inView(hero)){heroSeen=true;const title=root.querySelector('#hr-title');play(title,[{opacity:.6,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:1000,easing:'cubic-bezier(.2,.7,.2,1)'})}
  root.querySelectorAll('.hr-record').forEach(reveal);
 }
 const schedule=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(update)};
 const scroll=()=>{finishCounters();Array.from(animations).forEach(animation=>{if(!inView(animation.effect?.target))animation.cancel()});schedule()};
 const visibility=()=>{if(document.hidden){root.dataset.effects='off';stop()}else schedule()};
 function capture(){const positions=new Map();if(allowed())root.querySelectorAll('.hr-record[data-key]').forEach(row=>{if(inView(row))positions.set(row.dataset.key,row.getBoundingClientRect().top)});return positions}
 function rowsChanged(rows,positions,old){
  const measured=rows.map(row=>({row,top:row.getBoundingClientRect().top,visible:inView(row)}));
  measured.forEach(({row,top,visible})=>{
   const previous=row.dataset.key?old.get(row.dataset.key):null;
   row.__hrCount=!previous||previous.distanceM!==row.__hrDistance;row.__hrStart=previous?.distanceM||0;
   const before=positions.get(row.dataset.key);
   if(visible&&allowed()&&before!=null&&Math.abs(before-top)>1){seen.add(row);play(row,[{transform:'translateY('+(before-top)+'px)'},{transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.75,.2,1)'});if(row.__hrCount)count(row.querySelector('.hr-distance-value'),row.__hrStart,row.__hrDistance)}
   else if(previous&&!row.__hrCount)seen.add(row);
  });schedule();
 }
 function celebrate(){
  if(!allowed()||!inView(lead)||typeof lead.animate!=='function')return;
  play(root.querySelector('.hr-leader-flash'),[{opacity:0},{opacity:.24,offset:.25},{opacity:0}],{duration:650,easing:'ease-out'});
  pieces.replaceChildren();for(let i=0;i<8;i++){
   const bit=document.createElement('span');bit.className='hr-paper-piece';bit.style.left=(25+i*7)+'%';bit.style.background=i%3===0?'#b94731':'#eee8d8';pieces.append(bit);
   play(bit,[{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:'translate('+(i*27-90)+'px,'+(i%2?-75:-120)+'px) rotate('+(i%2?120:-100)+'deg)',opacity:0}],{duration:650+i*25,easing:'cubic-bezier(.1,.6,.2,1)'},()=>bit.remove());
  }
 }
 window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',schedule,{passive:true});document.addEventListener('visibilitychange',visibility);window.addEventListener('tbt:motionchange',visibility);window.addEventListener('pageshow',schedule);window.addEventListener('pagehide',()=>{root.dataset.effects='off';stop()});
 if(media?.addEventListener)media.addEventListener('change',visibility);else media?.addListener?.(visibility);
 schedule();return {capture,rowsChanged,celebrate,stop,schedule};
}
