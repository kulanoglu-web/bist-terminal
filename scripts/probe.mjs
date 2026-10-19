// Kaynak yoklamasi: GitHub Actions'tan hangi veri kaynaklarina ulasilabiliyor?
import fs from 'fs';
const OUT='pout';fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept-Language':'tr-TR,tr;q=0.9,en;q=0.5'};
const res={};
async function tryGet(name,url,opt={}){const t0=Date.now();try{const r=await fetch(url,{method:opt.method||'GET',headers:{...UA,...(opt.headers||{})},body:opt.body,signal:AbortSignal.timeout(20000),redirect:'follow'});const tx=await r.text();res[name]={status:r.status,ct:r.headers.get('content-type'),len:tx.length,ms:Date.now()-t0,head:tx.slice(0,opt.n||400).replace(/\s+/g,' ')};return tx}catch(e){res[name]={err:String(e).slice(0,160),ms:Date.now()-t0};return null}}
// 1) Haber RSS
const q=encodeURIComponent;
await tryGet('gnews_hisse','https://news.google.com/rss/search?q='+q('THYAO hisse')+'&hl=tr&gl=TR&ceid=TR:tr');
await tryGet('gnews_borsa','https://news.google.com/rss/search?q='+q('Borsa İstanbul BIST 100 when:1d')+'&hl=tr&gl=TR&ceid=TR:tr');
await tryGet('gnews_kap','https://news.google.com/rss/search?q='+q('Türk Hava Yolları KAP pay geri alım')+'&hl=tr&gl=TR&ceid=TR:tr');
for(const [k,u] of Object.entries({aa_ekonomi:'https://www.aa.com.tr/tr/rss/default?cat=ekonomi',bloomberght:'https://www.bloomberght.com/rss',ekonomim:'https://www.ekonomim.com/rss',dunya:'https://www.dunya.com/rss',investing_tr:'https://tr.investing.com/rss/news.rss',bigpara:'https://bigpara.hurriyet.com.tr/rss/',haberturk_ekonomi:'https://www.haberturk.com/rss/ekonomi.xml',cnbce:'https://www.cnbce.com/rss',reuters_tr:'https://tr.investing.com/rss/news_25.rss',tcmb_duyuru:'https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Duyurular/Basin/rss'}))await tryGet('rss_'+k,u);
// 2) KAP
await tryGet('kap_main','https://www.kap.org.tr/tr',{n:200});
await tryGet('kap_list_get','https://www.kap.org.tr/tr/api/disclosure/list/main');
await tryGet('kap_byCriteria','https://www.kap.org.tr/tr/api/disclosure/members/byCriteria',{method:'POST',headers:{'Content-Type':'application/json','Referer':'https://www.kap.org.tr/tr/bildirim-sorgu','Origin':'https://www.kap.org.tr'},body:JSON.stringify({fromDate:'2026-10-12',toDate:'2026-10-19',memberTypes:['IGS'],mkkMemberOidList:[],inactiveMkkMemberOidList:[],disclosureClass:'',subjectList:[],isLate:'',mainSector:'',sector:'',subSector:'',market:'',index:'',year:'',term:'',ruleType:'',period:'',fromSrc:false,srcCategory:'',disclosureIndexList:[]})});
await tryGet('kap_bildirim_html','https://www.kap.org.tr/tr/bildirim-sorgu',{n:200});
await tryGet('kap_sirketler','https://www.kap.org.tr/tr/api/company/list?memberTypes=IGS');
// 3) Yahoo makro
for(const s of ['^XU100','USDTRY=X','EURTRY=X','GC=F','BZ=F','^GSPC','^VIX','DX-Y.NYB','^TNX','TUR','EEM','XU030.IS','TRY=X'])await tryGet('yf_'+s,`https://query1.finance.yahoo.com/v8/finance/chart/${q(s)}?range=1mo&interval=1d`,{n:160});
// Yahoo haber (hisse bazli)
await tryGet('yf_news_thyao','https://query1.finance.yahoo.com/v1/finance/search?q=THYAO.IS&newsCount=8&quotesCount=0',{n:500});
// 4) TradingView ek alanlar
const CAND=['book_value_per_share_fq','total_debt_fq','cash_n_short_term_invest_fq','total_assets_fq','total_current_assets_fq','total_current_liabilities_fq','current_ratio_fq','quick_ratio_fq','debt_to_equity_fq','total_equity_fq','common_equity_total_fq','net_income_ttm','total_revenue_ttm','gross_margin_ttm','operating_margin_ttm','net_margin_ttm','dividends_yield_current','dividend_payout_ratio_ttm','total_shares_outstanding_fundamental','float_shares_outstanding','free_float','earnings_release_next_date','earnings_release_date','beta_1_year','Perf.1M','Perf.3M','Perf.6M','Perf.Y','Perf.YTD','average_volume_30d_calc','sector','industry','number_of_employees','price_earnings_ttm','price_sales_current','return_on_assets','return_on_invested_capital','debt_to_equity','goodwill','inventory_turnover','EBITDA','institutional_ownership_percent','insider_ownership','float_shares_percent_current','foreign_ownership','recommendation_buy','recommendation_sell','recommendation_hold','price_target_high','price_target_low','price_target_median'];
const H={'Content-Type':'application/json',...UA};res.tv={};
for(const c of CAND){try{const r=await fetch('https://scanner.tradingview.com/turkey/scan',{method:'POST',headers:H,body:JSON.stringify({filter:[{left:'type',operation:'equal',right:'stock'}],options:{lang:'en'},markets:['turkey'],symbols:{query:{types:[]},tickers:[]},columns:['name',c],sort:{sortBy:'volume',sortOrder:'desc'},range:[0,700]}),signal:AbortSignal.timeout(20000)});const tx=await r.text();if(!r.ok){res.tv[c]={status:r.status,msg:tx.slice(0,80)};continue}const j=JSON.parse(tx),v=j.data.map(x=>x.d[1]);res.tv[c]={ok:1,rows:v.length,nonnull:v.filter(x=>x!=null).length,ex:v.filter(x=>x!=null).slice(0,3)}}catch(e){res.tv[c]={err:String(e).slice(0,80)}}}
// 5) Is Yatirim: mali tablo, yabanci takas
await tryGet('isy_malitablo','https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/MaliTablo?companyCode=THYAO&exchange=TRY&financialGroup=XI_29&year1=2026&period1=6&year2=2025&period2=12&year3=2025&period3=9&year4=2025&period4=6',{n:900});
await tryGet('isy_hissetekil','https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/HisseTekil?hisse=THYAO&startdate=15-10-2026&enddate=19-10-2026',{n:700});
await tryGet('isy_yabanci','https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/Yabanci-Takas-Orani.aspx',{n:300});
await tryGet('isy_sirketkarti','https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/OzetBilgi?hisse=THYAO',{n:600});
await tryGet('isy_hisse_ozet','https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/StockInfo/CompanyInfoAjax.aspx/GetKapHaberleri',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hisseKodu:'THYAO',count:10}),n:600});
await tryGet('mkk_yabanci','https://www.mkk.com.tr/tr/veri-kaynaklari/yabanci-yatirimci-islemleri',{n:300});
await tryGet('borsaistanbul','https://www.borsaistanbul.com/tr/sayfa/2417/ihale',{n:300});
fs.writeFileSync(OUT+'/probe.json',JSON.stringify(res,null,1));console.log('tamam',Object.keys(res).length);
