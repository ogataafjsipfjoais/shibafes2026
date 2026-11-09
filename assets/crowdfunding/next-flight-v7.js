/* Next Flight — responsive interactions without the old template dependencies. */
(()=>{'use strict';
 const $=sel=>document.querySelector(sel), $$=sel=>[...document.querySelectorAll(sel)];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const menu=$('#menu-toggle'),nav=$('#main-nav'),progress=$('#scroll-track');
 function closeMenu(){if(!menu||!nav)return;menu.setAttribute('aria-expanded','false');menu.textContent='目次';nav.classList.remove('is-open');document.body.classList.remove('is-menu-open')}
 if(menu&&nav){
   menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'閉じる':'目次';nav.classList.toggle('is-open',open);document.body.classList.toggle('is-menu-open',open)});
   $$('#main-nav a').forEach(a=>a.addEventListener('click',closeMenu));
   document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
   addEventListener('resize',()=>{if(innerWidth>760)closeMenu()},{passive:true});
 }
 let pending=false;
 function onScroll(){pending=false;if(progress){const d=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress.style.transform='scaleX('+Math.max(0,Math.min(1,scrollY/d)).toFixed(4)+')'}}
 addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(onScroll)}},{passive:true});
 addEventListener('resize',onScroll,{passive:true});onScroll();
 const motionNodes=$$('[data-reveal],.film-frame,.assembly');
 if(!reduce.matches&&'IntersectionObserver' in window){
  document.documentElement.classList.add('is-enhanced');
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-inview');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -7% 0px'});
  motionNodes.forEach(el=>io.observe(el));
 } else motionNodes.forEach(el=>el.classList.add('is-inview'));
 // Every amount is based on the public campaign plan. Interaction changes only the explanation.
 const plans={
  materials:{name:'翼の材料費',copy:'次の翼をつくるために。カーボンなどの機体材料。',amount:'約29',unit:'万円'},
  platform:{name:'CAMPFIRE手数料',copy:'プロジェクトの決済・運営に必要な手数料。',amount:'約7.7',unit:'万円'},
  returns:{name:'返礼品の製作・送料',copy:'支援した人に届ける品の製作費と送料。',amount:'約4',unit:'万円'}
 };
 const buttons=$$('.fund-tab'),assembly=$('#assembly'),title=$('#fund-title'),copy=$('#fund-copy'),amount=$('#fund-amount');
 function choose(key){
  const v=plans[key];if(!v||!title||!copy||!amount||!assembly)return;
  assembly.dataset.active=key;
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fund===key)));
  title.textContent=v.name;copy.textContent=v.copy;amount.textContent=v.amount;
  const unit=document.createElement('small');unit.textContent=v.unit;amount.append(unit);
 }
 buttons.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.fund)));
})();
