/* TBT crowdfunding experience — no external animation libraries. */
(() => {
 'use strict';
 const $ = (selector, root=document) => root.querySelector(selector);
 const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const header = $('.site-header');
 const nav = $('#main-nav');
 const menu = $('#menu-toggle');
 const progress = $('#read-progress');
 const sceneCounter = $('#scene-counter');
 let frame = 0;
 const closeMenu = () => {
   if (!menu || !nav) return;
   menu.setAttribute('aria-expanded', 'false');
   menu.textContent = 'メニュー';
   nav.classList.remove('is-open');
   document.body.classList.remove('menu-open');
 };
 if (menu && nav) {
   menu.addEventListener('click', () => {
     const open = menu.getAttribute('aria-expanded') !== 'true';
     menu.setAttribute('aria-expanded', String(open));
     menu.textContent = open ? '閉じる' : 'メニュー';
     nav.classList.toggle('is-open', open);
     document.body.classList.toggle('menu-open', open);
   });
   $$('#main-nav a').forEach(a => a.addEventListener('click', closeMenu));
   document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
   window.addEventListener('resize', () => { if (innerWidth > 760) closeMenu(); }, {passive:true});
 }
 const sceneNodes = $$('.story-scene');
 const onScroll = () => {
   frame = 0;
   const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
   if (progress) progress.style.transform = 'scaleX(' + Math.min(1, Math.max(0, scrollY / max)).toFixed(4) + ')';
   if (sceneCounter) {
     let current = 1;
     const marker = innerHeight * .48;
     for (let i=0; i<sceneNodes.length; i++) {
       if (sceneNodes[i].getBoundingClientRect().top <= marker) current = i+1;
     }
     sceneCounter.textContent = String(current).padStart(2,'0') + ' / ' + String(sceneNodes.length).padStart(2,'0');
   }
 };
 const requestUpdate = () => { if (!frame) frame = requestAnimationFrame(onScroll); };
 addEventListener('scroll', requestUpdate, {passive:true});
 addEventListener('resize', requestUpdate, {passive:true});
 onScroll();
 if (reduced.matches) document.documentElement.classList.add('reduced-motion');
 const revealNodes = $$('[data-reveal]');
 const scale = $('.scale');
 if (!reduced.matches && 'IntersectionObserver' in window) {
   document.documentElement.classList.add('is-enhanced');
   const observer = new IntersectionObserver(entries => {
     entries.forEach(entry => {
       if (entry.isIntersecting) {
         entry.target.classList.add('is-inview');
         observer.unobserve(entry.target);
       }
     });
   }, {rootMargin:'0px 0px -8% 0px', threshold:.12});
   revealNodes.forEach(el => observer.observe(el));
   if (scale) {
     const io = new IntersectionObserver(entries => {
       if (entries.some(entry => entry.isIntersecting)) {
         scale.classList.add('is-visible');
         io.disconnect();
       }
     }, {threshold:.28});
     io.observe(scale);
   }
   requestAnimationFrame(() => $('.hero')?.classList.add('is-ready'));
 } else {
   revealNodes.forEach(el => el.classList.add('is-inview'));
   scale?.classList.add('is-visible');
 }
 // Three meaningful routes, all leading somewhere real. No fake donation or progress data.
 const actions = {
   see: {image:'../assets/crowdfunding/2026-wing-transport.jpg',alt:'琵琶湖で40メートルの翼を運ぶTeamBirdmanTrialのメンバー',heading:'その翼を、\n自分の目で。',description:'機体の全体像を、360°。',link:'3Dで機体を見る',href:'#aircraft',outside:false},
   choose: {image:'../assets/crowdfunding/2026-propeller-team.jpg',alt:'プロペラを掲げるTeamBirdmanTrialのメンバー',heading:'応援の形を、\nあなたが選ぶ。',description:'返礼品はCAMPFIREで公開中。',link:'返礼品を見る',href:'https://camp-fire.jp/projects/990337/view',outside:true},
   support: {image:'../assets/crowdfunding/2026-assembly.jpg',alt:'飛行機の接合部を組み付ける学生たち',heading:'この挑戦を、\nあなたの一歩で。',description:'次の翼へ。',link:'CAMPFIREで支援する',href:'https://camp-fire.jp/projects/990337/view',outside:true}
 };
 const options = $$('.path-option');
 const photo = $('#path-image');
 const title = $('#path-title');
 const info = $('#path-text');
 const action = $('#path-action');
 let selected = 'see';
 function select(key) {
   const value = actions[key];
   if (!value || !photo || !title || !info || !action) return;
   selected = key;
   options.forEach(button => {
     const active = button.dataset.path === key;
     button.classList.toggle('is-active', active);
     button.setAttribute('aria-pressed', String(active));
   });
   title.textContent = value.heading;
   info.textContent = value.description;
   action.href = value.href;
   action.textContent = '';
   action.append(document.createTextNode(value.link+' '));
   const arrow = document.createElement('span');
   arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
   action.append(arrow);
   if (value.outside) { action.target='_blank'; action.rel='noopener noreferrer'; }
   else { action.removeAttribute('target'); action.removeAttribute('rel'); }
   if (photo.getAttribute('src') !== value.image) {
     photo.classList.add('is-changing');
     photo.src=value.image;
     photo.alt=value.alt;
     const targetSrc = value.image;
     if (photo.decode) {
       photo.decode().catch(()=>{}).then(() => {
         if (selected === key && photo.getAttribute('src') === targetSrc) photo.classList.remove('is-changing');
       });
     } else photo.classList.remove('is-changing');
   }
 }
 options.forEach(button => button.addEventListener('click',()=>select(button.dataset.path)));
})();
