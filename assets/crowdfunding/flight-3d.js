/* TeamBirdmanTrial — interactive S-320 flight stage.
   The flight is a visual metaphor, NOT a recorded flight or a simulated donation.
   Lazy WebGL, mobile model, reduced-motion fallback, and no scroll hijack. */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

const root=document.querySelector('#flight-experience');
const viewport=document.querySelector('#flight-viewport');
const canvasHost=document.querySelector('#flight-canvas');
const launchButton=document.querySelector('#flight-launch');
const launchMessage=document.querySelector('#flight-launch-message');
const status=document.querySelector('#flight-status');
const beats=[...document.querySelectorAll('.flight-beat')];
const segmentBars=[...document.querySelectorAll('.flight-progress-segment')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const isMobile=matchMedia('(max-width: 760px)');
const lowBudget=matchMedia('(max-width: 1100px)');
const SPAN=14;
let renderer=null,scene=null,camera=null,aircraft=null,rig=null;
let visible=false,ready=false,failed=false,scrollPosition=0,launchAt=0,launchFinished=false;
let frame=0,lastFrame=0,loading=false,mouseX=0,mouseY=0,observing=false;
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const smooth=(a,b,t)=>a+(b-a)*t;
function updateScroll(){
 if(!root)return;
 const rect=root.getBoundingClientRect();
 const length=Math.max(1,rect.height-innerHeight);
 scrollPosition=clamp(-rect.top/length);
 const beat=scrollPosition<.34?0:scrollPosition<.70?1:2;
 beats.forEach((item,i)=>item.classList.toggle('is-current',i===beat));
 segmentBars.forEach((item,i)=>{
   const p=clamp((scrollPosition-(i/3))*3);
   item.style.transform='scaleX('+p.toFixed(3)+')';
 });
 root.style.setProperty('--flight-progress',scrollPosition.toFixed(3));
 if(!ready)return;
}
let scheduled=false;
function requestScroll(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;updateScroll();});}
addEventListener('scroll',requestScroll,{passive:true});
addEventListener('resize',()=>{requestScroll();resize3D();},{passive:true});
updateScroll();

function resize3D(){
 if(!renderer||!camera||!canvasHost)return;
 const w=Math.max(1,canvasHost.clientWidth),h=Math.max(1,canvasHost.clientHeight);
 renderer.setSize(w,h,false);
 camera.aspect=w/h;
 camera.position.set(isMobile.matches?0:4,isMobile.matches?6:5,isMobile.matches?34:23);
 camera.lookAt(0,0,0);
 camera.updateProjectionMatrix();
}
function onFallback(reason){
 failed=true;
 if(status)status.textContent=reason;
 root?.classList.add('flight-fallback');
 if(launchButton){
  launchButton.disabled=false;
  launchButton.textContent='この挑戦を支援する ↗';
  launchButton.onclick=()=>window.open('https://camp-fire.jp/projects/990337/view','_blank','noopener,noreferrer');
 }
}
async function init3D(){
 if(ready||failed||loading||!canvasHost)return;
 if(reduced.matches){onFallback('動きを抑える設定のため静止画像を表示しています。');return;}
 const test=document.createElement('canvas');
 if(!test.getContext('webgl2')&&!test.getContext('webgl')){onFallback('この端末では静止画像を表示しています。');return;}
 loading=true;
 try{
  await MeshoptDecoder.ready;
  const loader=new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const url=new URL('../',import.meta.url).href+'s320-'+(isMobile.matches?'mobile':'desktop')+'.glb';
  if(status)status.textContent='S-320の3Dモデルを読み込んでいます。';
  const result=await loader.loadAsync(url);
  if(!root?.isConnected)return;
  aircraft=result.scene;
  const bounds=new THREE.Box3().setFromObject(aircraft);
  if(bounds.isEmpty())throw Error('Empty aircraft scene');
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  const scale=SPAN/Math.max(size.x,size.y,size.z);
  aircraft.position.copy(center).multiplyScalar(-scale);
  aircraft.scale.setScalar(scale);
  rig=new THREE.Group();
  rig.add(aircraft);
  scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xeaf7ff,0x164859,2.7));
  const sun=new THREE.DirectionalLight(0xfffae9,3.3);
  sun.position.set(-8,17,14);
  scene.add(sun);
  const rim=new THREE.DirectionalLight(0x79dafa,2.1);
  rim.position.set(8,3,-7);
  scene.add(rim);
  scene.add(rig);
  camera=new THREE.PerspectiveCamera(36,1,.1,200);
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:!lowBudget.matches,powerPreference:'low-power',preserveDrawingBuffer:false});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio,lowBudget.matches?1:1.25));
  canvasHost.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  resize3D();
  ready=true;
  root.classList.add('flight-ready');
  if(status)status.textContent='3Dを操作できます。画面をスクロールして飛行シーンを進めてください。';
  if(!observing){observing=true;const io=new IntersectionObserver(entries=>{
   visible=entries.some(entry=>entry.isIntersecting);
   if(visible)requestFrame();
  },{threshold:0});io.observe(root);}
  requestFrame();
 }catch(err){console.warn('S-320 flight scene unavailable',err);onFallback('3Dを読み込めませんでした。写真と支援ページをご利用ください。');}
 finally{loading=false;}
}
function requestFrame(){if(!frame&&ready&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
function render(now){
 frame=0;
 if(!ready||!visible||document.hidden)return;
 if(now-lastFrame<42){requestFrame();return;}
 lastFrame=now;
 let launch=0;
 if(launchAt){
  launch=clamp((now-launchAt)/2900);
  if(launch>=1&&!launchFinished){
   launchFinished=true;
   launchMessage?.classList.add('is-shown');
   launchButton?.classList.add('is-done');
   if(launchButton)launchButton.textContent='実際の支援はCAMPFIREへ ↗';
  }
 }
 const p=scrollPosition;
 const ease=p*p*(3-2*p);
 // From ground inspection to a climbing aircraft: the camera follows your reading.
 rig.position.set(smooth(-1.0,1.2,ease)+mouseX*.23, smooth(-1.35,1.55,ease)+mouseY*.12+launch*11, -launch*22);
 rig.rotation.set(smooth(-.05,-.19,ease)-launch*.31, smooth(-.33,.30,ease)+mouseX*.14, smooth(-.07,.11,ease)+launch*.12);
 const scale=smooth(.88,1.10,ease)*(1-launch*.28);
 rig.scale.setScalar(scale);
 camera.lookAt(0,launch*2.5,0);
 renderer.render(scene,camera);
 requestFrame();
}
function launch(){
 if(launchFinished){window.open('https://camp-fire.jp/projects/990337/view','_blank','noopener,noreferrer');return;}
 if(!ready){init3D().then(()=>{if(ready)startLaunch();});return;}
 startLaunch();
}
function startLaunch(){
 if(launchAt||reduced.matches||!ready)return;
 launchAt=performance.now();
 root.classList.add('is-launching');
 if(launchButton){launchButton.disabled=true;launchButton.textContent='あなたの一歩で、次の空へ。';}
 requestFrame();
}
launchButton?.addEventListener('click',launch);
viewport?.addEventListener('pointermove',event=>{
 if(event.pointerType==='touch'||reduced.matches)return;
 const rect=viewport.getBoundingClientRect();
 mouseX=clamp((event.clientX-rect.left)/rect.width)*2-1;
 mouseY=clamp((event.clientY-rect.top)/rect.height)*2-1;
},{passive:true});
viewport?.addEventListener('pointerleave',()=>{mouseX=0;mouseY=0;});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestFrame()});
if(root && 'IntersectionObserver' in window){
 const preload=new IntersectionObserver(entries=>{
  if(entries.some(e=>e.isIntersecting)){init3D();preload.disconnect();}
 },{rootMargin:'300px 0px',threshold:0});
 preload.observe(root);
}else if(root){init3D();}
