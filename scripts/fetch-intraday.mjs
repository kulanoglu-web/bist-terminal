import fs from 'fs';
const T=['AEFES','AKBNK','AKSEN','ALARK','ARCLK','ASELS','ASTOR','BIMAS','BRSAN','BTCIM','CCOLA','CIMSA','DOAS','DOHOL','ECILC','EGEEN','EKGYO','ENJSA','ENKAI','EREGL','FROTO','GARAN','GUBRF','HALKB','HEKTS','ISCTR','ISMEN','KCHOL','KONTR','KRDMD','MAVI','MGROS','MPARK','ODAS','OTKAR','OYAKC','PETKM','PGSUS','SAHOL','SASA','SISE','SOKM','TABGD','TAVHL','TCELL','THYAO','TKFEN','TOASO','TSKB','TTKOM','TUPRS','ULKER','VAKBN','VESTL','YKBNK','KOZAL','AGHOL','AKSA','ALFAS','ANHYT','BRYAT'];
fs.mkdirSync('www/data',{recursive:true});
const H={'User-Agent':'Mozilla/5.0'};
async function yh(t){for(const h of['query1','query2']){try{const r=await fetch(`https://${h}.finance.yahoo.com/v8/finance/chart/${t}.IS?range=10d&interval=15m`,{headers:H});if(!r.ok)continue;const q=(await r.json()).chart.result[0],z=q.indicators.quote[0];return q.timestamp.map((s,i)=>({t:s,o:z.open[i],c:z.close[i],h:z.high[i],l:z.low[i],v:z.volume[i]||0})).filter(b=>b.c&&b.o&&b.h&&b.l)}catch(e){}}}
const ok=[],fail=[];
for(const t of T){const d=await yh(t);if(d&&d.length>=60){fs.writeFileSync(`www/data/i_${t}.json`,JSON.stringify(d));ok.push(t)}else fail.push(t);await new Promise(r=>setTimeout(r,300))}
fs.writeFileSync('www/data/istatus.json',JSON.stringify({updated:new Date().toISOString(),ok,fail}));
console.log(ok.length,fail);
