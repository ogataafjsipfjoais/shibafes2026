/* RUNWAY — small and deliberate interactions, independent of animation frameworks. */
(()=>{'use strict';
 const $=selector=>document.querySelector(selector);
 const $$=selector=>Array.from(document.querySelectorAll(selector));
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const menu=$('#menu-toggle'), nav=$('#main-nav'), pageProgress=$('#page-progress');
 function closeMenu(){if(!menu||!nav)return;menu.setAttribute('aria-expanded','false');menu.textContent='メニュー';nav.classList.remove('is-open');document.body.classList.remove('menu-open')}
 if(menu&&nav){
  menu.addEventListener('click',()=>{
   const open=menu.getAttribute('aria-expanded')!=='true';
   menu.setAttribute('aria-expanded',String(open));
   menu.textContent=open?'閉じる':'メニュー';
   nav.classList.toggle('is-open',open);
   document.body.classList.toggle('menu-open',open);
  });
  $$('#main-nav a').forEach(a=>a.addEventListener('click',closeMenu));
  addEventListener('resize',()=>{if(innerWidth>760)closeMenu()},{passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
 }
 let scheduled=false;
 function updatePageProgress(){
  scheduled=false;
  const distance=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  if(pageProgress)pageProgress.style.transform='scaleX('+Math.max(0,Math.min(1,scrollY/distance)).toFixed(4)+')';
 }
 function queueProgress(){if(scheduled)return;scheduled=true;requestAnimationFrame(updatePageProgress)}
 addEventListener('scroll',queueProgress,{passive:true});addEventListener('resize',queueProgress,{passive:true});updatePageProgress();
 const reveals=$$('[data-reveal],.record-image,.frame-photo,.wing-drawing,.meter');
 if(!reduce&&'IntersectionObserver' in window){
  document.documentElement.classList.add('is-enhanced');
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-inview');observer.unobserve(entry.target)}
   });
  },{threshold:.08,rootMargin:'0px 0px -7% 0px'});
  reveals.forEach(el=>observer.observe(el));
 }else reveals.forEach(el=>el.classList.add('is-inview'));
 // Reading progress is not fund-raising progress: only the verified snapshot drives the bar.
 const meter=$('#campaign-progress'),line=$('#campaign-fill');
 if(meter&&line){
  const goal=Number(meter.dataset.goal),raised=Number(meter.dataset.raised);
  if(goal>0&&Number.isFinite(raised)){
   line.style.width=(Math.max(0,Math.min(1,raised/goal))*100).toFixed(5)+'%';
   meter.setAttribute('aria-valuenow',String(raised));
   meter.setAttribute('aria-valuemax',String(goal));
  }
 }
})();