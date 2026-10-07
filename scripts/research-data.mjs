// Araştırma verisi: en likit ~100 hisse için 5dk (60g), saatlik (2y), 1dk (7g, ilk 40)
import fs from 'fs';
const OUT='rout';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const H={'User-Agent':'Mozilla/5.0'},sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sc=await (await fetch('https://raw.githubusercontent.com/kulanoglu-web/bist-terminal/data/scan.json')).json();
const L=sc.rows.filter(r=>r.lq).sort((a,b)=>b.tv-a.tv).slice(0,100).map(r=>r.t);
async function get(t,range,iv){for(const h of['query1','query2','query1']){try{const r=await fetch(`https://${h}.finance.yahoo.com/v8/finance/chart/${t}.IS?range=${range}&interval=${iv}`,{headers:H});if(!r.ok){await sleep(400);continue}const q=(await r.json()).chart.result[0],z=q.indicators.quote[0],o=[];q.timestamp.forEach((s,i)=>{if(z.close[i]>0&&z.open[i]>0)o.push([s,+z.open[i].toFixed(3),+z.high[i].toFixed(3),+z.low[i].toFixed(3),+z.close[i].toFixed(3),z.volume[i]||0])});return o}catch(e){await sleep(400)}}return null}
const q=[...L.entries()],stat={ok:0,m5:0,h1:0,m1:0};
await Promise.all([0,1,2].map(async()=>{while(q.length){const[i,t]=q.shift(),m5=await get(t,'60d','5m'),h1=await get(t,'730d','60m'),m1=i<40?await get(t,'7d','1m'):null;
 if(m5||h1){fs.writeFileSync(`${OUT}/${t}.json`,JSON.stringify({m5,h1,m1}));stat.ok++;if(m5)stat.m5++;if(h1)stat.h1++;if(m1)stat.m1++}await sleep(150)}}));
fs.writeFileSync(OUT+'/meta.json',JSON.stringify({u:new Date().toISOString(),tickers:L,stat}));console.log(stat);
