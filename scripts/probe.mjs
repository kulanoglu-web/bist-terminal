import fs from 'fs';
const OUT='pout';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept-Language':'tr-TR,tr;q=0.9'};
const res={};
const ids=[];for(const t of ['AHGAZ','KLRHO']){const j=JSON.parse(await (await fetch(`https://raw.githubusercontent.com/kulanoglu-web/bist-terminal/data/c/${t}.json`)).text());ids.push(...j.kap.filter(o=>o.g=='GERİ ALIM').slice(0,2).map(o=>[t,o.i,o.m]))}
for(const [t,idx,m] of ids){const h=await (await fetch(`https://www.kap.org.tr/tr/Bildirim/${idx}`,{headers:UA})).text();
 let flight='';for(const mm of h.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)){try{flight+=JSON.parse('"'+mm[1]+'"')}catch(e){}}
 const kv=[...flight.matchAll(/<div class="bold font14">([\s\S]*?)<\/div><\/td><td[^>]*><div[^>]*>([\s\S]*?)<\/div>/g)].map(x=>[x[1].replace(/<[^>]+>/g,'').trim(),x[2].replace(/<[^>]+>/g,'').trim()]);
 const rows=[...flight.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(r=>[...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c=>c[1].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim())).filter(r=>r.length>=3);
 res[t+'_'+idx]={summary:m,kv:kv.slice(0,40),rows:rows.slice(0,25)}}
fs.writeFileSync(OUT+'/probe.json',JSON.stringify(res,null,1));console.log('tamam');
