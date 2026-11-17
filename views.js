/* Neue Hauptansichten: Heute, Analyse, Planen, Berichte, Media-Kit, Daten holen, Rollen */
"use strict";

const card = (html, cls = "", style = "") => `<section class="card ${cls}" style="${style}">${html}</section>`;
const placeholder = (title, text) => `<section class="card ph"><div class="row"><b class="spacer">${esc(title)}</b><span class="meta">${esc(text)}</span></div></section>`;
const fmtDate = s => new Date(s + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });
const PLAN_TYPES = { beitrag: ["Beitrag", "car"], karussell: ["Karussell", "car"], reel: ["Reel", "reel"], story: ["Story", "sto"] };

/* ================= Rollen ================= */
function roleForm(c) {
  return `
    <div class="roles">${Object.entries(ROLES).map(([k, r]) => `<label class="rolecard"><input type="radio" name="role" value="${k}" ${c.role === k ? "checked" : ""}><span><b>${esc(r.label)}</b><small>${esc(r.desc)}</small></span></label>`).join("")}</div>
    <label class="field" id="brwrap" style="margin-top:12px;${c.role === "business" ? "" : "display:none"}"><span>Branche</span><select id="rbranche">${Object.entries(BRANCHEN).map(([k, l]) => `<option value="${k}" ${c.branche === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="field" id="ewwrap" style="margin-top:12px;${c.role === "public" ? "" : "display:none"}"><span>Einwohnerzahl</span><small>Für die Reichweite im Verhältnis zur Bevölkerung</small><input type="number" inputmode="numeric" id="rew" value="${c.einwohner ?? ""}"></label>
    <label class="field" style="margin-top:12px"><span>Bundesland</span><small>Für Feiertage im Anlässe-Kalender</small><select id="rland">${Object.entries(LAENDER).map(([k, l]) => `<option value="${k}" ${(c.land || "SN") === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
}
function bindRoleForm(b, c, done) {
  b.querySelectorAll("input[name=role]").forEach(r => r.onchange = () => { b.querySelector("#brwrap").style.display = r.value === "business" ? "" : "none"; b.querySelector("#ewwrap").style.display = r.value === "public" ? "" : "none"; });
  return () => {
    const r = b.querySelector("input[name=role]:checked"); if (!r) { toast("Bitte eine Rolle wählen"); return false; }
    c.role = r.value; c.branche = b.querySelector("#rbranche").value; c.land = b.querySelector("#rland").value;
    const ew = parseFloat(b.querySelector("#rew").value); if (isFinite(ew)) c.einwohner = ew; else delete c.einwohner;
    save(); done && done(); return true;
  };
}
function openChannelSettings() {
  const c = channel();
  openSheet(`<h2>Kanal-Einstellungen</h2><p class="hint">„${esc(c.name)}“ – die Rolle bestimmt Kategorien, Wochenziele, Anlässe, Experimente und Berichte.</p>${roleForm(c)}
    <button class="btn primary block" id="rsave" style="margin-top:16px">Speichern</button>`, b => {
    const ok = bindRoleForm(b, c, () => { closeSheet(); render(); toast("Gespeichert"); });
    b.querySelector("#rsave").onclick = ok;
  });
}

/* ================= Daten holen ================= */
function openDaten() {
  const c = channel(), api = c.api;
  openSheet(`<h2>Daten holen</h2><p class="hint">für ${esc(c.name)}</p>
    ${api ? `<div class="card" style="border:1.5px solid var(--good)"><div class="row"><span class="ico good">${I.sync}</span><div class="spacer"><b>Instagram-API</b> <span class="badge good">verbunden</span><div class="meta">${api.lastSync ? `zuletzt ${new Date(api.lastSync).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}` : "noch kein Abruf"} · beim Öffnen automatisch alle 6 Std.</div></div></div>
        <div class="row" style="margin-top:12px"><button class="btn primary spacer" id="dsync">Jetzt abrufen</button><button class="btn spacer" id="dapi">Einstellungen</button></div></div>`
      : `<button class="opt" id="dapi"><span class="ico">${I.sync}</span><span class="spacer"><b>Mit Instagram verbinden</b><small>Einmal einrichten, danach automatisch</small></span><span class="chev">›</span></button>`}
    <div class="label">Ergänzen</div>
    <button class="opt" id="dshot"><span class="ico">${I.cam}</span><span class="spacer"><b>Screenshots einlesen</b><small>${api ? "Für Profilaufrufe und Bio-Link-Klicks" : "Schnell-Check mit 4 Bildern"}</small></span><span class="chev">›</span></button>
    <button class="opt" id="dhand"><span class="ico">${I.edit}</span><span class="spacer"><b>Von Hand eintragen</b><small>Einzelne Beiträge, Reels oder Stories</small></span><span class="chev">›</span></button>`, b => {
    if (b.querySelector("#dsync")) b.querySelector("#dsync").onclick = () => runApiSync();
    b.querySelector("#dapi").onclick = openApi;
    b.querySelector("#dshot").onclick = openGuide;
    b.querySelector("#dhand").onclick = () => { closeSheet(); go("erfassen"); };
  });
}

/* ================= Heute ================= */
function renderHeute(v) {
  const c = channel(), data = CH();
  if (!c.role) {
    v.innerHTML = card(`<h2>Willkommen</h2><p class="hint">Wofür nutzt du den Kanal „${esc(c.name)}“? Danach passen Kategorien, Wochenziele, Anlässe und Berichte zu deiner Rolle.</p>${roleForm(c)}<button class="btn primary block" id="rgo" style="margin-top:16px">Weiter</button>`);
    const ok = bindRoleForm(v, c, () => render()); $("#rgo").onclick = ok; return;
  }
  const sn = snapshot(S.active), ks = sn.konto, d = ks?.d || {}, dl = ks?.delta || {};
  if (!sn.total) {
    v.innerHTML = card(`<div class="empty-state"><div class="big">📥</div><h2>Noch keine Daten für „${esc(c.name)}“</h2><p>Verbinde den Kanal mit Instagram oder lies 4 Screenshots ein.</p>
      <button class="btn grad block" id="h0">${I.plus} Daten holen</button><button class="btn ghost block" id="hdemo">Beispieldaten ansehen</button></div>`);
    $("#h0").onclick = openDaten; $("#hdemo").onclick = () => { loadDemoHist(Object.keys(TYPES)); render(); };
    return;
  }
  const [cls] = scoreLabel(sn.score);
  const bad = sn.findings.find(f => f.lvl === "bad"), good = sn.findings.find(f => f.lvl === "good");
  const trend = Insights.trend30(ks);
  const tile = (t, val, delta, inv) => val == null ? "" : `<div class="tile"><div class="t">${t}</div><div class="v">${val}</div>${delta != null ? `<div class="d ${(inv ? -delta : delta) >= 0 ? "up" : "down"}">${fmtDeltaPct(delta)}</div>` : ""}</div>`;
  const tiles = [
    tile("Follower", (d.followers ?? sn.followers) != null ? fmtNum(d.followers ?? sn.followers, 0) : null, dl.followers),
    tile("Betrachter", d.reached != null ? fmtNum(d.reached, 0) : null, dl.reached),
    trend ? tile("30-Tage-Trend", fmtDeltaPct(trend.pct).replace(" %", " %"), null) : tile("Wachstum/Monat", sn.growth != null ? fmtNum(sn.growth, 1) + " %" : null),
  ].filter(Boolean).slice(0, 3);
  // Aufgaben
  const t0 = today(), items = (data.plan || []).filter(p => p.date === t0);
  const running = (data.experiments || []).filter(x => !x.closed);
  const tasks = [];
  items.forEach(p => tasks.push(`<label class="task"><input type="checkbox" data-pdone="${p.id}" ${p.done ? "checked" : ""}><span><b>${esc(PLAN_TYPES[p.type]?.[0] || "")}: ${esc(p.title)}</b><small>${p.time ? `${esc(p.time)} Uhr · ` : ""}Redaktionsplan${p.exp ? " · Experiment" : ""}</small></span></label>`));
  if (!items.length) running.slice(0, 1).forEach(x => tasks.push(`<div class="task"><span class="dot exp"></span><span><b>${esc(x.action)}</b><small>Experiment „${esc(x.name)}“ · Woche ${expWeek(x)} von ${x.weeks}</small></span></div>`));
  if (sn.issues[0]) { const s = sn.issues[0], tip = roleTips(s.k, c)?.[0]; if (tip) tasks.push(`<div class="task"><span class="dot bad"></span><span><b>${esc(tip)}</b><small>Baustelle · ${esc(s.k.n)} ${esc(fmtKpi(s.k, s.a))}</small></span></div>`); }
  if (!items.length && !running.length) tasks.push(`<button class="task linkish" id="hplan"><span class="dot"></span><span><b>Woche planen</b><small>Noch nichts für heute im Redaktionsplan</small></span></button>`);
  const hot = Insights.hotPost(data);
  const next = Anlaesse.upcoming(c, data, new Date(), 21).filter(a => a.date >= t0 && a.idea)[0];
  v.innerHTML = `
    ${card(`<div class="row" style="gap:14px"><div class="ring ${cls}" style="--p:${sn.score ?? 0}"><span>${sn.score ?? "–"}</span></div>
      <div class="spacer"><b style="font-size:1rem">${esc(bad?.title || good?.title || "Kanal im Blick")}</b><div class="hint" style="margin:2px 0 0">${good && bad ? `Stark: ${esc(good.title)}` : esc(roleOf(c).label)}</div></div></div>
      ${tiles.length ? `<div class="tiles c3">${tiles.join("")}</div>` : ""}
      <button class="btn ghost" id="hana" style="padding-left:0;margin-top:6px">Zur Analyse →</button>`)}
    <div class="label">Heute wichtig</div>
    ${card(tasks.join(""), "", "padding:4px 16px")}
    ${hot ? card(`<div class="row" style="align-items:flex-start;gap:12px"><span style="color:var(--accent)">${I.up}</span><div class="spacer"><b>${esc(hot.p.e.name)} läuft gut</b><p class="hint" style="margin:2px 0 0">Reichweite ${fmtNum(hot.dev, 0)} % über deinem Schnitt. Jetzt in der Story teilen, solange er noch läuft.</p></div></div>`, "", "background:var(--hl)") : ""}
    ${next ? `<div class="label">Demnächst</div>${card(`<div class="row" style="gap:14px"><div class="datebox"><small>${new Date(next.date + "T12:00").toLocaleDateString("de-DE", { month: "short" }).replace(".", "").toUpperCase()}</small><b>${+next.date.slice(8)}</b></div>
      <div class="spacer"><b>${esc(next.name)}</b><div class="hint" style="margin:2px 0 0">${esc(next.idea)}</div></div><button class="btn small" id="hnext">Planen</button></div>`)}` : ""}`;
  $("#hana").onclick = () => { S.ui.asub = "ueberblick"; go("analyse"); };
  v.querySelectorAll("[data-pdone]").forEach(cb => cb.onchange = () => { const p = data.plan.find(x => x.id === cb.dataset.pdone); p.done = cb.checked; save(); });
  if ($("#hplan")) $("#hplan").onclick = () => go("planen");
  if ($("#hnext")) $("#hnext").onclick = () => openPlanItem({ date: dayBefore(next.date), title: next.idea, type: "beitrag" });
}
const dayBefore = s => { const d = new Date(s + "T12:00"); d.setDate(d.getDate() - 1); const t = today(); const r = Anlaesse.iso(d); return r < t ? t : r; };

/* ================= Analyse ================= */
const ASUBS = [["ueberblick", "Überblick"], ["inhalte", "Inhalte"], ["zielgruppe", "Zielgruppe"], ["wachstum", "Wachstum"]];
function renderAnalyse(v) {
  const sub = ASUBS.some(x => x[0] === S.ui.asub) ? S.ui.asub : "ueberblick";
  v.innerHTML = `<div class="chips">${ASUBS.map(([k, l]) => `<button class="chip" data-asub="${k}" aria-pressed="${k === sub}">${l}</button>`).join("")}</div><div id="asub"></div>`;
  v.querySelectorAll("[data-asub]").forEach(b => b.onclick = () => { S.ui.asub = b.dataset.asub; save(); render(); });
  const el = $("#asub");
  ({ ueberblick: renderUeberblick, inhalte: renderInhalte, zielgruppe: renderZielgruppe, wachstum: renderWachstum })[sub](el);
}

function barRows(rows, color = "var(--accent)") {
  const mx = Math.max(...rows.map(r => r[1] || 0)) || 1;
  return `<div class="bars">${rows.map(([l, val, txt]) => `<div class="bar"><span>${esc(l)}</span><span class="track"><span class="fill" style="display:block;width:${Math.max(2, (val || 0) / mx * 100)}%;background:${color}"></span></span><span class="num">${esc(txt)}</span></div>`).join("")}</div>`;
}

function renderInhalte(v) {
  const c = channel(), data = CH();
  const cats = Insights.categories(data, c);
  if (!cats.length) { v.innerHTML = card(`<div class="empty-state"><div class="big">🧩</div><h2>Noch keine Beiträge</h2><p>Über die API oder die vollständige Bestandsaufnahme kommen Beiträge in die Analyse.</p><button class="btn primary" id="i0">Daten holen</button></div>`); $("#i0").onclick = openDaten; return; }
  const core = Insights.coreInsight(cats);
  const partners = Insights.partners(data, c);
  const rh = Insights.rhythm(data);
  const vm = Insights.vsMedian(data);
  const fR = cats.filter(r => r.follows != null), cR = cats.filter(r => r.comments != null), eR = cats.filter(r => r.er != null);
  v.innerHTML = `
    ${core ? card(`<div class="t-label">Kernaussage</div><div style="font-size:1.02rem;font-weight:700;line-height:1.4;margin-top:6px">${esc(core)}</div>`, "dark") : ""}
    ${card(`<div class="row"><b class="spacer">Inhalts-Kategorien</b><span class="meta">${cats.reduce((s, r) => s + r.n, 0)} Beiträge · automatisch</span></div>
      ${fR.length ? `<div class="label" style="margin:12px 0 6px">Ø neue Follower je Beitrag</div>${barRows(fR.map(r => [r.name, r.follows, fmtNum(r.follows, 0)]))}` : ""}
      ${cR.length ? `<div class="label" style="margin:14px 0 6px">Ø Kommentare je Beitrag</div>${barRows(cR.map(r => [r.name, r.comments, fmtNum(r.comments, 0)]), "var(--accent2)")}` : ""}
      ${!fR.length && !cR.length && eR.length ? `<div class="label" style="margin:12px 0 6px">Ø Engagement-Rate</div>${barRows(eR.map(r => [r.name, r.er, fmtNum(r.er, 1) + " %"]))}` : ""}
      <p class="meta" style="margin:10px 0 0">${cats.map(r => `${esc(r.name)}: ${r.n}`).join(" · ")}</p>
      <details><summary>Wie wird kategorisiert?</summary><p>Die App erkennt Kategorien an Wörtern und Markierungen in der Bildunterschrift – passend zur Rolle „${esc(roleOf(c).short)}“. Bei Beiträgen aus Screenshots steht nur der Anfang der Bildunterschrift zur Verfügung; mit der API ist die Erkennung genauer. Unter „Alle Einträge“ lässt sich die Kategorie je Beitrag ändern.</p></details>`)}
    ${partners.length ? card(`<b>${esc(roleOf(c).partner)}</b><div class="meta" style="margin:2px 0 8px">Markierte Accounts in Beiträgen</div>
      ${partners.slice(0, 5).map((p, i) => `<div class="rank"><span class="no n${Math.min(i, 2)}">${i + 1}</span><span class="spacer"><b>${esc(p.handle)}</b><small>${p.n} ${p.n === 1 ? "Beitrag" : "Beiträge"}${p.hasR ? ` · ${fmtNum(p.reach / p.hasR, 0)} Ø erreicht` : ""}</small></span><b>${p.hasF ? fmtNum(p.follows, 0) : "–"}</b></div>`).join("")}
      <p class="meta" style="margin:6px 0 0">Rechts: neue Follower aus gemeinsamen Beiträgen</p>`) : ""}
    ${card(`<div class="row"><b class="spacer">Posting-Rhythmus</b><span class="meta">letzte 10 Wochen</span></div>
      <div class="weekbars" aria-hidden="true">${rh.bins.map(b => `<div style="height:${b.n ? Math.min(100, 20 + b.n * 25) : 6}%" class="${b.n ? "" : "zero"}"></div>`).join("")}</div>
      <div class="row meta" style="justify-content:space-between"><span>KW ${rh.bins[0].kw}</span><span>KW ${rh.bins[rh.bins.length - 1].kw}</span></div>
      <p style="margin:10px 0 0;font-size:.88rem">Ø <b>${fmtNum(rh.perWeek, 1)} Beiträge pro Woche</b>${rh.gap ? `. Längste Pause: <b>${rh.gap.days} Tage</b> (${dDE(rh.gap.from)}${rh.gap.to ? `–${dDE(rh.gap.to)}` : " bis heute"})` : ""}.</p>`)}
    ${vm ? card(`<b>Im Vergleich zu deinem Schnitt</b><div class="meta" style="margin:2px 0 8px">Reichweite je Beitrag · Median ${fmtNum(vm.median, 0)}</div>
      ${[...vm.rows.slice(0, 2), vm.rows[vm.rows.length - 1]].map(r => `<div class="row line"><span class="spacer">${esc(r.p.e.name)} · ${dDE(r.p.date)}</span><b class="${r.dev >= 0 ? "up" : "down"}">${r.dev >= 0 ? "+" : "−"}${fmtNum(Math.abs(r.dev), 0)} %</b></div>`).join("")}
      <button class="btn ghost" id="iall" style="padding-left:0">Alle Einträge →</button>`) : `<button class="btn block" id="iall">Alle Einträge</button>`}
    ${placeholder("Bildstimmung", "mit automatischem Abruf")}`;
  $("#iall").onclick = () => { S.ui.histType = "beitrag"; S.ui.histMode = "tabelle"; go("verlauf"); };
}

function renderZielgruppe(v) {
  const c = channel(), ks = latestKonto(), d = ks?.d || {};
  if (!ks) { v.innerHTML = card(`<div class="empty-state"><div class="big">👥</div><h2>Noch keine Zielgruppen-Daten</h2><p>Kommt mit dem API-Abruf oder dem Zielgruppe-Screenshot.</p><button class="btn primary" id="z0">Daten holen</button></div>`); $("#z0").onclick = openDaten; return; }
  const goal = CH().goals.k_female, en = ks.engaged;
  const gbar = (f, m) => `<div class="gbar"><div style="width:${f}%"></div><div></div></div><div class="row" style="justify-content:space-between;font-size:.82rem;font-weight:700;margin-top:5px"><span style="color:var(--accent)">Frauen ${fmtNum(f, 1)} %</span><span style="color:var(--accent2)">Männer ${fmtNum(m ?? 100 - f, 1)} %</span></div>`;
  const ages = Object.entries(ks.age || {}).sort(), cities = Object.entries(ks.cities || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const on = ks.online;
  let heat = "";
  if (on) {
    const mx = Math.max(...on.flat()) || 1, slots = [6, 9, 12, 15, 18, 21];
    const cell = (wd, h) => { const val = Math.max(on[wd][h] || 0, on[wd][h + 1] || 0, on[wd][h + 2] || 0); return `<span class="hm" style="background:rgba(194,24,91,${(0.08 + 0.92 * val / mx).toFixed(2)})"></span>`; };
    const best = []; on.forEach((row, wd) => row.forEach((n, h) => best.push([n, wd, h]))); best.sort((a, b) => b[0] - a[0]);
    const WD = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    heat = `<div class="heat"><span></span>${slots.map(h => `<span class="meta" style="text-align:center">${h}</span>`).join("")}${WD.map((w, i) => `<span class="meta">${w}</span>${slots.map(h => cell(i, h)).join("")}`).join("")}</div>
      <p style="font-size:.86rem;margin:10px 0 0">Beste Zeiten: ${best.slice(0, 3).map(([, wd, h]) => `<b>${WD[wd]} ${h} Uhr</b>`).join(", ")}</p>`;
  }
  v.innerHTML = `
    ${d.female != null ? card(`<div class="row"><b class="spacer">Frauenanteil</b>${goal ? `<button class="btn ghost small" id="zg">Ziel: ${fmtNum(goal.v, 0)} %</button>` : `<button class="btn ghost small" id="zg">Ziel setzen</button>`}</div>
      <div class="label" style="margin:12px 0 6px">Follower</div>${gbar(d.female, d.male)}
      <div class="label" style="margin:16px 0 6px">Wer interagiert</div>
      ${en?.female != null ? `${gbar(en.female, en.male)}<p style="font-size:.86rem;margin:10px 0 0">${en.female > d.female + 2 ? `Frauen reagieren stärker, als sie folgen (+${fmtNum(en.female - d.female, 1)} Prozentpunkte). Inhalte, die Frauen ansprechen, sind der Hebel.` : en.female < d.female - 2 ? `Frauen reagieren schwächer, als sie folgen. Inhalte gezielt auf Frauen ausrichten.` : "Follower und Interagierende sind ähnlich verteilt."}</p>`
        : `<div class="gbar ph"></div><p class="meta" style="margin:6px 0 0">Kommt mit dem API-Abruf</p>`}`) : ""}
    ${ages.length ? card(`<b>Altersgruppen</b>${en?.age && Object.keys(en.age).length ? `<span class="meta"> · Follower / Interagierende</span>` : ""}<div style="margin-top:10px">${barRows(ages.map(([a, p]) => [a, p, `${fmtNum(p, 1)} %${en?.age?.[a] != null ? ` / ${fmtNum(en.age[a], 1)} %` : ""}`]))}</div>`) : ""}
    ${on ? card(`<div class="row"><b class="spacer">Beste Posting-Zeiten</b><span class="meta">Follower online, Ø 30 Tage</span></div>${heat}`) : placeholder("Beste Posting-Zeiten", "per API")}
    ${cities.length ? card(`<b>Top-Städte</b><div style="margin-top:10px">${barRows(cities.map(([n, p]) => [n, p, fmtNum(p, 1) + " %"]))}</div>`) : placeholder("Top-Städte", "per API oder Screenshot")}`;
  if ($("#zg")) $("#zg").onclick = () => { S.ui.goalType = "konto"; go("ziele"); };
}

function renderWachstum(v) {
  const c = channel(), data = CH(), sn = snapshot(S.active), ks = sn.konto, d = ks?.d || {}, kv = sn.kv;
  const trend = Insights.trend30(ks), fc = Insights.forecast(d.followers ?? sn.followers, sn.growth);
  const hist = [...(data.konto || [])].filter(x => x.d.followers).sort((a, b) => a.date.localeCompare(b.date));
  const t = (l, val, delta) => val == null ? "" : `<div class="tile"><div class="t">${l}</div><div class="v">${val}</div>${delta != null ? `<div class="d ${delta >= 0 ? "up" : "down"}">${fmtDeltaPct(delta)}</div>` : ""}</div>`;
  v.innerHTML = `
    ${card(`<b>Follower</b><div class="tiles">${[
      t("Follower", d.followers != null ? fmtNum(d.followers, 0) : sn.followers != null ? fmtNum(sn.followers, 0) : null, ks?.delta?.followers),
      t("Netto", d.net != null ? (d.net > 0 ? "+" : "") + fmtNum(d.net, 0) : null),
      t("Neue", d.newF != null ? fmtNum(d.newF, 0) : null), t("Verloren", d.lost != null ? fmtNum(d.lost, 0) : null),
      t("Wachstum / Monat", kv.k_growth != null ? fmtNum(kv.k_growth, 1) + " %" : kv.p_growth != null ? fmtNum(kv.p_growth, 1) + " %" : null),
      t("Abwanderung / Monat", kv.k_churn != null ? fmtNum(kv.k_churn, 1) + " %" : null)].join("")}</div>`)}
    ${fc ? card(`<div class="t-label">Prognose</div><div style="font-size:1.02rem;font-weight:700;margin-top:6px">${fmtNum(fc.target, 0)} Follower voraussichtlich im ${fc.date.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</div><p class="meta" style="margin:6px 0 0">Bei gleichbleibend ${fmtNum(sn.growth, 1)} % Wachstum pro Monat.</p>`, "dark") : ""}
    ${trend || kv.k_nonf != null ? card(`<b>Reichweite</b><div class="tiles">${[
      trend ? t("30-Tage-Trend", fmtDeltaPct(trend.pct)) : "",
      t("Nicht-Follower-Anteil", kv.k_nonf != null ? fmtNum(kv.k_nonf, 1) + " %" : null, ks?.delta?.viewsNF),
      t("Betrachter", d.reached != null ? fmtNum(d.reached, 0) : null, ks?.delta?.reached),
      t("Aufrufe / Betrachter", kv.k_freq != null ? fmtNum(kv.k_freq, 1) + " ×" : null)].join("")}</div>${trend ? `<p class="meta" style="margin:8px 0 0">Trend: ${esc(trend.src)}</p>` : ""}`) : ""}
    ${hist.length >= 2 ? card(`<b>Follower-Verlauf</b><div style="margin-top:10px">${barRows(hist.slice(-8).map(x => [dDE(x.date), x.d.followers - Math.min(...hist.map(h => h.d.followers)) * 0.98, fmtNum(x.d.followers, 0)]))}</div>`) : ""}
    ${placeholder("Follower-Qualität und Tagesverlauf", "mit automatischem Abruf")}`;
}

/* ================= Planen ================= */
function weekStart(off = 0) { const m = Insights.mondayOf(new Date()); m.setDate(m.getDate() + 7 * off); return m; }
function expWeek(x) { return Math.min(x.weeks, Math.max(1, Math.floor((Date.now() - new Date(x.start + "T00:00")) / (7 * 864e5)) + 1)); }
function renderPlanen(v) {
  const c = channel(), data = CH(), r = roleOf(c) || ROLES.creator;
  data.plan = data.plan || []; data.experiments = data.experiments || []; data.events = data.events || [];
  const off = S.ui.weekOff || 0, ws = weekStart(off), days = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i); return Anlaesse.iso(d); });
  const inWeek = data.plan.filter(p => days.includes(p.date));
  const count = key => key === "story" ? new Set(inWeek.filter(p => p.type === "story").map(p => p.date)).size
    : key === "beitrag" ? inWeek.filter(p => p.type === "beitrag" || p.type === "karussell").length : inWeek.filter(p => p.type === key).length;
  const goals = r.weekly.filter(([, n]) => n > 0), doneN = goals.reduce((s, [k, n]) => s + Math.min(n, count(k)), 0), totN = goals.reduce((s, [, n]) => s + n, 0);
  const ev = Anlaesse.upcoming(c, data, new Date(), 45).filter(a => a.date >= today());
  const WD = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"];
  v.innerHTML = `
    ${card(`<div class="row"><div class="spacer"><div class="meta">Wochenziel · ${esc(r.short)}</div><b>${goals.map(([k, n, l]) => `${n} ${l}`).join(" · ")}</b></div><b style="font-size:1.2rem">${doneN}/${totN}</b></div>`)}
    <div class="row weeknav"><button class="iconbtn" id="wprev" aria-label="Vorige Woche">‹</button><b class="spacer" style="text-align:center">KW ${Insights.isoWeek(ws)} · ${dDE(days[0]).slice(0, 5)}–${dDE(days[6]).slice(0, 5)}</b><button class="iconbtn" id="wnext" aria-label="Nächste Woche">›</button></div>
    ${card(days.map((ds, i) => {
      const its = data.plan.filter(p => p.date === ds).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      const evs = ev.filter(a => a.date === ds);
      const isT = ds === today();
      return `<div class="day ${isT ? "today" : ""}"><div class="dl"><small>${isT ? "HEUTE" : WD[i]}</small><b>${+ds.slice(8)}</b></div><div class="spacer">
        ${evs.map(a => `<div class="evtag">${esc(a.name)}</div>`).join("")}
        ${its.map(p => `<button class="it ${p.done ? "done" : ""}" data-pi="${p.id}"><span class="tag ${PLAN_TYPES[p.type]?.[1]}">${PLAN_TYPES[p.type]?.[0]}</span><span class="spacer">${esc(p.title)}</span>${p.time ? `<span class="meta">${esc(p.time)}</span>` : ""}</button>`).join("")}
        <button class="addit" data-add="${ds}" aria-label="Inhalt am ${fmtDate(ds)} planen">＋</button></div></div>`;
    }).join(""), "", "padding:4px 16px")}
    <div class="label">Anlässe</div>
    ${card((ev.length ? ev.slice(0, 8).map(a => `<div class="row line"><b style="width:52px;font-size:.84rem">${dDE(a.date).slice(0, 5)}</b><span class="spacer"><b>${esc(a.name)}</b>${a.kind === "eigen" ? ' <span class="badge">eigener</span>' : ""}${a.idea ? `<small class="meta" style="display:block">${esc(a.idea)}</small>` : ""}</span><button class="btn ghost small" data-evplan="${a.date}|${esc(a.idea || a.name)}">Planen</button></div>`).join("") : `<p class="hint">Keine Anlässe in den nächsten Wochen.</p>`) + `<button class="btn ghost" id="evadd" style="padding-left:0">+ Eigener Anlass (z. B. Stadtfest, Messe)</button>`, "", "padding:4px 16px")}
    <div class="label">Experimente</div>
    ${data.experiments.map(x => expCard(x)).join("")}
    <button class="btn block" id="expadd">+ Experiment starten</button>`;
  $("#wprev").onclick = () => { S.ui.weekOff = off - 1; render(); };
  $("#wnext").onclick = () => { S.ui.weekOff = off + 1; render(); };
  v.querySelectorAll("[data-pi]").forEach(b => b.onclick = () => openPlanItem(data.plan.find(p => p.id === b.dataset.pi)));
  v.querySelectorAll("[data-add]").forEach(b => b.onclick = () => openPlanItem({ date: b.dataset.add, type: "beitrag" }));
  v.querySelectorAll("[data-evplan]").forEach(b => b.onclick = () => { const [dt, t] = b.dataset.evplan.split("|"); openPlanItem({ date: dayBefore(dt), title: t, type: "beitrag" }); });
  $("#evadd").onclick = openEvent;
  $("#expadd").onclick = openExperiment;
  v.querySelectorAll("[data-expclose]").forEach(b => b.onclick = () => { const x = data.experiments.find(e => e.id === b.dataset.expclose); x.closed = true; x.result = currentValue(KPI_BY_ID[x.kpi])?.v ?? null; save(); render(); });
  v.querySelectorAll("[data-expdel]").forEach(b => armed(b, "Wirklich löschen?", () => { data.experiments = data.experiments.filter(e => e.id !== b.dataset.expdel); save(); render(); }));
}
function expCard(x) {
  const k = KPI_BY_ID[x.kpi], cur = x.closed ? x.result : currentValue(k)?.v, wk = expWeek(x), over = wk >= x.weeks && (Date.now() - new Date(x.start)) / 864e5 >= x.weeks * 7;
  const better = cur != null && x.baseline != null ? (k.inv ? cur < x.baseline : cur > x.baseline) : null;
  return card(`<div class="row"><b class="spacer">${esc(x.name)}</b><span class="meta" style="color:var(--accent2);font-weight:700">${x.closed ? "abgeschlossen" : `Woche ${wk} von ${x.weeks}`}</span></div>
    <p style="font-size:.86rem;margin:6px 0 0">${esc(x.hyp)}</p><p class="meta" style="margin:4px 0 0">Maßnahme: ${esc(x.action)}</p>
    <div class="progress" style="margin:12px 0 8px"><i style="width:${x.closed ? 100 : wk / x.weeks * 100}%;background:var(--accent2)"></i></div>
    <div class="row" style="font-size:.82rem"><span class="spacer meta">${esc(k?.n || x.kpi)}</span><span>Start <b>${x.baseline != null ? esc(fmtKpi(k, x.baseline)) : "–"}</b>${cur != null && (x.closed || wk > 1) ? ` → jetzt <b>${esc(fmtKpi(k, cur))}</b> <span class="${better ? "up" : "down"}">${esc(fmtDelta(k, x.baseline, cur))}</span>` : ""}</span></div>
    ${x.closed ? `<p style="font-size:.86rem;margin:8px 0 0;font-weight:700" class="${better ? "up" : "down"}">${better ? "Annahme bestätigt – Maßnahme beibehalten." : "Annahme nicht bestätigt – etwas anderes testen."}</p>` : ""}
    <div class="row" style="margin-top:8px">${!x.closed ? `<button class="btn small" data-expclose="${x.id}">${over ? "Auswerten & abschließen" : "Vorzeitig abschließen"}</button>` : ""}<button class="btn small" data-expdel="${x.id}">Löschen</button></div>`);
}
function openPlanItem(p) {
  const data = CH(), isNew = !p.id, exps = (data.experiments || []).filter(x => !x.closed);
  openSheet(`<h2>${isNew ? "Inhalt planen" : "Inhalt bearbeiten"}</h2>
    <div class="grid"><label class="field"><span>Datum</span><input type="date" id="pdate" value="${p.date || today()}"></label>
    <label class="field"><span>Uhrzeit</span><input type="time" id="ptime" value="${p.time || ""}"></label></div>
    <label class="field" style="margin-top:12px"><span>Format</span><select id="ptype">${Object.entries(PLAN_TYPES).map(([k, [l]]) => `<option value="${k}" ${p.type === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="field" style="margin-top:12px"><span>Thema</span><input type="text" id="ptitle" maxlength="80" value="${esc(p.title || "")}" placeholder="z. B. Behind the Scenes vom Shooting"></label>
    ${exps.length ? `<label class="field" style="margin-top:12px"><span>Gehört zu Experiment</span><select id="pexp"><option value="">–</option>${exps.map(x => `<option value="${x.id}" ${p.exp === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>` : ""}
    ${!isNew ? `<label class="row" style="margin-top:12px;gap:10px;font-weight:600"><input type="checkbox" id="pdone" ${p.done ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)"> Erledigt</label>` : ""}
    <div class="row" style="margin-top:16px"><button class="btn primary spacer" id="psave">Speichern</button>${!isNew ? `<button class="btn" id="pdel">Löschen</button>` : ""}</div>`, b => {
    b.querySelector("#psave").onclick = () => {
      const title = b.querySelector("#ptitle").value.trim(); if (!title) return toast("Bitte ein Thema eingeben");
      const it = { id: p.id || newId(), date: b.querySelector("#pdate").value || today(), time: b.querySelector("#ptime").value, type: b.querySelector("#ptype").value, title, exp: b.querySelector("#pexp")?.value || "", done: b.querySelector("#pdone")?.checked || false };
      data.plan = (data.plan || []).filter(x => x.id !== it.id).concat(it); save(); closeSheet(); render(); toast(isNew ? "Eingeplant" : "Gespeichert");
    };
    if (b.querySelector("#pdel")) armed(b.querySelector("#pdel"), "Wirklich?", () => { data.plan = data.plan.filter(x => x.id !== p.id); save(); closeSheet(); render(); });
  });
}
function openEvent() {
  openSheet(`<h2>Eigener Anlass</h2><p class="hint">Lokale Termine wie Stadtfest, Messe, Jubiläum oder Eröffnung.</p>
    <label class="field"><span>Datum</span><input type="date" id="edate" value="${today()}"></label>
    <label class="field" style="margin-top:12px"><span>Name</span><input type="text" id="ename" maxlength="60" placeholder="z. B. Striezelmarkt Dresden"></label>
    <label class="field" style="margin-top:12px"><span>Idee (optional)</span><input type="text" id="eidea" maxlength="100" placeholder="z. B. Reel vom Markt"></label>
    <button class="btn primary block" id="esave" style="margin-top:16px">Hinzufügen</button>`, b => {
    b.querySelector("#esave").onclick = () => {
      const name = b.querySelector("#ename").value.trim(); if (!name) return toast("Bitte einen Namen eingeben");
      CH().events = (CH().events || []).concat({ id: newId(), date: b.querySelector("#edate").value || today(), name, idea: b.querySelector("#eidea").value.trim() });
      save(); closeSheet(); render(); toast("Anlass hinzugefügt");
    };
  });
}
const EXP_KPIS = ["k_nonf", "k_growth", "k_female", "k_reels", "k_conv", "k_link", "b_er_reach", "b_save", "b_share", "b_follow", "b_reachq", "r_wtr", "r_hook", "r_share", "s_compl", "s_reply"];
function openExperiment() {
  const r = roleOf(channel()) || ROLES.creator;
  const draw = (t = {}) => openSheet(`<h2>Experiment starten</h2><p class="hint">Eine Sache gezielt ändern und nach einigen Wochen messen, ob sie wirkt.</p>
    <div class="label">Vorlagen · ${esc(r.short)}</div>
    <div class="chips wrap">${r.experiments.map((x, i) => `<button class="chip" data-tpl="${i}" aria-pressed="${t.name === x.name}">${esc(x.name)}</button>`).join("")}</div>
    <label class="field" style="margin-top:12px"><span>Name</span><input type="text" id="xname" maxlength="60" value="${esc(t.name || "")}"></label>
    <label class="field" style="margin-top:12px"><span>Annahme</span><small>Was soll sich verbessern, und warum?</small><input type="text" id="xhyp" maxlength="160" value="${esc(t.hyp || "")}"></label>
    <label class="field" style="margin-top:12px"><span>Maßnahme</span><input type="text" id="xact" maxlength="120" value="${esc(t.action || "")}"></label>
    <div class="grid" style="margin-top:12px"><label class="field"><span>Messgröße</span><select id="xkpi">${EXP_KPIS.map(id => `<option value="${id}" ${t.kpi === id ? "selected" : ""}>${esc(KPI_BY_ID[id].n)}</option>`).join("")}</select></label>
    <label class="field"><span>Dauer</span><select id="xw">${[2, 4, 6, 8].map(w => `<option value="${w}" ${w === 4 ? "selected" : ""}>${w} Wochen</option>`).join("")}</select></label></div>
    <p class="meta" id="xbase" style="margin:8px 0 0"></p>
    <button class="btn primary block" id="xsave" style="margin-top:16px">Starten</button>`, b => {
    const base = () => { const k = KPI_BY_ID[b.querySelector("#xkpi").value], cur = currentValue(k); b.querySelector("#xbase").textContent = cur ? `Ausgangswert: ${fmtKpi(k, cur.v)} (aus ${cur.src})` : "Noch kein Ausgangswert – er wird beim nächsten Datenabruf gesetzt."; };
    base(); b.querySelector("#xkpi").onchange = base;
    b.querySelectorAll("[data-tpl]").forEach(x => x.onclick = () => draw(r.experiments[+x.dataset.tpl]));
    b.querySelector("#xsave").onclick = () => {
      const name = b.querySelector("#xname").value.trim(); if (!name) return toast("Bitte einen Namen eingeben");
      const kpi = b.querySelector("#xkpi").value;
      CH().experiments = (CH().experiments || []).concat({ id: newId(), name, hyp: b.querySelector("#xhyp").value.trim(), action: b.querySelector("#xact").value.trim() || name, kpi, weeks: +b.querySelector("#xw").value, start: today(), baseline: currentValue(KPI_BY_ID[kpi])?.v ?? null });
      save(); closeSheet(); render(); toast("Experiment gestartet");
    };
  });
  draw();
}

/* ================= Berichte ================= */
function renderBerichte(v) {
  const c = channel(), r = roleOf(c) || ROLES.creator, data = CH(), sn = snapshot(S.active), ks = sn.konto, d = ks?.d || {};
  const goals = Object.entries(data.goals).filter(([id]) => KPI_BY_ID[id]);
  const reached = goals.filter(([id, g]) => { const k = KPI_BY_ID[id], cur = currentValue(k); return cur && goalStatus(k, cur.v, g)?.done; }).length;
  const big = (id, icon, cls, title, sub) => `<button class="big" id="${id}"><span class="ico ${cls}">${icon}</span><span class="spacer"><b>${title}</b><small>${sub}</small></span><span class="chev">›</span></button>`;
  const mods = r.berichte;
  let werbewert = "", einwohner = "";
  if (mods.includes("werbewert")) {
    const cpm = c.cpm ?? 6, views = d.views, days = d.days || 90;
    werbewert = card(`<b>Werbewert der Reichweite</b><p class="meta" style="margin:2px 0 10px">Was hätten die Aufrufe als bezahlte Anzeigen gekostet?</p>
      ${views ? `<div class="tile hl"><div class="t">Rechnerischer Werbewert · ${days} Tage</div><div class="v">${fmtEUR(views / 1000 * cpm)}</div></div><p class="meta" style="margin:8px 0 0">${fmtNum(views, 0)} Aufrufe ÷ 1.000 × ${fmtEUR(cpm)} TKP</p>` : `<p class="hint">Braucht Aufrufe aus API oder Leistung-Screenshot.</p>`}
      <label class="field" style="margin-top:12px"><span>Annahme: TKP für Anzeigen (€)</span><small>Kosten je 1.000 Aufrufe – am besten aus eigenen Werbekampagnen übernehmen</small><input type="number" inputmode="decimal" id="bcpm" value="${cpm}"></label>
      <details><summary>Wofür ist das gut?</summary><p>Der Werbewert übersetzt organische Reichweite in Geld und hilft, Social Media intern zu begründen. Es ist ein Vergleichswert, kein Umsatz.</p></details>`);
  }
  if (mods.includes("einwohner")) {
    const ew = c.einwohner;
    einwohner = card(`<b>Reichweite in der Bevölkerung</b><p class="meta" style="margin:2px 0 10px">Einwohnerzahl in den Kanal-Einstellungen</p>
      ${ew ? `<div class="tiles">${(d.followers ?? sn.followers) ? `<div class="tile"><div class="t">Follower je 100 Einwohner</div><div class="v">${fmtNum((d.followers ?? sn.followers) / ew * 100, 1)}</div></div>` : ""}${d.reached ? `<div class="tile"><div class="t">Betrachter im Verhältnis</div><div class="v">${fmtNum(d.reached / ew * 100, 0)} %</div></div>` : ""}</div>
        <p class="meta" style="margin:8px 0 0">Nicht alle Follower und Betrachter wohnen vor Ort – die Zahlen sind eine Annäherung.</p>` : `<button class="btn small" id="bew">Einwohnerzahl eintragen</button>`}`);
  }
  v.innerHTML = `
    ${card(`<div class="row"><b class="spacer">Ziele</b><span class="meta" style="font-weight:700">${goals.length ? `${reached} von ${goals.length} erreicht` : ""}</span></div>
      ${goals.slice(0, 3).map(([id, g]) => { const k = KPI_BY_ID[id], cur = currentValue(k), gs = goalStatus(k, cur?.v, g); return `<div class="goal"><div class="row" style="font-size:.9rem"><b class="spacer">${esc(k.n)}</b><span><b>${cur ? esc(fmtKpi(k, cur.v)) : "–"}</b> / ${esc(fmtKpi(k, g.v))}</span></div><div class="progress ${gs?.done ? "done" : ""}"><i style="width:${gs ? gs.progress : 0}%"></i></div><div class="meta">${gs ? esc(gs.done ? "erreicht" : gs.text) : "noch kein Wert"}${g.date ? ` · bis ${dDE(g.date)}` : ""}</div></div>`; }).join("") || `<p class="hint" style="margin:8px 0 0">Noch keine Ziele gesetzt.</p>`}
      <button class="btn ghost" id="bgoals" style="padding-left:0">${goals.length ? "Alle Ziele bearbeiten →" : "+ Ziel setzen"}</button>`)}
    ${big("brep", I.doc, "dark", "Report", "Gestalteter Bericht als PDF – Monat wählbar")}
    ${mods.includes("mediakit") ? big("bmk", I.image, "acc", "Media-Kit", "Für Läden und Marken: Reichweite, Zielgruppe, Leistungen") : ""}
    ${mods.includes("deals") ? big("bdeal", I.deal, "", "Kooperation", "Preis einschätzen, Angebot prüfen") : ""}
    ${werbewert}${einwohner}
    <p class="note">Rolle: ${esc(r.label)}${c.role === "business" ? ` · ${esc(BRANCHEN[c.branche] || "")}` : ""} · <button class="btn ghost small" id="brole" style="padding:0;min-height:0;display:inline">ändern</button></p>`;
  $("#bgoals").onclick = () => go("ziele");
  $("#brep").onclick = () => go("report");
  if ($("#bmk")) $("#bmk").onclick = () => go("mediakit");
  if ($("#bdeal")) $("#bdeal").onclick = () => go("deals");
  if ($("#bcpm")) $("#bcpm").onchange = e => { const x = parseFloat(e.target.value); if (isFinite(x) && x > 0) { c.cpm = x; save(); render(); } };
  if ($("#bew")) $("#bew").onclick = openChannelSettings;
  $("#brole").onclick = openChannelSettings;
}

/* ================= Media-Kit ================= */
function mediaKitDoc(c, mk) {
  const sn = snapshot(S.active), ks = sn.konto, d = ks?.d || {}, kv = sn.kv, data = CH();
  const e = s => esc(s ?? "");
  const followers = d.followers ?? sn.followers;
  const top = Insights.posts(data).filter(p => p.reach).sort((a, b) => b.reach - a.reach).slice(0, 4);
  const deal = calcDeal({ ...data.deal, nPost: 1, nReel: 1, nStory: 1, rPost: data.deal.rPost ?? (sn.reachPost && Math.round(sn.reachPost)), rReel: data.deal.rReel ?? (sn.reachReel && Math.round(sn.reachReel)), er: data.deal.er ?? sn.erPost });
  const T = (l, v) => v == null ? "" : `<div class="rp-tile"><div class="t">${e(l)}</div><div class="v">${e(v)}</div></div>`;
  const B = [];
  B.push(`<div class="rp-block"><div class="rp-h2">Auf einen Blick</div><div class="rp-tiles c4">${[
    T("Follower", followers != null ? fmtNum(followers, 0) : null),
    T(`Aufrufe · ${d.days || 90} Tage`, d.views != null ? fmtNum(d.views, 0) : null),
    T("Erreichte Konten", d.reached != null ? fmtNum(d.reached, 0) : null),
    T("Ø Reichweite Beitrag", sn.reachPost ? fmtNum(Math.round(sn.reachPost), 0) : null),
    T("Ø Engagement-Rate", sn.erPost != null ? fmtNum(sn.erPost, 1) + " %" : null),
    T("Interaktionen / Monat", ks?.ex ? fmtNum(exInter(ks.ex) * 30 / (ks.ex.days || 30), 0) : null),
    T("Aufrufe von Nicht-Followern", kv.k_nonf != null ? fmtNum(kv.k_nonf, 0) + " %" : null),
    T("Wachstum / Monat", sn.growth != null ? fmtNum(sn.growth, 1) + " %" : null)].join("")}</div></div>`);
  const ages = Object.entries(ks?.age || {}).sort(), cities = Object.entries(ks?.cities || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (d.female != null || ages.length || cities.length) {
    const mx = Math.max(...ages.map(a => a[1]), 1), cm = Math.max(...cities.map(a => a[1]), 1);
    const bars = (rows, m) => `<div class="rp-bars">${rows.map(([l, p]) => `<div class="rp-bar"><span>${e(l)}</span><span class="tr"><span class="fi" style="display:block;width:${p / m * 100}%"></span></span><span class="n">${fmtNum(p, 1)} %</span></div>`).join("")}</div>`;
    B.push(`<div class="rp-block"><div class="rp-h2">Zielgruppe</div><div class="rp-two"><div>
      ${d.female != null ? `<div class="rp-sub">Geschlecht</div><div style="display:flex;height:16px;border-radius:99px;overflow:hidden;margin-bottom:4px"><div style="width:${d.female}%;background:${ReportDoc.C.accent}"></div><div style="flex:1;background:${ReportDoc.C.accent2}"></div></div><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:12px"><span style="color:${ReportDoc.C.accent}">Frauen ${fmtNum(d.female, 1)} %</span><span style="color:${ReportDoc.C.accent2}">Männer ${fmtNum(d.male ?? 100 - d.female, 1)} %</span></div>` : ""}
      ${ages.length ? `<div class="rp-sub">Alter</div>${bars(ages, mx)}` : ""}</div>
      <div>${cities.length ? `<div class="rp-sub">Top-Städte</div>${bars(cities, cm)}` : ""}</div></div></div>`);
  }
  if (top.length) B.push(`<div class="rp-block"><div class="rp-h2">Erfolgreichste Inhalte</div><table class="rp-t"><thead><tr><th>Inhalt</th><th>Datum</th><th>Erreicht</th><th>Interaktion</th></tr></thead><tbody>${top.map(p => `<tr><td>${e(p.e.name)}</td><td>${dDE(p.date)}</td><td>${fmtNum(p.reach, 0)}</td><td>${p.er != null ? fmtNum(p.er, 1) + " %" : "–"}</td></tr>`).join("")}</tbody></table></div>`);
  const svc = [["post", "Feed-Beitrag", 0], ["reel", "Reel", 1], ["story", "Story-Slide", 2]].filter(([k]) => mk.services?.[k] !== false);
  if (svc.length) B.push(`<div class="rp-block"><div class="rp-h2">Leistungen</div><table class="rp-t"><thead><tr><th>Leistung</th><th>${mk.prices ? "Preisrahmen" : ""}</th></tr></thead><tbody>${svc.map(([, l, i]) => `<tr><td>${l}</td><td>${mk.prices && deal.items[i].lo ? `${fmtEUR(deal.items[i].lo)} – ${fmtEUR(deal.items[i].hi)}` : mk.prices ? "auf Anfrage" : ""}</td></tr>`).join("")}${mk.extra ? `<tr><td>${e(mk.extra)}</td><td>${mk.prices ? "auf Anfrage" : ""}</td></tr>` : ""}</tbody></table>
    ${mk.prices ? `<div class="rp-note" style="margin-top:6px">Preise netto, abhängig von Umfang, Nutzungsrechten und Exklusivität.</div>` : ""}</div>`);
  if (mk.contact) B.push(`<div class="rp-block"><div class="rp-h2">Kontakt</div><div style="font-size:15px;font-weight:700;white-space:pre-line">${e(mk.contact)}</div></div>`);
  const meta = { ch: c.name, period: "Media-Kit", prev: null };
  const cover = `<div class="rp-cover" style="height:190px"><div class="k">Media-Kit</div><h1>${e(c.name)}</h1><div class="s" style="font-size:15px">${e(mk.tagline || "")}</div><div class="s" style="opacity:.85;margin-top:6px">${e(mk.location || "")}${ks ? ` · Stand ${dDE(ks.date)}` : ""}</div></div>`;
  return ReportDoc.layoutBlocks(B, meta, cover);
}
let mkPdf = null;
function renderMediaKit(v) {
  const c = channel(), mk = c.mediakit = c.mediakit || { tagline: "", location: "", contact: "", prices: true, services: {} };
  const doc = mediaKitDoc(c, mk);
  if (mkPdf) { URL.revokeObjectURL(mkPdf.url); mkPdf = null; }
  v.innerHTML = `
    ${card(`<b>Angaben</b><p class="meta" style="margin:2px 0 10px">Zahlen kommen automatisch aus der Bestandsaufnahme.</p>
      <label class="field"><span>Kurzbeschreibung</span><input type="text" id="mtag" maxlength="90" value="${esc(mk.tagline)}" placeholder="z. B. Model & Content Creator aus Dresden"></label>
      <label class="field" style="margin-top:10px"><span>Ort / Region</span><input type="text" id="mloc" maxlength="60" value="${esc(mk.location)}" placeholder="z. B. Dresden & Pirna"></label>
      <label class="field" style="margin-top:10px"><span>Kontakt</span><textarea id="mcon" style="min-height:70px;font-family:inherit;font-size:16px" placeholder="E-Mail, Telefon">${esc(mk.contact)}</textarea></label>
      <div class="label" style="margin:14px 0 6px">Leistungen</div>
      ${[["post", "Feed-Beitrag"], ["reel", "Reel"], ["story", "Story-Slide"]].map(([k, l]) => `<label class="row" style="gap:10px;padding:5px 0;font-weight:600"><input type="checkbox" data-svc="${k}" ${mk.services[k] !== false ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)"> ${l}</label>`).join("")}
      <label class="field" style="margin-top:6px"><span>Weitere Leistung (optional)</span><input type="text" id="mext" maxlength="60" value="${esc(mk.extra || "")}" placeholder="z. B. Shooting im Laden"></label>
      <label class="row" style="gap:10px;margin-top:12px;font-weight:600"><input type="checkbox" id="mpri" ${mk.prices ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--accent)"> Preisrahmen anzeigen</label>`)}
    <div class="row" style="margin-bottom:12px"><button class="btn grad spacer" id="mpdf">${I.doc} PDF erstellen</button></div><div id="mout"></div>
    <div class="label">Vorschau</div><div id="mprev"></div>`;
  const prev = $("#mprev"), w = prev.clientWidth || 358, sc = w / ReportDoc.W;
  prev.innerHTML = `<style>${doc.css}</style>` + doc.pages.map(p => `<div style="width:${w}px;height:${ReportDoc.H * sc}px;overflow:hidden;border-radius:10px;box-shadow:0 2px 14px rgba(0,0,0,.12);margin-bottom:14px;background:#fff"><div style="transform:scale(${sc});transform-origin:0 0;width:${ReportDoc.W}px">${p}</div></div>`).join("");
  const upd = () => { mk.tagline = $("#mtag").value.trim(); mk.location = $("#mloc").value.trim(); mk.contact = $("#mcon").value.trim(); mk.extra = $("#mext").value.trim(); mk.prices = $("#mpri").checked; v.querySelectorAll("[data-svc]").forEach(x => mk.services[x.dataset.svc] = x.checked); save(); renderMediaKit(v); };
  ["#mtag", "#mloc", "#mcon", "#mext"].forEach(s => $(s).onchange = upd);
  $("#mpri").onchange = upd; v.querySelectorAll("[data-svc]").forEach(x => x.onchange = upd);
  $("#mpdf").onclick = async () => {
    const btn = $("#mpdf"); btn.disabled = true;
    try {
      const blob = await ReportDoc.toPDF(doc, (i, n) => { btn.textContent = `PDF wird erstellt … ${i}/${n}`; });
      const name = `Media-Kit_${c.name.replace(/[^\wäöüÄÖÜß-]+/g, "_")}.pdf`, file = new File([blob], name, { type: "application/pdf" });
      mkPdf = { url: URL.createObjectURL(blob) };
      const can = navigator.canShare && navigator.canShare({ files: [file] });
      $("#mout").innerHTML = card(`<b>✓ Media-Kit ist fertig</b><div class="row" style="margin-top:10px">${can ? `<button class="btn primary spacer" id="mshare">${I.share} Teilen / Sichern</button>` : ""}<a class="btn spacer" href="${mkPdf.url}" target="_blank" rel="noopener" download="${esc(name)}">Öffnen</a></div>`, "kpi good");
      if (can) $("#mshare").onclick = () => navigator.share({ files: [file], title: `Media-Kit ${c.name}` }).catch(() => {});
      btn.innerHTML = `${I.doc} PDF neu erstellen`;
    } catch (err) { toast(err.message || "PDF konnte nicht erstellt werden"); btn.innerHTML = `${I.doc} PDF erstellen`; }
    finally { btn.disabled = false; }
  };
}
