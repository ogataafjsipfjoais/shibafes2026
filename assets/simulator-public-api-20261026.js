/* Proposed public display contract v1. Contains no registration or staff privileges. */
const BASE = '/shibafes2026/';
export const STALE_AFTER_MS = 120000;
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
  const response = await fetch(url,{signal,credentials:'omit',cache:'no-store',headers:{Accept:'application/json'}});
  if (!response.ok) throw Error('Public data unavailable');
  const text = await response.text();
  if (text.length > 200000) throw Error('Response too large');
  return JSON.parse(text);
}
export async function loadPublic(kind, signal) {
  const config = await json(BASE+'content/simulator-public-config.json',signal);
  if (config.schemaVersion !== 1) throw Error('Invalid config');
  const url = endpoint(config[kind === 'status' ? 'statusUrl' : 'rankingUrl']);
  if (!url) return null;
  const data = await json(url,signal);
  if(kind === 'status' && data === null) return null;
  return kind === 'status' ? validateStatus(data) : validateRanking(data);
}
export function isStale(data, now = Date.now()) { return data.sourceAvailable === false || now - timestamp(data.updatedAt,now) > STALE_AFTER_MS; }
export function updatedLabel(value) {
  return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
}
