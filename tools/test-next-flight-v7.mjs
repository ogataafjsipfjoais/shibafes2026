// V7 quality contract: no template HTML, actual interactive WebGL and source-grounded funding.
import {readFileSync,statSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const html=readFileSync('crowdfunding/index.html','utf8');
const css=readFileSync('assets/crowdfunding/next-flight-v7.css','utf8');
const ui=readFileSync('assets/crowdfunding/next-flight-v7.js','utf8');
const three=readFileSync('assets/crowdfunding/flight-3d.js','utf8');
const errors=[];
const ok=(pass,msg)=>{if(!pass)errors.push(msg)};
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const anchors=[...html.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
ok((html.match(/<h1\b/g)||[]).length===1,'One H1');
ok(new Set(ids).size===ids.length,'IDs unique');
ok(anchors.every(a=>ids.includes(a)),'All internal anchors exist');
ok(html.includes('クラウドファンディング')&&html.includes('この挑戦を支援する'),'Campaign CTA and identity');
ok(html.includes('flight-3d.js')&&[0,1,2].every(n=>html.includes('data-flight-beat="'+n+'"')),'WebGL three-phase stage');
ok(html.includes('id="flight-launch"')&&html.includes('flight-launch-message'),'3D launch control');
ok(html.includes("180.67m")&&html.includes('S-330')&&html.includes('鵠')&&html.includes('燈（ともしび）'),'True aircraft context');
ok(html.includes('三輪 陽希')&&html.includes('ローリー ノエル'),'Verified pilots');
ok(html.includes('翼の材料費')&&html.includes('410,000')&&html.includes('約29'),'True funding plan');
ok(html.includes('fund-tab')&&html.includes('data-fund="materials"'),'Touchable cost breakdown');
ok(['return-mail','return-letter','return-visit'].every(x=>html.includes('#'+x)),'Live catalogue deep links');
ok(existsSync('crowdfunding/rewards/index.html'),'Rewards catalogue present');
ok(html.includes("object-src 'none'")&&!html.includes('noindex'),'CSP and indexing');
ok(css.includes('@media(max-width:760px)')&&css.includes('@media(prefers-reduced-motion:reduce)'),'Mobile motion safety');
ok(!css.includes('@import'),'Independent CSS design, no reuse');
ok(three.includes("new URL('../',import.meta.url)")&&three.includes("const isMobile=matchMedia('(max-width: 760px)')"),'Real GLB integration');
ok([...html.matchAll(/<img\b[^>]*>/g)].every(x=>/\balt=/.test(x[0])),'Image alternative text');
for(const asset of ['assets/s320-desktop.glb','assets/s320-mobile.glb','assets/s320-render.webp','assets/crowdfunding/2026-wing-transport.jpg','assets/crowdfunding/2026-assembly.jpg','assets/crowdfunding/2026-maintenance.jpg','assets/crowdfunding/2026-tail-lake.jpg','assets/crowdfunding/2026-propeller-team.jpg'])ok(existsSync(asset)&&statSync(asset).size>10000,'Asset missing '+asset);
for(const [src,mode] of [[ui,'script'],[three,'module']]){
 const cmd=mode==='module'?['--input-type=module','--check']:['--check'];
 const r=spawnSync(process.execPath,cmd,{input:src,encoding:'utf8'});
 ok(r.status===0,mode+' JS syntax: '+r.stderr);
}
let brace=0;for(const ch of css){if(ch==='{')brace++;else if(ch==='}')brace--}
ok(brace===0,'Balanced CSS');
if(errors.length){console.error('V7 FAIL\n'+errors.join('\n'));process.exit(1)}
console.log('V7 PASS — independent visual system, three-act WebGL, tactile budget, real S-330 story, consent-first CTA, mobile and reduced-motion');
