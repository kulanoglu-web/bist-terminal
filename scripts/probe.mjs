import fs from 'fs';
const OUT='pout';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept-Language':'tr-TR,tr;q=0.9'};
const res={};
const j=JSON.parse(await (await fetch('https://raw.githubusercontent.com/kulanoglu-web/bist-terminal/data/c/KLRHO.json')).text());
const ids=[...j.kap.filter(o=>o.g=='PAY ALIM-SATIM').slice(0,2),...j.kap.filter(o=>o.g=='GERİ ALIM').slice(0,1)].map(o=>o.i);
for(const idx of ids){const t=await (await fetch(`https://www.kap.org.tr/tr/Bildirim/${idx}`,{headers:UA})).text();
 // flight verisini birlestir
 let flight='';for(const m of t.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)){try{flight+=JSON.parse('"'+m[1]+'"')}catch(e){}}
 res[idx]={htmlLen:t.length,flightLen:flight.length,sendData:null,keys:null};
 const i=flight.indexOf('"sendData"');if(i>=0)res[idx].sendData=flight.slice(i,i+2500);
 // tablo hucreleri: Alım/Satım, Fiyat, Adet gecen yerler
 res[idx].hits=[...flight.matchAll(/(İşlem Tipi|Alış|Satış|Alım|Satım|Fiyat|Adet|Lot|Nominal|Ortalama|Toplam)/g)].slice(0,25).map(m=>flight.slice(Math.max(0,m.index-60),m.index+140).replace(/\s+/g,' '));
 res[idx].tail=flight.slice(-1500);}
fs.writeFileSync(OUT+'/probe.json',JSON.stringify(res,null,1));console.log('tamam');
