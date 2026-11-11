/* TeamBirdmanTrial S-320 — scroll-controlled GLB stage.
 * Model files are the ones used on the Shibafes website:
 *   /assets/s320-desktop.glb and /assets/s320-mobile.glb.
 * They are Meshopt-compressed, hence the pinned GLTFLoader + MeshoptDecoder.
 * No required button, no scroll capture, no fake aircraft mesh.
 */
(()=>{
  'use strict';
  const root=document.getElementById('flight');
  const stage=document.getElementById('flight-stage');
  const canvas=document.getElementById('aircraft-canvas');
  const progressTrack=document.getElementById('flight-progress');
  const chapterNumber=document.getElementById('flight-number');
  const chapterEls=[...document.querySelectorAll('.chapter[data-chapter]')];
  const status=document.getElementById('model-status');
  if(!root||!stage||!canvas)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 760px)');
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);
  let renderer=null,scene=null,camera=null,rig=null,model=null;
  let initialized=false,loading=false,failed=false,visible=false;
  let scrollValue=0,raf=0,resizeRequested=false;
  const SOURCE_MODEL=()=> '../assets/s320-'+(mobile.matches?'mobile':'desktop')+'.glb';
  const setStatus=(msg)=>{if(status)status.textContent=msg||'';};
  const debug=()=>Object.freeze({model:SOURCE_MODEL(),loaded:initialized,failed,chapter:Math.min(4,Math.floor(scrollValue*4)+1),progress:Math.round(scrollValue*100)});
  Object.defineProperty(window,'TBTScrollFlight',{configurable:false,get:debug});

  function onScroll(){
    const bounds=root.getBoundingClientRect();
    const range=Math.max(1,bounds.height-innerHeight);
    scrollValue=clamp(-bounds.top/range);
    const i=Math.min(3,Math.floor(scrollValue*4));
    if(chapterNumber)chapterNumber.textContent='0'+(i+1)+' / 04';
    chapterEls.forEach((el,n)=>el.classList.toggle('is-current',n===i));
    stage.style.setProperty('--progress',scrollValue.toFixed(4));
    if(!reduce.matches)requestFrame();
  }
  let scrollTick=false;
  addEventListener('scroll',()=>{
    if(scrollTick)return;
    scrollTick=true;requestAnimationFrame(()=>{scrollTick=false;onScroll()});
  },{passive:true});
  addEventListener('resize',()=>{resizeRequested=true;onScroll();requestFrame();},{passive:true});
  onScroll();

  function fail(message){
    if(initialized)return;
    failed=true;loading=false;stage.classList.add('has-fallback');
    setStatus(message||'3Dを利用できないため、S-320の画像を表示しています。');
  }
  function buildStage(){
    const T=window.THREE;
    scene=new T.Scene();
    scene.background=new T.Color(0x20434b);
    scene.fog=new T.Fog(0x20434b,50,115);
    scene.add(new T.HemisphereLight(0xf8f3df,0x365753,2.4));
    const sun=new T.DirectionalLight(0xfff4d6,2.6);
    sun.position.set(-9,13,7);scene.add(sun);
    const fill=new T.DirectionalLight(0x85c8c3,1.5);
    fill.position.set(8,5,-10);scene.add(fill);
    camera=new T.PerspectiveCamera(40,1,.1,250);
    renderer=new T.WebGLRenderer({canvas,antialias:!mobile.matches,powerPreference:'low-power',alpha:false});
    renderer.outputEncoding=T.sRGBEncoding;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile.matches?1:1.25));
    resize();
  }
  function resize(){
    if(!renderer||!camera)return;
    const width=Math.max(1,stage.clientWidth);
    const height=Math.max(1,stage.clientHeight);
    renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  function applyScrollPose(){
    if(!rig||!camera)return;
    const t=scrollValue;
    const points=[
      {yaw:-.48,bank:-.06,pitch:-.05,x:0,y:-1.25,z:0,camX:1.0,camY:5.8,camZ:23.5},
      {yaw:.30,bank:.03,pitch:-.02,x:1.0,y:-.20,z:-.7,camX:5,camY:3.0,camZ:22},
      {yaw:-.46,bank:.12,pitch:.08,x:-.8,y:.35,z:-1.5,camX:-3.2,camY:4.1,camZ:23},
      {yaw:.45,bank:.04,pitch:-.16,x:1.0,y:1.0,z:-2.7,camX:2.4,camY:5.5,camZ:26},
      {yaw:.06,bank:0,pitch:-.10,x:0,y:1.1,z:-3.2,camX:.3,camY:6.1,camZ:27}
    ];
    const which=Math.min(3,Math.floor(t*4));
    const f=smooth(clamp(t*4-which));
    const a=points[which],b=points[which+1];
    const v=k=>lerp(a[k],b[k],f);
    rig.rotation.set(v('pitch'),v('yaw'),v('bank'));
    rig.position.set(v('x'),v('y'),v('z'));
    const distance=mobile.matches?1.48:1.0;
    camera.position.set(v('camX')*distance,v('camY')*distance,v('camZ')*distance);
    camera.lookAt(mobile.matches?0:rig.position.x*.3,rig.position.y*.4,0);
  }
  function requestFrame(){if(!initialized||!visible||document.hidden||raf||reduce.matches)return;raf=requestAnimationFrame(render)}
  function render(){
    raf=0;
    if(!initialized||!visible||document.hidden)return;
    if(resizeRequested){resizeRequested=false;resize();}
    applyScrollPose();
    renderer.render(scene,camera);
  }

  async function loadModel(){
    if(loading||initialized||failed||reduce.matches)return;
    if(!window.THREE||!window.THREE.GLTFLoader||!window.MeshoptDecoder){
      fail('3D用ライブラリが利用できません。S-320の画像を表示しています。');return;
    }
    loading=true;
    setStatus('芝浦祭サイトと同じS-320の3Dデータを読み込んでいます。');
    try{
      buildStage();
      await Promise.race([
        window.MeshoptDecoder.ready,
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('decoder timeout')),14000))
      ]);
      const loader=new window.THREE.GLTFLoader();
      loader.setMeshoptDecoder(window.MeshoptDecoder);
      const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('model timeout')),20000));
      const result=await Promise.race([loader.loadAsync(SOURCE_MODEL()),timeout]);
      if(!stage.isConnected)return;
      model=result.scene;
      const T=window.THREE;
      const box=new T.Box3().setFromObject(model);
      if(box.isEmpty())throw Error('Empty GLB scene');
      const size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
      const span=mobile.matches?10:15;
      const scale=span/Math.max(.001,size.x,size.y,size.z);
      model.scale.setScalar(scale);
      model.position.copy(center).multiplyScalar(-scale);
      rig=new T.Group();rig.add(model);scene.add(rig);
      initialized=true;loading=false;
      stage.classList.add('is-ready');
      setStatus('S-320の3Dモデルを表示中（芝浦祭サイトと共通）');
      applyScrollPose();
      renderer.render(scene,camera);
    }catch(error){
      console.warn('S-320 GLB model could not be displayed',error);
      fail('3Dモデルを読み込めないため、S-320の画像を表示しています。');
    }
  }
  // iOS/iPadOS may evict one WebGL context when the full pilot scene and
  // this additional aircraft renderer allocate two copies of the same GLB.
  // Prefer the interactive flight, with a static aircraft illustration in the article.
  const limitedTouch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1;
  if(limitedTouch){
    stage.classList.add('has-fallback');
    setStatus('タッチ端末では負荷を抑え、ここはS-320の静止画像を表示しています。上の操縦体験では実際の3D機体を使用できます。');
    return;
  }
  if(reduce.matches){
    stage.classList.add('has-fallback');
    setStatus('動きを抑える設定に合わせ、S-320の静止画像を表示しています。');
    return;
  }
  if(!window.IntersectionObserver){
    visible=true;loadModel();return;
  }
  const watcher=new IntersectionObserver(entries=>{
    visible=entries.some(e=>e.isIntersecting);
    if(visible){loadModel();requestFrame();}
  },{rootMargin:'650px 0px',threshold:0});
  watcher.observe(stage);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestFrame()});
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    initialized=false;failed=true;stage.classList.remove('is-ready');
    stage.classList.add('has-fallback');
    setStatus('3Dの描画が停止しました。S-320の画像をご覧ください。');
  });
})();
