import fs from 'fs';
const OUT='pout';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept-Language':'tr-TR,tr;q=0.9'};
const res={};const get=async(u,o={})=>{const r=await fetch(u,{method:o.method||'GET',headers:{...UA,...(o.headers||{})},body:o.body,signal:AbortSignal.timeout(30000)});return {s:r.status,t:await r.text()}};
const fmt=d=>d.toISOString().slice(0,10);
const kap=async(a,b)=>{const r=await get('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria',{method:'POST',headers:{'Content-Type':'application/json','Referer':'https://www.kap.org.tr/tr/bildirim-sorgu','Origin':'https://www.kap.org.tr'},body:JSON.stringify({fromDate:a,toDate:b,memberTypes:['IGS'],mkkMemberOidList:[],inactiveMkkMemberOidList:[],disclosureClass:'',subjectList:[],isLate:'',mainSector:'',sector:'',subSector:'',market:'',index:'',year:'',term:'',ruleType:'',period:'',fromSrc:false,srcCategory:'',disclosureIndexList:[]})});return JSON.parse(r.t)};
// pencere basina kayit sayisi (2000 siniri var mi?)
res.win={};for(let d=0;d<8;d++){const day=fmt(new Date(Date.now()-d*864e5));try{const j=await kap(day,day);res.win[day]=j.length}catch(e){res.win[day]='hata '+e}}
try{const j=await kap(fmt(new Date(Date.now()-864e5)),fmt(new Date()));res.nullstock=j.filter(x=>!x.relatedStocks).slice(0,14).map(x=>({t:x.kapTitle,s:x.subject,sc:x.stockCodes,sum:(x.summary||'').slice(0,80),cls:x.disclosureClass}));res.withstock=j.filter(x=>x.relatedStocks).slice(0,6).map(x=>({t:x.kapTitle,rs:x.relatedStocks,s:x.subject}));res.nullcount=[j.length,j.filter(x=>!x.relatedStocks).length]}catch(e){res.nullstock='hata '+e}
// Google News hiz testi: 48 sorgu, es zamanli 4
const names=['TÜRK HAVA YOLLARI','ASELSAN','GARANTİ BANKASI','BORUSAN','KOÇ HOLDİNG','AHLATCI DOĞALGAZ','TÜPRAŞ','EREĞLİ DEMİR ÇELİK'];const t0=Date.now();let ok=0,items=0;const qs=[];for(let i=0;i<48;i++)qs.push(names[i%8]+' hisse '+(i>=8?String(i):''));
let idx=0;await Promise.all([0,1,2,3].map(async()=>{while(idx<qs.length){const q=qs[idx++];try{const r=await get('https://news.google.com/rss/search?q='+encodeURIComponent(q.trim()+' when:7d')+'&hl=tr&gl=TR&ceid=TR:tr');if(r.s==200){ok++;items+=(r.t.match(/<item>/g)||[]).length}else res['gn_fail_'+r.s]=(res['gn_fail_'+r.s]||0)+1}catch(e){res.gn_err=String(e).slice(0,100)}}}));
res.gnews={queries:qs.length,ok,items,ms:Date.now()-t0};
// Google News oge ayrintisi: source etiketi
try{const r=await get('https://news.google.com/rss/search?q='+encodeURIComponent('ASELSAN when:7d')+'&hl=tr&gl=TR&ceid=TR:tr');res.gnitem=[...r.t.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,2).map(m=>m[1].replace(/<link>[^<]*<\/link>/,'<link>..</link>').replace(/<guid[^>]*>[^<]*<\/guid>/,'').replace(/\s+/g,' ').slice(0,700))}catch(e){res.gnitem='hata'}
// RSS ornekleri: AA, Bloomberg HT
for(const [k,u] of Object.entries({aa:'https://www.aa.com.tr/tr/rss/default?cat=ekonomi',bht:'https://www.bloomberght.com/rss',inv:'https://tr.investing.com/rss/news.rss'})){try{const r=await get(u);res['rss_'+k]=[...r.t.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,2).map(m=>m[1].replace(/\s+/g,' ').slice(0,420))}catch(e){res['rss_'+k]='hata'}}
// Ortaklik yapisi tam cikti
try{const r=await get('https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/OrtaklikYapisi?hisse=THYAO');res.ort=r.t.slice(0,1500).replace(/\s+/g,' ')}catch(e){res.ort='hata'}
fs.writeFileSync(OUT+'/probe.json',JSON.stringify(res,null,1));console.log('tamam');
