/** TBT 芝浦祭2026 来場者記録受付。管理関数は末尾_によりWebから呼出不可。 */
const PUBLIC_SHEET_ID_ = '1xU1jsvE-eoHNVBP5skd7vYcG-69_YBTqnCfSSMsMxcU';
const HEADERS_ = ['受付ID','公開名','飛距離（m）','掲載同意','確認状態','受付日時','送信キー'];

// 管理操作は実行者本人のGoogleアカウントが所有者と一致するときだけ許可。
// Webアプリは必ず「自分として実行」でデプロイしてください。
function assertOwner_() {
  const active=Session.getActiveUser().getEmail(), effective=Session.getEffectiveUser().getEmail();
  const owner=PropertiesService.getScriptProperties().getProperty('OWNER_EMAIL');
  if(!active || active!==effective || (owner && active!==owner)) throw Error('この操作は管理者専用です。');
  return active;
}
function adminSetup() {
  const owner=assertOwner_();
  PropertiesService.getScriptProperties().setProperty('OWNER_EMAIL',owner);
  setup_();
}
function adminPublish() { assertOwner_(); publishApproved_(); }

// 最初に所有者がエディタから実行。確認待ちの記録は別の非共有ファイルへ保存。
function setup_() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('INBOX_ID')) {
    const book = SpreadsheetApp.create('TBT芝浦祭2026 記録確認（スタッフ専用）');
    const sheet = book.getSheets()[0]; sheet.setName('記録確認');
    sheet.getRange(1,1,1,7).setValues([HEADERS_]);
    sheet.setFrozenRows(1); sheet.getRange('A1:G1').setBackground('#102f46').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setColumnWidth(1,310); sheet.setColumnWidths(2,4,180); sheet.setColumnWidth(6,200);
    sheet.hideColumns(7);
    sheet.getRange('E2:E1001').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['確認待ち','承認','反映済','却下'],true).setAllowInvalid(false).build());
    sheet.getRange('E1').setNote('計測内容と掲載同意を確認し「承認」に変更後、GASエディタでpublishApproved_を実行。「却下」で公開から撤回できます。');
    props.setProperty('INBOX_ID',book.getId());
  }
  if (!props.getProperty('ACCEPTING')) props.setProperty('ACCEPTING','false');
  console.log('スタッフ確認用: https://docs.google.com/spreadsheets/d/'+props.getProperty('INBOX_ID')+'/edit');
  console.log('受付を開始するにはスクリプトプロパティ ACCEPTING を true に設定してください。');
}

function doGet() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('INBOX_ID') || props.getProperty('ACCEPTING')!=='true') {
    return HtmlService.createHtmlOutput('<!doctype html><html lang="ja"><meta name="viewport" content="width=device-width,initial-scale=1"><title>記録受付</title><body style="font:18px sans-serif;padding:32px;color:#102f46"><h1>記録受付は準備中です</h1><p>会場スタッフにお声がけください。</p></body></html>');
  }
  const token = Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put('visitor:'+token,JSON.stringify({created:Date.now()}),1200);
  return HtmlService.createHtmlOutput(visitorPage_().replace('__TOKEN__',token))
    .setTitle('飛翔録｜体験の記録を送る').addMetaTag('viewport','width=device-width,initial-scale=1');
}

function validateRecord_(input) {
  if (!input || typeof input!=='object' || typeof input.token!=='string' || !/^[a-f0-9]{64}$/.test(input.token)) throw Error('画面を開き直してお試しください。');
  if ((input.nickname!=null && typeof input.nickname!=='string') || typeof input.distance!=='string' || input.consent!==true) throw Error('入力内容と掲載同意をご確認ください。');
  const nickname=(input.nickname||'').trim()||'名もなき挑戦者', distance=input.distance.trim();
  if (Array.from(nickname).length>40 || /[\u0000-\u001f\u007f]/.test(nickname)) throw Error('公開名は40文字以内で入力してください。');
  if (!/^(0|[1-9][0-9]{0,6})(\.[0-9]{1,30})?$/.test(distance) || compareDistance_(distance,'1000000')>0) throw Error('飛距離は単位なしの半角数値で入力してください。小数は30桁まで、範囲は0〜1000000mです。');
  return {nickname:nickname,distance:distance,token:input.token};
}

// 唯一の公開書込API。記録閲覧、承認、公開用ファイルへの書込APIは公開しない。
function submitRecord(input) {
  const record=validateRecord_(input), props=PropertiesService.getScriptProperties();
  if(props.getProperty('ACCEPTING')!=='true' || !props.getProperty('INBOX_ID')) throw Error('現在、Webでの記録受付を停止しています。');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(5000)) throw Error('混み合っています。少し待って、もう一度送信してください。');
  try {
    const cache=CacheService.getScriptCache(), ticket=cache.get('visitor:'+record.token);
    if(!ticket) throw Error('入力の有効期限が切れました。画面を開き直してください。');
    const sheet=SpreadsheetApp.openById(props.getProperty('INBOX_ID')).getSheetByName('記録確認');
    assertHeaders_(sheet,HEADERS_);
    const count=sheet.getLastRow()-1;
    if(count>1000) throw Error('受付上限に達しました。会場スタッフにお声がけください。');
    // 同じ画面からの再送は同じ受付IDを返す。通信再試行でも二重登録しない。
    const rows=count?sheet.getRange(2,1,count,7).getDisplayValues():[];
    const existing=rows.find(row=>row[6]===record.token);
    if(existing) return {receipt:existing[0],state:'確認待ち'};
    if(count>=1000) throw Error('受付上限に達しました。会場スタッフにお声がけください。');
    if(Date.now()-JSON.parse(ticket).created<1500) throw Error('入力内容をご確認のうえ、もう一度送信してください。');
    const receipt='flight-'+Utilities.getUuid();
    const values=[receipt,record.nickname,record.distance,'同意あり','確認待ち',Utilities.formatDate(new Date(),'Asia/Tokyo','yyyy-MM-dd HH:mm:ss'),record.token];
    // リッチテキスト書込は = 等から始まる名前も数式として評価しない。
    writeText_(sheet.getRange(count+2,1,1,7),[values]);
    SpreadsheetApp.flush();
    return {receipt:receipt,state:'確認待ち'};
  } finally { lock.releaseLock(); }
}

function compareDistance_(a,b) {
  const parts=v=>{const x=v.split('.');return [(x[0].replace(/^0+(?=\d)/,'')||'0'),(x[1]||'').padEnd(30,'0')];};
  const x=parts(a),y=parts(b);
  return x[0].length-y[0].length || (x[0]===y[0]?0:x[0]>y[0]?1:-1) || (x[1]===y[1]?0:x[1]>y[1]?1:-1);
}
function assertHeaders_(sheet,headers) {
  if(!sheet || JSON.stringify(sheet.getRange(1,1,1,headers.length).getDisplayValues()[0])!==JSON.stringify(headers)) throw Error('入力シートの見出しが変更されています。スタッフにご確認ください。');
}
function writeText_(range,rows) {
  range.setNumberFormat('@');
  range.setRichTextValues(rows.map(row=>row.map(value=>SpreadsheetApp.newRichTextValue().setText(String(value)).build())));
}

// スタッフがGASエディタから実行。「承認」のみ公開シートへ反映。却下で撤回。
function publishApproved_() {
  const lock=LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const props=PropertiesService.getScriptProperties(), inbox=SpreadsheetApp.openById(props.getProperty('INBOX_ID')).getSheetByName('記録確認');
    assertHeaders_(inbox,HEADERS_);
    const count=inbox.getLastRow()-1;
    if(count<1)return;
    if(count>1000)throw Error('記録数上限を超えています。');
    const rows=inbox.getRange(2,1,count,7).getDisplayValues();
    const target=SpreadsheetApp.openById(PUBLIC_SHEET_ID_).getSheetByName('ランキング');
    assertHeaders_(target,['記録ID','公開名','飛距離（m）','公開可否']);
    const last=target.getLastRow();
    if(last>501)throw Error('公開シートの上限500件を超えています。');
    const published=last>1?target.getRange(2,1,last-1,4).getDisplayValues():[];
    const index=new Map();
    published.forEach((row,i)=>{if(row[0]){if(index.has(row[0]))throw Error('公開シートに重複IDがあります。');index.set(row[0],i);}});
    let writes=0;
    rows.forEach((row,i)=>{
      if(!['承認','却下'].includes(row[4]))return;
      if(!/^flight-[a-f0-9-]{36}$/.test(row[0]))throw Error('受付IDを変更しないでください。');
      if(row[4]==='却下') {
        if(index.has(row[0])) { target.getRange(index.get(row[0])+2,4).setValue('非公開'); writes++; }
        return;
      }
      const valid=validateRecord_({token:row[6],nickname:row[1],distance:row[2],consent:row[3]==='同意あり'});
      let at=index.get(row[0]);
      if(at===undefined) {
        at=published.length;
        // 途中の空行を再利用して既存手入力記録を保護。
        const blank=published.findIndex(x=>x.every(cell=>cell===''));
        if(blank>=0)at=blank;
        if(at>=500)throw Error('公開シートの上限500件に達しました。');
        published[at]=[row[0],valid.nickname,valid.distance,'公開']; index.set(row[0],at);
      }
      writeText_(target.getRange(at+2,1,1,4),[[row[0],valid.nickname,valid.distance,'公開']]);
      SpreadsheetApp.flush();
      inbox.getRange(i+2,5).setValue('反映済'); writes++;
    });
    SpreadsheetApp.flush();console.log(writes+'件を公開シートへ反映しました。');
  } finally { lock.releaseLock(); }
}

function visitorPage_() { return "<!doctype html><html lang=\"ja\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>飛翔録｜体験の記録を送る</title><style>\n:root{color-scheme:light;--ink:#102f46;--paper:#f5f8f9;--line:#cbd8df;--red:#b44836}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:system-ui,-apple-system,'Hiragino Kaku Gothic ProN',sans-serif;line-height:1.7}main{max-width:680px;margin:auto;padding:28px 24px 56px}.brand{display:flex;justify-content:space-between;gap:16px;font-size:11px;letter-spacing:.12em;border-bottom:1px solid var(--line);padding-bottom:16px}.eyebrow{font-size:11px;letter-spacing:.18em;margin:32px 0 8px;color:#527083}h1{font-family:'Hiragino Mincho ProN','Yu Mincho',serif;font-size:clamp(48px,13vw,76px);letter-spacing:.16em;line-height:1.25;margin:0 0 10px}h2{font-size:23px;margin:8px 0}p{overflow-wrap:anywhere}.intro{margin:0 0 26px;color:#527083;font-size:14px}.steps{display:flex;gap:16px;padding:14px 0;border-block:1px solid var(--line);font-size:12px;list-style:none;margin:0 0 26px}.steps li{flex:1}.steps b{display:block;font-size:18px}label.field{display:block;font-weight:700;margin:24px 0 6px}.hint{font-size:12px;color:#527083;margin:0 0 8px}input[type=text]{width:100%;font:inherit;font-size:18px;background:#fff;border:1px solid #8ca4b2;border-radius:4px;padding:15px;color:var(--ink);min-width:0}input:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid #3686bb;outline-offset:3px}.distance{display:flex;align-items:center;gap:12px}.distance span{font-size:24px}.check{display:flex;gap:12px;align-items:flex-start;font-size:14px;margin:24px 0}.check input{flex:none;width:22px;height:22px;accent-color:var(--ink);margin-top:3px}button{border:0;border-radius:4px;background:var(--ink);color:white;font:inherit;font-weight:700;padding:17px 22px;min-height:54px;width:100%;cursor:pointer}button:disabled{opacity:.6;cursor:wait}.secondary{background:transparent;color:var(--ink);border:1px solid var(--line);margin-top:12px}.notice{font-size:12px;color:#527083}.error{color:#9b2a1b;font-weight:700}.review{margin:26px 0;border-block:1px solid var(--line);padding:20px 0}.review dt{font-size:12px;color:#527083}.review dd{margin:3px 0 18px;overflow-wrap:anywhere;font-weight:700;font-size:22px}.receipt{font-size:12px;overflow-wrap:anywhere;padding:14px;background:#e9f0f3}a{color:var(--ink);text-underline-offset:4px}.links{display:flex;flex-wrap:wrap;gap:20px;margin-top:32px;font-size:13px}.badge{display:inline-block;padding:4px 12px;background:#e4ecef;font-size:12px;font-weight:700}.foot{font-size:11px;color:#527083;margin-top:40px;border-top:1px solid var(--line);padding-top:16px}[hidden]{display:none!important}@media(max-width:360px){main{padding:20px 18px 40px}.brand{letter-spacing:.02em}.steps{gap:8px}}@media(prefers-reduced-motion:no-preference){main{animation:enter .35s ease-out}@keyframes enter{from{opacity:.7;transform:translateY(6px)}to{opacity:1;transform:none}}}\n</style></head><body><main><div class=\"brand\"><span>TEAM BIRDMAN TRIAL</span><span>SHIBAFES 2026</span></div><p class=\"eyebrow\">YOUR FLIGHT, YOUR RECORD.</p><h1>飛翔録</h1><p class=\"intro\">あなたの飛んだ距離を、今日の記録に。<br>体験後、計測画面の数字を入力してください。</p><ol class=\"steps\"><li><b>01</b>入力する</li><li><b>02</b>確認して送る</li><li><b>03</b>スタッフ確認後に掲載</li></ol>\n<section id=\"entry\"><form id=\"record-form\"><label class=\"field\" for=\"nickname\">公開名 <small>任意</small></label><p class=\"hint\" id=\"name-hint\">空欄の場合は「名もなき挑戦者」で掲載します。入力する場合は、本名や連絡先を使わず40文字以内で。</p><input id=\"nickname\" name=\"nickname\" type=\"text\" placeholder=\"入力しなくても送信できます\" autocomplete=\"off\" aria-describedby=\"name-hint\"><label class=\"field\" for=\"distance\">飛距離 <small>必須</small></label><p class=\"hint\" id=\"distance-hint\">計測画面の数字をそのまま入力。小数の桁は変えません。</p><div class=\"distance\"><input id=\"distance\" name=\"distance\" type=\"text\" inputmode=\"decimal\" required autocomplete=\"off\" placeholder=\"例：38.2701\" aria-describedby=\"distance-hint\"><span>m</span></div><label class=\"check\"><input id=\"consent\" type=\"checkbox\" required><span>公開名（空欄の場合は「名もなき挑戦者」）と飛距離を、TBT芝浦祭2026のランキングに掲載することに同意します。</span></label><p id=\"entry-error\" class=\"error\" role=\"alert\"></p><button type=\"submit\">入力内容を確認する →</button></form><p class=\"notice\">送信直後には掲載されません。スタッフが記録を確認してから反映します。同意しない場合は送信せず、会場スタッフにお声がけください。</p></section>\n<section id=\"review\" hidden tabindex=\"-1\" aria-labelledby=\"review-title\"><span class=\"badge\">送信前の確認</span><h2 id=\"review-title\">この記録を送りますか？</h2><dl class=\"review\"><dt>公開名</dt><dd id=\"review-name\"></dd><dt>飛距離</dt><dd id=\"review-distance\"></dd></dl><p id=\"send-error\" class=\"error\" role=\"alert\"></p><button id=\"send\" type=\"button\">この記録を送信する</button><button id=\"back\" class=\"secondary\" type=\"button\">入力内容を修正する</button><p class=\"notice\">誤った記録を送った場合は、会場スタッフに受付IDをお伝えください。</p></section>\n<section id=\"complete\" hidden tabindex=\"-1\" aria-labelledby=\"complete-title\"><span class=\"badge\">スタッフ確認待ち</span><h2 id=\"complete-title\">記録を受け付けました。</h2><p>ご参加ありがとうございます。スタッフ確認後、ランキングへ反映します。</p><p class=\"receipt\">受付ID：<span id=\"receipt\"></span></p><p class=\"notice\">この画面を保存しておくと、記録を確認する際に便利です。</p></section>\n<noscript><p class=\"error\">記録送信にはJavaScriptが必要です。会場スタッフにお声がけください。</p></noscript><nav class=\"links\"><a href=\"https://teambirdmantrial.jp/shibafes2026/\" target=\"_blank\" rel=\"noopener\">特設サイトへ ↗</a></nav><p class=\"foot\">© 2026 Team Birdman Trial</p></main><script>\n(function(){\n'use strict';\nvar token='__TOKEN__',draft=null,busy=false,completed=false,sequence=0;\nvar el=function(id){return document.getElementById(id);};\nfunction screen(id){['entry','review','complete'].forEach(function(key){el(key).hidden=key!==id;});if(id!=='entry')el(id).focus();}\nfunction validate(){\n var name=el('nickname').value.trim()||'名もなき挑戦者',distance=el('distance').value.trim();\n if(Array.from(name).length>40||/[\\u0000-\\u001f\\u007f]/.test(name))throw Error('公開名は40文字以内で入力してください。');\n if(!/^(0|[1-9][0-9]{0,6})(\\.[0-9]{1,30})?$/.test(distance)||Number(distance)>1000000||(distance.split('.')[0]==='1000000'&&/[1-9]/.test(distance.split('.')[1]||'')))throw Error('飛距離は単位なしの半角数値で入力してください。0〜1000000m、小数30桁までです。');\n if(!el('consent').checked)throw Error('掲載への同意をご確認ください。');\n return {token:token,nickname:name,distance:distance,consent:true};\n}\nel('record-form').addEventListener('submit',function(event){event.preventDefault();el('entry-error').textContent='';try{draft=validate();el('review-name').textContent=draft.nickname;el('review-distance').textContent=draft.distance+' m';screen('review');}catch(error){el('entry-error').textContent=error.message;}});\nel('back').addEventListener('click',function(){if(!busy){screen('entry');el('nickname').focus();}});\nel('send').addEventListener('click',function(){\n if(busy||!draft)return;\n el('send-error').textContent='';\n if(typeof google==='undefined'||!google.script||!google.script.run){el('send-error').textContent='GASの公開URLから開いてください。このプレビューでは送信できません。';return;}\n var attempt=++sequence;busy=true;el('send').disabled=true;el('back').disabled=true;el('send').textContent='送信しています…';\n var timeout=setTimeout(function(){if(completed||attempt!==sequence)return;busy=false;el('send').disabled=false;el('back').disabled=true;el('send').textContent='同じ記録の送信結果を確認する';el('send-error').textContent='通信に時間がかかっています。同じ記録で再試行できます。二重登録はされません。';},20000);\n google.script.run.withSuccessHandler(function(result){clearTimeout(timeout);if(completed)return;completed=true;busy=false;el('receipt').textContent=result.receipt;screen('complete');}).withFailureHandler(function(error){clearTimeout(timeout);if(completed||attempt!==sequence)return;busy=false;el('send').disabled=false;el('back').disabled=false;el('send').textContent='もう一度送信する';el('send-error').textContent=error&&error.message?error.message:'送信できませんでした。もう一度お試しください。';}).submitRecord(draft);\n});\n})();\n</script></body></html>\n"; }
