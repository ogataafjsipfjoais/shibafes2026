/* Lake Biwa takeoff experience, TeamBirdmanTrial.
 * Aircraft: the exact S-320 Meshopt GLB assets used by the existing Shibafes site.
 * Venue: an illustrative reconstruction based on 2026 official venue parameters:
 * Hikone Matsubara shore / 10 m platform / 10 m run-up / 3.5° slope.
 * Not a measured terrain, flight simulation, or footage of the competition.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const section=$('pilot'), stage=$('pilot-stage'), canvas=$('pilot-canvas');
if(!section||!stage||!canvas)return;
const beginBtn=$('pilot-begin'), quitBtn=$('pilot-quit'), repeatBtn=$('pilot-repeat');
const intro=$('pilot-intro'), hud=$('pilot-hud'), finish=$('pilot-finish');
const status=$('pilot-loading'), metrics=$('pilot-metrics');
const guide=$('pilot-guide'), message=$('pilot-message'), checkpoint=$('pilot-checkpoint'), storyTitle=$('pilot-story-title');
const readNext=$('pilot-read-next');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=matchMedia('(max-width:760px)');
const touchLimited=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1;
const lightModel=mobile.matches||touchLimited;
const T=window.THREE;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const smooth=(a,b,k)=>a+(b-a)*k;
const state={mode:'preview',ready:false,passed:0,distance:0,aircraft:'s320-'+(lightModel?'mobile':'desktop')+'.glb'};
const input={x:0,y:0,keys:new Set(),touchId:null};
let game=null,frame=0,last=0,active=false,loading=false,failed=false,beginRequested=false,elapsed=0,holdUntil=0;
const modelPath='../assets/'+state.aircraft;
const gateStories=[
 {title:'180.67mを飛んだ。',text:'2026年のS-320 Elementは、琵琶湖で180.67mを記録しました。'},
 {title:'悔しさも、次の設計へ。',text:'26代の経験を27代が受け継ぎ、次の機体づくりが始まっています。'},
 {title:'つくる日々は続く。',text:'設計、組み立て、点検。飛行の一瞬を支えるのは、その積み重ねです。'},
 {title:'S-330「鵠」へ。',text:'次の二人乗り人力プロペラ機を製作するため、支援を募っています。'}
];
const gateSpots=[
 {x:0,y:13.1,z:-45},
 {x:-6.5,y:12.2,z:-84},
 {x:6.2,y:14.0,z:-128},
 {x:-2.8,y:13.2,z:-176}
];
const expose=()=>Object.freeze({mode:state.mode,ready:state.ready,passed:state.passed,distance:Math.round(state.distance),aircraft:state.aircraft,position:game?{x:game.rig.position.x,y:game.rig.position.y,z:game.rig.position.z}:null});
Object.defineProperty(window,'TBTVenueFlight',{configurable:false,get:expose});
function show(el,on){if(el)el.hidden=!on}
function info(text){if(status){status.textContent=text;status.hidden=!text}}
function fail(text){
 failed=true;state.ready=false;state.mode='unavailable';
 show(intro,true);show(hud,false);show(finish,false);
 stage.classList.remove('is-playing');stage.classList.remove('is-ready');
 beginBtn.disabled=true;beginBtn.textContent='3Dを利用できません';
 info(text||'3Dが利用できないため、会場写真をご覧ください。');
}
function mesh(geometry,material,parent,x=0,y=0,z=0){
 const obj=new T.Mesh(geometry,material);obj.position.set(x,y,z);parent.add(obj);return obj;
}
function mat(color,roughness=1){return new T.MeshStandardMaterial({color,roughness,metalness:0.0})}
function drawVenue(scene){
 // Facing the open lake toward -Z. The platform is roughly ten metres above the water.
 const lake=mat(0x2b6776,.94),sand=mat(0xafa48e),forest=mat(0x42664b),dark=mat(0x364a43),
 deck=mat(0xd4a941,.78),blue=mat(0x2871b4,.67),metal=mat(0x738988,.62),wood=mat(0x827d69);
 const water=mesh(new T.PlaneGeometry(1100,1100,40,40),lake,scene,0,-.65,-220);
 water.rotation.x=-Math.PI/2;
 // Faint water surface reflection lines, cheap enough for a phone.
 const lineMat=new T.MeshBasicMaterial({color:0xa7d7dc,transparent:true,opacity:.16});
 for(let row=0;row<(lightModel?18:48);row++){ 
  const z=-(row*11+8);
  for(let k=0;k<3;k++){
   const length=1.4+(row%4)*1.0;
   mesh(new T.BoxGeometry(length,.008,.027),lineMat,scene,(-35+k*34+(row%5)*2.7),-.625,z);
  }
 }
 // Distant west-coast mountains and a thin horizon line. Shapes are stylized.
 const distant=new T.MeshBasicMaterial({color:0x8297a0,side:T.DoubleSide});
 for(let band=0;band<2;band++){
  const points=[],tris=[];
  const z=-315-band*20,base=band===0?4:5;
  for(let i=0;i<=32;i++){
   const x=-260+i*16.25;
   const height=base+4.5*Math.abs(Math.sin(i*.3+band*.9))+3.5*Math.abs(Math.sin(i*.9+1.3));
   const idx=points.length/3;
   points.push(x,-.6,z,x,height,z);
   if(i>0)tris.push(idx-2,idx-1,idx,idx-1,idx+1,idx);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex(tris);g.computeVertexNormals();
  mesh(g,new T.MeshBasicMaterial({color:band?0x65838d:0x8fa8a7,side:T.DoubleSide,transparent:true,opacity:band?.7:.8}),scene);
 }
 // Eastern shore behind the platform, sandy ground and dark trees.
 mesh(new T.PlaneGeometry(650,240),sand,scene,0,-.59,155).rotation.x=-Math.PI/2;
 mesh(new T.BoxGeometry(650,2,85),forest,scene,0,.18,235);
 for(let i=0;i<(lightModel?14:34);i++){ 
  const x=-190+i*12+(i%3)*2,z=82+(i%5)*11;
  mesh(new T.CylinderGeometry(.18,.26,3.2,6),wood,scene,x,1.9,z);
  const tree=mesh(new T.ConeGeometry(2.5+(i%3)*.4,6+(i%5),7),forest,scene,x,6,z);
  tree.rotation.y=i*.34;
 }
 // Long connecting pier between the shore and the tower.
 mesh(new T.BoxGeometry(6,.35,63),wood,scene,0,1.15,46);
 for(let z=19;z<=73;z+=5){
  for(const x of [-2.6,2.6])mesh(new T.BoxGeometry(.17,3,.17),metal,scene,x,.1,z);
 }
 // Platform scaffolding: realistic location/height cue, not an engineering drawing.
 const supportZ=[-11,-5,1,7,12];
 for(const z of supportZ){
  for(const x of [-12,12]){
   mesh(new T.BoxGeometry(.18,11.2,.18),metal,scene,x,4.9,z);
   mesh(new T.BoxGeometry(.13,.13,24.1),metal,scene,0,1.1,z);
   mesh(new T.BoxGeometry(.13,.13,24.1),metal,scene,0,5.8,z);
   mesh(new T.BoxGeometry(.13,.13,24.1),metal,scene,0,9.7,z);
   for(const y of [2,5,8]){
    const diagonal=mesh(new T.BoxGeometry(.075,3.8,.075),metal,scene,x,y,z-2);
    diagonal.rotation.x=(x>0?-.68:.68);
   }
  }
 }
 // 10m run-up, 3.5-degree downward pitch toward the lake.
 const slope=3.5*Math.PI/180;
 const runway=mesh(new T.BoxGeometry(24,.33,12),deck,scene,0,10.08,-3.2);
 runway.rotation.x=-slope;
 const stripe=mesh(new T.BoxGeometry(2.7,.025,11.7),blue,scene,0,10.28,-3.2);
 stripe.rotation.x=-slope;
 const nearDeck=mesh(new T.BoxGeometry(24,.32,15),deck,scene,0,10.46,9);
 const central=mesh(new T.BoxGeometry(2.7,.025,14.8),blue,scene,0,10.64,9);
 // Edge safety stripes show the runway surface (not true replica graphics).
 const edgeMat=new T.MeshBasicMaterial({color:0x141d20});
 for(const x of [-11.7,11.7]){
  for(let z=-9;z<16;z+=2.5)mesh(new T.BoxGeometry(.36,.032,1.0),edgeMat,scene,x,10.68,z);
 }
 // Low rails at the back only. The departure end stays open.
 for(const x of [-11.9,11.9]){
  for(let z=5;z<=15;z+=2.5){
   mesh(new T.CylinderGeometry(.06,.06,1.3,6),metal,scene,x,11.1,z);
  }
  mesh(new T.BoxGeometry(.08,.07,12),metal,scene,x,11.7,10);
 }
 // A few small safety boats and buoys in the lake.
 const buoyMat=mat(0xe0a25d);
 for(let i=0;i<(lightModel?12:24);i++){ 
  const x=(i%6-2.5)*25,z=-(22+Math.floor(i/6)*60);
  mesh(new T.SphereGeometry(.35,8,6),buoyMat,scene,x,-.1,z);
 }
 const boatMat=mat(0xdde8e1);
 for(const [x,z] of [[-35,-45],[42,-90],[-61,-155]]){
  mesh(new T.BoxGeometry(3.8,.58,1.5),boatMat,scene,x,-.05,z);
  mesh(new T.BoxGeometry(1.4,.8,1.0),metal,scene,x,.48,z);
 }
}
function makeGates(scene){
 const gates=[];
 for(let i=0;i<gateSpots.length;i++){
  const p=gateSpots[i],group=new T.Group();group.position.set(p.x,p.y,p.z);
  const ring=new T.Mesh(new T.TorusGeometry(1,.027,8,64),new T.MeshStandardMaterial({
   color:0xf0d19c,emissive:0x45381c,emissiveIntensity:.24,transparent:true,opacity:.58
  }));
  ring.scale.set(9.8,5.3,1);group.add(ring);
  const halo=new T.Mesh(new T.TorusGeometry(1,.013,4,48),new T.MeshBasicMaterial({
   color:0xa7dfdc,transparent:true,opacity:.18
  }));
  halo.scale.set(10.1,5.55,1);group.add(halo);
  scene.add(group);gates.push({group,ring,passed:false,p});
 }
 return gates;
}
async function setup(){
 if(loading||failed||state.ready||reduced.matches)return;
 if(!T||!T.GLTFLoader||!window.MeshoptDecoder){fail('モデルの読み込みに必要な処理が利用できません。');return;}
 loading=true;info('芝浦祭サイトのS-320機体データと会場を準備しています。');
 try{
  const renderer=new T.WebGLRenderer({canvas,antialias:!lightModel,powerPreference:'low-power',alpha:false,failIfMajorPerformanceCaveat:false});
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.04;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,lightModel?1:1.25));
  renderer.outputEncoding=T.sRGBEncoding;
  const scene=new T.Scene();scene.background=new T.Color(0x8eb7c6);scene.fog=new T.Fog(0x89abb4,210,650);
  scene.add(new T.HemisphereLight(0xfaf6e7,0x315b63,0.92));
  const sun=new T.DirectionalLight(0xfff3d4,1.18);sun.position.set(-65,135,-40);scene.add(sun);
  drawVenue(scene);
  const gates=makeGates(scene);
  const camera=new T.PerspectiveCamera(56,1,.12,1000);
  const loader=new T.GLTFLoader();loader.setMeshoptDecoder(window.MeshoptDecoder);
  await Promise.race([window.MeshoptDecoder.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('decoder timeout')),14000))]);
  const gltf=await Promise.race([loader.loadAsync(modelPath),new Promise((_,reject)=>setTimeout(()=>reject(new Error('GLB timeout')),24000))]);
  const aircraft=gltf.scene;
  const bounds=new T.Box3().setFromObject(aircraft);
  if(bounds.isEmpty())throw Error('No geometry in festival GLB');
  const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const scale=22/Math.max(size.x,size.y,size.z,.001);
  aircraft.scale.setScalar(scale);
  aircraft.position.copy(center).multiplyScalar(-scale);
  // Keep the real model and its material/detail, with no substitute box-plane.
  const rig=new T.Group();rig.add(aircraft);rig.position.set(0,11.45,10);scene.add(rig);
  game={renderer,scene,camera,rig,aircraft,gates,target:new T.Vector3()};
  state.ready=true;loading=false;stage.classList.add('is-ready');
  resize();renderPreview();info('');
  if(beginRequested)start();
 }catch(e){console.warn('Venue flight failed:',e);fail('3D会場を読み込めませんでした。写真とスクロールの機体紹介をご覧ください。');}
}
function resize(){
 if(!game)return;
 const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
 game.camera.aspect=w/h;game.camera.updateProjectionMatrix();game.renderer.setSize(w,h,false);
}
function renderPreview(){
 if(!game)return;
 game.camera.position.set(lightModel?17:22,lightModel?19.5:19,lightModel?29:28);
 game.camera.lookAt(0,10.9,6);
 game.renderer.render(game.scene,game.camera);
}
function setInputs(e){
 if(!game||!['takeoff','flying','holding'].includes(state.mode))return;
 const rect=canvas.getBoundingClientRect();
 input.x=clamp((e.clientX-rect.left)/rect.width*2-1,-1,1);
 input.y=clamp((e.clientY-rect.top)/rect.height*2-1,-1,1);
}
function start(){
 if(!state.ready){beginRequested=true;beginBtn.disabled=true;setup();return;}
 beginRequested=false;beginBtn.disabled=false;
 state.mode='takeoff';state.passed=0;state.distance=0;elapsed=0;holdUntil=0;
 input.x=0;input.y=0;input.keys.clear();
 game.rig.position.set(0,11.45,10);
 game.rig.rotation.set(0,0,0);
 game.gates.forEach(g=>{
  g.passed=false;g.ring.material.color.setHex(0xf0d19c);
  g.ring.material.emissive.setHex(0x665020);
 });
 storyTitle.textContent='琵琶湖、離陸台から。';
 message.textContent='機体を湖へ送り出します。マウス・指・矢印キーで進路と高度を操作できます。';
 checkpoint.textContent='TAKEOFF / HIKONE MATSUBARA';
 guide.textContent='離陸準備';
 show(intro,false);show(hud,true);show(finish,false);
 stage.classList.add('is-playing');status.hidden=true;
 stage.scrollIntoView({behavior:'auto',block:'center'});
 last=performance.now();request();
}
function finishFlight(){
 state.mode='complete';show(hud,false);show(finish,true);
 stage.classList.remove('is-playing');
}
function pass(){
 const g=game.gates[state.passed];g.passed=true;
 g.ring.material.color.setHex(0xa8e9c3);g.ring.material.emissive.setHex(0x316f4e);
 const s=gateStories[state.passed];state.passed++;
 storyTitle.textContent=s.title;message.textContent=s.text;
 checkpoint.textContent='GATE '+state.passed+' / 04';
 state.mode='holding';holdUntil=performance.now()+(state.passed===4?1750:1350);
 guide.textContent=state.passed===4?'4つのゲート通過':'次のゲートへ';
}
function animate(now){
 frame=0;
 if(!game||document.hidden||!active)return;
 const dt=Math.min(.22,Math.max(.002,(now-last)/1000||.016));last=now;
 const p=game.rig.position;
 const playing=['takeoff','flying','holding'].includes(state.mode);
 if(playing){
  elapsed+=dt;
  const left=input.keys.has('arrowleft')||input.keys.has('a'),right=input.keys.has('arrowright')||input.keys.has('d');
  const up=input.keys.has('arrowup')||input.keys.has('w'),down=input.keys.has('arrowdown')||input.keys.has('s');
  const steerX=clamp(input.x+(Number(right)-Number(left))*.75,-1,1);
  const steerY=clamp(input.y+(Number(down)-Number(up))*.75,-1,1);
  if(state.mode==='takeoff'){
   const t=clamp(elapsed/2.15,0,1);
   p.z=10-t*27;
   p.y=11.45-.8*t+1.85*Math.max(0,(t-.77)/.23);
   if(t>=1){state.mode='flying';storyTitle.textContent='湖上へ。';message.textContent='向こうに見える光のゲートへ。左右と上下の位置を合わせて進んでください。';}
  }else{
   const targetX=steerX*12.5,targetY=clamp(12.9-steerY*4.2,7.1,19.8);
   const easing=1-Math.exp(-dt*3.6);
   p.x=smooth(p.x,targetX,easing);
   p.y=smooth(p.y,targetY,easing);
   if(state.mode==='flying'&&state.passed<4){
    const g=game.gates[state.passed],dx=p.x-g.p.x,dy=p.y-g.p.y;
    const aligned=Math.abs(dx)<8.5&&Math.abs(dy)<4.6;
    const waitZ=g.p.z+4.0;
    if(!aligned&&p.z<=waitZ)p.z=waitZ;
    else p.z-=13.2*dt;
    if(aligned&&p.z<=g.p.z+1.3)pass();
    else if(p.z<=waitZ+2.0)guide.textContent=!aligned?(dx>0?'左へ':'右へ')+(Math.abs(dy)>4.6?(dy>0?'・下へ':'・上へ'):''):'そのまま進む';
    else guide.textContent='次の光のゲートへ';
   }else if(state.mode==='holding'&&now>=holdUntil){
    if(state.passed===4)finishFlight();
    else state.mode='flying';
   }
   if(state.mode==='holding')p.z-=.4*dt;
   state.distance=Math.max(0,-p.z-17);
   game.rig.rotation.z=smooth(game.rig.rotation.z,-steerX*.17,easing);
   game.rig.rotation.x=smooth(game.rig.rotation.x,-steerY*.055,easing);
   game.rig.rotation.y=smooth(game.rig.rotation.y,steerX*.11,easing);
  }
  if(metrics)metrics.innerHTML=(state.mode==='takeoff'?'RUNWAY 10m':'SIM '+Math.round(state.distance)+'m')+' <span>進行距離は演出上の数値</span>';
 }
 if(playing){
  const desired=new T.Vector3(p.x+(lightModel?5:12),p.y+(lightModel?9.4:9.0),p.z+(lightModel?25:22));
  game.camera.position.lerp(desired,1-Math.exp(-dt*2.75));
  game.target.set(p.x*.82,p.y+.2,p.z-2.0);
  game.camera.lookAt(game.target);
 }
 game.renderer.render(game.scene,game.camera);
 if(active&&['takeoff','flying','holding'].includes(state.mode))request();
}
function request(){if(!frame&&active&&!document.hidden&&game)frame=requestAnimationFrame(animate)}
function quit(){
 state.mode='preview';show(hud,false);show(finish,false);show(intro,true);
 stage.classList.remove('is-playing');input.keys.clear();
 if(game){game.rig.position.set(0,11.45,10);game.rig.rotation.set(0,0,0);renderPreview()}
}
function listen(){
 beginBtn.addEventListener('click',start);
 quitBtn.addEventListener('click',quit);
 repeatBtn.addEventListener('click',start);
 canvas.addEventListener('pointerdown',e=>{
  if(!['takeoff','flying','holding'].includes(state.mode))return;
  input.touchId=e.pointerId;
  try{canvas.setPointerCapture(e.pointerId)}catch(_){}
  setInputs(e);
 });
 canvas.addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse'||input.touchId===e.pointerId)setInputs(e);
 });
 canvas.addEventListener('pointerup',e=>{if(input.touchId===e.pointerId)input.touchId=null});
 canvas.addEventListener('pointercancel',()=>{input.touchId=null});
 document.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(k)&&['takeoff','flying','holding'].includes(state.mode)){
   e.preventDefault();input.keys.add(k);
  }
  if(k==='escape'&&['takeoff','flying','holding','complete'].includes(state.mode))quit();
 });
 document.addEventListener('keyup',e=>input.keys.delete(e.key.toLowerCase()));
 addEventListener('blur',()=>input.keys.clear());
 addEventListener('resize',()=>{if(game){resize();if(state.mode==='preview')renderPreview()}},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=performance.now();request()}});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('3Dの表示が中断されたため、写真へ切り替えました。')});
 if(readNext)readNext.addEventListener('click',()=>{quit();});
}
listen();
if(reduced.matches){
 fail('動きを抑える設定に合わせ、飛行演出の代わりに会場写真を表示しています。');
 return;
}
if('IntersectionObserver' in window){
 const io=new IntersectionObserver(entries=>{
  active=entries.some(e=>e.isIntersecting);
  if(active){setup();last=performance.now();request()}
 },{rootMargin:'300px 0px',threshold:0});
 io.observe(stage);
}else{active=true;setup()}
})();