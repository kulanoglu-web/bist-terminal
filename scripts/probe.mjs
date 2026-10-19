import fs from 'fs';import {execSync} from 'child_process';
const OUT='pout';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept-Language':'tr-TR,tr;q=0.9'};
const res={};
try{res.which=execSync('which pdftotext; which pdftohtml; python3 -c "import fitz;print(1)" 2>&1 | tail -1').toString()}catch(e){res.which='yok '+String(e).slice(0,100)}
const j=JSON.parse(await (await fetch('https://raw.githubusercontent.com/kulanoglu-web/bist-terminal/data/c/KLRHO.json')).text());
const ids=[...j.kap.filter(o=>o.g=='PAY ALIM-SATIM').slice(0,3),...j.kap.filter(o=>o.g=='GERİ ALIM').slice(0,1)].map(o=>o.i);
res.txt={};
for(const idx of ids){try{const r=await fetch(`https://www.kap.org.tr/tr/api/BildirimPdf/${idx}`,{headers:{...UA,Referer:'https://www.kap.org.tr/tr/Bildirim/'+idx}});const b=Buffer.from(await r.arrayBuffer());fs.writeFileSync(`/tmp/k${idx}.pdf`,b);try{res.txt[idx]=execSync(`pdftotext -layout /tmp/k${idx}.pdf - | head -80`).toString().slice(0,2500)}catch(e){res.txt[idx]='pdftotext hata '+String(e).slice(0,100)}}catch(e){res.txt[idx]='fetch hata '+e}}
// KAP RSC icinde veri var mi? Alim/Satim kelimesini ara
try{const r=await fetch(`https://www.kap.org.tr/tr/Bildirim/${ids[0]}`,{headers:UA});const t=await r.text();res.html={len:t.length,idxAlim:[...t.matchAll(/Alış|Alım|Satış|Satım/g)].slice(0,10).map(m=>t.slice(Math.max(0,m.index-80),m.index+120).replace(/\s+/g,' ')),lot:[...t.matchAll(/Lot|Adet|İşlem Fiyatı|Ortalama/g)].slice(0,6).map(m=>t.slice(Math.max(0,m.index-60),m.index+100).replace(/\s+/g,' '))}}catch(e){res.html='hata '+e}
fs.writeFileSync(OUT+'/probe.json',JSON.stringify(res,null,1));console.log('tamam');
