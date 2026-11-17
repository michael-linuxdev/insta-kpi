/* Gestalteter Report: A4-Seiten (HTML) → PDF */
"use strict";

const ReportDoc = (() => {
  const W = 794, H = 1123, PAD = 48, FOOT = 46;
  const C = { ink: "#1a1720", muted: "#6e6876", line: "#e8e3ec", soft: "#f5f2f8", accent: "#d62976", accent2: "#7a3cff", good: "#1f8a4c", ok: "#b86e00", bad: "#d1343b" };
  const GRAD = "linear-gradient(120deg,#feda75 -20%,#fa7e1e 12%,#d62976 45%,#962fbf 78%,#4f5bd5 110%)";

  const css = `
  .rp-page{width:${W}px;height:${H}px;background:#fff;color:${C.ink};position:relative;overflow:hidden;box-sizing:border-box;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.45;-webkit-user-select:text;user-select:text}
  .rp-page *{box-sizing:border-box}
  .rp-body{position:absolute;left:${PAD}px;right:${PAD}px;top:${PAD}px;bottom:${FOOT + 14}px}
  .rp-cover{height:150px;margin:-${PAD}px -${PAD}px 22px;padding:30px ${PAD}px;background:${GRAD};color:#fff;position:relative}
  .rp-cover .k{font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.9;font-weight:700}
  .rp-cover h1{font-size:30px;margin:6px 0 4px;font-weight:800;letter-spacing:-.02em}
  .rp-cover .s{font-size:13px;opacity:.95}
  .rp-mini{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${C.ink};padding-bottom:8px;margin-bottom:18px;font-size:11px;color:${C.muted}}
  .rp-mini b{color:${C.ink};font-size:12px}
  .rp-foot{position:absolute;left:${PAD}px;right:${PAD}px;bottom:18px;height:${FOOT - 18}px;border-top:1px solid ${C.line};display:flex;justify-content:space-between;align-items:center;font-size:10px;color:${C.muted}}
  .rp-block{margin-bottom:18px}
  .rp-h2{font-size:16px;font-weight:800;margin:0 0 10px;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}
  .rp-h2::before{content:"";width:5px;height:18px;border-radius:3px;background:${GRAD}}
  .rp-sub{font-size:11px;color:${C.muted};margin:-6px 0 10px}
  .rp-glance{display:grid;grid-template-columns:150px 1fr;gap:22px;align-items:center}
  .rp-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .rp-tiles.c4{grid-template-columns:repeat(4,1fr)}
  .rp-tile{background:${C.soft};border-radius:12px;padding:10px 12px}
  .rp-tile .t{font-size:10px;color:${C.muted};font-weight:700;text-transform:uppercase;letter-spacing:.04em}
  .rp-tile .v{font-size:20px;font-weight:800;letter-spacing:-.02em;margin-top:2px}
  .rp-tile .d{font-size:11px;font-weight:700}
  .rp-bars{display:flex;flex-direction:column;gap:7px}
  .rp-bar{display:grid;grid-template-columns:96px 1fr 104px;gap:10px;align-items:center;font-size:12px}
  .rp-bar .tr{height:10px;background:${C.soft};border-radius:99px;overflow:hidden}
  .rp-bar .fi{height:100%;border-radius:99px;background:${GRAD}}
  .rp-bar .n{text-align:right;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
  .rp-find{border-left:4px solid ${C.line};background:${C.soft};border-radius:0 10px 10px 0;padding:9px 12px;margin-bottom:8px;break-inside:avoid}
  .rp-find b{display:block;font-size:13px;margin-bottom:2px}
  .rp-find p{margin:0;font-size:12px;color:#3b3640}
  .rp-find.bad{border-color:${C.bad}}.rp-find.ok{border-color:${C.ok}}.rp-find.good{border-color:${C.good}}.rp-find.info{border-color:${C.accent2}}
  .rp-two{display:grid;grid-template-columns:1fr 1fr;gap:22px}
  table.rp-t{width:100%;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}
  .rp-t th{text-align:right;font-size:10px;color:${C.muted};font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:6px 6px;border-bottom:2px solid ${C.ink}}
  .rp-t td{text-align:right;padding:6px 6px;border-bottom:1px solid ${C.line}}
  .rp-t th:first-child,.rp-t td:first-child{text-align:left}
  .rp-t td:first-child{font-weight:600}
  .rp-badge{display:inline-block;font-size:10px;font-weight:800;padding:1px 7px;border-radius:99px}
  .rp-badge.good{background:#e3f4ea;color:${C.good}}.rp-badge.ok{background:#fbefdc;color:${C.ok}}.rp-badge.bad{background:#fbe3e4;color:${C.bad}}
  .up{color:${C.good}}.down{color:${C.bad}}
  .rp-goal{display:grid;grid-template-columns:1fr 150px 120px;gap:12px;align-items:center;padding:7px 0;border-bottom:1px solid ${C.line};font-size:12px}
  .rp-goal .tr{height:8px;background:${C.soft};border-radius:99px;overflow:hidden}
  .rp-goal .fi{height:100%;background:${C.accent};border-radius:99px}
  .rp-goal .fi.done{background:${C.good}}
  .rp-rec{display:grid;grid-template-columns:26px 1fr;gap:10px;margin-bottom:9px;font-size:12px}
  .rp-rec .no{width:24px;height:24px;border-radius:50%;background:${C.ink};color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:12px}
  .rp-rec b{display:block}
  .rp-note{font-size:10px;color:${C.muted}}
  `;

  const e = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ring = (score, label) => {
    const r = 54, c = 2 * Math.PI * r, p = score == null ? 0 : score / 100;
    const col = score == null ? C.line : score >= 60 ? C.good : score >= 40 ? C.ok : C.bad;
    return `<svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r="${r}" fill="none" stroke="${C.soft}" stroke-width="14"/>
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 75 75)"/>
      <text x="75" y="76" text-anchor="middle" font-size="38" font-weight="800" fill="${C.ink}" font-family="inherit">${score ?? "–"}</text>
      <text x="75" y="100" text-anchor="middle" font-size="11" fill="${C.muted}" font-family="inherit">${e(label)}</text></svg>`;
  };
  const bars = (rows, fmt = v => fmtNum(v, 0)) => {
    const mx = Math.max(...rows.map(r => r[1])) || 1;
    return `<div class="rp-bars">${rows.map(([l, v, t]) => `<div class="rp-bar"><span>${e(l)}</span><span class="tr"><span class="fi" style="display:block;width:${Math.max(1.5, v / mx * 100)}%"></span></span><span class="n">${e(t ?? fmt(v))}</span></div>`).join("")}</div>`;
  };
  const tile = (t, v, d, inv) => v == null ? "" : `<div class="rp-tile"><div class="t">${e(t)}</div><div class="v">${e(v)}</div>${d != null ? `<div class="d ${(inv ? -d : d) >= 0 ? "up" : "down"}">${fmtDeltaPct(d)} ggü. Vorzeitraum</div>` : ""}</div>`;
  const deltaCls = (k, a, b) => a == null || b == null || a === b ? "" : ((k.inv ? b < a : b > a) ? "up" : "down");

  /* Inhalt als Blöcke; jeder Block bleibt auf einer Seite zusammen */
  function blocks(opts) {
    const { period, forWhom, withTips } = opts;
    const B = [], ch = channel(), sn = snapshot(S.active), ks = sn.konto, kv = sn.kv;
    const months = periodsAvailable(), ym = period || months[0] || "all", isAll = ym === "all", prev = isAll ? null : prevMonth(ym);

    // Auf einen Blick
    const [cls, lbl] = scoreLabel(sn.score);
    const areaRows = Object.entries(sn.areas).filter(([, a]) => a.score != null).map(([t, a]) => [AREA_LABEL(t), a.score, `${a.score}/100`]);
    const d = ks?.d || {}, dl = ks?.delta || {};
    const keyTiles = [
      tile("Follower", d.followers != null ? fmtNum(d.followers, 0) : sn.followers != null ? fmtNum(sn.followers, 0) : null, dl.followers),
      tile("Aufrufe", d.views != null ? fmtNum(d.views, 0) : null, dl.views),
      tile("Betrachter", d.reached != null ? fmtNum(d.reached, 0) : null, dl.reached),
      tile("Wachstum / Monat", kv.k_growth != null ? fmtNum(kv.k_growth, 1) + " %" : kv.p_growth != null ? fmtNum(kv.p_growth, 1) + " %" : null),
      tile("Nicht-Follower-Anteil", kv.k_nonf != null ? fmtNum(kv.k_nonf, 1) + " %" : null, dl.viewsNF),
      tile("Interaktionen / Follower", kv.x_ipf != null ? fmtNum(kv.x_ipf, 0) + " % p. M." : null),
      tile("Ø ER Beiträge", kv.b_er_reach != null ? fmtNum(kv.b_er_reach, 1) + " %" : null),
      tile("Reels / Monat", kv.x_reels != null ? fmtNum(kv.x_reels, 1) : null),
    ].filter(Boolean).slice(0, 6);
    B.push(`<div class="rp-block"><div class="rp-h2">Auf einen Blick</div>
      <div class="rp-glance"><div>${ring(sn.score, lbl)}</div><div>${areaRows.length ? bars(areaRows) : ""}
      ${keyTiles.length ? `<div class="rp-tiles" style="margin-top:14px">${keyTiles.join("")}</div>` : ""}</div></div></div>`);

    // Befunde
    if (sn.findings.length) {
      const fs = sn.findings.slice(0, 8);
      B.push(`<div class="rp-block"><div class="rp-h2">Befunde</div>${fs.slice(0, 2).map(f => `<div class="rp-find ${f.lvl}"><b>${e(f.title)}</b><p>${e(f.text)}</p></div>`).join("")}</div>`);
      for (let i = 2; i < fs.length; i += 2) B.push(`<div class="rp-block" style="margin-top:-10px">${fs.slice(i, i + 2).map(f => `<div class="rp-find ${f.lvl}"><b>${e(f.title)}</b><p>${e(f.text)}</p></div>`).join("")}</div>`);
    }

    // Konto, Content-Mix, Zielgruppe
    if (ks) {
      const t2 = [
        tile("Netto-Follower", d.net != null ? (d.net > 0 ? "+" : "") + fmtNum(d.net, 0) : null),
        tile("Profilaufrufe", d.profileVisits != null ? fmtNum(d.profileVisits, 0) : null),
        tile("Follow-Conversion", kv.k_conv != null ? fmtNum(kv.k_conv, 1) + " %" : null),
        tile("Bio-Link-Klickrate", kv.k_link != null ? fmtNum(kv.k_link, 2) + " %" : null),
        tile("Aufrufe / Betrachter", kv.k_freq != null ? fmtNum(kv.k_freq, 1) + " ×" : null),
        tile("Abwanderung / Monat", kv.k_churn != null ? fmtNum(kv.k_churn, 1) + " %" : null),
        tile("Gefolgt / Follower", kv.k_ratio != null ? fmtNum(kv.k_ratio, 0) + " %" : null),
        tile("Beiträge gesamt", d.posts != null ? fmtNum(d.posts, 0) : null),
      ].filter(Boolean);
      if (t2.length) B.push(`<div class="rp-block"><div class="rp-h2">Konto</div><div class="rp-sub">Bestandsaufnahme vom ${dDE(ks.date)} · Zeitraum ${d.days || 90} Tage</div><div class="rp-tiles c4">${t2.join("")}</div></div>`);
      const mix = d.vPosts != null ? [["Beiträge", d.vPosts], ["Stories", d.vStories || 0], ["Reels", d.vReels || 0]] : null;
      const mixI = d.iPosts != null ? [["Beiträge", d.iPosts], ["Stories", d.iStories || 0], ["Reels", d.iReels || 0]] : null;
      const ages = Object.entries(ks.age || {}).sort();
      const left = mix ? `<div><div class="rp-h2">Content-Mix</div><div class="rp-sub">Aufrufe nach Format</div>${bars(mix)}${mixI ? `<div class="rp-sub" style="margin-top:12px">Interaktionen (je 100 Aufrufe)</div>${bars(mixI.map(([l, x], i) => [l, x, `${fmtNum(x, 0)} (${mix[i][1] ? fmtNum(x / mix[i][1] * 100, 1) : "–"})`]))}` : ""}</div>` : "";
      const right = d.female != null || ages.length ? `<div><div class="rp-h2">Zielgruppe</div>
        ${d.female != null ? `<div class="rp-sub">Geschlecht</div><div style="display:flex;height:16px;border-radius:99px;overflow:hidden;margin-bottom:4px"><div style="width:${d.female}%;background:${C.accent}"></div><div style="flex:1;background:${C.accent2}"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:12px"><span style="color:${C.accent}">Frauen ${fmtNum(d.female, 1)} %</span><span style="color:${C.accent2}">Männer ${fmtNum(d.male ?? 100 - d.female, 1)} %</span></div>` : ""}
        ${ages.length ? `<div class="rp-sub">Altersgruppen</div>${bars(ages.map(([a, p]) => [a, p, fmtNum(p, 1) + " %"]))}` : ""}</div>` : "";
      if (left || right) B.push(`<div class="rp-block"><div class="rp-two">${left}${right}</div></div>`);
      if (ks.ex) {
        const x = ks.ex;
        B.push(`<div class="rp-block"><div class="rp-h2">Interaktionen im Zeitraum</div><div class="rp-sub">${e(x.range || "")}${x.days ? ` · ${x.days} Tage` : ""} · Reels und Beiträge</div>
          <div class="rp-tiles c4">${tile("Interaktionen gesamt", fmtNum(exInter(x), 0))}${tile("„Gefällt mir“", x.likes != null ? fmtNum(x.likes, 0) : null)}${tile("Kommentare", x.comments != null ? fmtNum(x.comments, 0) : null)}${tile("Geteilt", x.shares != null ? fmtNum(x.shares, 0) : null)}${tile("Gespeichert", x.saves != null ? fmtNum(x.saves, 0) : null)}${tile("Reposts", x.reposts != null ? fmtNum(x.reposts, 0) : null)}${tile("Reels veröffentlicht", x.reels != null ? fmtNum(x.reels, 0) : null)}${tile("Betrachter", x.reached != null ? fmtNum(x.reached, 0) : null)}</div></div>`);
      }
    }

    // Bereiche im Zeitraum
    for (const t in TYPES) {
      const cur = entriesIn(t, ym); if (!cur.length) continue;
      const before = prev ? entriesIn(t, prev) : [];
      const rows = kpisOf(t).map(k => ({ k, a: avgKpi(k, cur), b: before.length ? avgKpi(k, before) : null })).filter(r => r.a != null);
      if (!rows.length) continue;
      B.push(`<div class="rp-block"><div class="rp-h2">${e(TYPES[t].plural)}</div><div class="rp-sub">${isAll ? "Alle Einträge" : monthLabel(ym)} · Durchschnitt aus ${cur.length} ${cur.length === 1 ? "Eintrag" : "Einträgen"}${before.length ? ` · Vergleich ${monthLabel(prev)}` : ""}</div>
        <table class="rp-t"><thead><tr><th>Kennzahl</th><th>Wert</th>${before.length ? "<th>Vormonat</th><th>Veränderung</th>" : ""}<th>Bewertung</th></tr></thead><tbody>
        ${rows.map(({ k, a, b }) => { const r = rateKpi(k, a); return `<tr><td>${e(k.n)}</td><td><b>${e(fmtKpi(k, a))}</b></td>${before.length ? `<td>${b != null ? e(fmtKpi(k, b)) : "–"}</td><td class="${deltaCls(k, b, a)}">${e(fmtDelta(k, b, a) || "–")}</td>` : ""}<td>${r ? `<span class="rp-badge ${r}">${RATE_LABEL[r]}</span>` : ""}</td></tr>`; }).join("")}
        </tbody></table></div>`);
    }

    // Top-Beiträge
    const posts = (isAll ? sortedHist("beitrag") : entriesIn("beitrag", ym));
    const pool = posts.length >= 3 ? posts : sortedHist("beitrag");
    const ranked = pool.map(p => ({ p, er: evalKpi(KPI_BY_ID.b_er_reach, p.d) })).filter(x => x.er != null).sort((a, b) => b.er - a.er).slice(0, 6);
    if (ranked.length >= 2) B.push(`<div class="rp-block"><div class="rp-h2">Top-Beiträge</div><div class="rp-sub">Sortiert nach Engagement-Rate (Reichweite)${pool !== posts ? " · alle Einträge" : ""}</div>
      <table class="rp-t"><thead><tr><th>Beitrag</th><th>Datum</th><th>Erreicht</th><th>ER</th><th>Gespeichert</th><th>Geteilt</th><th>Neue Follower</th></tr></thead><tbody>
      ${ranked.map(({ p, er }) => `<tr><td>${e(p.name)}</td><td>${dDE(p.date)}</td><td>${p.d.reach != null ? fmtNum(p.d.reach, 0) : "–"}</td><td><b>${fmtNum(er, 1)} %</b></td><td>${p.d.saves ?? "–"}</td><td>${p.d.shares ?? "–"}</td><td>${p.d.follows ?? "–"}</td></tr>`).join("")}
      </tbody></table></div>`);

    // Formate
    const fs = formatStats().filter(s => s.rows.length > 1);
    if (fs.length) B.push(`<div class="rp-block"><div class="rp-h2">Formate im Vergleich</div><div class="rp-two">${fs.slice(0, 4).map(s => `<div><div class="rp-sub" style="margin:0 0 6px">${e(s.m.n)}</div>${bars(s.rows.map(r => [r.g.name, r.v, s.m.unit === "pct" ? fmtNum(r.v, 1) + " %" : fmtNum(Math.round(r.v), 0)]))}</div>`).join("")}</div></div>`);

    // Ziele
    const goals = Object.entries(CH().goals).filter(([id]) => KPI_BY_ID[id]);
    if (goals.length) B.push(`<div class="rp-block"><div class="rp-h2">Ziele</div>${goals.map(([id, g]) => {
      const k = KPI_BY_ID[id], cur = currentValue(k), gs = goalStatus(k, cur?.v, g);
      return `<div class="rp-goal"><span><b>${e(k.n)}</b><br><span class="rp-note">${e(AREA_LABEL(k.t))}${g.date ? ` · bis ${dDE(g.date)}` : ""}</span></span>
        <span class="tr"><span class="fi ${gs?.done ? "done" : ""}" style="display:block;width:${gs ? gs.progress : 0}%"></span></span>
        <span style="text-align:right"><b>${cur ? e(fmtKpi(k, cur.v)) : "–"}</b> / ${e(fmtKpi(k, g.v))}<br><span class="rp-note">${gs ? e(gs.done ? "erreicht" : gs.text) : ""}</span></span></div>`;
    }).join("")}</div>`);

    // Empfehlungen
    if (withTips) {
      const seen = new Set(), recs = [];
      for (const s of sn.issues) if (s.k.tips && !seen.has(s.k.id)) { seen.add(s.k.id); recs.push({ k: s.k, a: s.a, t: s.t }); }
      for (const t in TYPES) for (const k of kpisOf(t)) { if (!k.tips || seen.has(k.id)) continue; const a = avgKpi(k, entriesIn(t, ym)); if (a != null && rateKpi(k, a) === "ok") { seen.add(k.id); recs.push({ k, a, t }); } }
      const top = recs.slice(0, 6);
      if (top.length) {
        B.push(`<div class="rp-block"><div class="rp-h2">Empfehlungen</div>${top.slice(0, 3).map((r, i) => rec(r, i)).join("")}</div>`);
        if (top.length > 3) B.push(`<div class="rp-block" style="margin-top:-10px">${top.slice(3).map((r, i) => rec(r, i + 3)).join("")}</div>`);
      }
    }
    B.push(`<div class="rp-block rp-note">Richtwerte sind grobe Orientierungen für kleine bis mittlere Accounts und schwanken je nach Branche und Format. Entscheidend ist die Entwicklung des eigenen Kanals über mehrere Zeiträume.</div>`);
    return { B, meta: { ch: ch.name, period: isAll ? "Alle Einträge" : monthLabel(ym), prev: prev ? monthLabel(prev) : null, forWhom } };
  }
  function rec(r, i) {
    return `<div class="rp-rec"><span class="no">${i + 1}</span><div><b>${e(r.k.n)} · ${e(fmtKpi(r.k, r.a))}</b>${e(r.k.tips[0])}${r.k.tips[1] ? ` ${e(r.k.tips[1])}` : ""}</div></div>`;
  }

  function cover(meta) {
    return `<div class="rp-cover"><div class="k">Instagram-Report</div><h1>${e(meta.ch)}</h1>
      <div class="s">${e(meta.period)}${meta.prev ? ` · Vergleich mit ${e(meta.prev)}` : ""}</div>
      <div class="s" style="opacity:.85;margin-top:2px">Erstellt am ${new Date().toLocaleDateString("de-DE")}${meta.forWhom ? ` für ${e(meta.forWhom)}` : ""}</div></div>`;
  }
  const mini = meta => `<div class="rp-mini"><b>${e(meta.ch)}</b><span>Instagram-Report · ${e(meta.period)}</span></div>`;
  const foot = (meta, i, n) => `<div class="rp-foot"><span>Insta-KPI-Trainer · insta-kpi.micana.de</span><span>Seite ${i} von ${n}</span></div>`;

  /* Blöcke messen und auf Seiten verteilen */
  function paginate(opts) {
    const { B, meta } = blocks(opts);
    const host = document.createElement("div");
    host.style.cssText = `position:fixed;left:-10000px;top:0;width:${W}px;visibility:hidden`;
    host.innerHTML = `<style>${css}</style><div class="rp-page"><div class="rp-body" id="rp-m"></div></div>`;
    document.body.appendChild(host);
    const m = host.querySelector("#rp-m");
    const avail = H - PAD - FOOT - 14 - PAD;
    m.innerHTML = cover(meta); const coverH = m.firstElementChild.getBoundingClientRect().height + 22 - PAD;
    m.innerHTML = mini(meta); const miniH = m.firstElementChild.getBoundingClientRect().height + 18;
    const pages = []; let cur = [], used = coverH;
    for (const b of B) {
      m.innerHTML = b;
      const el = m.firstElementChild, st = getComputedStyle(el);
      const h = el.getBoundingClientRect().height + parseFloat(st.marginTop) + parseFloat(st.marginBottom);
      if (cur.length && used + h > avail) { pages.push(cur); cur = []; used = miniH; }
      cur.push(b.replace('style="margin-top:-10px"', pages.length && !cur.length ? "" : 'style="margin-top:-10px"')); used += h;
    }
    if (cur.length) pages.push(cur);
    host.remove();
    const n = pages.length;
    const html = pages.map((p, i) => `<div class="rp-page"><div class="rp-body">${i === 0 ? cover(meta) : mini(meta)}${p.join("")}</div>${foot(meta, i + 1, n)}</div>`);
    return { pages: html, meta, css };
  }

  /* ---------- PDF ---------- */
  const LIBS = ["https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"];
  const load = src => new Promise((res, rej) => {
    if ([...document.scripts].some(s => s.src === src)) return res();
    const s = document.createElement("script"); s.src = src; s.onload = res;
    s.onerror = () => rej(new Error("PDF-Werkzeug konnte nicht geladen werden. Bitte Internetverbindung prüfen."));
    document.head.appendChild(s);
  });
  async function toPDF(doc, onProgress) {
    for (const l of LIBS) await load(l);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
    const host = document.createElement("div");
    host.style.cssText = `position:fixed;left:-10000px;top:0;width:${W}px`;
    host.innerHTML = `<style>${doc.css}</style>` + doc.pages.join("");
    document.body.appendChild(host);
    try {
      const els = host.querySelectorAll(".rp-page");
      for (let i = 0; i < els.length; i++) {
        onProgress && onProgress(i + 1, els.length);
        const canvas = await html2canvas(els[i], { scale: 2, backgroundColor: "#ffffff", logging: false, width: W, height: H, windowWidth: W });
        if (i) pdf.addPage("a4", "portrait");
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 595.28, 841.89);
      }
    } finally { host.remove(); }
    return pdf.output("blob");
  }
  const fileName = meta => `Instagram-Report_${meta.ch.replace(/[^\wäöüÄÖÜß-]+/g, "_")}_${meta.period.replace(/\s+/g, "_")}.pdf`;
  return { paginate, toPDF, fileName, css, W, H };
})();
