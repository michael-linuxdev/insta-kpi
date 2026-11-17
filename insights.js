/* Tiefere Auswertungen aus vorhandenen Daten */
"use strict";

const Insights = (() => {
  const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  const own = c => (c?.name || "").toLowerCase().replace(/^@/, "");

  function posts(data) {
    const out = [];
    for (const e of data.hist.beitrag) out.push({ e, t: "beitrag", date: e.date, text: `${e.caption || ""} ${e.name || ""}`, reach: e.d.reach, follows: e.d.follows, comments: e.d.comments, views: e.d.views, saves: e.d.saves, shares: e.d.shares, er: evalKpi(KPI_BY_ID.b_er_reach, e.d) });
    for (const e of data.hist.reel) out.push({ e, t: "reel", date: e.date, text: `${e.caption || ""} ${e.name || ""}`, reach: e.d.reach, follows: e.d.follows, comments: null, views: e.d.plays, saves: e.d.saves, shares: e.d.shares, er: evalKpi(KPI_BY_ID.r_er, e.d) });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }

  function categorize(p, c) {
    if (p.e.cat) return p.e.cat;
    const r = roleOf(c) || ROLES.creator;
    for (const [id, , re] of r.categories) if (re.test(p.text)) return id;
    return "other";
  }
  function catName(id, c) { const r = roleOf(c) || ROLES.creator; return id === "other" ? r.other : (r.categories.find(x => x[0] === id)?.[1] || id); }

  function categories(data, c) {
    const groups = {};
    for (const p of posts(data)) { const id = categorize(p, c); (groups[id] = groups[id] || []).push(p); }
    const rows = Object.entries(groups).map(([id, ps]) => ({
      id, name: catName(id, c), n: ps.length,
      follows: mean(ps.map(p => p.follows).filter(v => v != null)),
      comments: mean(ps.map(p => p.comments).filter(v => v != null)),
      er: mean(ps.map(p => p.er).filter(v => v != null)),
      reach: mean(ps.map(p => p.reach).filter(v => v != null)),
      repeat: mean(ps.filter(p => p.views && p.reach).map(p => p.views / p.reach)),
    })).sort((a, b) => b.n - a.n);
    return rows;
  }
  function coreInsight(rows) {
    const withF = rows.filter(r => r.follows != null && r.n >= 1);
    if (rows.length < 2) return null;
    const topF = [...withF].sort((a, b) => b.follows - a.follows)[0];
    const topR = [...rows.filter(r => r.repeat != null)].sort((a, b) => b.repeat - a.repeat)[0];
    const topE = [...rows.filter(r => r.er != null)].sort((a, b) => b.er - a.er)[0];
    if (topF && topR && topF.id !== topR.id) return `„${topF.name}“ bringt die meisten neuen Follower. „${topR.name}“ wird am häufigsten wiederholt angesehen – das bindet die bestehende Community.`;
    if (topF && topE && topF.id !== topE.id) return `„${topF.name}“ bringt die meisten neuen Follower, „${topE.name}“ die höchste Interaktion.`;
    if (topF) return `„${topF.name}“ funktioniert in fast allen Kennzahlen am besten.`;
    if (topE) return `„${topE.name}“ erzielt die höchste Interaktion.`;
    return null;
  }

  function partners(data, c) {
    const me = own(c), map = {};
    for (const p of posts(data)) {
      const handles = [...new Set((p.text.match(/@[\w.]+/g) || []).map(h => h.toLowerCase().replace(/\.+$/, "")))].filter(h => h.slice(1) !== me);
      for (const h of handles) {
        const m = map[h] = map[h] || { handle: h, n: 0, follows: 0, hasF: 0, reach: 0, hasR: 0 };
        m.n++; if (p.follows != null) { m.follows += p.follows; m.hasF++; } if (p.reach != null) { m.reach += p.reach; m.hasR++; }
      }
    }
    return Object.values(map).sort((a, b) => (b.follows - a.follows) || (b.reach - a.reach)).slice(0, 8);
  }

  const mondayOf = d => { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); x.setHours(0, 0, 0, 0); return x; };
  function isoWeek(d) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y) / 864e5 + 1) / 7); }
  function rhythm(data, weeks = 10) {
    const ps = posts(data);
    const m0 = mondayOf(new Date()), bins = [];
    for (let i = weeks - 1; i >= 0; i--) { const s = new Date(m0); s.setDate(s.getDate() - 7 * i); bins.push({ start: s, kw: isoWeek(s), n: 0 }); }
    for (const p of ps) { const d = new Date(p.date + "T12:00:00"); const b = bins.find((x, i) => d >= x.start && (i === bins.length - 1 || d < bins[i + 1].start)); if (b && d < new Date(m0.getTime() + 7 * 864e5)) b.n++; }
    const recent = ps.filter(p => new Date(p.date) > new Date(Date.now() - 182 * 864e5)).map(p => p.date);
    let gap = null;
    for (let i = 1; i < recent.length; i++) { const g = Math.round((new Date(recent[i]) - new Date(recent[i - 1])) / 864e5); if (!gap || g > gap.days) gap = { days: g, from: recent[i - 1], to: recent[i] }; }
    if (recent.length) { const since = Math.round((Date.now() - new Date(recent[recent.length - 1])) / 864e5); if (!gap || since > gap.days) gap = { days: since, from: recent[recent.length - 1], to: null }; }
    return { bins, perWeek: bins.reduce((s, b) => s + b.n, 0) / weeks, gap, total: ps.length };
  }

  function trend30(ks) {
    if (!ks) return null;
    const d = ks.d || {};
    if (d.views30 && d.views && d.days && d.days > 30) { const base = d.views / d.days * 30; return { pct: (d.views30 - base) / base * 100, src: "Aufrufe letzte 30 Tage gegenüber dem Schnitt" }; }
    if (ks.src === "api" && ks.delta?.views != null) return { pct: ks.delta.views, src: "Aufrufe gegenüber den 30 Tagen davor" };
    return null;
  }

  function vsMedian(data) {
    const ps = posts(data).filter(p => p.t === "beitrag" && p.reach);
    const med = median(ps.map(p => p.reach));
    if (!med || ps.length < 3) return null;
    return { median: med, rows: ps.map(p => ({ p, dev: (p.reach - med) / med * 100 })).sort((a, b) => b.dev - a.dev) };
  }
  function hotPost(data) {
    const v = vsMedian(data); if (!v) return null;
    const recent = v.rows.filter(r => (Date.now() - new Date(r.p.date)) / 864e5 <= 7 && r.dev >= 30);
    return recent[0] || null;
  }

  function forecast(followers, growthPerMonth) {
    if (!followers || !growthPerMonth || growthPerMonth <= 0) return null;
    const step = followers < 10000 ? 1000 : followers < 50000 ? 5000 : 10000;
    const target = Math.ceil((followers + 1) / step) * step;
    const months = Math.log(target / followers) / Math.log(1 + growthPerMonth / 100);
    const d = new Date(); d.setDate(d.getDate() + Math.round(months * 30.4));
    return { target, months, date: d };
  }

  return { posts, categorize, catName, categories, coreInsight, partners, rhythm, trend30, vsMedian, hotPost, forecast, median, isoWeek, mondayOf };
})();
