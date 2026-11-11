/* Campaign UX: Japan-local deadline and reliable, honest 3D fallback. */
(()=>{
'use strict';
const days=document.getElementById('days-remaining');
if(days){
 try{
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
  const values=Object.fromEntries(parts.map(p=>[p.type,Number(p.value)]));
  const now=Date.UTC(values.year,values.month-1,values.day);
  const deadline=Date.UTC(2026,10,30);
  const remaining=Math.ceil((deadline-now)/86400000);
  days.textContent=remaining>0?'残り'+remaining+'日':remaining===0?'本日最終日':'募集期間は終了しました';
 }catch(_){days.textContent='';}
}
const root=document.getElementById('flight-experience');
const status=document.getElementById('flight-status');
const button=document.getElementById('flight-launch');
if(!root||!status)return;
let watchdog=null;
const fallback=()=>{
 if(root.classList.contains('flight-ready')||root.classList.contains('flight-fallback'))return;
 root.classList.add('flight-fallback');
 status.textContent='3Dを読み込めないため、活動写真を表示しています。';
 if(button){
  button.textContent='実際の飛行映像を見る ↗';
  button.disabled=false;
  // In the event that the module never loaded, provide a safe external alternative.
  button.addEventListener('click',()=>{if(!root.classList.contains('flight-ready'))window.open('https://youtu.be/s1ggG4gD4V4','_blank','noopener,noreferrer');},{once:true});
 }
};
const watch=()=>{
 if(watchdog!==null)return;
 watchdog=setTimeout(fallback,20000);
};
if('IntersectionObserver' in window){
 const obs=new IntersectionObserver(entries=>{
  if(entries.some(e=>e.isIntersecting)){watch();obs.disconnect();}
 },{rootMargin:'300px 0px',threshold:0});
 obs.observe(root);
}else watch();
})();
