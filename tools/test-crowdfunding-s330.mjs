// The S-330 campaign is deliberately independent of the festival's 3D exhibition.
import {readFileSync,existsSync,statSync} from 'node:fs';
const page=readFileSync('crowdfunding/index.html','utf8');
const bad=[];
const require=(ok,msg)=>{if(!ok)bad.push(msg)};
const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const anchors=[...page.matchAll(/href="#([^"]+)"/g)].map(x=>x[1]);
require((page.match(/<h1\b/g)||[]).length===1,'Exactly one H1 required');
require(new Set(ids).size===ids.length,'Duplicate IDs');
require(anchors.every(x=>ids.includes(x)),'Broken internal anchor');
require(page.includes('S-330 鵠')&&page.includes('燈（ともしび）'),'Next aircraft identity');
require(page.includes('S-230 Cygnus')&&page.includes('180.67'),'Record and context');
require(page.includes('三輪 陽希')&&page.includes('ローリー ノエル'),'Actual pilot stories');
require(page.includes('41<span>万円')&&page.includes('約29万円')&&page.includes('約7.7万円')&&page.includes('約4万円'),'Published funding breakdown');
require((page.match(/href="https:\/\/camp-fire.jp\/projects\/990337\/view"/g)||[]).length>=3,'Donation calls to action');
require(page.includes('href="./rewards/"')&&existsSync('crowdfunding/rewards/index.html'),'Return guide link');
require(page.includes('※S-330の完成機体写真ではありません'),'Honest photo labeling');
require(page.includes('公式発表のコメントを要約'),'Attribution');
require(page.includes('rel="canonical"'),'Canonical');
require(page.includes("object-src 'none'")&&!page.includes('noindex'),'Security or indexability');
require(page.includes('max-width:1200px')&&page.includes('grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr)'),'Designed desktop two columns');
require(page.includes('@media(max-width:780px)')&&page.includes('@media(max-width:560px)'),'Responsive breakpoints');
require(page.includes('@media(prefers-reduced-motion:reduce)'),'Reduced motion support');
require(!page.includes('experience-v5.css')&&!page.includes('runway.css')&&!page.includes('flight-3d.js')&&!page.includes('flight-experience'),'Festival components must not be reused');
for(const f of ['2026-assembly.jpg','2026-wing-transport.jpg','2026-maintenance.jpg','2026-tail-lake.jpg']){
 const name='assets/crowdfunding/'+f;
 require(existsSync(name)&&statSync(name).size>10000,'Photo missing: '+name);
 require(page.includes('../assets/crowdfunding/'+f),'Photo link missing: '+f);
}
if(bad.length){console.error('FAIL S-330 CAMPAIGN\n'+bad.join('\n'));process.exit(1)}
console.log('PASS S-330 campaign: source-backed story, donor CTAs, two-column UI, breakpoints, honest images, no 3D reuse');