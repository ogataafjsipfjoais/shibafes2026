import {loadPublic,isStale,updatedLabel} from './simulator-public-api-live-20261028.js';
import {rankRecords,recordSignature,didLeaderChange,leaderLabel} from './hishoroku-data-20261027.js';
import {distanceGap} from './distance-decimal-20261027.js';
import {createMotion} from './hishoroku-motion-20261027.js';
const id=name=>document.getElementById(name),root=id('hishoroku'),motion=createMotion(root);
const select=id('hr-group'),list=id('hr-list'),wrap=id('hr-list-wrap'),empty=id('hr-empty'),button=id('hr-refresh'),status=id('hr-status'),updated=id('hr-updated'),connection=id('hr-connection'),heading=id('hr-records-title'),section=id('hr-records');
let data=null,failed=false,active=null,interval=0,previous=[],previousGroup=null,signature=null;
const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!=null)el.textContent=text;return el};
function resetEmpty(message,detail){motion.stop();previous=[];previousGroup=null;signature=null;list.replaceChildren();wrap.hidden=true;empty.hidden=false;id('hr-empty-title').textContent=message;id('hr-empty-copy').textContent=detail;id('hr-lead-gap').textContent='集計中';id('hr-lead-note').textContent='記録の接続を待っています。';id('hr-leader-name').textContent='公開記録の受信後に表示します。'}
function render(){
 const chosen=select.value;
 if(!data){root.dataset.state=failed?'error':'unlinked';connection.textContent=failed?'取得失敗':'集計中';heading.textContent='空への軌跡を、ここに。';select.hidden=true;id('hr-group-label').hidden=true;updated.textContent='最終更新：未取得';status.textContent=failed?'記録を取得できませんでした。通信状況を確認し、再度更新してください。':'集計中です。公開データの接続を待っています。';resetEmpty('集計中',failed?'現在、オンラインの記録を確認できません。会場スタッフにご確認ください。':'公開記録の受信後にランキングを表示します。最新の状況は会場スタッフにご確認ください。');return}
 const stale=failed||isStale(data);root.dataset.state=stale?'stale':'fresh';connection.textContent=stale?'更新停止':'公開記録';updated.textContent=(data.live?'最終取得：':'最終更新：')+updatedLabel(data.updatedAt)+'（日本時間）';status.textContent=stale?'更新が止まっています。以下は最終取得時点の記録です。':'同じ区分の公開記録を、飛距離の長い順に掲載しています。';
 const optionsKey=JSON.stringify(data.groups.map(group=>[group.key,group.label]));
 if(select.dataset.optionsKey!==optionsKey){select.replaceChildren();for(const group of data.groups){const option=node('option',null,group.label);option.value=group.key;select.append(option)}select.dataset.optionsKey=optionsKey}
 if(data.groups.some(group=>group.key===chosen))select.value=chosen;
 select.hidden=!data.groups.length;id('hr-group-label').hidden=!data.groups.length;
 const group=data.groups.find(group=>group.key===select.value);heading.textContent=group?.label||'空への軌跡を、ここに。';
 if(!group?.entries.length){resetEmpty('集計中','この区分には、公開された記録がまだありません。');return}
 const records=rankRecords(group.entries),nextSignature=recordSignature(records),sameGroup=previousGroup===group.key;
 id('hr-lead-gap').textContent=records.length>1?distanceGap(records[0].distanceM,records[1].distanceM)+' m':'比較待ち';
 id('hr-lead-note').textContent=stale?'最終取得時点の記録から算出しています。':records.length>1?'一漕ぎの差が、順位を変えていく。':'次の挑戦の記録を待っています。';id('hr-leader-name').textContent=leaderLabel(records);
 if(sameGroup&&signature===nextSignature)return;
 const positions=sameGroup&&!stale?motion.capture():new Map(),old=new Map(sameGroup?previous.filter(row=>row.key).map(row=>[row.key,row]):[]),change=sameGroup&&!stale&&didLeaderChange(previous,records);
 motion.stop();list.replaceChildren();empty.hidden=true;wrap.hidden=false;
 for(const record of records){
  const row=node('li','hr-record');row.dataset.rank=String(record.rank);if(record.key)row.dataset.key=record.key;row.__hrDistance=record.distanceM;row.setAttribute('aria-label',record.rank+'位 '+record.nickname);
  const nameWrap=node('div','hr-name-wrap'),time=node('time',null,record.challengeAt?'挑戦 '+updatedLabel(record.challengeAt)+'（日本時間）':'挑戦時刻 不明');if(record.challengeAt)time.dateTime=record.challengeAt;nameWrap.append(node('h3','hr-name',record.nickname),time);
  const distance=node('div','hr-distance');distance.append(node('span','hr-distance-value',record.distanceText),node('span','hr-unit','m'));
  const gap=node('div','hr-gap');gap.append(node('small',null,record.rank===1?'首位':'首位との差'),node('span',null,record.gapText+' m'));
  const bar=node('div','hr-flight-bar');bar.setAttribute('aria-hidden','true');bar.style.setProperty('--flight-ratio',String(records[0].distanceM?record.distanceM/records[0].distanceM*100:0)+'%');bar.append(node('i'));
  row.append(node('span','hr-rank',String(record.rank).padStart(2,'0')),nameWrap,distance,gap,bar);list.append(row);
 }
 previous=records;previousGroup=group.key;signature=nextSignature;motion.rowsChanged(Array.from(list.children),positions,old);if(change){motion.celebrate();status.textContent='首位が交代しました。'+records[0].nickname+'、'+records[0].distanceText+' m。'}
}
async function refresh(){
 if(active||document.hidden)return;
 const controller=new AbortController();active=controller;const timeout=setTimeout(()=>controller.abort(),8000);button.disabled=true;button.textContent='更新中…';section.setAttribute('aria-busy','true');
 try{const incoming=await loadPublic('ranking',controller.signal);if(!controller.signal.aborted){data=incoming;failed=false}}catch{if(!document.hidden){data=null;failed=true}}finally{clearTimeout(timeout);active=null;button.disabled=false;button.textContent='記録を更新';section.setAttribute('aria-busy','false');render()}
}
const start=()=>{if(!interval)interval=setInterval(()=>{if(!document.hidden)refresh()},30000)};
select.addEventListener('change',render);button.addEventListener('click',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden){start();refresh()}else{clearInterval(interval);interval=0;active?.abort()}});window.addEventListener('pagehide',()=>{clearInterval(interval);interval=0;active?.abort()});window.addEventListener('pageshow',event=>{start();if(event.persisted)refresh()});start();refresh();
