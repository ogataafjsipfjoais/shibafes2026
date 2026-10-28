/* Both days 10:00–18:00, confirmed by the site owner. Japan time. */
export const festivalSchedule=[
 {date:'2026-10-31',opensAt:'2026-10-31T10:00:00+09:00',closesAt:'2026-10-31T18:00:00+09:00'},
 {date:'2026-11-01',opensAt:'2026-11-01T10:00:00+09:00',closesAt:'2026-11-01T18:00:00+09:00'}
];
const dayMs=86400000;
export function festivalState(now,schedule=festivalSchedule){
 const current=Number(now),dates=schedule.map(day=>day.date);
 const first=Date.parse(dates[0]+'T00:00:00+09:00'),afterLast=Date.parse(dates[dates.length-1]+'T00:00:00+09:00')+dayMs;
 const complete=schedule.every(day=>typeof day.opensAt==='string'&&typeof day.closesAt==='string'&&Number.isFinite(Date.parse(day.opensAt))&&Number.isFinite(Date.parse(day.closesAt))&&Date.parse(day.opensAt)<Date.parse(day.closesAt));
 if(complete){
  for(let i=0;i<schedule.length;i++){
   const opening=Date.parse(schedule[i].opensAt),closing=Date.parse(schedule[i].closesAt);
   if(current<opening){const minutes=Math.ceil((opening-current)/60000);return {kind:'before',label:i?'芝浦祭 次の開場まで':'芝浦祭 開場まで',value:`${Math.floor(minutes/1440)}日 ${Math.floor(minutes%1440/60)}時間 ${minutes%60}分`,detail:'開場予定：'+schedule[i].date.slice(5).replace('-','/')+' '+schedule[i].opensAt.slice(11,16)+'（日本時間）'}}
   if(current<closing)return {kind:'open',label:'SHIBAURA FESTIVAL 2026',value:'芝浦祭 開催中',detail:'TBT展示は教室棟3階・303教室。受付状況は会場の案内をご確認ください。'};
  }
  return ended();
 }
 if(current>=afterLast)return ended();
 if(current<first)return {kind:'before',label:'芝浦祭 開場まで',value:'開催日まで あと'+Math.ceil((first-current)/dayMs)+'日',detail:'10月31日・11月1日開催。開場時刻は確認中です。'};
 return {kind:'scheduled',label:'SHIBAURA FESTIVAL 2026',value:'芝浦祭の開催期間です',detail:'本日の開場・終了時刻は公式案内をご確認ください。'};
}
function ended(){return {kind:'ended',label:'SHIBAURA FESTIVAL 2026',value:'芝浦祭2026は終了しました',detail:'ご来場ありがとうございました。TBTの空への挑戦は、これからも続きます。'}}
