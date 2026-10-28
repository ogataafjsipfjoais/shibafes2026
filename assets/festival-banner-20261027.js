import {n as interop} from './rolldown-runtime-Bh1tDfsg.js';
import {r as reactFactory,i as jsxFactory} from './react-BWWYEreZ.js';
import {festivalState} from './festival-state-20261027.js';
const React=interop(reactFactory(),1),s=jsxFactory();
export function FestivalBanner(){
 const [state,setState]=React.useState(()=>festivalState(Date.now()));
 React.useEffect(()=>{let timer;const tick=()=>{clearTimeout(timer);if(document.hidden)return;const now=Date.now();setState(festivalState(now));timer=setTimeout(tick,60000-now%60000)};tick();document.addEventListener('visibilitychange',tick);window.addEventListener('pageshow',tick);return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',tick);window.removeEventListener('pageshow',tick)}},[]);
 return s.jsxs('div',{className:'tbt-festival-state','data-state':state.kind,children:[s.jsx('p',{className:'tbt-festival-state-label',children:state.label}),s.jsx('strong',{children:state.value}),s.jsx('p',{className:'tbt-festival-state-detail',children:state.detail}),state.kind==='scheduled'?s.jsx('a',{href:'https://shibaurasai.jp/',target:'_blank',rel:'noreferrer',children:'芝浦祭公式の案内を見る ↗'}):null]});
}
