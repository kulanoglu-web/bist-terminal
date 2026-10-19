import fs from 'fs';
const OUT='pout';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept-Language':'tr-TR,tr;q=0.9'};
const res={};const get=async(u,o={})=>{try{const r=await fetch(u,{method:o.method||'GET',headers:{...UA,...(o.headers||{})},body:o.body,signal:AbortSignal.timeout(30000)});return {s:r.status,t:await r.text()}}catch(e){return {s:0,t:'ERR '+e}}};
const j=JSON.parse((await get('https://raw.githubusercontent.com/kulanoglu-web/bist-terminal/data/c/KLRHO.json')).t);
const pas=j.kap.find(o=>o.g=='PAY ALIM-SATIM'),geri=j.kap.find(o=>o.g=='GERİ ALIM');res.ids={pas:pas&&pas.i,geri:geri&&geri.i};
const strip=t=>t.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for(const [k,idx] of Object.entries(res.ids)){if(!idx)continue;
 for(const u of [`https://www.kap.org.tr/tr/Bildirim/${idx}`,`https://www.kap.org.tr/tr/api/notification/${idx}`,`https://www.kap.org.tr/tr/api/disclosure/${idx}`,`https://www.kap.org.tr/tr/api/disclosureDetail/${idx}`,`https://www.kap.org.tr/tr/api/BildirimPdf/${idx}`,`https://www.kap.org.tr/tr/api/disclosure/detail/${idx}`]){
  const r=await get(u,{headers:{'Referer':'https://www.kap.org.tr/tr/bildirim-sorgu'}});const tx=strip(r.t);
  res[k+'_'+u.split('/').slice(-2,-1)[0]]={s:r.s,len:r.t.length,txt:tx.slice(0,r.s==200?900:120),hasAlim:/Alım|Satım|Alis|Satis/i.test(tx),hasLot:/Lot|Adet|Fiyat/i.test(tx)};
  if(r.s==200&&u.includes('/Bildirim/')){const m=r.t.match(/__next_f\.push\(\[1,"([\s\S]{0,3000}?)"\]\)/g);res[k+'_rsc']=(m||[]).slice(0,3).map(x=>x.slice(0,1200));const i=r.t.search(/Alım|Satım/);res[k+'_ctx']=i>=0?strip(r.t.slice(Math.max(0,i-500),i+1500)).slice(0,900):null}}}
fs.writeFileSync(OUT+'/probe.json',JSON.stringify(res,null,1));console.log('tamam');
