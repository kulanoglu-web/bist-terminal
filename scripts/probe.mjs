import fs from 'fs';
const OUT='pout';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept-Language':'tr-TR,tr;q=0.9'};
const KAPT=[['GERİ ALIM',/Payların Geri Alınması/i],['İHALE',/İhale Süreci/i],['YENİ İŞ',/Yeni İş İlişkisi/i],['PAY ALIM-SATIM',/Pay Alım Satım/i],['SERMAYE',/Bedelsiz|Bedelli|Hak Kullanım Süreç/i],['DERECE',/Kredi Derecelendirmesi/i],['DEVRE KESİCİ',/Devre Kesici/i],['TEMETTÜ',/Kâr Payı|Temettü/i],['ÖZEL DURUM',/Özel Durum Açıklaması/i]];
const day=d=>new Date(Date.now()+3*3600e3-d*864e5).toISOString().slice(0,10);
const ev=[],cnt={};let fail=0;
async function one(d){const dt=new Date(day(d)+'T12:00:00Z').getUTCDay();if(dt==0||dt==6)return;
 for(let a=0;a<3;a++){try{const c=new AbortController();const to=setTimeout(()=>c.abort(),40000);
  const r=await fetch('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria',{method:'POST',signal:c.signal,headers:{...UA,'Content-Type':'application/json','Referer':'https://www.kap.org.tr/tr/bildirim-sorgu','Origin':'https://www.kap.org.tr'},body:JSON.stringify({fromDate:day(d),toDate:day(d),memberTypes:['IGS'],mkkMemberOidList:[],inactiveMkkMemberOidList:[],disclosureClass:'',subjectList:[],isLate:'',mainSector:'',sector:'',subSector:'',market:'',index:'',year:'',term:'',ruleType:'',period:'',fromSrc:false,srcCategory:'',disclosureIndexList:[]})});clearTimeout(to);
  const j=await r.json();cnt[day(d)]=j.length;
  for(const o of j){const sub=o.subject||'',sm=o.summary||'';let tag=null;for(const[n,rx]of KAPT)if(rx.test(sub)){tag=n;break}if(!tag)continue;
   if(tag=='ÖZEL DURUM'){if(/sözleşme|sipariş|ihale/i.test(sm))tag='SÖZLEŞME';else if(/dava|soruşturma|SPK|ceza/i.test(sm))tag='DAVA';else if(/birleşme|devral|satın al|pay devri/i.test(sm))tag='BİRLEŞME';else continue}
   const tks=((o.relatedStocks||o.stockCodes||'')+'').split(',').map(s=>s.trim().replace(/\.E$/,'')).filter(Boolean);if(!tks.length)continue;
   const m=(o.publishDate||'').match(/(\d\d)\.(\d\d)\.(\d{4}) (\d\d):(\d\d)/);if(!m)continue;
   ev.push({i:o.disclosureIndex,dt:`${m[3]}-${m[2]}-${m[1]}`,h:+m[4]*60+ +m[5],g:tag,k:tks,m:sm.slice(0,110)})}
  return}catch(e){await new Promise(r=>setTimeout(r,1500))}}fail++}
const days=Array.from({length:760},(_,i)=>i);let p=0;
await Promise.all(Array.from({length:4},async()=>{while(p<days.length){await one(days[p++])}}));
fs.writeFileSync(OUT+'/probe.json',JSON.stringify({fail,n:ev.length,days:Object.keys(cnt).length,ev}));console.log('tamam',ev.length,'fail',fail,'days',Object.keys(cnt).length);
