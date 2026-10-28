import {loadPublic,isStale,updatedLabel} from './simulator-public-api-20261028.js';
const byId=id=>document.getElementById(id);
const status=byId('ranking-status'),select=byId('ranking-group'),body=byId('ranking-body'),updated=byId('ranking-updated'),retry=byId('ranking-retry'),podium=byId('ranking-podium'),content=byId('ranking-content'),empty=byId('ranking-empty'),emptyTitle=byId('ranking-empty-title'),emptyCopy=byId('ranking-empty-copy'),connection=byId('ranking-connection'),heading=byId('ranking-group-title'),results=byId('ranking-results');
let data=null,active=null,unavailable=false;
function node(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(text!=null)element.textContent=text;return element;}
function distance(value,className){const element=node('strong',className,value.toLocaleString('ja-JP',{maximumFractionDigits:1}));element.append(node('small',null,'m'));return element;}
function emptyState(title,copy){empty.hidden=false;content.hidden=true;emptyTitle.textContent=title;emptyCopy.textContent=copy;}
function render(){
  const selected=select.value;select.replaceChildren();body.replaceChildren();podium.replaceChildren();
  if(!data){
    document.body.dataset.state=unavailable?'error':'unlinked';connection.textContent=unavailable?'取得失敗':'未連携';heading.textContent='フライトランキング';
    select.hidden=true;select.parentElement.hidden=true;updated.textContent='';
    status.textContent=unavailable?'ランキングを取得できませんでした。':'オンライン情報は現在未連携です。';
    emptyState(unavailable?'記録を読み込めませんでした':'次のフライトを、待っています。',unavailable?'通信状況を確認し、「更新する」を押してください。会場スタッフにも確認できます。':'公開データの接続後、ここに挑戦の記録が並びます。最新の受付状況は会場スタッフにご確認ください。');return;
  }
  const stale=unavailable||isStale(data);document.body.dataset.state=stale?'stale':'fresh';connection.textContent=stale?'更新停止':'データ連携済み';
  status.textContent=stale?'最新情報を確認できません。最終取得時点の記録を表示しています。':'公開に同意された記録を掲載しています。';
  updated.textContent='最終更新 '+updatedLabel(data.updatedAt)+'（日本時間）';
  for(const group of data.groups){const option=node('option',null,group.label);option.value=group.key;select.append(option);}
  if(data.groups.some(group=>group.key===selected))select.value=selected;
  select.hidden=!data.groups.length;select.parentElement.hidden=!data.groups.length;
  const group=data.groups.find(group=>group.key===select.value);heading.textContent=group?.label||'フライトランキング';
  if(!group?.entries.length){emptyState('最初の記録は、誰の手に。','この区分には、公開された記録がまだありません。');return;}
  empty.hidden=true;content.hidden=false;
  for(const entry of group.entries.slice(0,3)){
    const card=node('article','podium-card');card.append(node('span','podium-rank','RANK '+String(entry.rank).padStart(2,'0')),node('h3',null,entry.nickname),distance(entry.distanceM,'podium-distance'),node('p','podium-time',entry.challengeAt?'挑戦 '+updatedLabel(entry.challengeAt):'挑戦時刻 不明'));podium.append(card);
  }
  for(const entry of group.entries){
    const row=node('li','record');row.dataset.top=String(entry.rank<=3);row.setAttribute('aria-label',entry.rank+'位 '+entry.nickname);
    const time=node('span','record-time');time.append(node('span',null,'挑戦時刻 · 日本時間'),node('time',null,entry.challengeAt?updatedLabel(entry.challengeAt):'不明'));
    if(entry.challengeAt)time.lastElementChild.dateTime=entry.challengeAt;
    row.append(node('span','record-rank',String(entry.rank).padStart(2,'0')),node('span','record-name',entry.nickname),distance(entry.distanceM,'record-distance'),time);body.append(row);
  }
}
async function refresh(){
  if(active)return;
  const controller=new AbortController();active=controller;const timer=setTimeout(()=>controller.abort(),8000);retry.disabled=true;results.setAttribute('aria-busy','true');
  try{data=await loadPublic('ranking',controller.signal);unavailable=false;}catch{unavailable=true;}finally{clearTimeout(timer);active=null;retry.disabled=false;results.setAttribute('aria-busy','false');render();}
}
select.addEventListener('change',render);retry.addEventListener('click',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
setInterval(()=>{if(!document.hidden)refresh();},30000);
window.addEventListener('pagehide',()=>active?.abort());window.addEventListener('pageshow',event=>{if(event.persisted)refresh();});refresh();
