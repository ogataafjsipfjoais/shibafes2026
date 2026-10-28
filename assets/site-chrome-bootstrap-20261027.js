/* Mount the same chrome components as the main page; no main/Three.js import. */
import {n as interop} from './rolldown-runtime-Bh1tDfsg.js';
import {r as reactFactory,t as clientFactory,i as jsxFactory} from './react-BWWYEreZ.js';
import {SiteHeader,SiteFooter,SkipToContent} from './site-chrome-20261027.js?v=20261027-hangar1';
const React=interop(reactFactory(),1),client=clientFactory(),s=jsxFactory();
function HeaderController(){
 const [open,setOpen]=React.useState(false);
 const [motion,setMotion]=React.useState(()=>{try{return localStorage.getItem('tbt-motion')!=='off'}catch{return true}});
 const [reduced,setReduced]=React.useState(()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
 React.useEffect(()=>{if(!window.matchMedia)return;const media=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(media.matches);if(media.addEventListener)media.addEventListener('change',change);else media.addListener?.(change);return()=>{if(media.removeEventListener)media.removeEventListener('change',change);else media.removeListener?.(change)}},[]);
 React.useEffect(()=>{document.documentElement.dataset.motion=motion&&!reduced?'on':'off';try{localStorage.setItem('tbt-motion',motion?'on':'off')}catch{}window.dispatchEvent(new Event('tbt:motionchange'))},[motion,reduced]);
 React.useEffect(()=>{if(!open)return;const key=event=>{if(event.key==='Escape')setOpen(false)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[open]);
 return s.jsxs(s.Fragment,{children:[s.jsx(SkipToContent,{}),s.jsx(SiteHeader,{secondary:true,menuOpen:open,onMenuChange:setOpen,motionEnabled:motion&&!reduced,reducedMotion:reduced,onToggleMotion:setMotion})]});
}
for(const [id,component] of [['site-header-root',HeaderController],['site-footer-root',SiteFooter]]){
 const root=document.getElementById(id);if(root)client.createRoot(root).render(s.jsx(component,{}));
}
