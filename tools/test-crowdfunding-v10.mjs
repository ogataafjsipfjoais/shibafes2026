// Four-gate crowdfunding flight: deployment gate for accessible, honest interaction.
import {readFileSync,statSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const html=readFileSync('crowdfunding/index.html','utf8');
const css=readFileSync('assets/crowdfunding/flight-gates.css','utf8');
const game=readFileSync('assets/crowdfunding/flight-gates.js','utf8');
const errors=[];
const check=(condition,message)=>{if(!condition)errors.push(message);};
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
check(ids.length===new Set(ids).size,'Duplicate element IDs');
check((html.match(/<h1\b/g)||[]).length===1,'There must be exactly one h1');
const required=['flight-app','scene','start','takeoff','hud','gate','chapter','chapter-title','chapter-source','guide','pause','resume','skip','info','info-back','replay','finale','status-text'];
check(required.every(id=>ids.includes(id)),'Missing required game UI elements');
check(html.includes('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'),'Use pinned Three.js r128 library');
check(html.includes('flight-gates.js')&&html.includes('flight-gates.css'),'Load game JS/CSS from own assets');
check(!html.includes('editorial-v13.css')&&!html.includes('flight-3d.js'),'Do not load old scroll storytelling scripts');
check(html.indexOf('id="start"')<html.indexOf('id="hud"'),'The start interface must precede HUD');
check(html.includes('role="status"')&&html.includes('aria-live="polite"'),'Live feedback must be accessible');
check(html.includes('操作せずに読む')&&html.includes('3Dは実機の飛行ではなく'),'Noninteractive alternative and disclaimer');
check(html.includes('https://camp-fire.jp/projects/990337/view'),'Official support URL present');
check(html.includes('./rewards/')&&existsSync('crowdfunding/rewards/index.html'),'Original 10 rewards page stays reachable');
check(html.includes('金銭的なリターンはありません'),'No investment-like promises');
check(html.includes('410,000円')&&html.includes('11月30日')&&html.includes('500円'),'Grounded campaign terms');
check(html.includes('180.67m')&&html.includes('髙草木雄太')&&html.includes('大谷映奈'),'Historical facts and attribution');
check(!html.includes('現在37,000円')&&!html.includes('残り2枠')&&!html.includes('人気No.1'),'No stale funding or invented scarcity');
check(html.includes('S-330の飛行映像ではありません'),'Honest model disclaimer');
check(['pointermove','pointerdown','keydown','arrowleft','arrowright','arrowup','arrowdown','webglcontextlost','prefers-reduced-motion','flight-fallback'].filter(x=>game.includes(x)).length>=9,
      'Pointer/keyboard/fallback/reduced-motion logic must be available');
check(game.includes('gatePassed()')&&game.includes('Math.abs(deltaX)<=2.0')&&game.includes("state.passed===4"),'Actual gate collision and progression logic');
check(game.includes('window.TBTFlight')&&game.includes('const gateData=['),'Observable four-gate runtime');
check(game.includes('Math.max(1,innerWidth)')&&game.includes('renderer.setPixelRatio'),'Responsive rendering');
check(css.includes('@media(max-width:760px)')&&css.includes('prefers-reduced-motion'),'Responsive and reduced-motion styles');
check(css.includes('touch-action:none')&&css.includes('[hidden]'),'Touch steering and hidden-state styles');
check(css.includes(':focus-visible'),'Keyboard focus indication');
check(html.includes("object-src 'none'")&&html.includes('upgrade-insecure-requests'),'CSP safeguards');
check([...html.matchAll(/<img\b[^>]*>/g)].every(m=>/\balt=/.test(m[0])),'Every image needs alt');
for(const file of ['assets/crowdfunding/2026-propeller-team.jpg','assets/tbt-official-emblem.svg','assets/crowdfunding/flight-gates.js','assets/crowdfunding/flight-gates.css']){
 check(existsSync(file)&&statSync(file).size>500,'Missing original or game asset: '+file);
}
for(const [label,source] of [['game',game]]){
 const r=spawnSync(process.execPath,['--check','--input-type=commonjs'],{input:source,encoding:'utf8'});
 check(r.status===0,'JS syntax failed '+label+': '+r.stderr);
}
let braces=0;for(const ch of css){if(ch==='{')braces++;if(ch==='}')braces--;}
check(braces===0,'CSS braces unbalanced');
if(errors.length){console.error('FOUR GATES FAIL\n'+errors.join('\n'));process.exit(1);}
console.log('FOUR GATES PASS: source facts, 4 controllable gates, accessibility, sharing and support preserved');
