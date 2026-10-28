import {compareDistance} from './distance-decimal-20261027.js';
/* Proposed public display contract v1. Contains no registration or staff privileges. */
const BASE = '/shibafes2026/';
export const STALE_AFTER_MS = 120000;
let staleAfterMs=STALE_AFTER_MS,requestSequence=0;
export function endpoint(value, origin = location.origin) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw Error('Invalid endpoint');
  const url = new URL(value, origin);
  if (url.username || url.password || url.hash || (url.protocol !== 'https:' && url.origin !== origin)) throw Error('Invalid endpoint');
  return url.href;
}
export function timestamp(value, now = Date.now()) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value)) throw Error('Missing timezone');
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time > now + 120000) throw Error('Invalid timestamp');
  return time;
}
export function validateStatus(data, now = Date.now()) {
  if (!data || data.schemaVersion !== 1 || !['open','paused','closed'].includes(data.reception)) throw Error('Invalid status');
  timestamp(data.updatedAt, now);
  let wait = null;
  if (data.waitMinutes != null) {
    const {min, max} = data.waitMinutes;
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min < 0 || max < min || max > 1440) throw Error('Invalid wait');
    wait = {min, max};
  }
  const result={schemaVersion:1,reception:data.reception,waitMinutes:wait,updatedAt:data.updatedAt};
  if(data.sourceAvailable!=null){if(typeof data.sourceAvailable!=='boolean')throw Error('Invalid source state');result.sourceAvailable=data.sourceAvailable;}
  return result;
}
function validDistance(value){return typeof value==='number'?Number.isFinite(value)&&value>=0&&value<=1000000:typeof value==='string'&&/^(0|[1-9][0-9]{0,6})(\.[0-9]{1,30})?$/.test(value)&&Number(value)<=1000000;}
export function validateRanking(data, now = Date.now()) {
  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.groups) || data.groups.length > 30) throw Error('Invalid rankings');
  timestamp(data.updatedAt, now);
  const keys = new Set();
  const groups = data.groups.map(group => {
    if (!group || typeof group.key !== 'string' || !/^[a-z0-9_-]{1,80}$/i.test(group.key) || keys.has(group.key) || typeof group.label !== 'string' || !group.label.trim() || group.label.length > 120 || !Array.isArray(group.entries) || group.entries.length > 10) throw Error('Invalid group');
    keys.add(group.key);
    let previousRank = 0;
    const publicKeys = new Set();
    const entries = group.entries.map(row => {
      if (!row || !Number.isSafeInteger(row.rank) || row.rank < 1 || row.rank > 10 || row.rank < previousRank || typeof row.nickname !== 'string' || !row.nickname.trim() || row.nickname.length > 40 || !validDistance(row.distanceM)) throw Error('Invalid public entry');
      previousRank = row.rank;
      if (row.challengeAt != null) timestamp(row.challengeAt, now);
      const result={rank:row.rank,nickname:row.nickname,distanceM:row.distanceM,challengeAt:row.challengeAt ?? null};
      if(row.entryKey!=null){if(typeof row.entryKey!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(row.entryKey)||publicKeys.has(row.entryKey))throw Error('Invalid public entry key');publicKeys.add(row.entryKey);result.entryKey=row.entryKey;}
      return result;
    });
    return {key:group.key,label:group.label,entries};
  });
  return {schemaVersion:1,updatedAt:data.updatedAt,groups,...(data.sourceAvailable===false?{sourceAvailable:false}:{})};
}
async function json(url, signal) {
  const requestUrl=new URL(url,location.origin);if(requestUrl.origin===location.origin)requestUrl.searchParams.set('_tbt',Date.now()+'-'+(++requestSequence));
  const response = await fetch(requestUrl.href,{signal,credentials:'omit',cache:'no-store',headers:{Accept:'application/json'}});
  if (!response.ok) throw Error('Public data unavailable');
  const text = await response.text();
  if (text.length > 200000) throw Error('Response too large');
  return JSON.parse(text);
}
function csvRows(csv) {
 if(typeof csv!=='string'||csv.length>200000||csv.trimStart().startsWith('<'))throw Error('Invalid sheet');
 const rows=[];let row=[],field='',quoted=false;
 csv=csv.replace(/^\uFEFF/,'');
 for(let i=0;i<csv.length;i++){const c=csv[i];if(c==='"'){if(quoted&&csv[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field.trim());field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(field.trim());rows.push(row);row=[];field='';}else field+=c;}
 if(quoted)throw Error('Invalid CSV quoting');if(field||row.length){row.push(field.trim());rows.push(row);}
 return rows;
}
export function statusFromCSV(csv,now=Date.now()) {
 const rows=csvRows(csv),labels=['項目','受付状況','待ち時間の下限（分）','待ち時間の上限（分）'];
 if(rows.length!==4||rows.some((r,i)=>r.length!==2||r[0]!==labels[i])||rows[0][1]!=='値')throw Error('Invalid sheet fields');
 const state=rows[1][1],states={'受付中':'open','一時停止中':'paused','受付終了':'closed'};
 if(state===''||state==='未設定')return null;if(!Object.prototype.hasOwnProperty.call(states,state))throw Error('Invalid reception');
 const min=rows[2][1],max=rows[3][1];let wait=null;
 if(min!==''||max!==''){if(!/^(0|[1-9][0-9]{0,3})$/.test(min)||!/^(0|[1-9][0-9]{0,3})$/.test(max))throw Error('Invalid wait');wait={min:Number(min),max:Number(max)};}
 return validateStatus({schemaVersion:1,reception:states[state],waitMinutes:wait,updatedAt:new Date(now).toISOString()},now);
}
// Only the formula-generated public tab is fetched, never the staff input tab.
export function rankingFromCSV(csv,now=Date.now()) {
 const rows=csvRows(csv),headers=['記録ID','公開名','飛距離（m）','公開可否'];
 if(rows.length>501||JSON.stringify(rows.shift())!==JSON.stringify(headers))throw Error('Invalid ranking fields');
 const keys=new Set(),entries=[];
 for(const row of rows){
  if(row.every(value=>value===''))continue;
  if(row.length!==4||row[3]!=='公開')throw Error('Invalid public row');
  const [entryKey,nickname,distanceM]=row;
  if(!/^[A-Za-z0-9_-]{1,80}$/.test(entryKey)||keys.has(entryKey)||!nickname||nickname.length>40||!validDistance(distanceM))throw Error('Invalid public record');
  keys.add(entryKey);entries.push({entryKey,nickname,distanceM});
 }
 entries.sort((a,b)=>compareDistance(b.distanceM,a.distanceM));
 let previous=null,rank=0;
 const top=entries.slice(0,10).map((entry,index)=>{if(previous===null||compareDistance(entry.distanceM,previous)!==0)rank=index+1;previous=entry.distanceM;return {...entry,rank};});
 return {...validateRanking({schemaVersion:1,updatedAt:new Date(now).toISOString(),groups:[{key:'all',label:'飛距離ランキング',entries:top}]},now),live:true};
}
async function sheetRanking(value,signal){
 const url=new URL(value);
 if(url.origin!=='https://docs.google.com'||url.pathname!=='/spreadsheets/d/1xU1jsvE-eoHNVBP5skd7vYcG-69_YBTqnCfSSMsMxcU/export'||url.searchParams.get('format')!=='csv'||url.searchParams.get('gid')!=='20261028'||url.searchParams.get('range')!=='A1:D501'||url.username||url.password)throw Error('Invalid public ranking range');
 url.searchParams.set('_tbt',Date.now()+'-'+(++requestSequence));
 const response=await fetch(url.href,{signal,credentials:'omit',cache:'no-store'});if(!response.ok)throw Error('Ranking sheet unavailable');
 return rankingFromCSV(await response.text());
}
async function sheetStatus(value,signal){
 const url=new URL(value);
 if(url.origin!=='https://docs.google.com'||url.pathname!=='/spreadsheets/d/1xU1jsvE-eoHNVBP5skd7vYcG-69_YBTqnCfSSMsMxcU/export'||url.searchParams.get('format')!=='csv'||url.searchParams.get('gid')!=='0'||url.searchParams.get('range')!=='A1:B4'||url.username||url.password)throw Error('Invalid public sheet range');
 url.searchParams.set('_tbt',String(Date.now()));
 const response=await fetch(url.href,{signal,credentials:'omit',cache:'no-store'});if(!response.ok)throw Error('Sheet unavailable');
 return statusFromCSV(await response.text());
}
export async function loadPublic(kind, signal) {
  const config = await json(BASE+'content/simulator-public-config.json',signal);
  if (config.schemaVersion !== 1) throw Error('Invalid config');
  staleAfterMs=Number.isSafeInteger(config.staleAfterMs)&&config.staleAfterMs>=120000&&config.staleAfterMs<=900000?config.staleAfterMs:STALE_AFTER_MS;
  if(kind==='status'&&config.statusSheetUrl)return sheetStatus(config.statusSheetUrl,signal);
  if(kind==='ranking'&&config.rankingSheetUrl)return sheetRanking(config.rankingSheetUrl,signal);
  const url = endpoint(config[kind === 'status' ? 'statusUrl' : 'rankingUrl']);
  if (!url) return null;
  const data = await json(url,signal);
  if(kind === 'status' && data === null) return null;
  return kind === 'status' ? validateStatus(data) : validateRanking(data);
}
export function isStale(data, now = Date.now()) { return data.sourceAvailable === false || now - timestamp(data.updatedAt,now) > staleAfterMs; }
export function updatedLabel(value) {
  return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
}
