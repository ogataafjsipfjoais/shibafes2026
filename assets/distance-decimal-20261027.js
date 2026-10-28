/* Preserve the received numeric value. No inferred measurement precision, no BigInt requirement. */
function expand(value){
 if(typeof value==='string'){if(!/^(0|[1-9][0-9]{0,6})(\.[0-9]{1,30})?$/.test(value)||Number(value)>1000000)throw Error('Invalid distance');return value;}
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1000000)throw Error('Invalid distance');
 let [coefficient,exponent='0']=String(value).toLowerCase().split('e');
 const parts=coefficient.split('.'),digits=parts.join(''),point=parts[0].length+Number(exponent);
 if(point<=0)return '0.'+'0'.repeat(-point)+digits;
 if(point>=digits.length)return digits+'0'.repeat(point-digits.length);
 return digits.slice(0,point)+'.'+digits.slice(point);
}
function canonical(value){let result=value.replace(/^0+(?=\d)/,'');if(result.includes('.'))result=result.replace(/0+$/,'').replace(/\.$/,'');return result||'0'}
export function distanceText(value){return typeof value==='string'?expand(value):canonical(expand(value));}
export function distanceGap(leader,value){
 const left=distanceText(leader),right=distanceText(value);
 const scale=Math.max((left.split('.')[1]||'').length,(right.split('.')[1]||'').length);
 const integer=text=>{const [whole,fraction='']=text.split('.');return (whole+fraction.padEnd(scale,'0')).replace(/^0+(?=\d)/,'')};
 const a=integer(left),b=integer(right);if(a.length<b.length||(a.length===b.length&&a<b))throw Error('Leader is shorter than record');
 const padded=b.padStart(a.length,'0');let carry=0,result='';
 for(let i=a.length-1;i>=0;i--){let digit=Number(a[i])-Number(padded[i])-carry;if(digit<0){digit+=10;carry=1}else carry=0;result=String(digit)+result}
 result=result.padStart(scale+1,'0');return canonical(scale?result.slice(0,-scale)+'.'+result.slice(-scale):result);
}
export function countFrame(start,end,progress){
 // Intermediate frames are presentation only; the final frame is always the exact received number.
 if(progress>=1)return distanceText(end);
 if(typeof end==='string')return distanceText(end);
 const scale=(distanceText(end).split('.')[1]||'').length;
 if(scale>5||end<start)return distanceText(end);
 const factor=Math.pow(10,scale),value=start+(end-start)*progress;
 return (Math.floor(value*factor)/factor).toFixed(scale).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1');
}

export function compareDistance(a,b){
 const [aw,af='']=canonical(expand(a)).split('.'),[bw,bf='']=canonical(expand(b)).split('.');
 return aw.length-bw.length || (aw===bw?0:aw>bw?1:-1) || (af.padEnd(30,'0')===bf.padEnd(30,'0')?0:af.padEnd(30,'0')>bf.padEnd(30,'0')?1:-1);
}
