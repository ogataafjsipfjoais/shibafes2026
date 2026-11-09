// Release gate: a donor-first campaign dossier, not the old 3D festival exhibition.
import {readFileSync,existsSync,statSync} from 'node:fs';
const source=readFileSync('crowdfunding/index.html','utf8');
const failed=[];function ok(condition,message){if(!condition)failed.push(message)}
const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const jumps=[...source.matchAll(/href="#([^"]+)"/g)].map(x=>x[1]);
ok((source.match(/<h1\b/g)||[]).length===1,'Exactly one H1');
ok(new Set(ids).size===ids.length,'Duplicate DOM ids');
ok(jumps.every(id=>ids.includes(id)),'Broken internal anchor');
ok(source.includes('S-330 鵠')&&source.includes('燈（ともしび）'),'Next aircraft and concept');
ok(source.includes('S-230 Cygnus')&&source.includes('180.67'),'Verified historical context');
ok(source.includes('三輪 陽希')&&source.includes('ローリー ノエル'),'Pilot names');
ok(source.includes('41<span>万円')&&source.includes('約29万円')&&source.includes('約7.7万円')&&source.includes('約4万円'),'Public funding figures');
ok((source.match(/href="https:\/\/camp-fire.jp\/projects\/990337\/view"/g)||[]).length>=4,'Support calls to action');
ok(source.includes('href="./rewards/"')&&existsSync('crowdfunding/rewards/index.html'),'Reward guide');
ok(source.includes('※S-330の完成機体写真ではありません'),'Historical photo disclaimer');
ok(source.includes('公式発表のコメントを要約'),'Pilot attribution');
ok(source.includes('rel="canonical"')&&!source.includes('noindex'),'Indexable canonical');
ok(source.includes("object-src 'none'")&&source.includes("script-src 'none'"),'CSP');
ok(source.includes('.cover-number')&&source.includes('.cover-drawing')&&source.includes('.funding-paper'),'Distinctive layout architecture');
ok(source.includes('@media(max-width:780px)')&&source.includes('@media(max-width:560px)'),'Responsive styles');
ok(source.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion styles');
ok(!source.includes('flight-experience')&&!source.includes('experience-v5.css')&&!source.includes('flight-3d.js'),'No festival 3D code');
ok(!/<script\b/.test(source),'No runtime scripts needed');
for(const filename of ['2026-assembly.jpg','2026-wing-transport.jpg','2026-maintenance.jpg','2026-tail-lake.jpg']){
 const asset='assets/crowdfunding/'+filename;
 ok(existsSync(asset)&&statSync(asset).size>10000,'Missing image '+asset);
 ok(source.includes('../assets/crowdfunding/'+filename),'Unreferenced image '+filename);
}
if(failed.length){console.error('FAIL: S-330 donation dossier\n'+failed.join('\n'));process.exit(1)}
console.log('PASS: S-330 identity, evidence, donation, accessible responsive layout, imagery, no reused 3D assets');