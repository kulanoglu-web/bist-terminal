import fs from 'fs';
const OUT='pout';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'};
const sc=JSON.parse(await (await fetch('https://raw.githubusercontent.com/kulanoglu-web/bist-terminal/data/scan.json?'+Date.now())).text());
const T=sc.rows.filter(r=>r.lq).sort((a,b)=>b.tv-a.tv).slice(0,200).map(r=>r.t);
const res={},fail=[];
async function one(t){for(let a=0;a<3;a++){try{for(const h of['query1','query2']){const r=await fetch(`https://${h}.finance.yahoo.com/v8/finance/chart/${t}.IS?range=730d&interval=1h`,{headers:UA});if(!r.ok)continue;const j=await r.json(),q=j.chart.result[0],ts=q.timestamp,i=q.indicators.quote[0],o=[];
 for(let k=0;k<ts.length;k++){if(i.close[k]==null||i.open[k]==null)continue;o.push([ts[k],+i.open[k].toFixed(3),+i.high[k].toFixed(3),+i.low[k].toFixed(3),+i.close[k].toFixed(3),i.volume[k]||0])}
 res[t]=o;return}}catch(e){}await new Promise(r=>setTimeout(r,1000))}fail.push(t)}
let p=0;await Promise.all(Array.from({length:6},async()=>{while(p<T.length)await one(T[p++])}));
fs.writeFileSync(OUT+'/probe.json',JSON.stringify({fail,n:Object.keys(res).length,res}));console.log('tamam',Object.keys(res).length,'fail',fail.length);
