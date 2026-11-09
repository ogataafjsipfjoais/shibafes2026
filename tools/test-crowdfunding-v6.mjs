// V6: editorial flight-log release gate. Tests content, actual assets and safe fallbacks.
import {readFileSync,statSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const html=readFileSync('crowdfunding/index.html','utf8');
const css=readFileSync('assets/crowdfunding/runway.css','utf8');
const client=readFileSync('assets/crowdfunding/runway.js','utf8');
const flight=readFileSync('assets/crowdfunding/flight-3d.js','utf8');
const snapshot=JSON.parse(readFileSync('assets/crowdfunding/campaign-snapshot.json','utf8'));
const fail=[];
function expect(ok,msg){if(!ok)fail.push(msg)}
function checkCode(code,mode,label){const a=mode==='module'?['--input-type=module','--check']:['--check'];const p=spawnSync(process.execPath,a,{input:code,encoding:'utf8'});expect(p.status===0,label+': '+p.stderr)}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const anchors=[...html.matchAll(/href="#([^"]+)"/g)].map(x=>x[1]);
expect((html.match(/<h1\b/g)||[]).length===1,'Exactly one H1');
expect(ids.length===new Set(ids).size,'Duplicate IDs');
expect(anchors.every(x=>ids.includes(x)),'Broken hash link');
expect(html.includes('クラウドファンディング'),'Crowdfunding not highlighted');
expect(html.includes('id="flight-experience"'),'Interactive stage missing');
expect([0,1,2].every(n=>html.includes('data-flight-beat="'+n+'"')),'Three-stage flight script missing');
expect(html.includes('id="flight-launch"')&&html.includes('id="flight-launch-message"'),'Launch control or feedback missing');
expect(html.includes('href="https://camp-fire.jp/projects/990337/view"'),'Official donation not linked');
expect(['return-mail','return-letter','return-visit'].every(id=>html.includes('./rewards/#'+id)),'Official rewards catalogue anchors missing');
expect(existsSync('crowdfunding/rewards/index.html'),'Rewards catalogue absent');
expect(html.includes("今回の結果には納得のいかない部分もあります"),'Verified team voice missing');
expect(html.includes('S-330')&&html.includes('鵠'),'Next aircraft missing');
expect(html.includes('実機映像ではありません'),'The illustrative 3D distinction is missing');
expect(html.includes('data-goal="'+snapshot.goalJPY+'"')&&html.includes('data-raised="'+snapshot.raisedJPY+'"'),'Historical donation values mismatch snapshot');
expect(html.includes('2026年11月9日'),'Date of snapshot missing');
expect(html.includes("object-src 'none'")&&!html.includes('noindex'),'Security or indexability regressed');
expect(html.includes('runway.css')&&html.includes('runway.js')&&!html.includes('experience-v5.css'),'Old layout style reused');
expect(!css.includes('@import')&&css.includes('.flight-beat')&&css.includes('.build-sequence')&&css.includes('.blueprint')&&css.includes('.reward-index'),'Not a fully standalone design');
expect(css.includes('@media(max-width:760px)')&&css.includes('@media(prefers-reduced-motion:reduce)'),'Responsive/reduced motion support missing');
expect(flight.includes("const isMobile=matchMedia('(max-width: 760px)')"),'Mobile 3D model choice missing');
expect(flight.includes("new URL('../',import.meta.url)"),'GLB path resolver missing');
const imgs=[...html.matchAll(/<img\b[^>]*>/g)].map(x=>x[0]);expect(imgs.every(x=>/\balt=/.test(x)),'Missing image alternative text');
for(const path of ['assets/s320-desktop.glb','assets/s320-mobile.glb','assets/s320-render.webp',
'assets/crowdfunding/2026-wing-transport.jpg','assets/crowdfunding/2026-assembly.jpg',
'assets/crowdfunding/2026-maintenance.jpg','assets/crowdfunding/2026-tail-lake.jpg',
'assets/crowdfunding/2026-propeller-team.jpg']){
 expect(existsSync(path)&&statSync(path).size>10000,'Missing original image/model '+path);
}
checkCode(client,'script','Page JS');
checkCode(flight,'module','Flight module');
const braces=[...css].reduce((n,c)=>n+(c==='{'?1:c==='}'?-1:0),0);
expect(braces===0,'CSS brace mismatch');
if(fail.length){console.error('FAIL RUNWAY V6\n'+fail.join('\n'));process.exit(1)}
console.log('PASS RUNWAY V6: independent layout, 3D launch, support first, sourced story, reward links, data snapshot, mobile and reduced-motion');
