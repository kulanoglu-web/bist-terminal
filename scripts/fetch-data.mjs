import fs from 'fs';
const T=['THYAO','ASELS','GARAN','AKBNK','EREGL','KCHOL','BIMAS','TUPRS','SISE','FROTO','PGSUS','SAHOL','TCELL','YKBNK','OTKAR','TABGD'];
fs.mkdirSync('www/data',{recursive:true});
const H={'User-Agent':'Mozilla/5.0'};
async function yahoo(t){for(const h of['query1','query2']){try{const r=await fetch(`https://${h}.finance.yahoo.com/v8/finance/chart/${t}.IS?range=3y&interval=1d`,{headers:H});if(!r.ok)continue;const q=(await r.json()).chart.result[0],z=q.indicators.quote[0];return q.timestamp.map((s,i)=>({t:s,o:z.open[i],c:z.close[i],h:z.high[i],l:z.low[i],v:z.volume[i]||1})).filter(b=>b.c&&b.o&&b.h&&b.l)}catch(e){}}}
async function stooq(t){try{const r=await fetch(`https://stooq.com/q/d/l/?s=${t.toLowerCase()}.tr&i=d`,{headers:H});return (await r.text()).trim().split('\n').slice(1).map(l=>{const a=l.split(',');return{t:Date.parse(a[0])/1000,o:+a[1],h:+a[2],l:+a[3],c:+a[4],v:+a[5]||1}}).filter(b=>b.c>0&&b.o>0)}catch(e){}}
let ok=0;
for(const t of T){const d=(await yahoo(t))||(await stooq(t));if(d&&d.length>260){fs.writeFileSync(`www/data/${t}.json`,JSON.stringify(d));ok++;console.log(t,d.length)}else console.log('FAIL',t);await new Promise(r=>setTimeout(r,500))}
console.log('ok',ok);if(!ok)process.exit(1);
