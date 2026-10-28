import {distanceText,distanceGap,compareDistance} from './distance-decimal-20261027.js';
export function rankRecords(entries){
 let previous=null,rank=0;
 return entries.map((entry,index)=>({...entry,_order:index})).sort((a,b)=>compareDistance(b.distanceM,a.distanceM)||a._order-b._order).map((entry,index)=>{
  if(previous===null||compareDistance(entry.distanceM,previous)!==0)rank=index+1;
  previous=entry.distanceM;
  return {...entry,rank,key:entry.entryKey||null,distanceText:distanceText(entry.distanceM)};
 }).map((entry,index,records)=>({...entry,gapText:distanceGap(records[0].distanceM,entry.distanceM)}));
}
export function recordSignature(records){return JSON.stringify(records.map(row=>[row.key,row.nickname,row.distanceText,row.challengeAt,row.rank]));}
export function didLeaderChange(previous,current){
 if(!previous.length||!current.length)return false;
 const leaders=rows=>rows.filter(row=>(row.distanceM===rows[0].distanceM||compareDistance(row.distanceM,rows[0].distanceM)===0));
 const before=leaders(previous),after=leaders(current);
 // Reordering tied leaders is not a change of leader; unknown identities stay conservative.
 if(before.some(row=>!row.key)||after.some(row=>!row.key))return false;
 const keys=new Set(before.map(row=>row.key));
 return after.every(row=>!keys.has(row.key));
}
export function leaderLabel(records){
 if(!records.length)return '';
 const leaders=records.filter(row=>compareDistance(row.distanceM,records[0].distanceM)===0);
 return (leaders.length>1?'同率首位：':'現在の首位：')+leaders.map(row=>row.nickname).join('・')+' ／ '+records[0].distanceText+' m';
}
