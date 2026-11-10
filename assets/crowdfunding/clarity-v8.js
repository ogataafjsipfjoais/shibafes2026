/* Clarity v8: only navigation and gentle, functional reveal. No scroll gimmicks. */
(()=>{'use strict';
 const menu=document.querySelector('#menu-toggle'), nav=document.querySelector('#main-nav');
 const close=()=>{
  if(!menu||!nav)return;
  menu.setAttribute('aria-expanded','false');
  menu.textContent='メニュー';
  nav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
 };
 if(menu&&nav){
  menu.addEventListener('click',()=>{
   const open=menu.getAttribute('aria-expanded')!=='true';
   menu.setAttribute('aria-expanded',String(open));
   menu.textContent=open?'閉じる':'メニュー';
   nav.classList.toggle('is-open',open);
   document.body.classList.toggle('menu-open',open);
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  window.addEventListener('resize',()=>{if(innerWidth>760)close()},{passive:true});
 }
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduced&&'IntersectionObserver' in window){
  const nodes=[...document.querySelectorAll('[data-reveal]')];
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}
   });
  },{rootMargin:'0px 0px -6% 0px',threshold:.08});
  nodes.forEach(node=>observer.observe(node));
 }else{
  document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('is-visible'));
 }
})();