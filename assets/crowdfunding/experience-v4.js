
/* Crowdfunding journey v4. Real money/data never inferred from scroll or interactions. */
(() => {
 'use strict';
 const $ = (selector, root=document) => root.querySelector(selector);
 const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
 const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const menu = $('#menu-toggle');
 const links = $('#main-nav');
 const close = () => {
   if (!links || !menu) return;
   links.classList.remove('is-open');
   menu.setAttribute('aria-expanded','false');
   menu.textContent = 'メニュー';
 };
 if (menu && links) {
   menu.addEventListener('click', () => {
     const open = menu.getAttribute('aria-expanded') !== 'true';
     links.classList.toggle('is-open',open);
     menu.setAttribute('aria-expanded',String(open));
     menu.textContent = open ? '閉じる' : 'メニュー';
   });
   $$('#main-nav a').forEach(link => link.addEventListener('click',close));
   document.addEventListener('keydown', e => {if(e.key==='Escape')close()});
   window.addEventListener('resize', () => {if(innerWidth>760)close()}, {passive:true});
 }
 const hero = $('.hero');
 if(hero)requestAnimationFrame(()=>hero.classList.add('is-ready'));
 // Keep source-snapshot numbers static: GSAP only animates their visual presentation.
 const progress = $('#campaign-progress');
 const fill = $('#campaign-fill');
 const marker = $('#campaign-marker');
 if(progress && fill){
   const goal = Number(progress.dataset.goal);
   const raised = Number(progress.dataset.raised);
   const pct = goal > 0 ? Math.max(0,Math.min(100,raised/goal*100)) : 0;
   fill.style.width = pct.toFixed(4)+'%';
   progress.setAttribute('aria-valuenow',String(raised));
   progress.setAttribute('aria-valuemax',String(goal));
   if(marker)marker.style.left=pct.toFixed(4)+'%';
 }
 const gsap = window.gsap;
 const ScrollTrigger = window.ScrollTrigger;
 if(!reduce && gsap && ScrollTrigger) {
   gsap.registerPlugin(ScrollTrigger);
   const reveal=$$('[data-enter]');
   reveal.forEach(element=>{
     gsap.from(element,{
       opacity:0,y:26,duration:.85,ease:'power2.out',
       scrollTrigger:{trigger:element,start:'top 88%',once:true}
     });
   });
   const wing = $('#wing-photo');
   if(wing && innerWidth>=800){
     gsap.fromTo(wing,{xPercent:-4},{xPercent:0,duration:1.6,ease:'none',scrollTrigger:{trigger:'.chapter-one',start:'top bottom',end:'bottom 20%',scrub:.9}});
   }
   if(fill && progress) {
     gsap.fromTo(fill,{scaleX:0,transformOrigin:'left center'},{scaleX:1,duration:1.25,ease:'power2.out',scrollTrigger:{trigger:'.progress-info',start:'top 85%',once:true}});
     if(marker)gsap.fromTo(marker,{left:'0%'},{left:fill.style.width,duration:1.25,ease:'power2.out',scrollTrigger:{trigger:'.progress-info',start:'top 85%',once:true}});
   }
   const Lenis=window.Lenis;
   if(Lenis && innerWidth >= 800 && window.matchMedia('(pointer:fine)').matches){
     try {
       const lenis=new Lenis({autoRaf:false,anchors:true,smoothWheel:true,lerp:.095});
       document.documentElement.style.scrollBehavior='auto';
       lenis.on('scroll',ScrollTrigger.update);
       gsap.ticker.add(t=>lenis.raf(t*1000));
       gsap.ticker.lagSmoothing(0);
     } catch(error) { console.warn('Native scroll fallback',error); }
   }
 } else if(!reduce && 'IntersectionObserver' in window){
   // A deliberately small fallback when the optional GSAP CDN is unavailable.
   const io=new IntersectionObserver(entries=>{
     for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-inview');io.unobserve(entry.target)}
   },{threshold:.1});
   $$('[data-enter]').forEach(el=>io.observe(el));
 }
})();
