// WORKBENCH V10: test authentic stories, sourced testimony, and accessible donation flow.
import {readFileSync,statSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const html=readFileSync('crowdfunding/index.html','utf8');
const css=readFileSync('assets/crowdfunding/workbench-v10.css','utf8');
const ui=readFileSync('assets/crowdfunding/clarity-v8.js','utf8');
const model=readFileSync('assets/crowdfunding/flight-3d.js','utf8');
const errors=[];
const check=(value,message)=>{if(!value)errors.push(message)};
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),anchors=[...html.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
check((html.match(/<h1\b/g)||[]).length===1,'Use a single primary heading');
check(ids.length===new Set(ids).size,'No duplicate IDs');
check(anchors.every(id=>ids.includes(id)),'Every internal anchor resolves');
check(html.includes('クラウドファンディング')&&html.includes('class="cta human-primary"'),'Campaign and support visible in hero');
check([0,1,2].every(i=>html.includes('data-flight-beat="'+i+'"')),'3D flight progression preserved');
check(html.includes('id="flight-launch"')&&html.includes('id="flight-launch-message"'),'3D controls and feedback preserved');
check(html.includes("flight-3d.js")&&model.includes("new URL('../',import.meta.url)"),'Original real GLB model preserved');
check(html.includes('S-330')&&html.includes('鵠')&&html.includes('180.67'),'Real story and aircraft preserved');
check(html.includes('三輪 陽希')&&html.includes('ローリー ノエル')&&html.includes('大谷 映奈')&&html.includes('髙草木 雄太'),'Real student voices preserved');
check(['今回の結果には納得のいかない部分もあります','部員が抱えている悔しい思いを結果という形で昇華','10年越しのビッグフライトを目指します','一年間の思いをペダルに込めて'].every(x=>html.includes(x)),'Actual sourced quotes missing');
check(html.includes('https://teambirdmantrial.jp/news/')&&html.includes('2026年9月4日の公式メッセージ'),'Source links and attribution missing');
check(html.includes('id="human-title"')&&html.indexOf('id="human-title"')<html.indexOf('id="flight-experience"'),'Real people must lead before 3D');
check(html.includes('2026-propeller-team.jpg')&&html.includes('2026-assembly.jpg'),'Documentary photography missing');
check(html.includes('約29万円')&&html.includes('約7.7万円')&&html.includes('約4万円')&&html.includes('410,000円'),'Funding allocations readable');
check(html.includes('./rewards/')&&existsSync('crowdfunding/rewards/index.html'),'Published rewards page linked');
check(html.includes('https://camp-fire.jp/projects/990337/view'),'Live support action');

check(html.includes('500円から参加できます')&&html.includes('募集は2026年11月30日まで'),'Hero must state entry amount and deadline');
check(html.indexOf('次の機体づくりを支援する')>html.indexOf('それでも、')&&html.indexOf('次の機体づくりを支援する')<html.indexOf('id="people"'),'Support CTA immediately follows emotional peak');
check(!html.includes('class="support-seat"'),'No repeated guilt-based copy');
check(['お礼メール','トートバッグ','試験見学会','500円','7,000円','25,000円'].every(x=>html.includes(x)),'Three featured rewards with actual prices');
check(html.includes('グッズで応援・おすすめ')&&!html.includes('一番選ばれている'),'Recommendation must not impersonate support statistics');
check(!html.includes('支援状況の記録（2026年11月9日時点）'),'Historical-only funding readout removed');
check(html.includes('最新の進捗を見る')&&!html.includes('live-funding-track')&&!html.includes('aria-valuenow='),'Unverified progress is never presented as factual');
check(html.includes('S-330の実機映像ではありません'),'Preserve honest 3D model notice');
check(!html.includes('flight-distance-slider')&&!html.includes('fund-tab'),'Redundant interactions removed');
check(!html.includes('assembly-graphic')&&!html.includes('next-flight-v7.css'),'Unused fake CAD and layout removed');
check(css.includes('@media(max-width:760px)')&&css.includes('@media(prefers-reduced-motion:reduce)'),'Responsive and reduced motion');
check(!css.includes('@import'),'Standalone CSS');
check(css.includes('V10 | THE WORKBENCH')&&css.includes('.opening-image:before')&&css.includes('.atelier-photo:nth-child(2)'),'The independent asymmetric workbench design is missing');
check(html.includes('設計して、つくって、飛ばして。'),'Natural language is missing');
check(html.includes('hand-to-hand-v9.css')===false,'Old styling accidentally linked');
check(html.includes("object-src 'none'")&&!html.includes('noindex'),'Security and indexability');
check([...html.matchAll(/<img\b[^>]*>/g)].every(m=>/\balt=/.test(m[0])),'All images have alt');
for(const path of [
 'assets/s320-desktop.glb','assets/s320-mobile.glb',
 'assets/crowdfunding/2026-propeller-team.jpg','assets/crowdfunding/2026-wing-transport.jpg',
 'assets/crowdfunding/2026-assembly.jpg','assets/crowdfunding/2026-maintenance.jpg',
 'assets/crowdfunding/2026-tail-lake.jpg']){
 check(existsSync(path)&&statSync(path).size>10000,'Missing source asset '+path);
}
for(const [src,mode] of [[ui,'script'],[model,'module']]){
 const command=mode==='module'?['--input-type=module','--check']:['--check'];
 const r=spawnSync(process.execPath,command,{input:src,encoding:'utf8'});
 check(r.status===0,'JavaScript syntax failed '+mode+': '+r.stderr);
}
let n=0;for(const ch of css){if(ch==='{')n++;if(ch==='}')n--}check(n===0,'CSS brace balance');
if(errors.length){console.error('HAND TO HAND V9 FAIL\n'+errors.join('\n'));process.exit(1)}
console.log('HAND TO HAND V9 PASS: real voices, own visual language, human-first, 3D intact, support accessible');
