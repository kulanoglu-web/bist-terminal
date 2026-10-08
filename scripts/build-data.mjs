// Tüm BIST için: hisse listesi (TradingView) + Yahoo 3y günlük + temettü → scan.json ve d/T.json
import fs from 'fs';
const LOCAL=process.env.LOCAL,OUT='out';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT+'/d',{recursive:true});
const html=fs.readFileSync('www/index.html','utf8');let code=html.match(/<script>([\s\S]*)<\/script>/)[1];code=code.slice(0,code.indexOf('function home(){'));
const E=new Function('document','fetch',code+';return{ind,FEd,mraw,mscore,sigT,mkXS,mkMKT,setG:(a,b,q,r)=>{XS=a;MKT=b;FQ=q;SQ=r}}')({querySelector(){}},()=>{});
const FALL='AEFES AKBNK AKSEN ALARK ARCLK ASELS ASTOR BIMAS BRSAN BTCIM CCOLA CIMSA DOAS DOHOL ECILC EGEEN EKGYO ENJSA ENKAI EREGL FROTO GARAN GUBRF HALKB HEKTS ISCTR ISMEN KCHOL KONTR KRDMD MAVI MGROS MPARK ODAS OTKAR OTTO OYAKC PETKM PGSUS SAHOL SASA SISE SOKM TABGD TAVHL TCELL THYAO TKFEN TOASO TSKB TTKOM TUPRS ULKER VAKBN VESTL YKBNK KOZAL AGHOL AKSA ALFAS ANHYT BRYAT'.split(' ').map(t=>({t,n:t,sec:''}));
const H={'User-Agent':'Mozilla/5.0'},sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function universe(){if(LOCAL){let nm={};try{JSON.parse(fs.readFileSync(LOCAL+'/scan.json')).rows.forEach(r=>nm[r.t]=r)}catch(e){}return fs.readdirSync(LOCAL+'/d').map(f=>f.slice(0,-5)).map(t=>({t,n:(nm[t]||{}).n||t,sec:(nm[t]||{}).sec||''}))}
 try{const r=await fetch('https://scanner.tradingview.com/turkey/scan',{method:'POST',headers:{'Content-Type':'application/json',...H},body:JSON.stringify({filter:[{left:'type',operation:'equal',right:'stock'}],options:{lang:'tr'},markets:['turkey'],symbols:{query:{types:[]},tickers:[]},columns:['name','description','sector'],sort:{sortBy:'volume',sortOrder:'desc'},range:[0,1200]})});const j=await r.json();const L=j.data.map(x=>({t:x.d[0],n:x.d[1],sec:x.d[2]||''})).filter(x=>/^[A-Z0-9]{3,6}$/.test(x.t));if(L.length>100){console.log('liste TradingView',L.length);return L}}catch(e){console.log('TV hata',String(e).slice(0,80))}console.log('yedek liste');return FALL}
async function get(t){if(LOCAL){const p=`${LOCAL}/d/${t}.json`;if(!fs.existsSync(p))return null;const j=JSON.parse(fs.readFileSync(p));return{b:j.b.map(a=>({t:a[0],o:a[1],h:a[2],l:a[3],c:a[4],v:a[5]})),dv:(j.dv||[]).map(v=>({t:v[0],a:v[1]}))}}
 for(const h of['query1','query2','query1']){try{const r=await fetch(`https://${h}.finance.yahoo.com/v8/finance/chart/${t}.IS?range=3y&interval=1d&events=div`,{headers:H});if(!r.ok){await sleep(400);continue}const q=(await r.json()).chart.result[0],z=q.indicators.quote[0],ev=q.events&&q.events.dividends;
 const b=q.timestamp.map((s,i)=>({t:s,o:z.open[i],c:z.close[i],h:z.high[i],l:z.low[i],v:z.volume[i]||0})).filter(x=>x.c>0&&x.o>0&&x.h>0&&x.l>0);return{b,dv:ev?Object.values(ev).map(x=>({t:x.date,a:x.amount})).sort((a,c)=>a.t-c.t):[]}}catch(e){await sleep(400)}}return null}
const L=await universe(),R=[],q=[...L];let bad=0;
await Promise.all([0,1,2,3].map(async()=>{while(q.length){const u=q.shift(),d=await get(u.t);if(!d||d.b.length<260){bad++;continue}R.push({...u,...d});await sleep(120)}}));
console.log('veri alinan',R.length,'basarisiz/kisa',bad);
const avg=(a,n)=>a.slice(-n).reduce((x,y)=>x+y,0)/Math.min(n,a.length);
R.forEach(o=>{o.x=E.ind(o.b);o.f=E.FEd(o.b);o.tv=avg(o.b.map(b=>b.c*b.v),20)});
const liq=[...R].sort((a,b)=>b.tv-a.tv).slice(0,250).filter(o=>o.tv>1e6),LS=new Set(liq.map(o=>o.t));
const LR=Object.fromEntries(liq.map((o,i)=>[o.t,i+1])),XS=E.mkXS(liq.map(o=>o.x)),MKT=E.mkMKT(liq.map(o=>o.b));
const quant=a=>{const s=[...a].sort((x,y)=>x-y);return Array.from({length:101},(_,i)=>s[Math.round(i/100*(s.length-1))])};
const FQ={};Object.keys(liq[0].f).forEach(k=>FQ[k]=quant(liq.map(o=>o.f[k]).filter(v=>isFinite(v))));
E.setG(XS,MKT,FQ,null);const raw=liq.map(o=>E.mraw(o.f)),SQ={s10:quant(raw.map(r=>r.s1)),s20:quant(raw.map(r=>r.s2))};E.setG(XS,MKT,FQ,SQ);
const pick=['p','d1','r','d50','don','b3','bkq','mom121','nh','sd60','up120','vr20','h20','l20','h55','l55','at','pct','s50','s200','bull','bear','held','retest','bbS','bbN','bbL','bbK','bbStop','bbRisk','bbQ','d55'];
const now=Date.now()/1000;
const rows=R.map(o=>{const m=E.mscore(o.f),lq=LS.has(o.t),x={};pick.forEach(k=>x[k]=o.x[k]);
 const ttm=o.dv.filter(v=>v.t>now-365*86400).reduce((s,v)=>s+v.a,0),prev=o.dv.filter(v=>v.t<=now-365*86400&&v.t>now-730*86400).reduce((s,v)=>s+v.a,0),yrs=Math.min(3,new Set(o.dv.filter(v=>v.t>now-3*365*86400).map(v=>new Date(v.t*1000).getUTCFullYear())).size),la=o.dv[o.dv.length-1];
 return{t:o.t,n:o.n,sec:o.sec,lq:lq?1:0,tv:Math.round(o.tv),p:x.p,d1:x.d1,p1:m.p1,p2:m.p2,pm:m.pm,st:m.st,lt:m.lt,lr:LR[o.t]||0,sg:lq?E.sigT(m.pm,LR[o.t]):['LİKİT YOK','m'],c:lq?m.pm:-1,x,dv:{y:x.p?ttm/x.p:0,g:prev>0?ttm/prev-1:null,n:yrs,ld:la?la.t:0,la:la?la.a:0}}});
const br={n:liq.length,a50:liq.filter(o=>o.x.p>o.x.s50).length/liq.length,a200:liq.filter(o=>o.x.p>o.x.s200).length/liq.length};
const last=Math.max(...R.map(o=>o.b[o.b.length-1].t));
const rnd=(k,v)=>typeof v=='number'&&isFinite(v)?Math.round(v*1e5)/1e5:v;
fs.writeFileSync(OUT+'/scan.json',JSON.stringify({u:new Date().toISOString(),last,xs:XS,mkt:MKT,fq:FQ,sq:SQ,model:'ridge-v1',br,rows},rnd));
R.forEach(o=>fs.writeFileSync(`${OUT}/d/${o.t}.json`,JSON.stringify({b:o.b.map(b=>[b.t,b.o,b.h,b.l,b.c,b.v]),dv:o.dv.map(v=>[v.t,v.a])},rnd)));
console.log('scan satir',rows.length,'likit',liq.length,'MKT',MKT,'genislik',br.a50.toFixed(2),br.a200.toFixed(2),'boyut KB',Math.round(fs.statSync(OUT+'/scan.json').size/1024));
