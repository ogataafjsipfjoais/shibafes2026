const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const context=vm.createContext({console});vm.runInContext(fs.readFileSync(__dirname+'/Code.gs','utf8'),context);
const token='a'.repeat(64),input={token,nickname:'<img src=x onerror=alert(1)>',distance:'38.270100',consent:true};
assert.equal(context.validateRecord_(input).distance,'38.270100');
for(const changes of [{distance:'-1'},{distance:'1e2'},{distance:'1000000.00000000000000001'},{distance:'1.2m'},{consent:false},{nickname:'x'.repeat(41)},{token:'bad'}])assert.throws(()=>context.validateRecord_({...input,...changes}));
assert.equal(context.compareDistance_('38.270100','38.2701'),0);assert.ok(context.compareDistance_('38.270100','38.270099')>0);
class Range{constructor(s,r,c,h,w){Object.assign(this,{s,r,c,h,w});}getDisplayValues(){return Array.from({length:this.h},(_,i)=>Array.from({length:this.w},(_,j)=>this.s.rows[this.r-1+i]?.[this.c-1+j]||''));}setNumberFormat(){return this;}setRichTextValues(rows){rows.forEach((row,i)=>row.forEach((v,j)=>{this.s.rows[this.r-1+i]??=[];this.s.rows[this.r-1+i][this.c-1+j]=v.text;}));return this;}setValue(v){this.s.rows[this.r-1]??=[];this.s.rows[this.r-1][this.c-1]=v;return this;}}
class Sheet{constructor(rows){this.rows=rows;}getLastRow(){return this.rows.length;}getRange(r,c,h=1,w=1){return new Range(this,r,c,h,w);}}
const inbox=new Sheet([['受付ID','公開名','飛距離（m）','掲載同意','確認状態','受付日時','送信キー']]);const target=new Sheet([['記録ID','公開名','飛距離（m）','公開可否'],['manual','既存記録','99.123','公開']]);
const properties={INBOX_ID:'private',ACCEPTING:'true'};
context.PropertiesService={getScriptProperties:()=>({getProperty:key=>properties[key]})};context.LockService={getScriptLock:()=>({tryLock:()=>true,waitLock(){},releaseLock(){}})};context.CacheService={getScriptCache:()=>({get:()=>JSON.stringify({created:Date.now()-10000})})};context.Utilities={getUuid:()=> '11111111-1111-4111-a111-111111111111',formatDate:()=> '2026-10-27 19:00:00'};
context.SpreadsheetApp={openById:id=>({getSheetByName:()=>id==='private'?inbox:target}),flush(){},newRichTextValue:()=>({setText(text){this.text=text;return this;},build(){return {text:this.text};}})};
const first=context.submitRecord(input),again=context.submitRecord(input);assert.equal(first.receipt,again.receipt);assert.equal(inbox.rows.length,2);assert.equal(target.rows.length,2);assert.equal(inbox.rows[1][4],'確認待ち');
inbox.rows[1][4]='承認';context.publishApproved_();assert.equal(target.rows.length,3);assert.equal(target.rows[2][2],'38.270100');assert.equal(target.rows[2][1],input.nickname);assert.equal(inbox.rows[1][4],'反映済');assert.equal(target.rows[1][0],'manual');context.publishApproved_();assert.equal(target.rows.length,3);
inbox.rows[1][4]='却下';context.publishApproved_();assert.equal(target.rows[2][3],'非公開');properties.ACCEPTING='false';assert.throws(()=>context.submitRecord(input));
console.log('PASS validation, exact decimals, pending isolation, duplicate submission, approval, existing records, withdrawal, stopped reception');
properties.OWNER_EMAIL='owner@example.test';context.Session={getActiveUser:()=>({getEmail:()=>''}),getEffectiveUser:()=>({getEmail:()=> 'owner@example.test'})};assert.throws(()=>context.adminPublish());context.Session.getActiveUser=()=>({getEmail:()=> 'other@example.test'});assert.throws(()=>context.adminSetup());context.Session.getActiveUser=()=>({getEmail:()=> 'owner@example.test'});assert.equal(context.assertOwner_(),'owner@example.test');console.log('PASS anonymous and other accounts cannot execute administrator functions');

for(const nickname of ['', '   ', undefined, null])assert.equal(context.validateRecord_({...input,nickname}).nickname,'名もなき挑戦者');
assert.throws(()=>context.validateRecord_({...input,nickname:123}));
properties.ACCEPTING='true';context.Utilities.getUuid=()=> '22222222-2222-4222-a222-222222222222';
context.submitRecord({...input,token:'b'.repeat(64),nickname:'',distance:'12.3400'});
const anonymous=inbox.rows.at(-1);assert.equal(anonymous[1],'名もなき挑戦者');assert.equal(anonymous[2],'12.3400');anonymous[4]='承認';context.publishApproved_();
assert.equal(target.rows.at(-1)[1],'名もなき挑戦者');assert.equal(target.rows.at(-1)[2],'12.3400');
console.log('PASS optional nickname, anonymous submission and approved publication without rounding');
