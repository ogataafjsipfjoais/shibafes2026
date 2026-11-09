// Crowdfunding V5 contract checks. Runs in the Pages build before deployment.
import {readFileSync,statSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const html=readFileSync('crowdfunding/index.html','utf8');
const css=readFileSync('assets/crowdfunding/experience-v5.css','utf8');
const flight=readFileSync('assets/crowdfunding/flight-3d.js','utf8');
const info=JSON.parse(readFileSync('assets/crowdfunding/campaign-snapshot.json','utf8'));
const errs=[];
const expect=(ok,msg)=>{if(!ok)errs.push(msg)};
expect((html.match(/<h1\b/g)||[]).length===1,'Exactly one page heading required');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const anchors=[...html.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
expect(new Set(ids).size===ids.length,'Duplicate DOM ids');
expect(anchors.every(a=>ids.includes(a)),'Broken in-page anchor');
expect(html.includes('クラウドファンディング'),'Campaign identity missing');
expect(html.includes('data-flight-beat="0"')&&html.includes('data-flight-beat="1"')&&html.includes('data-flight-beat="2"'),'3D three-act story absent');
expect(html.includes('aria-labelledby="main-title"')&&html.includes('id="flight-launch"'),'Interactive launch absent');
expect(html.includes('href="https://camp-fire.jp/projects/990337/view"'),'Actual donate path missing');
expect(html.includes('href="./rewards/#return-mail"')&&html.includes('href="./rewards/#return-letter"'),'Published rewards catalogue not linked');
expect(existsSync('crowdfunding/rewards/index.html'),'Published rewards page missing');
expect(info.goalJPY===410000 && info.raisedJPY===37000 && info.supporters===3,'Snapshot changed without coordinated page update');
expect(html.includes('data-goal="410000"')&&html.includes('data-raised="37000"'),'Snapshot numbers inconsistent with page');
expect(html.includes('実機映像ではありません'),'3D disclaimer needs factual distinction');
expect(html.includes('今回の結果には納得のいかない部分もあります'),'Genuine team testimony missing');
expect(html.includes('S-330')&&html.includes('鵠'),'Named next aircraft missing');
expect(html.includes('object-src \\'none\\''),'Security policy missing');
expect(!html.includes('noindex'),'Accidental noindex');
expect(html.includes('experience-v5.css')&&html.includes('flight-3d.js'),'V5 assets absent');
expect(css.includes('@import url("./experience-v4.css")'),'Base CSS dependency missing');
expect(css.includes('@media(max-width:760px)'),'Mobile rules absent');
expect(css.includes('@media(prefers-reduced-motion:reduce)'),'Reduced motion absent');
expect(flight.includes("const isMobile=matchMedia('(max-width: 760px)')"),'Mobile model selection missing');
expect(flight.includes("new URL('../',import.meta.url)"),'3D asset URL resolution absent');
for(const asset of ['assets/s320-desktop.glb','assets/s320-mobile.glb','assets/s320-render.webp','assets/crowdfunding/2026-wing-transport.jpg','assets/crowdfunding/2026-assembly.jpg','assets/crowdfunding/2026-maintenance.jpg','assets/crowdfunding/2026-propeller-team.jpg']) {
 expect(existsSync(asset)&&statSync(asset).size>10000,'Missing source asset: '+asset);
}
const mod=spawnSync(process.execPath,['--input-type=module','--check'],{input:flight,encoding:'utf8'});
expect(mod.status===0,'3D module syntax invalid: '+(mod.stderr||''));
const plain=readFileSync('assets/crowdfunding/experience-v4.js','utf8');
const checkV4=spawnSync(process.execPath,['--check'],{input:plain,encoding:'utf8'});
expect(checkV4.status===0,'Other movement logic invalid: '+(checkV4.stderr||''));
if(errs.length){console.error('FAIL Crowdfunding V5\n'+errs.join('\n'));process.exit(1)}
console.log('PASS Crowdfunding V5: hero CTA, three scene 3D, sourced testimony, published rewards, exact snapshot, responsive assets, syntax');
