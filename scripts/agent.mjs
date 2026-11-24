// AJAN PORTFÖY (eToro "agent portfolio" mantığının BIST uyarlaması, SANAL)
// Her tamamlanmış seans için bir kez çalışır: önceki günün emirlerini bugünün AÇILIŞ fiyatından doldurur,
// kapanışa göre çıkış/giriş kararı verir ve emirleri ertesi gün açılışa bırakır (ileriye bakma yok).
// Gerçek emir göndermez. Durum data dalındaki agent.json'da saklanır.
export const CFG = { cash0: 100000, max: 8, fee: 0.001, trail: 2.5, hold: 40, keepPend: 5 };
const ds = t => new Date((t + 10800) * 1000).toISOString().slice(0, 10);
const PRI = { A: 0, S: 1, B: 2 };
const r2 = v => Math.round(v * 100) / 100;

export function newAgent() {
  return { v: 1, cfg: CFG, start: null, last: null, cash: CFG.cash0, pos: [], pend: [], tx: [], log: [], eq: [], bench: CFG.cash0, note: '' };
}

// R: [{t, cb:[{t,o,h,l,c,v}]}] tamamlanmış çubuklar; rows: scan satırları (bk, sp, lq, pm, x.at); liq: likit tickerlar; crash: bool
export function runAgent(prev, { R, rows, liq, crash }) {
  const AG = prev && prev.v === 1 ? prev : newAgent();
  AG.cfg = CFG;
  const B = {}, RW = {};
  R.forEach(o => (B[o.t] = o.cb));
  rows.forEach(r => (RW[r.t] = r));
  // Gün: likit hisselerin en sık görülen son tamamlanmış çubuğu
  const cnt = {};
  liq.forEach(t => { const b = B[t]; if (b && b.length) { const d = ds(b[b.length - 1].t); cnt[d] = (cnt[d] || 0) + 1; } });
  const D = Object.entries(cnt).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))[0]?.[0];
  if (!D) return { AG, changed: false, msg: 'gün bulunamadı' };
  if (AG.last && D <= AG.last) return { AG, changed: false, msg: 'gün zaten işlendi ' + D };
  if (!AG.start) AG.start = D;
  const barOn = (t, d) => (B[t] || []).find(b => ds(b.t) === d);
  const closeAt = (t, d) => { const a = (B[t] || []).filter(b => ds(b.t) <= d); return a.length ? a[a.length - 1].c : null; };
  const fee = CFG.fee;

  // 1) Bekleyen emirleri doldur: oluştuğu günden sonraki ilk çubuğun açılışı (önce satışlar)
  const keep = [];
  for (const p of [...AG.pend].sort((a, b) => (a.s === 'SAT' ? -1 : 1) - (b.s === 'SAT' ? -1 : 1))) {
    const bar = (B[p.t] || []).find(b => ds(b.t) > p.d && ds(b.t) <= D);
    if (!bar) { if (daysBetween(p.d, D) <= CFG.keepPend + 2) keep.push(p); else AG.tx.push({ s: 'İPTAL', t: p.t, d: D, why: 'işlem görmedi' }); continue; }
    const px = bar.o, fd = ds(bar.t);
    if (p.s === 'SAT') {
      const i = AG.pos.findIndex(q => q.t === p.t);
      if (i < 0) continue;
      const q = AG.pos[i], pr = q.q * px * (1 - fee);
      AG.cash += pr;
      AG.log.push({ t: q.t, q: q.q, p: q.p, x: r2(px), d: q.d, xd: fd, pl: +(pr / (q.q * q.p * (1 + fee)) - 1).toFixed(4), why: p.why, g: q.g });
      AG.tx.push({ s: 'SAT', t: q.t, q: q.q, px: r2(px), d: fd, why: p.why });
      AG.pos.splice(i, 1);
    } else {
      const budget = Math.min(p.amt, AG.cash), q = Math.floor(budget / (px * (1 + fee)));
      if (q < 1) { AG.tx.push({ s: 'İPTAL', t: p.t, d: fd, why: 'nakit yetersiz' }); continue; }
      AG.cash -= q * px * (1 + fee);
      // Açılış boşluğu stopun altına açtıysa stopu açılışın 2,5×ATR altına çek
      const st = p.st < px ? p.st : px - CFG.trail * (p.at || px * 0.03);
      AG.pos.push({ t: p.t, q, p: r2(px), d: fd, st: r2(st), pk: px, why: p.why, g: p.g });
      AG.tx.push({ s: 'AL', t: p.t, q, px: r2(px), d: fd, why: p.why });
    }
  }
  AG.pend = keep;

  // 2) Değerle + zirveyi güncelle
  for (const q of AG.pos) {
    (B[q.t] || []).filter(b => ds(b.t) >= q.d && ds(b.t) <= D).forEach(b => (q.pk = Math.max(q.pk, b.c)));
    q.c = closeAt(q.t, D) ?? q.p;
    q.n = (B[q.t] || []).filter(b => ds(b.t) > q.d && ds(b.t) <= D).length;
  }

  // 3) Çıkış kararları (kapanışa göre, ertesi gün açılışta)
  const sells = new Set();
  for (const q of AG.pos) {
    const r = RW[q.t], at = r && r.x && r.x.at > 0 ? r.x.at : q.c * 0.03, tr = q.pk - CFG.trail * at;
    let why = null;
    if (q.c < q.st) why = 'Stop (' + q.st.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ') altında kapanış';
    else if (q.pk > q.p && q.c < tr) why = 'İz süren stop: zirveden 2,5×ATR geri çekildi';
    else if (r && r.bk && r.bk.c && r.bk.c[0] === 'd') why = 'Aşağı kırılım (' + (r.bk.c === 'd55' ? '55' : '20') + 'g dip)';
    else if (q.n >= CFG.hold) why = 'Süre doldu (' + CFG.hold + ' seans)';
    q.tr = r2(Math.max(q.st, tr));
    if (why) { sells.add(q.t); AG.pend.push({ s: 'SAT', t: q.t, d: D, why, ref: r2(q.c), w: null }); }
  }

  // 4) Değer (kapanış) ve evren karşılaştırması
  const posV = AG.pos.reduce((s, q) => s + q.q * q.c, 0), eq = AG.cash + posV;
  const prevD = AG.last;
  if (prevD) {
    const rs = liq.map(t => { const a = closeAt(t, prevD), b = closeAt(t, D); return a > 0 && b > 0 ? b / a - 1 : null; }).filter(v => v != null && Math.abs(v) < 0.5);
    if (rs.length) AG.bench *= 1 + rs.reduce((s, v) => s + v, 0) / rs.length;
  }
  AG.eq.push({ d: D, e: Math.round(eq), b: Math.round(AG.bench), n: AG.pos.length });

  // 5) Giriş kararları
  AG.note = '';
  if (crash) AG.note = 'Piyasa çöküş rejiminde (hacimli hisselerin %20’sinden azı 50g ortalama üstünde ve endeks 100g altında): yeni alım yapılmadı.';
  else {
    const held = new Set([...AG.pos.map(q => q.t), ...AG.pend.filter(p => p.s === 'AL').map(p => p.t)]);
    const slots = CFG.max - (AG.pos.length - sells.size) - AG.pend.filter(p => p.s === 'AL').length;
    const cand = rows.filter(r => r.lq && !held.has(r.t) && ((r.bk && (r.bk.g === 'A' || r.bk.g === 'B')) || (r.sp && r.sp.g === 'S')))
      .map(r => ({ r, g: r.bk && r.bk.g === 'A' ? 'A' : r.sp && r.sp.g === 'S' ? 'S' : 'B' }))
      .sort((a, b) => PRI[a.g] - PRI[b.g] || b.r.pm - a.r.pm);
    const amt = eq / CFG.max;
    for (const { r, g } of cand.slice(0, Math.max(0, slots))) {
      const at = r.x && r.x.at > 0 ? r.x.at : r.p * 0.03, st = g !== 'S' && r.bk && r.bk.st > 0 ? r.bk.st : r.p - CFG.trail * at;
      const why = g === 'A' ? 'Derece A: taze 55g kırılım, sakin hacim' : g === 'B' ? 'Derece B: 55g kırılıma yakın/taze, güçlü trend' : 'Sıçrama devamı (S)';
      AG.pend.push({ s: 'AL', t: r.t, d: D, why, g, amt: Math.round(amt), w: +(1 / CFG.max).toFixed(4), st: r2(st), at: r2(at), ref: r2(r.p) });
    }
    if (!cand.length) AG.note = 'Bugün kurallara uyan yeni aday yok.';
    else if (slots <= 0) AG.note = 'Portföy dolu (' + CFG.max + ' pozisyon); yeni aday beklemede.';
  }
  AG.last = D;
  AG.tx = AG.tx.slice(-300);
  AG.log = AG.log.slice(-300);
  AG.eq = AG.eq.slice(-400);
  return { AG, changed: true, msg: 'işlendi ' + D + ' değer ' + Math.round(eq) + ' poz ' + AG.pos.length + ' emir ' + AG.pend.length };
}
function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); }
