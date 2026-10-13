// Tüm BIST için: hisse listesi (TradingView) + Yahoo 3y günlük + temettü → scan.json ve d/T.json
import fs from 'fs';
const LOCAL=process.env.LOCAL,OUT='out';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT+'/d',{recursive:true});
const html=fs.readFileSync('www/index.html','utf8');let code=html.match(/<script>([\s\S]*)<\/script>/)[1];code=code.slice(0,code.indexOf('function home(){'));
const E=new Function('document','fetch',code+';return{ind,FEd,mraw,mscore,sigT,isPartial,BRKX,mkXS,mkMKT,setG:(a,b,q,r)=>{XS=a;MKT=b;FQ=q;SQ=r}}')({querySelector(){}},()=>{});
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
R.forEach(o=>{o.live=o.b[o.b.length-1];o.cb=E.isPartial(o.b)?o.b.slice(0,-1):o.b;o.x=E.ind(o.cb);o.f=E.FEd(o.cb);o.tv=avg(o.cb.map(b=>b.c*b.v),20)});
const liq=[...R].sort((a,b)=>b.tv-a.tv).slice(0,250).filter(o=>o.tv>1e6),LS=new Set(liq.map(o=>o.t));
const LR=Object.fromEntries(liq.map((o,i)=>[o.t,i+1])),XS=E.mkXS(liq.map(o=>o.x)),MKT=E.mkMKT(liq.map(o=>o.cb));
const quant=a=>{const s=[...a].sort((x,y)=>x-y);return Array.from({length:101},(_,i)=>s[Math.round(i/100*(s.length-1))])};
const FQ={};Object.keys(liq[0].f).forEach(k=>FQ[k]=quant(liq.map(o=>o.f[k]).filter(v=>isFinite(v))));
E.setG(XS,MKT,FQ,null);const raw=liq.map(o=>E.mraw(o.f)),SQ={s10:quant(raw.map(r=>r.s1)),s20:quant(raw.map(r=>r.s2))};E.setG(XS,MKT,FQ,SQ);
const pick=['p','d1','r','d50','don','b3','bkq','mom121','nh','sd60','up120','vr20','h20','l20','h55','l55','at','pct','s50','s200','bull','bear','held','retest','bbS','bbN','bbL','bbK','bbStop','bbRisk','bbQ','d55'];
const now=Date.now()/1000;
const bkOf=(o,m)=>{const C=o.cb.map(b=>b.c),H=o.cb.map(b=>b.h),W=o.cb.map(b=>b.l),V=o.cb.map(b=>b.v),bx=E.BRKX(C,H,W,V,C.length-1),p=o.live.c;let c=null,lv=0;if(bx.dn55){c='d55';lv=bx.l55}else if(bx.dn20){c='d20';lv=bx.l20}else if(bx.fresh55){c='f55';lv=bx.h55}else if(bx.fresh20){c='f20';lv=bx.h20}else if(bx.retest55){c='rt';lv=bx.rlv}else if(bx.near55){c='n55';lv=bx.h55}else if(bx.near20){c='n20';lv=bx.h20}if(!c)return null;const st=c[0]=='d'?0:Math.min(lv-2*bx.at,p-2*bx.at);
 // Derece (walk-forward ile secildi): A = taze 55g kirilim + hacim ortalamanin altinda (sessiz); B = 55g yakin/taze + hacim<1.3 + SMA200 uzerinde guclu trend; C = diger yukari adaylar, model>=70
 const vz=o.f.volz,d2=o.f.dist200;let g='';if(c=='f55'&&vz<1)g='A';else if((c=='n55'||c=='f55')&&vz<1.3&&d2>.15)g='B';else if(c[0]!='d'&&m.pm>=.7)g='C';
 return{c,lv,st,rk:c[0]=='d'?0:(p-st)/p,g,vz:+vz.toFixed(2)}};
const rows=R.map(o=>{const m=E.mscore(o.f),lq=LS.has(o.t),x={};pick.forEach(k=>x[k]=o.x[k]);x.p=o.live.c;if(o.cb!==o.b)x.d1=o.live.c/o.cb[o.cb.length-1].c-1;const fin=Object.values(o.f).every(isFinite),bk=fin?bkOf(o,m):null;
 const ttm=o.dv.filter(v=>v.t>now-365*86400).reduce((s,v)=>s+v.a,0),prev=o.dv.filter(v=>v.t<=now-365*86400&&v.t>now-730*86400).reduce((s,v)=>s+v.a,0),yrs=Math.min(3,new Set(o.dv.filter(v=>v.t>now-3*365*86400).map(v=>new Date(v.t*1000).getUTCFullYear())).size),la=o.dv[o.dv.length-1];
 return{t:o.t,n:o.n,sec:o.sec,lq:lq?1:0,tv:Math.round(o.tv),p:x.p,d1:x.d1,p1:m.p1,p2:m.p2,pm:m.pm,st:m.st,lt:m.lt,lr:LR[o.t]||0,sg:!fin?['LİKİT YOK','m']:lq?E.sigT(m.pm,LR[o.t]):(m.pm>=.9?['AL?','m']:['İZLE','m']),c:fin?m.pm:-1,x,bk,dv:{y:x.p?ttm/x.p:0,g:prev>0?ttm/prev-1:null,n:yrs,ld:la?la.t:0,la:la?la.a:0}}});

// ===== TEMEL ANALIZ (analist raporu tekniği): sektör çarpanı ile adil değer, değerleme/büyüme/kalite yüzdelikleri =====
const TVC=['close','market_cap_basic','earnings_per_share_diluted_ttm','earnings_per_share_forecast_next_fy','price_book_fq','enterprise_value_ebitda_ttm','free_cash_flow_ttm','net_debt','ebitda_ttm','total_revenue_yoy_growth_ttm','earnings_per_share_diluted_yoy_growth_ttm','ebitda_yoy_growth_ttm','return_on_equity','net_margin_ttm','price_target_average','recommendation_mark','recommendation_total'];
async function tvFund(){
 if(LOCAL){const m={};let k=7;for(const o of R){k=(k*16807)%2147483647;const u=()=>{k=(k*16807)%2147483647;return k/2147483647};const p=o.live.c;m[o.t]={close:p,market_cap_basic:p*(1e8+u()*5e9),earnings_per_share_forecast_next_fy:u()<.8?p/(4+u()*30):null,earnings_per_share_diluted_ttm:p/(3+u()*40),price_book_fq:.4+u()*5,enterprise_value_ebitda_ttm:u()<.8?2+u()*25:null,free_cash_flow_ttm:(u()-.4)*3e8,net_debt:(u()-.3)*2e9,ebitda_ttm:u()<.9?(u()-.1)*1e9:null,total_revenue_yoy_growth_ttm:(u()-.2)*120,earnings_per_share_diluted_yoy_growth_ttm:(u()-.4)*300,ebitda_yoy_growth_ttm:(u()-.3)*100,return_on_equity:(u()-.3)*50,net_margin_ttm:(u()-.3)*40,price_target_average:u()<.2?p*(.8+u()*.8):null,recommendation_mark:1+u()*3,recommendation_total:Math.round(u()*9)}}return m}
 const r=await fetch('https://scanner.tradingview.com/turkey/scan',{method:'POST',headers:{'Content-Type':'application/json',...H},body:JSON.stringify({filter:[{left:'type',operation:'equal',right:'stock'}],options:{lang:'en'},markets:['turkey'],symbols:{query:{types:[]},tickers:[]},columns:['name',...TVC],sort:{sortBy:'volume',sortOrder:'desc'},range:[0,1200]})});
 if(!r.ok)throw new Error('TV '+r.status);const j=await r.json(),m={};for(const x of j.data){const o={};TVC.forEach((c,i)=>o[c]=x.d[i+1]);m[x.d[0]]=o}return m}
const num=v=>typeof v=='number'&&isFinite(v)?v:null,med=a=>{const s=a.filter(v=>v!=null).sort((x,y)=>x-y);return s.length?s[Math.floor((s.length-1)/2)]:null};
function addFund(rows,F){
 const M={};rows.forEach(r=>{const g=F[r.t];if(!g)return;const p=r.p,mc=num(g.market_cap_basic),ef=num(g.earnings_per_share_forecast_next_fy),eb=num(g.ebitda_ttm),nd0=num(g.net_debt),fcf=num(g.free_cash_flow_ttm),pb=num(g.price_book_fq),ev=num(g.enterprise_value_ebitda_ttm);
  let nd=null;if(eb!=null&&nd0!=null){nd=eb>0?nd0/eb:(nd0>0?20:null);if(nd!=null)nd=Math.max(-5,Math.min(20,nd))}
  M[r.t]={p,mc,ef,eb,nd0,fpe:ef>0?p/ef:null,pb:pb>0?pb:null,ev:ev>0?ev:null,fy:mc>0&&fcf!=null?fcf/mc*100:null,rg:num(g.total_revenue_yoy_growth_ttm),eg:num(g.earnings_per_share_diluted_yoy_growth_ttm),ebg:num(g.ebitda_yoy_growth_ttm),roe:num(g.return_on_equity),nm:num(g.net_margin_ttm),nd,pt:num(g.price_target_average),pn:num(g.recommendation_total)||0,rm:num(g.recommendation_mark),et:num(g.earnings_per_share_diluted_ttm)}});
 const base=rows.filter(r=>r.lq&&M[r.t]),col=k=>base.map(r=>M[r.t][k]).filter(v=>v!=null).sort((a,b)=>a-b);
 const C={};['fpe','pb','ev','fy','rg','eg','ebg','roe','nm','nd'].forEach(k=>C[k]=col(k));
 const rk=(k,v,hi)=>{const a=C[k];if(v==null||a.length<40)return null;let lo=0,eq=0;for(const x of a){if(x<v)lo++;else if(x==v)eq++}const q=(lo+eq/2)/a.length;return hi?q:1-q};
 const mean=a=>{a=a.filter(v=>v!=null);return a.length>=2?a.reduce((x,y)=>x+y,0)/a.length*100:null};
 const secs={};rows.forEach(r=>{if(M[r.t])(secs[r.sec||'?']=secs[r.sec||'?']||[]).push(M[r.t])});
 const gpe=med(Object.values(M).map(m=>m.fpe>1&&m.fpe<=60?m.fpe:null)),gev=med(Object.values(M).map(m=>m.ev>1&&m.ev<=40?m.ev:null)),sm={};
 for(const[k,a]of Object.entries(secs)){const pe=a.map(m=>m.fpe>1&&m.fpe<=60?m.fpe:null).filter(v=>v!=null),ev=a.map(m=>m.ev>1&&m.ev<=40?m.ev:null).filter(v=>v!=null);sm[k]={pe:pe.length>=4?med(pe):gpe,ev:ev.length>=4?med(ev):gev,own:pe.length>=4}}
 let n=0;rows.forEach(r=>{const m=M[r.t];if(!m){r.fd=null;return}
  const sv=mean([rk('fpe',m.fpe,0),rk('ev',m.ev,0),rk('pb',m.pb,0),rk('fy',m.fy,1)]),sgr=mean([rk('rg',m.rg,1),rk('eg',m.eg,1),rk('ebg',m.ebg,1)]),sq=mean([rk('roe',m.roe,1),rk('nm',m.nm,1),rk('nd',m.nd,0)]),ws=[[sv,.4],[sgr,.3],[sq,.3]].filter(a=>a[0]!=null),ts=ws.length>=2?ws.reduce((s,a)=>s+a[0]*a[1],0)/ws.reduce((s,a)=>s+a[1],0):null;
  const S=sm[r.sec||'?']||{pe:gpe,ev:gev},fvs=[];if(m.ef>0&&S.pe)fvs.push(m.ef*S.pe);const sh=m.mc>0?m.mc/m.p:0;if(m.eb>0&&S.ev&&m.nd0!=null&&sh>0){const q=(S.ev*m.eb-m.nd0)/sh;if(q>0)fvs.push(q)}
  const fv=fvs.length?Math.max(.25*m.p,Math.min(4*m.p,fvs.reduce((a,b)=>a+b,0)/fvs.length)):null,pu=m.pt>0&&m.pn>=3?Math.max(-.9,Math.min(3,m.pt/m.p-1)):null;
  if(ts==null&&fv==null&&pu==null){r.fd=null;return}n++;
  r.fd={sv:sv==null?null:Math.round(sv),sg:sgr==null?null:Math.round(sgr),sq:sq==null?null:Math.round(sq),ts:ts==null?null:Math.round(ts),fv:fv==null?null:+fv.toFixed(2),fu:fv==null?null:+(fv/m.p-1).toFixed(3),fn:fvs.length,pt:pu==null?null:+m.pt.toFixed(2),pu:pu==null?null:+pu.toFixed(3),pn:m.pn,rm:m.rm,pe:m.fpe,pb:m.pb,ev:m.ev,fy:m.fy,roe:m.roe,nm:m.nm,rg:m.rg,eg:m.eg,nd:m.nd,spe:S.pe}});
 return n}
let fundN=0;try{const F=await tvFund();fundN=addFund(rows,F);console.log('temel veri',Object.keys(F).length,'hesaplanan',fundN)}catch(e){console.log('temel veri HATA',String(e).slice(0,120));rows.forEach(r=>r.fd=null)}
// gunluk anlik goruntu: ileride canli dogrulama icin (gecmis temel veri yok, geriye donuk test edilemez)
let FH={days:[]};if(!LOCAL){try{const r=await fetch('https://raw.githubusercontent.com/kulanoglu-web/bist-terminal/data/fhist.json',{headers:H});if(r.ok)FH=await r.json()}catch(e){console.log('fhist okunamadi')}}
if(fundN>0){const day=new Date(Date.now()+10800000).toISOString().slice(0,10),v={};rows.forEach(r=>{if(r.fd&&r.fd.ts!=null)v[r.t]=[r.p,r.fd.ts,r.fd.fu,r.fd.pu,Math.round(r.pm*1000)/1000]});FH.days=(FH.days||[]).filter(d=>d.day!=day);FH.days.push({day,v});FH.days=FH.days.slice(-260);fs.writeFileSync(OUT+'/fhist.json',JSON.stringify(FH,(k,x)=>typeof x=='number'?Math.round(x*1000)/1000:x))}
const br={n:liq.length,a50:liq.filter(o=>o.x.p>o.x.s50).length/liq.length,a200:liq.filter(o=>o.x.p>o.x.s200).length/liq.length};
const last=Math.max(...R.map(o=>o.b[o.b.length-1].t));
const rnd=(k,v)=>typeof v=='number'&&isFinite(v)?Math.round(v*1e5)/1e5:v;
fs.writeFileSync(OUT+'/scan.json',JSON.stringify({u:new Date().toISOString(),last,xs:XS,mkt:MKT,fq:FQ,sq:SQ,model:'ridge-v1',ver:6,br,rows},rnd));
R.forEach(o=>fs.writeFileSync(`${OUT}/d/${o.t}.json`,JSON.stringify({b:o.b.map(b=>[b.t,b.o,b.h,b.l,b.c,b.v]),dv:o.dv.map(v=>[v.t,v.a])},rnd)));
if(fs.existsSync('reports/reports.json'))fs.copyFileSync('reports/reports.json',OUT+'/reports.json');
console.log('scan satir',rows.length,'likit',liq.length,'MKT',MKT,'genislik',br.a50.toFixed(2),br.a200.toFixed(2),'boyut KB',Math.round(fs.statSync(OUT+'/scan.json').size/1024));
