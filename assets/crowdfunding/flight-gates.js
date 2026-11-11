/* TeamBirdmanTrial | Four Gates
 * Three.js r128; no backend or payments. All scene geometry is illustrative.
 * Keep controls meaningful and the story accessible without WebGL.
 */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const root = $('flight-app'), canvas = $('scene'), intro = $('start'), hud = $('hud');
  const info = $('info'), finale = $('finale'), pausePanel = $('pause-panel');
  const status = $('status-text'), takeoff = $('takeoff'), nextBtn = $('return-flight');
  const pauseBtn = $('pause'), resumeBtn = $('resume'), skipBtn = $('skip');
  const replayBtn = $('replay'), infoBtn = $('read-story'), infoBack = $('info-back');
  const progressText = $('gate'), dots = [...document.querySelectorAll('.progress-dots i')];
  const chapterNum = $('chapter-number'), chapterTitle = $('chapter-title');
  const chapterText = $('chapter'), sourceLink = $('chapter-source');
  const guide = $('guide'), guideText = $('guide-hint');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAMPFIRE = 'https://camp-fire.jp/projects/990337/view';

  const stories = [
    { label: '01 / 2026年の記録', title: '180.67m。その先へ。',
      text: 'S-320 Elementは琵琶湖で180.67mを記録しました。飛べた喜びと、残った悔しさ。その両方が次の製作に残っています。',
      source: '26代副代表・髙草木雄太さんの言葉', href: 'https://teambirdmantrial.jp/news/s-320-element-%E5%BF%9C%E6%8F%B4%E3%81%82%E3%82%8A%E3%81%8C%E3%81%A8%E3%81%86%E3%81%94%E3%81%96%E3%81%84%E3%81%BE%E3%81%97%E3%81%9F%EF%BC%81/' },
    { label: '02 / 受け継ぐ', title: '26代から、27代へ。',
      text: '「部員が抱えている悔しい思いを結果という形で昇華」。新代表・大谷映奈さんは、その決意を言葉にしています。',
      source: '大谷映奈さんの代表挨拶', href: 'https://teambirdmantrial.jp/news/s-330%E3%80%80%E4%BB%A3%E8%A1%A8%E6%8C%A8%E6%8B%B6/' },
    { label: '03 / つくり続ける', title: '設計と、製作の日々。',
      text: '新しい翼も、設計・組み立て・点検の積み重ねから生まれます。S-330「鵠」に向け、27代の挑戦が始まっています。',
      source: 'TeamBirdmanTrialの活動記録', href: 'https://teambirdmantrial.jp/gallery/' },
    { label: '04 / 次の一機へ', title: '支える方法は、いくつも。',
      text: '目標41万円、募集は11月30日まで。500円のお礼メールから見学会まで、選べる10コースの返礼品があります。金銭的なリターンはありません。',
      source: '返礼品10コースを見る', href: './rewards/' }
  ];

  const state = { mode: 'intro', ready: false, passed: 0, x: 0, y: 0, keyX: 0, keyY: 0, waitUntil: 0, next: 0 };
  const keyState = new Set();
  let game = null, raf = 0, lastFrame = 0, lost = false, activePointer = null;
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
  const lerp = (a,b,t) => a+(b-a)*t;
  const setStatus = message => { if(status){status.textContent=message;status.hidden=!message;} };
  const show = (el,yes) => {if(el)el.hidden=!yes;};
  const updateDots = () => dots.forEach((el,i)=>el.classList.toggle('done',i<state.passed));

  // A read-only diagnostic for browser QA and easier debugging, not a control surface.
  Object.defineProperty(window,'TBTFlight',{configurable:false,get:()=>Object.freeze({
    mode:state.mode,ready:state.ready,passed:state.passed,
    nextGate:state.passed<4?state.passed+1:null,
    position:game?{x:game.rig.position.x,y:game.rig.position.y,z:game.rig.position.z}:null
  })});

  function showStory(index){
    const story = stories[index];
    if(!story)return;
    chapterNum.textContent=story.label;
    chapterTitle.textContent=story.title;
    chapterText.textContent=story.text;
    sourceLink.textContent=story.source+' ↗';
    sourceLink.href=story.href;
    progressText.textContent='GATE '+String(state.passed).padStart(2,'0')+' / 04';
    updateDots();
  }
  function guideForGate(){
    if(!game||state.passed>=4)return;
    const target=game.gates[state.passed].center;
    const dx=target.x-game.rig.position.x;
    const dy=target.y-game.rig.position.y;
    const xLabel=Math.abs(dx)<.9?'正面':dx>0?'右':'左';
    const yLabel=Math.abs(dy)<.65?'':dy>0?' / 上へ':' / 下へ';
    guide.textContent='次のゲート：'+xLabel+yLabel;
    guideText.textContent=game.rig.position.z<target.z+4.1?'機体をゲートの中央に合わせよう':'マウス・指・矢印キーで機首を操作';
  }
  function openInfo(message){
    if(state.mode==='flying'||state.mode==='holding')state.mode='paused';
    show(intro,false);show(hud,false);show(pausePanel,false);show(finale,false);show(info,true);
    if(message)setStatus(message);
    nextBtn.textContent=game&&state.ready&&!reducedMotion?'飛行に戻る':'支援の案内を見る';
  }
  function finish(skipped=false){
    if(state.mode==='complete'&&!skipped)return;
    state.mode='complete';
    show(intro,false);show(info,false);show(hud,false);show(pausePanel,false);show(finale,true);
    $('finale-label').textContent=skipped?'STORY / SUPPORT':'FOUR GATES COMPLETED';
    $('finale-heading').textContent=skipped?'S-330「鵠」の、次の製作へ。':'四つのゲートの、その先へ。';
    setStatus('');
  }
  function resetScene(){
    state.passed=0;state.x=0;state.y=0;state.keyX=0;state.keyY=0;state.waitUntil=0;state.next=0;
    keyState.clear();
    if(game){
      game.rig.position.set(0,2.2,5);
      game.rig.rotation.set(0,0,0);
      game.gates.forEach(g=>{
        g.passed=false;g.ring.material.color.setHex(0xe8be74);
        g.ring.material.emissive.setHex(0x57401b);g.ring.visible=true;
      });
    }
    updateDots();
  }
  function begin(){
    if(reducedMotion||!state.ready){openInfo('3Dが利用できないため、読む形式で物語を表示しています。');return;}
    resetScene();
    state.mode='flying';
    show(intro,false);show(info,false);show(finale,false);show(pausePanel,false);show(hud,true);
    progressText.textContent='GATE 00 / 04';
    chapterNum.textContent='FLIGHT / 00';
    chapterTitle.textContent='最初のゲートへ。';
    chapterText.textContent='前方に見える光の輪を目指してください。進路がずれても、ゲートの前で待てます。';
    sourceLink.hidden=true;
    guideForGate();
    setStatus('');
  }
  function pause(){
    if(state.mode!=='flying'&&state.mode!=='holding')return;
    state.mode='paused';show(hud,false);show(pausePanel,true);
  }
  function resume(){
    if(!state.ready){openInfo('3Dの表示ができません。');return;}
    show(pausePanel,false);show(info,false);show(hud,true);
    state.mode=state.waitUntil>performance.now()?'holding':'flying';
    lastFrame=performance.now();
  }
  function gatePassed(){
    const g=game.gates[state.passed];g.passed=true;g.ring.material.color.setHex(0xa8e9c2);g.ring.material.emissive.setHex(0x2a5e43);
    state.passed++;
    showStory(state.passed-1);
    sourceLink.hidden=false;
    if(state.passed===4){
      state.mode='holding';state.waitUntil=performance.now()+2800;
      guide.textContent='4 / 4 ゲート通過';guideText.textContent='飛行体験が完了しました';
    }else{
      state.mode='holding';state.waitUntil=performance.now()+2600;
      guide.textContent='GATE '+String(state.passed)+' 通過';guideText.textContent='次のゲートへ進みます';
    }
  }

  function createPlane(THREE){
    const plane=new THREE.Group();
    const pale=new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.65,metalness:.02,side:THREE.DoubleSide});
    const teal=new THREE.MeshStandardMaterial({color:0x2b6553,roughness:.55,side:THREE.DoubleSide});
    const gold=new THREE.MeshStandardMaterial({color:0xe8bd78,roughness:.65,side:THREE.DoubleSide});
    const dark=new THREE.MeshStandardMaterial({color:0x1d3530,roughness:.5});
    const fuselage=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,3.4,16),pale);
    fuselage.rotation.x=Math.PI/2;fuselage.position.z=-.2;plane.add(fuselage);
    const nose=new THREE.Mesh(new THREE.SphereGeometry(.19,12,10),gold);nose.scale.z=1.35;nose.position.z=-2.02;plane.add(nose);
    const cockpit=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),dark);cockpit.scale.set(.8,.65,1.7);cockpit.position.set(0,.27,-.38);plane.add(cockpit);
    const shape=new THREE.Shape();
    shape.moveTo(-4.0,.24);shape.lineTo(-.75,-.45);shape.lineTo(.75,-.45);shape.lineTo(4.0,.24);
    shape.lineTo(3.2,1.23);shape.lineTo(-3.2,1.23);shape.closePath();
    const wing=new THREE.Mesh(new THREE.ShapeGeometry(shape),pale);
    wing.rotation.x=-Math.PI/2;wing.position.y=.03;wing.position.z=-.35;plane.add(wing);
    for(const x of [-3.2,3.2]){
      const tip=new THREE.Mesh(new THREE.BoxGeometry(.32,.035,.82),gold);tip.position.set(x,.08,-.82);plane.add(tip);
    }
    const stabilizer=new THREE.Mesh(new THREE.BoxGeometry(1.95,.055,.52),teal);stabilizer.position.set(0,.13,1.35);plane.add(stabilizer);
    const fin=new THREE.Mesh(new THREE.BoxGeometry(.08,.8,.65),teal);fin.position.set(0,.48,1.32);plane.add(fin);
    const prop=new THREE.Group();prop.position.set(0,0,-2.14);
    for(let i=0;i<2;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.11,1.45,.06),dark);blade.rotation.z=i*Math.PI/2;prop.add(blade)}
    plane.add(prop);
    const rig=new THREE.Group();rig.position.set(0,2.2,5);rig.add(plane);
    return {rig,prop,plane};
  }

  function init3D(){
    if(reducedMotion){setStatus('動きを抑える設定のため、読む形式を用意しています。');return;}
    if(!window.THREE){setStatus('3Dエンジンを読み込めませんでした。物語は読む形式でご覧になれます。');return;}
    try{
      const T=window.THREE;
      const renderer=new T.WebGLRenderer({canvas,antialias:innerWidth>700,powerPreference:'low-power',alpha:false});
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
      renderer.setSize(innerWidth,innerHeight,false);
      renderer.outputEncoding=T.sRGBEncoding;
      const scene=new T.Scene();scene.background=new T.Color(0x1d342e);scene.fog=new T.Fog(0x1d342e,26,119);
      scene.add(new T.HemisphereLight(0xf8f0df,0x1c3c30,2.2));
      const sun=new T.DirectionalLight(0xffe4b1,1.9);sun.position.set(-5,12,7);scene.add(sun);
      const rim=new T.DirectionalLight(0x8ec9a9,1.0);rim.position.set(6,6,-12);scene.add(rim);
      const groundMat=new T.MeshStandardMaterial({color:0x152921,roughness:1});
      const ground=new T.Mesh(new T.PlaneGeometry(250,400),groundMat);ground.rotation.x=-Math.PI/2;ground.position.set(0,-.72,-80);scene.add(ground);
      const grid=new T.GridHelper(230,46,0x527661,0x2d5040);grid.position.y=-.69;grid.position.z=-66;scene.add(grid);
      const centerLineMaterial=new T.MeshBasicMaterial({color:0xa1bc9a});
      for(let i=0;i<50;i++){
        const dash=new T.Mesh(new T.BoxGeometry(.07,.012,1.7),centerLineMaterial);
        dash.position.set(0,-.66,8-i*5.1);scene.add(dash);
      }
      const {rig,prop,plane}=createPlane(T);scene.add(rig);
      const gateData=[
        {x:1.35,y:2.2,z:-16},
        {x:-3.45,y:2.85,z:-36},
        {x:3.6,y:1.65,z:-56},
        {x:-2.9,y:2.55,z:-77}
      ];
      const gates=gateData.map((item,i)=>{
        const center=new T.Vector3(item.x,item.y,item.z);
        const mat=new T.MeshStandardMaterial({color:0xe8be74,emissive:0x57401b,emissiveIntensity:.85,roughness:.45,metalness:.16});
        const ring=new T.Mesh(new T.TorusGeometry(1,.015,8,88),mat);
        ring.scale.set(4.5,2.9,1);ring.position.copy(center);
        scene.add(ring);
        const disc=new T.Mesh(new T.TorusGeometry(1,.006,5,72),new T.MeshBasicMaterial({color:0xe1cfa1,transparent:true,opacity:.18}));
        disc.position.copy(center);disc.scale.set(4.85,3.2,1);scene.add(disc);
        const pillars=new T.Mesh(new T.CylinderGeometry(.065,.075,5.0,7),new T.MeshBasicMaterial({color:0x9ab3a0}));
        pillars.position.set(item.x+6.15,1.7,item.z);scene.add(pillars);
        return {center,ring,disc,passed:false};
      });
      const camera=new T.PerspectiveCamera(54,innerWidth/innerHeight,.1,220);
      camera.position.set(0,5.6,17);
      const target=new T.Vector3();
      game={renderer,scene,camera,rig,plane,prop,gates,target};
      state.ready=true;root.classList.add('is-ready');setStatus('');
      resize();
      request();
    }catch(e){
      console.warn('Flight 3D initialization failed:',e);
      setStatus('この端末では3Dを表示できません。文章と支援先は引き続き利用できます。');
    }
  }
  function resize(){
    if(!game)return;
    game.camera.aspect=Math.max(1,innerWidth)/Math.max(1,innerHeight);
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(Math.max(1,innerWidth),Math.max(1,innerHeight),false);
  }
  function updateInput(dt){
    const left=keyState.has('arrowleft')||keyState.has('a');
    const right=keyState.has('arrowright')||keyState.has('d');
    const up=keyState.has('arrowup')||keyState.has('w');
    const down=keyState.has('arrowdown')||keyState.has('s');
    const x=Number(right)-Number(left), y=Number(down)-Number(up);
    if(x)state.x=clamp(state.x+x*dt*.74,-1,1);
    if(y)state.y=clamp(state.y+y*dt*.74,-1,1);
  }
  function animate(now){
    raf=0;
    if(!game||lost||document.hidden)return;
    const dt=Math.min(.045,Math.max(.001,(now-lastFrame)/1000||.016));lastFrame=now;
    if(state.mode==='flying'||state.mode==='holding'){
      updateInput(dt);
      const rig=game.rig, goalX=state.x*5.2, goalY=clamp(2.2-state.y*1.8,.75,4.3);
      const ease=1-Math.exp(-dt*2.9);
      rig.position.x=lerp(rig.position.x,goalX,ease);
      rig.position.y=lerp(rig.position.y,goalY,ease);
      game.plane.rotation.z=lerp(game.plane.rotation.z,(goalX-rig.position.x)*-.075,1-Math.exp(-dt*3));
      game.plane.rotation.x=lerp(game.plane.rotation.x,(goalY-rig.position.y)*.09,1-Math.exp(-dt*3));
      if(state.mode==='holding'){
        if(now>=state.waitUntil){
          if(state.passed===4){finish(false);}
          else{state.mode='flying';guideForGate();}
        }
      }else if(state.passed<4){
        const g=game.gates[state.passed],deltaX=g.center.x-rig.position.x,deltaY=g.center.y-rig.position.y;
        const aligned=Math.abs(deltaX)<=2.0&&Math.abs(deltaY)<=1.45;
        const waitingZ=g.center.z+2.55;
        if(!aligned&&rig.position.z<=waitingZ)rig.position.z=waitingZ;
        else rig.position.z-=6.7*dt;
        if(rig.position.z<=g.center.z+.7&&aligned)gatePassed();
        guideForGate();
      }
    }
    if(state.mode!=='paused'&&state.mode!=='complete')game.prop.rotation.z+=dt*10;
    const cam=game.camera, p=game.rig.position;
    const desired=new window.THREE.Vector3(p.x*.74,p.y+3.35,p.z+10.2);
    cam.position.lerp(desired,1-Math.exp(-dt*3.8));
    game.target.set(p.x*.84,p.y+.15,p.z-12);
    cam.lookAt(game.target);
    game.renderer.render(game.scene,cam);
    request();
  }
  function request(){if(!raf&&!document.hidden&&game&&!lost)raf=requestAnimationFrame(animate)}
  function fallback(message){
    state.ready=false;lost=true;
    root.classList.remove('is-ready');
    setStatus(message||'3Dを表示できませんでした。文章でも物語を読めます。');
    if(state.mode==='flying'||state.mode==='holding'||state.mode==='paused')openInfo(message);
  }
  function bindEvents(){
    takeoff.addEventListener('click',begin);
    $('support-skip').addEventListener('click',()=>finish(true));
    infoBtn.addEventListener('click',()=>openInfo(''));
    skipBtn.addEventListener('click',()=>finish(true));
    pauseBtn.addEventListener('click',pause);
    resumeBtn.addEventListener('click',resume);
    $('pause-skip').addEventListener('click',()=>finish(true));
    infoBack.addEventListener('click',()=>{if(!state.ready||reducedMotion){finish(true);}else if(state.passed===0&&state.mode!=='paused')begin();else resume();});
    replayBtn.addEventListener('click',()=>{if(state.ready&&!reducedMotion)begin();else openInfo('3Dを利用できないため、文章で物語をご覧ください。')});
    const updatePointer=e=>{
      if(state.mode!=='flying'&&state.mode!=='holding')return;
      if(e.pointerType==='touch'&&activePointer!==e.pointerId)return;
      const rect=canvas.getBoundingClientRect();
      state.x=clamp(((e.clientX-rect.left)/rect.width)*2-1,-1,1);
      state.y=clamp(((e.clientY-rect.top)/rect.height)*2-1,-1,1);
    };
    canvas.addEventListener('pointerdown',e=>{activePointer=e.pointerId;try{canvas.setPointerCapture(e.pointerId)}catch(_){}updatePointer(e);});
    canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||activePointer===e.pointerId)updatePointer(e)});
    canvas.addEventListener('pointerup',e=>{if(e.pointerId===activePointer)activePointer=null});
    canvas.addEventListener('pointercancel',()=>{activePointer=null});
    document.addEventListener('keydown',e=>{
      const k=e.key.toLowerCase();
      if(['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(k)&&['flying','holding'].includes(state.mode)){
        e.preventDefault();keyState.add(k);
      }
      if((k==='p'||k==='escape')&&['flying','holding'].includes(state.mode)){e.preventDefault();pause();}
      else if((k==='p'||k==='escape')&&state.mode==='paused'){e.preventDefault();resume();}
    });
    document.addEventListener('keyup',e=>keyState.delete(e.key.toLowerCase()));
    window.addEventListener('blur',()=>keyState.clear());
    window.addEventListener('resize',resize,{passive:true});
    document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();if(!document.hidden)request()});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('3Dの描画が中断されました。文章と支援先をご利用ください。')});
    const footerLink=document.querySelector('#source-credits');
    if(footerLink)footerLink.href=CAMPFIRE;
  }
  bindEvents();
  if(reducedMotion){setStatus('動きを抑える設定が有効です。「物語を読む」で内容を確認できます。');}
  else init3D();
})();