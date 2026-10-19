import fs from 'fs';
const OUT='pout';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept-Language':'tr-TR,tr;q=0.9'};
const res={};const get=async(u,o={})=>{const r=await fetch(u,{method:o.method||'GET',headers:{...UA,...(o.headers||{})},body:o.body,signal:AbortSignal.timeout(30000)});return {s:r.status,t:await r.text()}};
const fmt=d=>d.toISOString().slice(0,10);
// KAP: son 30 gun
try{const to=new Date(),from=new Date(Date.now()-30*864e5);const r=await get('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria',{method:'POST',headers:{'Content-Type':'application/json','Referer':'https://www.kap.org.tr/tr/bildirim-sorgu','Origin':'https://www.kap.org.tr'},body:JSON.stringify({fromDate:fmt(from),toDate:fmt(to),memberTypes:['IGS'],mkkMemberOidList:[],inactiveMkkMemberOidList:[],disclosureClass:'',subjectList:[],isLate:'',mainSector:'',sector:'',subSector:'',market:'',index:'',year:'',term:'',ruleType:'',period:'',fromSrc:false,srcCategory:'',disclosureIndexList:[]})});
 const j=JSON.parse(r.t);res.kap={status:r.s,n:j.length,keys:Object.keys(j[0]),sample:j.slice(0,3)};
 const cnt={},ex={};for(const x of j){const k=(x.disclosureClass||'')+'|'+(x.subject||'');cnt[k]=(cnt[k]||0)+1;if(!ex[k])ex[k]={title:x.kapTitle,summary:(x.summary||'').slice(0,160),stocks:x.relatedStocks,idx:x.disclosureIndex,date:x.publishDate}}
 res.kap.subjects=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,60).map(([k,v])=>[k,v,ex[k]]);
 res.kap.geri=j.filter(x=>/geri al/i.test((x.subject||'')+(x.summary||'')+(x.kapTitle||''))).slice(0,6).map(x=>[x.publishDate,x.relatedStocks,x.subject,(x.summary||'').slice(0,200)]);
 res.kap.ihale=j.filter(x=>/ihale|sözleşme|iş ilişkisi/i.test((x.subject||'')+(x.summary||''))).slice(0,6).map(x=>[x.publishDate,x.relatedStocks,x.subject,(x.summary||'').slice(0,200)]);
 res.kap.insider=j.filter(x=>/pay alım satım|yönetici|işlem bildirimi/i.test((x.subject||'')+(x.kapTitle||''))).slice(0,6).map(x=>[x.publishDate,x.relatedStocks,x.subject,(x.summary||'').slice(0,200)]);
}catch(e){res.kap='hata '+e}
// Is Yatirim HisseTekil tam satir
try{const r=await get('https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/HisseTekil?hisse=THYAO&startdate=15-10-2026&enddate=19-10-2026');const j=JSON.parse(r.t);res.hissetekil={keys:Object.keys(j.value[0]),row:j.value[0]}}catch(e){res.hissetekil='hata '+e}
// MaliTablo: THYAO (sanayi) ve GARAN (banka) kalem kodlari
for(const [c,g] of [['THYAO','XI_29'],['GARAN','XI_29'],['GARAN','UFRS_K']]){try{const r=await get(`https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/MaliTablo?companyCode=${c}&exchange=TRY&financialGroup=${g}&year1=2026&period1=6&year2=2025&period2=12&year3=2025&period3=9&year4=2025&period4=6`);const j=JSON.parse(r.t);res['mali_'+c+'_'+g]=(j.value||[]).map(x=>[x.itemCode,x.itemDescTr,x.value1,x.value2])}catch(e){res['mali_'+c+'_'+g]='hata '+e}}
// Yabanci payi araması
for(const u of ['https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/YabanciOran?hisse=THYAO','https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/HisseYabanciPay?hisse=THYAO','https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/OrtaklikYapisi?hisse=THYAO','https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/HisseOrtakYapisi?hisse=THYAO','https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/IlkAltiHisse?']){try{const r=await get(u);res['try_'+u.split('/').pop()]={s:r.s,head:r.t.slice(0,300).replace(/\s+/g,' ')}}catch(e){res['try_'+u.split('/').pop()]='hata '+e}}
// Google News ornek ogeler
try{const r=await get('https://news.google.com/rss/search?q='+encodeURIComponent('"Türk Hava Yolları" OR THYAO when:7d')+'&hl=tr&gl=TR&ceid=TR:tr');const it=[...r.t.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,4).map(m=>m[1].replace(/\s+/g,' ').slice(0,600));res.gnews=it}catch(e){res.gnews='hata '+e}
// Yahoo makro son kapanislar
res.macro={};for(const s of ['XU100.IS','USDTRY=X','GC=F','BZ=F','^GSPC','^VIX','DX-Y.NYB','^TNX','TUR']){try{const r=await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?range=3mo&interval=1d`);const q=JSON.parse(r.t).chart.result[0];const c=q.indicators.quote[0].close.filter(v=>v!=null);res.macro[s]={n:c.length,last:c[c.length-1],ago20:c[c.length-21],meta:q.meta.regularMarketPrice}}catch(e){res.macro[s]='hata '+e}}
fs.writeFileSync(OUT+'/probe.json',JSON.stringify(res,null,1));console.log('tamam');
