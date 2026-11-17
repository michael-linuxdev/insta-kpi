/* Insta-KPI-Trainer – App-Logik */
"use strict";

/* ================= Icons ================= */
const I = {
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7l1.3-2h7l1.3 2h1.7A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.6"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19V11M10 19V5M16 19v-6M22 19H2"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>',
  deal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 8.5a3.5 3.5 0 1 0 0 7M7.5 10.5h6M7.5 13.5h6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
  pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

/* ================= State ================= */
const STORE_KEY = "instaKpiTrainer.v1";
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const emptyChannelData = () => ({
  draft: { beitrag: {}, reel: {}, story: {}, profil: {} },
  hist: { beitrag: [], reel: [], story: [], profil: [] },
  goals: {}, deal: { nPost: 1, nReel: 0, nStory: 3 }, konto: [],
});
function defaultState() {
  const id = newId();
  return { channels: [{ id, name: "Mein Kanal" }], active: id, data: { [id]: emptyChannelData() },
    ui: { view: "ueberblick", type: "beitrag", histType: "beitrag", histMode: "tabelle", goalType: "beitrag", reportPeriod: "", reportFor: "", installDismissed: false } };
}
let S;
try { S = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { S = null; }
if (!S || !Array.isArray(S.channels) || !S.channels.length) S = defaultState();
S.ui = Object.assign(defaultState().ui, S.ui || {});
for (const c of S.channels) {
  const d = S.data[c.id] = Object.assign(emptyChannelData(), S.data[c.id] || {});
  for (const t in TYPES) { d.draft[t] = d.draft[t] || {}; d.hist[t] = Array.isArray(d.hist[t]) ? d.hist[t] : []; }
  if (!Array.isArray(d.konto)) d.konto = [];
}
if (!S.data[S.active]) S.active = S.channels[0].id;

let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { toast("Speichern im Browser nicht möglich"); } }, 150);
}
const CH = () => S.data[S.active];
const channel = () => S.channels.find(c => c.id === S.active);
let editing = null; // {type,id}

/* ================= Helpers ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const dDE = s => { if (!s) return ""; const [y, m, d] = s.split("-"); return `${d}.${m}.${y.slice(2)}`; };
const monthLabel = ym => { const [y, m] = ym.split("-"); return new Date(+y, +m - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" }); };
const prevMonth = ym => { const [y, m] = ym.split("-").map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`; };
const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
const sortedHist = t => [...CH().hist[t]].sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)));
const fmtEUR = v => Number(v).toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600);
}
function openSheet(html, mount) {
  $("#sheet-body").innerHTML = html;
  $("#sheet").classList.add("open"); $("#backdrop").classList.add("open");
  document.body.style.overflow = "hidden";
  mount && mount($("#sheet-body"));
}
function closeSheet() {
  $("#sheet").classList.remove("open"); $("#backdrop").classList.remove("open");
  document.body.style.overflow = "";
}
$("#backdrop").onclick = closeSheet;

/* Menüs nach unten wegwischen: Sheet folgt dem Finger */
(() => {
  const sh = $("#sheet"), bd = $("#backdrop");
  let drag = null;
  sh.addEventListener("touchstart", e => {
    if (!sh.classList.contains("open") || e.touches.length > 1) return;
    const t = e.touches[0], top = sh.getBoundingClientRect().top;
    const onGrip = t.clientY - top < 44;
    if (sh.scrollTop > 0 && !onGrip) return;
    if (!onGrip && e.target.closest("input,textarea,select,.tblwrap,.calc,.thumbs")) return;
    drag = { y0: t.clientY, t0: performance.now(), dy: 0, active: false, onGrip };
  }, { passive: true });
  sh.addEventListener("touchmove", e => {
    if (!drag) return;
    const dy = e.touches[0].clientY - drag.y0;
    if (!drag.active) {
      if (dy > 8 && (sh.scrollTop <= 0 || drag.onGrip)) { drag.active = true; drag.y0 += 8; sh.style.transition = "none"; bd.style.transition = "none"; }
      else if (dy < -8 || sh.scrollTop > 0) { drag = null; return; }
      else return;
    }
    e.preventDefault();
    drag.dy = Math.max(0, e.touches[0].clientY - drag.y0);
    sh.style.transform = `translateY(${drag.dy}px)`;
    bd.style.opacity = String(Math.max(0, 1 - drag.dy / (sh.offsetHeight * 0.9)));
  }, { passive: false });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.active) return;
    const v = d.dy / Math.max(1, performance.now() - d.t0); // px pro ms
    sh.style.transition = ""; bd.style.transition = "";
    requestAnimationFrame(() => {
      if (d.dy > sh.offsetHeight * 0.28 || (v > 0.55 && d.dy > 40)) closeSheet();
      sh.style.transform = ""; bd.style.opacity = "";
    });
  };
  sh.addEventListener("touchend", end);
  sh.addEventListener("touchcancel", end);
})();
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); toast("Kopiert"); return true; }
  catch (e) { toast("Kopieren nicht möglich – Text markieren und manuell kopieren"); return false; }
}
// Zweimal tippen zum Bestätigen (statt Browser-Dialog)
function armed(btn, label, fn) {
  btn.onclick = () => {
    if (btn.dataset.armed) return fn();
    btn.dataset.armed = 1; const old = btn.innerHTML; btn.textContent = label;
    setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.innerHTML = old; } }, 3000);
  };
}
const seg = (items, cur, attr) => `<div class="seg" role="group">${items.map(([k, l]) =>
  `<button data-${attr}="${k}" aria-pressed="${k === cur}">${esc(l)}</button>`).join("")}</div>`;

/* KPI-Wert, der für Ziele als „aktuell“ gilt: letzter Verlaufseintrag, sonst Eingabe */
function latestKonto(chId = S.active) { const k = S.data[chId].konto || []; return k.length ? [...k].sort((a, b) => a.date.localeCompare(b.date)).pop() : null; }
function currentValue(k) {
  if (k.t === "konto" || k.t === "export") { const s = latestKonto(); const v = s ? evalKpi(k, k.t === "export" ? s.ex : s.d) : null; return v != null ? { v, src: `Bestandsaufnahme ${dDE(s.date)}` } : null; }
  const h = sortedHist(k.t);
  for (let i = h.length - 1; i >= 0; i--) { const v = evalKpi(k, h[i].d); if (v != null) return { v, src: h[i].name }; }
  const v = evalKpi(k, CH().draft[k.t]);
  return v != null ? { v, src: "aktuelle Eingabe" } : null;
}
function goalStatus(k, v, g) {
  if (!g || g.v == null || v == null) return null;
  const done = k.inv ? v <= g.v : v >= g.v;
  const progress = Math.max(0, Math.min(100, k.inv ? (v === 0 ? 100 : g.v / v * 100) : (g.v === 0 ? 100 : v / g.v * 100)));
  const gap = Math.abs(g.v - v);
  const gapTxt = k.unit === "pct" ? `${fmtNum(gap)} PP` : fmtNum(gap);
  return { done, progress, text: done ? "Ziel erreicht" : `noch ${gapTxt} bis ${fmtKpi(k, g.v)}` };
}

/* ================= Navigation ================= */
const VIEWS = {
  ueberblick: { label: "Überblick", icon: I.pulse, render: renderUeberblick },
  erfassen: { label: "Erfassen", icon: I.edit, render: renderErfassen },
  verlauf: { label: "Verlauf", icon: I.list, render: renderVerlauf },
  ziele: { label: "Ziele", icon: I.target, render: renderZiele },
  report: { label: "Report", icon: I.doc, render: renderReport },
  deals: { label: "Deals", icon: I.deal, render: renderDeals },
};
$("#tabbar").innerHTML = Object.entries(VIEWS).map(([k, v]) => `<button data-view="${k}">${v.icon}<span>${v.label}</span></button>`).join("");
$("#tabbar").onclick = e => { const b = e.target.closest("[data-view]"); if (b) go(b.dataset.view); };
function go(view) {
  if (!VIEWS[view]) view = "ueberblick";
  if (S.ui.view !== view) editing = editing && view === "erfassen" ? editing : null;
  S.ui.view = view; save();
  if (location.hash.slice(1) !== view) history.replaceState(null, "", "#" + view);
  render(); window.scrollTo(0, 0);
}
window.addEventListener("hashchange", () => go(location.hash.slice(1)));

function render() {
  document.querySelectorAll("#tabbar button").forEach(b => b.setAttribute("aria-current", b.dataset.view === S.ui.view ? "page" : "false"));
  $("#title").innerHTML = `<span id="chbtn" style="cursor:pointer">${esc(channel().name)} <span style="display:inline-block;vertical-align:middle;color:var(--muted)">${I.down}</span></span><span class="sub">Insta-KPI-Trainer · ${VIEWS[S.ui.view].label}</span>`;
  $("#chbtn").onclick = openChannels;
  $("#appbar-actions").innerHTML = S.ui.view === "erfassen" ? `<button class="iconbtn grad" id="ocrbtn" aria-label="Screenshot einlesen">${I.cam}</button>` : "";
  if ($("#ocrbtn")) $("#ocrbtn").onclick = startOcr;
  const v = $("#view"); v.classList.remove("view"); void v.offsetWidth; v.classList.add("view");
  VIEWS[S.ui.view].render(v);
}

/* ================= Kanäle ================= */
function openChannels() {
  const draw = () => openSheet(`
    <h2>Kanäle</h2><p class="hint">Jeder Kanal hat eigene Eingaben, eigenen Verlauf, eigene Ziele und Kooperationswerte.</p>
    <div class="card" style="padding:6px 14px"><ul class="entries">${S.channels.map(c => `
      <li><label class="row" style="flex:1;gap:12px;cursor:pointer"><input type="radio" name="ch" value="${c.id}" ${c.id === S.active ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)">
        <span><b>${esc(c.name)}</b><span class="meta" style="display:block">${Object.values(S.data[c.id].hist).reduce((s, a) => s + a.length, 0)} Einträge</span></span></label>
        <div class="row"><button class="btn small" data-ren="${c.id}">Umbenennen</button>${S.channels.length > 1 ? `<button class="btn small" data-delch="${c.id}">Löschen</button>` : ""}</div></li>`).join("")}
    </ul></div>
    <div class="card"><label class="field"><span>Neuer Kanal</span><small>z. B. @accountname oder Kundenname</small><input type="text" id="newch" maxlength="40" placeholder="@kanal"></label>
    <button class="btn primary block" id="addch" style="margin-top:10px">Kanal hinzufügen</button></div>`, b => {
    b.querySelectorAll("input[name=ch]").forEach(r => r.onchange = () => { S.active = r.value; editing = null; save(); closeSheet(); render(); toast(`Kanal: ${channel().name}`); });
    b.querySelectorAll("[data-ren]").forEach(btn => btn.onclick = () => {
      const c = S.channels.find(x => x.id === btn.dataset.ren);
      const li = btn.closest("li");
      li.innerHTML = `<input type="text" value="${esc(c.name)}" maxlength="40" style="margin:0"><button class="btn small primary">OK</button>`;
      const inp = li.querySelector("input"); inp.focus();
      const ok = () => { c.name = inp.value.trim() || c.name; save(); render(); draw(); };
      li.querySelector("button").onclick = ok; inp.onkeydown = e => e.key === "Enter" && ok();
    });
    b.querySelectorAll("[data-delch]").forEach(btn => armed(btn, "Wirklich?", () => {
      const id = btn.dataset.delch;
      S.channels = S.channels.filter(c => c.id !== id); delete S.data[id];
      if (S.active === id) S.active = S.channels[0].id;
      save(); render(); draw();
    }));
    b.querySelector("#addch").onclick = () => {
      const name = b.querySelector("#newch").value.trim(); if (!name) return toast("Bitte Namen eingeben");
      const id = newId(); S.channels.push({ id, name }); S.data[id] = emptyChannelData(); S.active = id; editing = null;
      save(); closeSheet(); render(); toast(`Kanal „${name}“ angelegt`);
    };
  });
  draw();
}

/* ================= Erfassen ================= */
function kpiCard(k, d, opts = {}) {
  const v = evalKpi(k, d);
  const expl = `<details><summary>Was bedeutet das?</summary><p>${esc(k.e)}</p></details>`;
  if (v == null) return `<div class="card kpi empty"><div class="kpi-top"><span class="kpi-name">${esc(k.n)}</span><span class="kpi-val" style="color:var(--muted)">–</span></div>
    <p class="bench">Noch nicht genug Werte eingetragen.</p>${expl}</div>`;
  const cls = rateKpi(k, v), val = fmtKpi(k, v);
  const g = CH().goals[k.id], gs = goalStatus(k, v, g);
  const tips = k.tips && (cls === "bad" || cls === "ok")
    ? (cls === "bad"
      ? `<p class="tips-title">💡 So verbesserst du das</p><ul class="tips">${k.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`
      : `<details><summary>💡 Hebel für mehr</summary><ul class="tips">${k.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul></details>`) : "";
  return `<div class="card kpi ${cls}"><div class="kpi-top"><span class="kpi-name">${esc(k.n)}</span><span class="kpi-val">${esc(val)}</span></div>
    <div class="calc">${esc(k.c(d))}${["pct", "n"].includes(k.unit) ? " = " + esc(val) : ""}</div>
    <div class="bench">${cls ? `<span class="badge">${RATE_LABEL[cls]}</span>` : ""}${esc(k.b)}</div>
    ${gs ? `<div class="goalline ${gs.done ? "done" : ""}">🎯 ${gs.done ? "✓ " : ""}${esc(gs.text)}</div>` : ""}
    ${tips}${expl}</div>`;
}

function renderErfassen(v) {
  const t = S.ui.type, T = TYPES[t], d = CH().draft[t];
  const ed = editing && editing.type === t ? CH().hist[t].find(e => e.id === editing.id) : null;
  if (editing && !ed) editing = null;
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  v.innerHTML = `
    ${!standalone && !S.ui.installDismissed ? `<div class="install"><span style="font-size:1.4rem">📲</span><div style="flex:1"><b>Als App installieren</b>Im Browser „Teilen“ → „Zum Home-Bildschirm“. Dann startet der Trainer ohne Browserleiste.</div><button class="iconbtn" id="instx" aria-label="Schließen" style="width:34px;height:34px;box-shadow:none">${I.x}</button></div>` : ""}
    ${seg(Object.entries(TYPES).map(([k, x]) => [k, x.label]), t, "type")}
    <section class="card">
      <div class="row"><h2 class="spacer">Zahlen aus Instagram</h2></div>
      <p class="hint">📍 ${esc(T.where)}</p>
      <button class="btn grad block" id="ocr2">${I.cam} Screenshot einlesen</button>
      <p class="hint" style="margin:8px 0 14px;text-align:center">oder Werte von Hand eintragen</p>
      <div class="grid">
        ${T.formats ? `<label class="field"><span>Format</span><small>Für den Format-Vergleich</small><select data-k="format">${T.formats.map(f => `<option ${d.format === f ? "selected" : ""}>${f}</option>`).join("")}</select></label>` : ""}
        ${T.fields.map(([k, l, h]) => `<label class="field"><span>${esc(l)}</span>${h ? `<small>${esc(h)}</small>` : ""}
          <input type="number" inputmode="decimal" min="0" step="any" data-k="${k}" value="${d[k] ?? ""}"></label>`).join("")}
      </div>
      <div class="row" style="margin-top:12px"><button class="btn small" id="demo">Beispielwerte</button><button class="btn small" id="clear">Felder leeren</button></div>
    </section>
    <section class="card">
      <h2>${ed ? "Eintrag bearbeiten" : "Im Verlauf speichern"}</h2>
      <p class="hint">${ed ? `„${esc(ed.name)}“ wird beim Speichern ersetzt.` : `Speichert die Werte, um mehrere ${esc(T.plural)} zu vergleichen.`}</p>
      <div class="grid"><label class="field"><span>Name</span><input id="hname" type="text" maxlength="40" placeholder="${esc(T.label)} ${CH().hist[t].length + 1}" value="${ed ? esc(ed.name) : ""}"></label>
      <label class="field"><span>Datum</span><input id="hdate" type="date" value="${ed ? ed.date : today()}"></label></div>
      <div class="row" style="margin-top:12px"><button class="btn primary spacer" id="hsave">${ed ? "Änderung speichern" : "Speichern"}</button>${ed ? '<button class="btn" id="hcancel">Abbrechen</button>' : ""}</div>
    </section>
    <div class="label">Kennzahlen</div>
    <div id="results"></div>
    <p class="note">Richtwerte sind grobe Orientierungen für kleine bis mittlere Accounts und schwanken je nach Branche, Größe und Format. Wichtiger als der Vergleich mit anderen ist die Entwicklung des eigenen Kanals.</p>`;

  const results = () => { $("#results").innerHTML = kpisOf(t).map(k => kpiCard(k, CH().draft[t])).join(""); };
  results();
  v.querySelectorAll("[data-type]").forEach(b => b.onclick = () => { S.ui.type = b.dataset.type; if (editing && editing.type !== b.dataset.type) editing = null; save(); render(); });
  v.querySelectorAll("[data-k]").forEach(inp => inp.addEventListener(inp.tagName === "SELECT" ? "change" : "input", () => {
    const k = inp.dataset.k, raw = inp.value.trim().replace(",", ".");
    if (inp.tagName === "SELECT") d[k] = inp.value;
    else if (raw === "" || !isFinite(parseFloat(raw))) delete d[k]; else d[k] = parseFloat(raw);
    save(); results();
  }));
  $("#ocr2").onclick = startOcr;
  $("#demo").onclick = () => { CH().draft[t] = { ...T.demo }; save(); render(); toast("Beispielwerte geladen"); };
  $("#clear").onclick = () => { CH().draft[t] = {}; editing = null; save(); render(); };
  if ($("#instx")) $("#instx").onclick = () => { S.ui.installDismissed = true; save(); render(); };
  if ($("#hcancel")) $("#hcancel").onclick = () => { editing = null; CH().draft[t] = {}; save(); render(); };
  $("#hsave").onclick = () => {
    const dd = CH().draft[t];
    if (!T.fields.some(([k]) => has(dd, k))) return toast("Erst Werte eintragen");
    if (T.formats && !dd.format) dd.format = T.formats[0];
    const name = $("#hname").value.trim() || `${T.label} ${CH().hist[t].length + 1}`;
    const date = $("#hdate").value || today();
    const list = CH().hist[t];
    const i = ed ? list.findIndex(e => e.id === ed.id) : -1;
    if (i >= 0) list[i] = { id: ed.id, name, date, d: { ...dd } }; else list.push({ id: newId(), name, date, d: { ...dd } });
    editing = null; CH().draft[t] = {}; save(); render();
    toast(i >= 0 ? `„${name}“ aktualisiert` : `„${name}“ gespeichert – ${list.length} ${list.length === 1 ? "Eintrag" : "Einträge"}`);
  };
}

/* ================= Screenshot / OCR ================= */
let ocrTexts = [], ocrThumbs = [], ocrMode = "single";
function startOcr() { ocrMode = "single"; const f = $("#file"); f.value = ""; f.click(); }
function startBestandOcr() { ocrMode = "bestand"; const f = $("#file"); f.value = ""; f.click(); }
$("#file").onchange = async e => {
  if (ocrMode === "bestand") return runBestand([...e.target.files].slice(0, 40));
  const files = [...e.target.files].slice(0, 6); if (!files.length) return;
  ocrThumbs.forEach(u => URL.revokeObjectURL(u)); ocrThumbs = files.map(f => URL.createObjectURL(f));
  openSheet(`<h2>Screenshot wird gelesen</h2><div class="thumbs">${ocrThumbs.map(u => `<img src="${u}" alt="">`).join("")}</div>
    <div class="spinner"></div><p class="hint" style="text-align:center" id="ocrstat">Texterkennung wird gestartet …</p>
    <p class="note" style="text-align:center">Die Bilder werden nur auf deinem Gerät verarbeitet und nicht hochgeladen.</p>`);
  try {
    ocrTexts = (await OCR.recognize(files, p => {
      const el = $("#ocrstat"); if (!el) return;
      const map = { "loading tesseract core": "Erkennung laden", "initializing tesseract": "Starten", "loading language traineddata": "Sprachdaten laden (einmalig)", "initializing api": "Starten", "recognizing text": "Text erkennen" };
      el.textContent = `${map[p.status] || p.status} … ${Math.round((p.p || 0) * 100)} %`;
    })).map(p => p.text);
    showOcrResult(OCR.detectType(ocrTexts.join("\n")));
  } catch (err) {
    openSheet(`<h2>Das hat nicht geklappt</h2><p class="hint">${esc(err.message || err)}</p><button class="btn block" onclick="closeSheet()">Schließen</button>`);
  }
};
function showOcrResult(type) {
  const found = OCR.parse(ocrTexts, type), T = TYPES[type];
  const n = Object.keys(found).length;
  openSheet(`<h2>${n ? `${n} Werte erkannt` : "Keine Werte erkannt"}</h2>
    <p class="hint">Bitte kurz prüfen – Texterkennung kann sich verlesen. Nur angehakte Werte werden übernommen.</p>
    <label class="field"><span>Erkannter Bereich</span><select id="ocrtype">${Object.entries(TYPES).map(([k, x]) => `<option value="${k}" ${k === type ? "selected" : ""}>${x.label}</option>`).join("")}</select></label>
    <div class="card" style="margin-top:12px;padding:4px 14px">
      ${T.formats ? `<div class="ocr-row"><input type="checkbox" data-c="format" ${found.format ? "checked" : ""}><span class="lbl">Format</span><select data-v="format" style="margin:0">${T.formats.map(f => `<option ${(found.format?.v || "Einzelbild") === f ? "selected" : ""}>${f}</option>`).join("")}</select></div>` : ""}
      ${T.fields.map(([k, l]) => { const f = found[k]; return `<div class="ocr-row"><input type="checkbox" data-c="${k}" ${f ? "checked" : ""} aria-label="${esc(l)} übernehmen">
        <span class="lbl">${esc(l)}<small>${f ? esc(f.src) : "nicht gefunden"}</small></span>
        <input type="number" inputmode="decimal" step="any" data-v="${k}" value="${f ? f.v : ""}"></div>`; }).join("")}
    </div>
    <div class="row"><button class="btn primary spacer" id="ocrok">Übernehmen</button><button class="btn" id="ocrno">Abbrechen</button></div>
    <details><summary>Erkannter Text</summary><pre class="report" style="max-height:200px">${esc(ocrTexts.join("\n—\n"))}</pre></details>
    <p class="note">Tipp: Für Beitrag, Reel und Story am besten die Insights-Seite komplett scrollen und 1–2 Screenshots zusammen auswählen.</p>`, b => {
    b.querySelector("#ocrtype").onchange = e => showOcrResult(e.target.value);
    b.querySelectorAll("[data-v]").forEach(i => i.addEventListener("input", () => { const c = b.querySelector(`[data-c="${i.dataset.v}"]`); if (c) c.checked = i.value !== ""; }));
    b.querySelector("#ocrno").onclick = closeSheet;
    b.querySelector("#ocrok").onclick = () => {
      const d = CH().draft[type]; let c = 0;
      b.querySelectorAll("[data-c]").forEach(cb => {
        if (!cb.checked) return;
        const k = cb.dataset.c, el = b.querySelector(`[data-v="${k}"]`);
        if (k === "format") { d.format = el.value; return; }
        const val = parseFloat(String(el.value).replace(",", "."));
        if (isFinite(val)) { d[k] = val; c++; }
      });
      S.ui.type = type; S.ui.view = "erfassen"; save(); closeSheet(); render();
      toast(`${c} Werte übernommen`);
    };
  });
}

/* ================= Verlauf ================= */
function renderVerlauf(v) {
  const ht = S.ui.histType, mode = S.ui.histMode;
  v.innerHTML = seg([["tabelle", "Vergleich"], ["formate", "Format-Vergleich"]], mode, "mode") +
    (mode === "tabelle" ? seg(Object.entries(TYPES).map(([k, x]) => [k, `${x.label} (${CH().hist[k].length})`]), ht, "ht") : "") +
    `<div id="hv"></div>` + backupCard();
  v.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { S.ui.histMode = b.dataset.mode; save(); render(); });
  v.querySelectorAll("[data-ht]").forEach(b => b.onclick = () => { S.ui.histType = b.dataset.ht; save(); render(); });
  if (mode === "tabelle") renderHistTable($("#hv"), ht); else renderFormats($("#hv"));
  bindBackup();
}

const DEMO_HIST = {
  beitrag: [["Karussell Tipps", -46, { format: "Karussell", reach: 3900, views: 5900, likes: 280, comments: 19, saves: 96, shares: 30, followers: 8100, nonfollow: 31 }],
    ["Foto Team", -39, { format: "Einzelbild", reach: 2600, views: 3100, likes: 240, comments: 31, saves: 9, shares: 6, followers: 8200, nonfollow: 12 }],
    ["Infografik", -25, { format: "Karussell", reach: 5100, views: 7400, likes: 350, comments: 22, saves: 140, shares: 77, followers: 8350, nonfollow: 47 }],
    ["Produktfoto", -10, { format: "Einzelbild", reach: 3100, views: 3700, likes: 190, comments: 8, saves: 14, shares: 9, followers: 8500, nonfollow: 20 }],
    ["Checkliste", -3, { format: "Karussell", reach: 4800, views: 6900, likes: 330, comments: 27, saves: 121, shares: 52, followers: 8560, nonfollow: 40 }]],
  reel: [["Behind the Scenes", -44, { reach: 9800, plays: 12100, interactions: 510, saves: 40, shares: 60, avgwatch: 7.2, length: 22, skip: 58 }],
    ["Tutorial 15s", -30, { reach: 21500, plays: 31000, interactions: 1350, saves: 260, shares: 310, avgwatch: 12.1, length: 15, skip: 41 }],
    ["Trend-Audio", -12, { reach: 14200, plays: 17800, interactions: 690, saves: 35, shares: 120, avgwatch: 6.8, length: 12, skip: 49 }],
    ["Tutorial 20s", -4, { reach: 18900, plays: 25600, interactions: 1100, saves: 210, shares: 240, avgwatch: 14.5, length: 20, skip: 44 }]],
  story: [["Umfrage-Story", -42, { first: 790, last: 660, slides: 3, fwd: 350, exit: 60, replies: 24, linkclicks: 0 }],
    ["Produkt-Launch", -33, { first: 910, last: 480, slides: 7, fwd: 560, exit: 140, replies: 8, linkclicks: 62 }],
    ["Alltag", -15, { first: 700, last: 590, slides: 4, fwd: 300, exit: 55, replies: 15, linkclicks: 0 }],
    ["Q&A", -5, { first: 860, last: 720, slides: 5, fwd: 380, exit: 48, replies: 41, linkclicks: 12 }]],
  profil: [["Vorvormonat", -62, { followers: 7900, gained: 310, lost: 150, reach: 48000, profilevisits: 2100, linktaps: 120, posts: 12 }],
    ["Vormonat", -32, { followers: 8210, gained: 460, lost: 150, reach: 66000, profilevisits: 3300, linktaps: 240, posts: 16 }],
    ["Aktueller Monat", -1, { followers: 8560, gained: 420, lost: 70, reach: 61000, profilevisits: 2900, linktaps: 210, posts: 14 }]],
};
function loadDemoHist(types) {
  const base = new Date();
  for (const t of types) DEMO_HIST[t].forEach(([name, off, d]) => {
    const dt = new Date(base); dt.setDate(dt.getDate() + off);
    CH().hist[t].push({ id: newId(), name, date: new Date(dt - dt.getTimezoneOffset() * 6e4).toISOString().slice(0, 10), d: { ...d } });
  });
  save();
}

function renderHistTable(el, ht) {
  const T = TYPES[ht], entries = sortedHist(ht);
  if (!entries.length) {
    el.innerHTML = `<div class="card empty-state"><div class="big">📊</div><h2>Noch keine ${esc(T.plural)}</h2>
      <p>Unter „Erfassen“ Werte eintragen und speichern. Ab zwei Einträgen erscheint der Vergleich.</p>
      <button class="btn" id="hdemo">Beispielverlauf laden</button></div>`;
    $("#hdemo").onclick = () => { loadDemoHist([ht]); render(); };
    return;
  }
  const ks = kpisOf(ht);
  const rows = ks.map(k => ({ k, vals: entries.map(e => evalKpi(k, e.d)) })).filter(r => r.vals.some(v => v != null));
  const cols = entries.length;
  const ins = [];
  if (cols >= 2) {
    const best = entries.map(() => 0), rated = rows.filter(r => r.vals.filter(v => v != null).length > 1);
    rated.forEach(r => { const val = r.vals.filter(v => v != null); const tgt = r.k.inv ? Math.min(...val) : Math.max(...val); r.vals.forEach((v, i) => v === tgt && best[i]++); });
    const top = best.indexOf(Math.max(...best));
    if (best[top]) ins.push(`<b>${esc(entries[top].name)}</b> ist bei ${best[top]} von ${rated.length} Kennzahlen vorn.`);
    const ch = rows.map(r => {
      const a = r.vals[cols - 2], b = r.vals[cols - 1]; if (a == null || b == null || a === b) return null;
      return { r, a, b, good: r.k.inv ? b < a : b > a, rel: a ? Math.abs((b - a) / a) : 1 };
    }).filter(Boolean).sort((x, y) => y.rel - x.rel);
    const up = ch.find(c => c.good), dn = ch.find(c => !c.good);
    if (up) ins.push(`Stärkste Verbesserung zum vorherigen Eintrag: <b>${esc(up.r.k.n)}</b> ${fmtDelta(up.r.k, up.a, up.b)}.`);
    if (dn) ins.push(`Stärkste Verschlechterung: <b>${esc(dn.r.k.n)}</b> ${fmtDelta(dn.r.k, dn.a, dn.b)}.`);
  }
  el.innerHTML = `
    <section class="card"><h2>${esc(T.label)}-Vergleich</h2>
      <p class="hint" style="margin:0">Spalten chronologisch. ★ = bester Wert (bei Exit-, Churn- und Verlustquoten der niedrigste). PP = Prozentpunkte.</p>
      ${ins.length ? `<ul class="insights">${ins.map(i => `<li>${i}</li>`).join("")}</ul>
      <details><summary>Prozent oder Prozentpunkte?</summary><p>Steigt eine Rate von 4 % auf 6 %, sind das <b>+2 Prozentpunkte</b> – aber eine Steigerung um <b>50 Prozent</b>. In Reports immer klar sagen, was gemeint ist. Darum zeigt die App bei Raten Prozentpunkte (PP), bei absoluten Werten Prozent.</p></details>` : ""}
    </section>
    <div class="tblwrap"><table><thead><tr><th>Kennzahl</th>${entries.map(e => `<th>${esc(e.name)}<br>${dDE(e.date)}${e.d.format ? `<br>${esc(e.d.format)}` : ""}</th>`).join("")}${cols > 1 ? "<th>Ø</th><th>Verlauf</th>" : ""}</tr></thead><tbody>
    ${rows.map(({ k, vals }) => {
      const val = vals.filter(v => v != null), tgt = val.length > 1 ? (k.inv ? Math.min(...val) : Math.max(...val)) : null;
      const mx = Math.max(...val.map(Math.abs)) || 1;
      return `<tr><td>${esc(k.n)}</td>${vals.map(v => v == null ? '<td class="na">–</td>' : `<td class="${rateKpi(k, v)}${v === tgt ? " best" : ""}">${esc(fmtKpi(k, v))}</td>`).join("")}
        ${cols > 1 ? `<td class="avg">${esc(fmtKpi(k, avg(val)))}</td><td><span class="spark">${vals.map(v => `<i style="height:${v == null ? 0 : Math.max(2, Math.abs(v) / mx * 22)}px"></i>`).join("")}</span></td>` : ""}</tr>`;
    }).join("")}</tbody></table></div>
    <div class="label">Einträge</div>
    <section class="card" style="padding:4px 16px"><ul class="entries">${entries.slice().reverse().map(e => `<li><div><b>${esc(e.name)}</b><div class="meta">${dDE(e.date)}${e.d.format ? " · " + esc(e.d.format) : ""}</div></div>
      <div class="row"><button class="btn small" data-load="${e.id}">Bearbeiten</button><button class="btn small" data-del="${e.id}">Löschen</button></div></li>`).join("")}</ul></section>
    <button class="btn small" id="hdemo">Beispielverlauf ergänzen</button>`;
  $("#hdemo").onclick = () => { loadDemoHist([ht]); render(); };
  el.querySelectorAll("[data-del]").forEach(b => armed(b, "Wirklich?", () => { CH().hist[ht] = CH().hist[ht].filter(e => e.id !== b.dataset.del); save(); render(); }));
  el.querySelectorAll("[data-load]").forEach(b => b.onclick = () => {
    const e = CH().hist[ht].find(x => x.id === b.dataset.load); if (!e) return;
    CH().draft[ht] = { ...e.d }; editing = { type: ht, id: e.id }; S.ui.type = ht; go("erfassen");
  });
}

/* Format-Vergleich über alle Inhaltstypen */
function formatGroups() {
  const h = CH().hist;
  return [
    { name: "Einzelbild", t: "beitrag", list: h.beitrag.filter(e => (e.d.format || "Einzelbild") === "Einzelbild") },
    { name: "Karussell", t: "beitrag", list: h.beitrag.filter(e => e.d.format === "Karussell") },
    { name: "Reel", t: "reel", list: h.reel },
    { name: "Story", t: "story", list: h.story },
  ];
}
const FORMAT_METRICS = [
  { n: "Ø Reichweite", unit: "acc", get: (t, d) => t === "story" ? (d.first || null) : (d.reach || null), e: "Bei Stories zählen die Aufrufe der ersten Slide als Reichweite." },
  { n: "Ø Engagement-Rate", unit: "pct", get: (t, d) => t === "beitrag" ? evalKpi(KPI_BY_ID.b_er_reach, d) : t === "reel" ? evalKpi(KPI_BY_ID.r_er, d) : null },
  { n: "Ø Share-Rate", unit: "pct", get: (t, d) => t === "beitrag" ? evalKpi(KPI_BY_ID.b_share, d) : t === "reel" ? evalKpi(KPI_BY_ID.r_share, d) : null },
  { n: "Ø Save-Rate", unit: "pct", get: (t, d) => t === "beitrag" ? evalKpi(KPI_BY_ID.b_save, d) : t === "reel" ? evalKpi(KPI_BY_ID.r_save, d) : null },
];
function formatStats() {
  return FORMAT_METRICS.map(m => {
    const rows = formatGroups().map(g => { const vals = g.list.map(e => m.get(g.t, e.d)).filter(v => v != null); return { g, v: avg(vals), n: vals.length }; }).filter(r => r.v != null);
    const best = rows.length ? rows.reduce((a, b) => b.v > a.v ? b : a) : null;
    return { m, rows, best };
  });
}
function renderFormats(el) {
  const groups = formatGroups(), total = groups.reduce((s, g) => s + g.list.length, 0);
  if (!total) {
    el.innerHTML = `<div class="card empty-state"><div class="big">🧩</div><h2>Noch keine Einträge</h2><p>Speichere Beiträge (mit Format), Reels und Stories – dann zeigt der Vergleich, welches Format wofür am besten funktioniert.</p><button class="btn" id="fdemo">Beispieldaten laden</button></div>`;
    $("#fdemo").onclick = () => { loadDemoHist(["beitrag", "reel", "story"]); render(); };
    return;
  }
  const stats = formatStats();
  const sum = stats.filter(s => s.best && s.rows.length > 1).map(s => `<li>${esc(s.m.n.replace("Ø ", ""))}: <b>${esc(s.best.g.name)}</b></li>`).join("");
  el.innerHTML = `<section class="card"><h2>Welches Format wofür?</h2>
      <p class="hint" style="margin:0">Durchschnitt aller gespeicherten Einträge: ${groups.map(g => `${esc(g.name)} ${g.list.length}`).join(" · ")}</p>
      ${sum ? `<ul class="insights">${sum}</ul>` : ""}
      <details><summary>Wie lese ich das?</summary><p>Jedes Format hat eine Aufgabe: Reels bringen meist Reichweite bei Nicht-Followern, Karussells erzeugen Speicherungen und Tiefe, Stories pflegen die Beziehung zu bestehenden Followern. Eine gute Content-Strategie mischt Formate passend zum Ziel. Wenige Einträge pro Format sind noch kein belastbarer Trend – ab etwa fünf je Format wird der Vergleich aussagekräftig.</p></details>
    </section>
    ${stats.map(s => s.rows.length ? `<section class="card"><h2>${esc(s.m.n)}</h2>${s.m.e ? `<p class="hint" style="margin:0">${esc(s.m.e)}</p>` : ""}
      <div class="bars">${s.rows.map(r => { const mx = Math.max(...s.rows.map(x => x.v)) || 1; return `<div class="bar ${r === s.best && s.rows.length > 1 ? "top" : ""}"><span>${esc(r.g.name)} <span class="meta">(${r.n})</span></span><span class="track"><span class="fill" style="display:block;width:${r.v / mx * 100}%"></span></span><span class="num">${esc(s.m.unit === "pct" ? fmtNum(r.v) + " %" : fmtNum(Math.round(r.v), 0))}</span></div>`; }).join("")}</div></section>` : "").join("")}`;
}

/* Sicherung */
function backupCard() {
  return `<details class="card" style="margin-top:12px"><summary>Sicherung &amp; Gerätewechsel</summary>
    <p class="hint">Alle Daten liegen nur auf diesem Gerät. Zum Sichern oder Übertragen: Daten kopieren, auf dem anderen Gerät einfügen und übernehmen. Gleiche Kanäle und Einträge werden zusammengeführt.</p>
    <div class="row wrap"><button class="btn small" id="bexp">${I.copy} Alle Daten kopieren</button><button class="btn small" id="bimp">Eingefügte Daten übernehmen</button></div>
    <textarea id="bjson" placeholder="Gesicherte Daten hier einfügen …"></textarea></details>`;
}
function bindBackup() {
  $("#bexp").onclick = () => { const txt = JSON.stringify({ app: "insta-kpi", v: 1, channels: S.channels.map(({ api, ...c }) => c), data: S.data }); $("#bjson").value = txt; copyText(txt); };
  $("#bimp").onclick = () => {
    let o; try { o = JSON.parse($("#bjson").value); } catch (e) { return toast("Das sind keine gültigen Daten"); }
    if (!o || !Array.isArray(o.channels) || !o.data) return toast("Das sind keine gültigen Daten");
    let n = 0;
    for (const c of o.channels) {
      const src = o.data[c.id]; if (!src) continue;
      if (!S.data[c.id]) { S.channels.push({ id: c.id, name: c.name }); S.data[c.id] = emptyChannelData(); }
      const dst = S.data[c.id];
      for (const t in TYPES) (src.hist?.[t] || []).forEach(e => { if (e && e.d && !dst.hist[t].some(x => x.id === e.id)) { dst.hist[t].push(e); n++; } });
      Object.assign(dst.goals, src.goals || {});
    }
    save(); render(); toast(`${n} Einträge übernommen`);
  };
}

/* ================= Ziele ================= */
function renderZiele(v) {
  const t = S.ui.goalType, ks = (t === "konto" ? [...kpisOf("konto"), ...kpisOf("export")] : kpisOf(t)).filter(k => k.ok !== undefined || k.id === "k_female");
  const goals = CH().goals;
  const set = ks.filter(k => goals[k.id]?.v != null);
  const reached = set.filter(k => { const c = currentValue(k); return c && goalStatus(k, c.v, goals[k.id]).done; }).length;
  v.innerHTML = `
    <section class="card"><h2>Ziele setzen</h2>
      <p class="hint" style="margin:0">Gute Ziele sind SMART: spezifisch, messbar, attraktiv, realistisch und terminiert. Also nicht „mehr Engagement“, sondern „Save-Rate von 0,8 % auf 1,5 % bis Ende März“.</p>
      ${set.length ? `<div class="tiles"><div class="tile"><div class="t">Ziele gesetzt</div><div class="v">${set.length}</div></div><div class="tile ${reached ? "hl" : ""}"><div class="t">Erreicht</div><div class="v">${reached} / ${set.length}</div></div></div>` : ""}
    </section>
    ${seg([["konto", "Konto"], ...Object.entries(TYPES).map(([k, x]) => [k, x.label])], t, "gt")}
    ${ks.map(k => {
      const g = goals[k.id] || {}, cur = currentValue(k), gs = goalStatus(k, cur?.v, g);
      const sugg = k.good === undefined ? (cur ? Math.round(cur.v + 10) : 50) : k.inv ? k.good : (cur && cur.v >= k.good ? Math.round(cur.v * 1.15 * 100) / 100 : k.good);
      return `<section class="card" data-goal="${k.id}">
        <div class="kpi-top"><span class="kpi-name">${esc(k.n)}</span><span class="kpi-val" style="font-size:1.15rem">${cur ? esc(fmtKpi(k, cur.v)) : "–"}</span></div>
        <p class="bench" style="margin:2px 0 8px">${cur ? `Aktuell aus „${esc(cur.src)}“` : "Noch kein Wert – erst Zahlen erfassen"} · ${esc(k.b)}</p>
        <div class="grid"><label class="field"><span>Zielwert ${k.unit === "pct" ? "(%)" : ""}${k.inv ? " – höchstens" : " – mindestens"}</span>
          <input type="number" inputmode="decimal" step="any" data-gv value="${g.v ?? ""}" placeholder="z. B. ${fmtNum(sugg)}"></label>
          <label class="field"><span>Bis</span><input type="date" data-gd value="${g.date || ""}"></label></div>
        ${gs ? `<div class="progress ${gs.done ? "done" : ""}"><i style="width:${gs.progress}%"></i></div><div class="goalline ${gs.done ? "done" : ""}">${gs.done ? "✓ " : ""}${esc(gs.text)}${g.date ? ` · ${daysLeft(g.date)}` : ""}</div>` : ""}
        <div class="row" style="margin-top:6px">${g.v == null ? `<button class="btn ghost" data-sugg="${sugg}">Vorschlag übernehmen: ${esc(fmtKpi(k, sugg))}</button>` : `<button class="btn ghost" data-clr>Ziel entfernen</button>`}</div>
      </section>`;
    }).join("")}`;
  v.querySelectorAll("[data-gt]").forEach(b => b.onclick = () => { S.ui.goalType = b.dataset.gt; save(); render(); });
  v.querySelectorAll("[data-goal]").forEach(card => {
    const id = card.dataset.goal, gv = card.querySelector("[data-gv]"), gd = card.querySelector("[data-gd]");
    const upd = () => {
      const val = parseFloat(gv.value.replace(",", "."));
      if (!isFinite(val)) delete CH().goals[id]; else CH().goals[id] = { v: val, date: gd.value || "" };
      save();
    };
    gv.addEventListener("change", () => { upd(); render(); });
    gd.addEventListener("change", () => { upd(); render(); });
    const s = card.querySelector("[data-sugg]"); if (s) s.onclick = () => { CH().goals[id] = { v: parseFloat(s.dataset.sugg), date: gd.value || "" }; save(); render(); };
    const c = card.querySelector("[data-clr]"); if (c) c.onclick = () => { delete CH().goals[id]; save(); render(); };
  });
}
function daysLeft(date) {
  const d = Math.ceil((new Date(date + "T23:59:59") - new Date()) / 864e5);
  return d < 0 ? `Frist seit ${-d} Tagen vorbei` : d === 0 ? "Frist heute" : `noch ${d} Tage (bis ${dDE(date)})`;
}

/* ================= Report ================= */
function periodsAvailable() {
  const months = new Set();
  for (const t in TYPES) CH().hist[t].forEach(e => months.add(e.date.slice(0, 7)));
  return [...months].sort().reverse();
}
function entriesIn(t, ym) { if (!TYPES[t]) return []; return ym === "all" ? sortedHist(t) : sortedHist(t).filter(e => e.date.startsWith(ym)); }
const goalValue = (k, ym) => TYPES[k.t] ? avgKpi(k, entriesIn(k.t, ym)) : currentValue(k)?.v ?? null;
function avgKpi(k, entries) { return avg(entries.map(e => evalKpi(k, e.d)).filter(v => v != null)); }

function buildReport(period, forWhom, withTips) {
  const months = periodsAvailable();
  const ym = period || months[0] || "all";
  const isAll = ym === "all", prev = isAll ? null : prevMonth(ym);
  const L = [], ch = channel(), goals = CH().goals;
  const sections = [], problems = [], wins = [], tipsOut = [];
  let base = [];
  for (const t in TYPES) {
    const cur = entriesIn(t, ym); if (!cur.length) continue;
    const before = prev ? entriesIn(t, prev) : [];
    base.push(`${cur.length} ${cur.length === 1 ? TYPES[t].label : TYPES[t].plural}`);
    const lines = [];
    for (const k of kpisOf(t)) {
      const a = avgKpi(k, cur); if (a == null) continue;
      const b = before.length ? avgKpi(k, before) : null;
      const r = rateKpi(k, a);
      let s = `• ${k.n}: ${fmtKpi(k, a)}`;
      if (b != null) s += ` (Vormonat ${fmtKpi(k, b)}, ${fmtDelta(k, b, a)})`;
      if (r) s += ` – ${RATE_LABEL[r]}`;
      const g = goals[k.id], gs = goalStatus(k, a, g);
      if (gs) s += gs.done ? ` ✓ Ziel ${fmtKpi(k, g.v)} erreicht` : ` · Ziel ${fmtKpi(k, g.v)}`;
      lines.push(s);
      if (r === "bad") problems.push({ k, a, t });
      if (b != null && a !== b) { const good = k.inv ? a < b : a > b; const rel = b ? Math.abs((a - b) / b) : 1; if (good) wins.push({ k, a, b, rel, t }); }
    }
    // Top-Inhalt
    const keyK = { beitrag: "b_er_reach", reel: "r_er", story: "s_compl", profil: null }[t];
    let top = "";
    if (keyK && cur.length > 1) {
      const kk = KPI_BY_ID[keyK];
      const best = cur.map(e => ({ e, v: evalKpi(kk, e.d) })).filter(x => x.v != null).sort((x, y) => y.v - x.v)[0];
      if (best) top = `Top: „${best.e.name}“ (${kk.short} ${fmtKpi(kk, best.v)})`;
    }
    sections.push(`${TYPES[t].plural.toUpperCase()} (${cur.length})\n${lines.join("\n")}${top ? "\n" + top : ""}`);
  }
  if (!sections.length) return null;
  wins.sort((x, y) => y.rel - x.rel);

  L.push(`Instagram-Report: ${ch.name}`);
  L.push(`Zeitraum: ${isAll ? "alle Einträge" : monthLabel(ym)}${prev ? ` (Vergleich: ${monthLabel(prev)})` : ""}`);
  L.push(`Erstellt am ${new Date().toLocaleDateString("de-DE")}${forWhom ? ` für ${forWhom}` : ""}`);
  L.push("");
  L.push("ZUSAMMENFASSUNG");
  L.push(`• Basis: ${base.join(", ")}`);
  if (wins[0]) L.push(`• Stärkste Entwicklung: ${wins[0].k.n} (${TYPES[wins[0].t].plural}) ${fmtDelta(wins[0].k, wins[0].b, wins[0].a)}`);
  if (wins[1]) L.push(`• Außerdem verbessert: ${wins[1].k.n} (${TYPES[wins[1].t].plural}) ${fmtDelta(wins[1].k, wins[1].b, wins[1].a)}`);
  if (problems[0]) L.push(`• Größte Baustelle: ${problems[0].k.n} (${TYPES[problems[0].t].plural}) mit ${fmtKpi(problems[0].k, problems[0].a)}`);
  const gIds = Object.keys(goals).filter(id => KPI_BY_ID[id]);
  if (gIds.length) {
    const done = gIds.filter(id => { const k = KPI_BY_ID[id], a = goalValue(k, ym); return a != null && goalStatus(k, a, goals[id]).done; }).length;
    L.push(`• Ziele: ${done} von ${gIds.length} erreicht`);
  }
  L.push("");
  const ks = latestKonto();
  if (ks) {
    const sn = snapshot(S.active), d = ks.d, dl = ks.delta || {};
    L.push(`KONTO (Bestandsaufnahme ${dDE(ks.date)}, ${d.days || 90} Tage)`);
    [["followers", "Follower"], ["net", "Netto-Follower"], ["views", "Aufrufe"], ["reached", "Betrachter"], ["profileVisits", "Profilaufrufe"]]
      .forEach(([k, l]) => d[k] != null && L.push(`• ${l}: ${fmtNum(d[k], 0)}${dl[k] != null ? ` (${fmtDeltaPct(dl[k])} ggü. Vorzeitraum)` : ""}`));
    for (const id of ["k_nonf", "k_reels", "k_conv", "k_link", "k_growth", "k_female"]) { const k = KPI_BY_ID[id], a = sn.kv[id]; if (a != null) L.push(`• ${k.n}: ${fmtKpi(k, a)}${rateKpi(k, a) ? " – " + RATE_LABEL[rateKpi(k, a)] : ""}`); }
    if (sn.findings.length) { L.push("Befunde:"); sn.findings.slice(0, 4).forEach(f => L.push(`  – ${f.title}`)); }
    L.push("");
  }
  sections.forEach(s => { L.push(s); L.push(""); });

  // Formate
  const fs = formatStats().filter(s => s.rows.length > 1);
  if (fs.length) {
    L.push("FORMATE (alle Einträge)");
    fs.forEach(s => L.push(`• ${s.m.n.replace("Ø ", "Höchste ")}: ${s.best.g.name} (${s.m.unit === "pct" ? fmtNum(s.best.v) + " %" : fmtNum(Math.round(s.best.v), 0) + " Konten"})`));
    L.push("");
  }
  // Ziele
  if (gIds.length) {
    L.push("ZIELE");
    gIds.forEach(id => {
      const k = KPI_BY_ID[id], g = goals[id], a = goalValue(k, ym);
      const gs = goalStatus(k, a, g);
      L.push(`• ${k.n} (${AREA_LABEL(k.t)}): ${a != null ? fmtKpi(k, a) : "kein Wert"} von ${fmtKpi(k, g.v)}${gs ? (gs.done ? " ✓ erreicht" : ` – ${gs.text}`) : ""}${g.date ? ` (bis ${dDE(g.date)})` : ""}`);
    });
    L.push("");
  }
  // Empfehlungen
  if (withTips) {
    const okOnes = [];
    for (const t in TYPES) for (const k of kpisOf(t)) { if (!k.tips) continue; const a = avgKpi(k, entriesIn(t, ym)); if (a != null && rateKpi(k, a) === "ok") okOnes.push({ k, a, t }); }
    const pick = [...problems, ...okOnes].filter(p => p.k.tips).slice(0, 4);
    if (pick.length) {
      L.push("EMPFEHLUNGEN");
      pick.forEach((p, i) => L.push(`${i + 1}. ${p.k.n} (${TYPES[p.t].plural}, ${fmtKpi(p.k, p.a)}): ${p.k.tips[0]}`));
      L.push("");
    }
  }
  L.push("Richtwerte sind Orientierungen; entscheidend ist die Entwicklung des eigenen Kanals.");
  return L.join("\n");
}

let reportPdf = null; // { blob, url, name }
function renderReport(v) {
  const months = periodsAvailable();
  if (!months.length && !latestKonto()) {
    v.innerHTML = `<div class="card empty-state"><div class="big">📝</div><h2>Noch nichts zu berichten</h2><p>Der Report entsteht aus Bestandsaufnahme und Verlauf. Mach den Schnell-Check oder lade Beispieldaten.</p>
      <div class="row" style="justify-content:center"><button class="btn primary" id="r0">Schnell-Check</button><button class="btn" id="rdemo">Beispieldaten</button></div></div>`;
    $("#r0").onclick = () => { go("ueberblick"); openGuide(); };
    $("#rdemo").onclick = () => { loadDemoHist(Object.keys(TYPES)); render(); };
    return;
  }
  if (S.ui.reportPeriod !== "all" && !months.includes(S.ui.reportPeriod)) S.ui.reportPeriod = months[0] || "all";
  const withTips = S.ui.reportTips !== false;
  const opts = { period: S.ui.reportPeriod, forWhom: S.ui.reportFor, withTips };
  const doc = ReportDoc.paginate(opts);
  const txt = buildReport(S.ui.reportPeriod, S.ui.reportFor, withTips) || snapshotText(S.active);
  if (reportPdf) { URL.revokeObjectURL(reportPdf.url); reportPdf = null; }
  v.innerHTML = `
    <section class="card"><h2>Report</h2>
      <p class="hint">Gestalteter Bericht für „${esc(channel().name)}“ mit Befunden, Diagrammen, Vormonatsvergleich, Zielen und Empfehlungen.</p>
      <div class="grid">
        <label class="field"><span>Zeitraum</span><select id="rper">${months.map(m => `<option value="${m}" ${m === S.ui.reportPeriod ? "selected" : ""}>${monthLabel(m)}</option>`).join("")}<option value="all" ${S.ui.reportPeriod === "all" ? "selected" : ""}>Alle Einträge</option></select></label>
        <label class="field"><span>Für (optional)</span><input type="text" id="rfor" maxlength="60" placeholder="z. B. Kundin, Chef" value="${esc(S.ui.reportFor)}"></label>
      </div>
      <label class="row" style="margin-top:12px;gap:10px;font-size:.9rem;font-weight:600"><input type="checkbox" id="rtips" ${withTips ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"> Empfehlungen aufnehmen</label>
    </section>
    <div class="row" style="margin-bottom:12px"><button class="btn grad spacer" id="rpdf">${I.doc} PDF erstellen</button><button class="btn" id="rprint">Drucken</button></div>
    <div id="rpdfout"></div>
    <div class="label">Vorschau · ${doc.pages.length} ${doc.pages.length === 1 ? "Seite" : "Seiten"}</div>
    <div id="rprev"></div>
    <details class="card" style="margin-top:12px"><summary>Als Text (zum Einfügen in Mail oder Chat)</summary>
      <pre class="report" id="rtxt">${esc(txt)}</pre><button class="btn small" id="rcopy" style="margin-top:8px">${I.copy} Text kopieren</button></details>
    <details class="card"><summary>Was macht einen guten Report aus?</summary>
      <p>Ein guter Social-Media-Report beantwortet drei Fragen: <b>Was ist passiert?</b> (Zahlen mit Vergleich), <b>Warum?</b> (welche Inhalte haben funktioniert) und <b>Was tun wir jetzt?</b> (Empfehlungen). Reine Zahlenlisten ohne Einordnung helfen Entscheidern wenig.</p></details>`;
  // Vorschau skaliert auf Bildschirmbreite
  const prev = $("#rprev"), w = prev.clientWidth || 358, sc = w / ReportDoc.W;
  prev.innerHTML = `<style>${doc.css}</style>` + doc.pages.map(p => `<div style="width:${w}px;height:${ReportDoc.H * sc}px;overflow:hidden;border-radius:10px;box-shadow:0 2px 14px rgba(0,0,0,.12);margin-bottom:14px;background:#fff"><div style="transform:scale(${sc});transform-origin:0 0;width:${ReportDoc.W}px">${p}</div></div>`).join("");
  $("#rper").onchange = e => { S.ui.reportPeriod = e.target.value; save(); render(); };
  $("#rfor").onchange = e => { S.ui.reportFor = e.target.value.trim(); save(); render(); };
  $("#rtips").onchange = e => { S.ui.reportTips = e.target.checked; save(); render(); };
  $("#rcopy").onclick = () => copyText(txt);
  $("#rprint").onclick = () => {
    let el = $("#print-root"); if (!el) { el = document.createElement("div"); el.id = "print-root"; document.body.appendChild(el); }
    el.innerHTML = `<style>${doc.css}</style>` + doc.pages.join("");
    try { window.print(); } catch (e) { toast("Drucken wird hier nicht unterstützt – bitte „PDF erstellen“ nutzen"); }
  };
  $("#rpdf").onclick = async () => {
    const btn = $("#rpdf"); btn.disabled = true;
    try {
      const blob = await ReportDoc.toPDF(doc, (i, n) => { btn.innerHTML = `PDF wird erstellt … Seite ${i} von ${n}`; });
      const name = ReportDoc.fileName(doc.meta);
      reportPdf = { blob, url: URL.createObjectURL(blob), name };
      const file = new File([blob], name, { type: "application/pdf" });
      const canShare = navigator.canShare && navigator.canShare({ files: [file] });
      $("#rpdfout").innerHTML = `<section class="card kpi good"><div class="kpi-name">✓ PDF ist fertig</div><p class="hint" style="margin:4px 0 10px">${esc(name)} · ${fmtNum(blob.size / 1024, 0)} KB</p>
        <div class="row">${canShare ? `<button class="btn primary spacer" id="rshare">${I.share} Teilen / Sichern</button>` : ""}<a class="btn spacer" href="${reportPdf.url}" target="_blank" rel="noopener" download="${esc(name)}">Öffnen</a></div></section>`;
      if (canShare) $("#rshare").onclick = () => navigator.share({ files: [file], title: `Instagram-Report ${doc.meta.ch}` }).catch(() => {});
      btn.innerHTML = `${I.doc} PDF neu erstellen`;
    } catch (err) {
      toast(err.message || "PDF konnte nicht erstellt werden"); btn.innerHTML = `${I.doc} PDF erstellen`;
    } finally { btn.disabled = false; }
  };
}

/* ================= Kooperations-Rechner ================= */
const CPM = { post: [10, 25], reel: [12, 30], story: [5, 15] };
function dealFromHistory() {
  const h = CH().hist, dl = CH().deal;
  const a = (list, f) => { const v = avg(list.map(e => f(e.d)).filter(x => x != null && isFinite(x))); return v == null ? null : Math.round(v); };
  const lastF = latestKonto()?.d.followers ?? [...sortedHist("profil"), ...sortedHist("beitrag")].map(e => e.d.followers).filter(Boolean).pop();
  const er = avg([...h.beitrag.map(e => evalKpi(KPI_BY_ID.b_er_reach, e.d)), ...h.reel.map(e => evalKpi(KPI_BY_ID.r_er, e.d))].filter(v => v != null));
  const vals = { followers: lastF, rPost: a(h.beitrag, d => d.reach), rReel: a(h.reel, d => d.reach), rStory: a(h.story, d => d.first), er: er == null ? null : Math.round(er * 100) / 100 };
  let n = 0; for (const k in vals) if (vals[k] != null) { dl[k] = vals[k]; n++; }
  save(); return n;
}
function calcDeal(d) {
  const er = d.er, f = er == null ? 1 : er < 3 ? 0.8 : er > 6 ? 1.2 : 1;
  const extra = 1 + (d.rights ? 0.3 : 0) + (d.excl ? 0.25 : 0);
  const items = [
    ["Feed-Beitrag", d.nPost || 0, d.rPost, CPM.post],
    ["Reel", d.nReel || 0, d.rReel, CPM.reel],
    ["Story-Slide", d.nStory || 0, d.rStory, CPM.story],
  ].map(([name, n, reach, [lo, hi]]) => ({ name, n, reach, lo: reach ? reach / 1000 * lo * f * extra : null, hi: reach ? reach / 1000 * hi * f * extra : null }));
  const used = items.filter(i => i.n > 0);
  const missing = used.filter(i => !i.reach).map(i => i.name);
  const lo = used.reduce((s, i) => s + (i.lo || 0) * i.n, 0), hi = used.reduce((s, i) => s + (i.hi || 0) * i.n, 0);
  const totalReach = used.reduce((s, i) => s + (i.reach || 0) * i.n, 0);
  return { items, used, missing, lo, hi, f, extra, totalReach };
}
function renderDeals(v) {
  const d = CH().deal, r = calcDeal(d);
  const num = (k, l, h) => `<label class="field"><span>${l}</span>${h ? `<small>${h}</small>` : ""}<input type="number" inputmode="decimal" min="0" step="any" data-d="${k}" value="${d[k] ?? ""}"></label>`;
  const offer = d.offer, er = d.er;
  let check = "";
  if (offer > 0 && r.totalReach > 0) {
    const cpm = offer / r.totalReach * 1000;
    const inter = er ? r.totalReach * er / 100 : null;
    const cpe = inter ? offer / inter : null;
    const verdict = !r.lo ? "" : offer < r.lo ? ["bad", "unter der Faustregel – nachverhandeln"] : offer > r.hi ? ["good", "über der Faustregel – sehr gutes Angebot"] : ["ok", "im üblichen Rahmen"];
    check = `<div class="tiles">
      <div class="tile"><div class="t">Effektiver TKP (CPM)</div><div class="v">${fmtEUR(cpm)}</div></div>
      <div class="tile"><div class="t">Kosten pro Interaktion</div><div class="v">${cpe ? cpe.toLocaleString("de-DE", { style: "currency", currency: "EUR" }) : "–"}</div></div>
      ${verdict ? `<div class="tile wide"><span class="badge ${verdict[0]}">${verdict[0] === "bad" ? "niedrig" : verdict[0] === "good" ? "hoch" : "passt"}</span>${verdict[1]}</div>` : ""}</div>
      <p class="calc">${fmtEUR(offer)} ÷ ${fmtNum(r.totalReach, 0)} Reichweite × 1.000 = ${fmtEUR(cpm)} TKP</p>`;
  }
  v.innerHTML = `
    <section class="card"><h2>Kooperations-Rechner</h2>
      <p class="hint" style="margin:0">Schätzt einen fairen Preis für Werbe-Kooperationen aus Reichweite und Engagement – und prüft, ob ein Angebot passt.</p></section>
    <section class="card"><div class="row"><h2 class="spacer">Kanal-Werte</h2><button class="btn small" id="dhist">Aus Verlauf</button></div>
      <p class="hint">Durchschnittswerte des Kanals „${esc(channel().name)}“.</p>
      <div class="grid">${num("followers", "Follower")}${num("er", "Ø Engagement-Rate (%)", "Nach Reichweite")}${num("rPost", "Ø Reichweite Beitrag")}${num("rReel", "Ø Reichweite Reel")}${num("rStory", "Ø Aufrufe Story-Slide")}</div></section>
    <section class="card"><h2>Paket</h2>
      <div class="grid">${num("nPost", "Feed-Beiträge")}${num("nReel", "Reels")}${num("nStory", "Story-Slides")}</div>
      <label class="row" style="margin-top:12px;gap:10px;font-size:.9rem;font-weight:600"><input type="checkbox" data-dc="rights" ${d.rights ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"> Nutzungsrechte für Werbung (+30 %)</label>
      <label class="row" style="margin-top:8px;gap:10px;font-size:.9rem;font-weight:600"><input type="checkbox" data-dc="excl" ${d.excl ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"> Branchen-Exklusivität (+25 %)</label>
    </section>
    <div class="label">Preis-Einschätzung</div>
    ${r.used.length ? `<section class="card">
      <div class="tiles"><div class="tile wide hl"><div class="t">Paketpreis (Faustregel)</div><div class="v">${r.lo ? `${fmtEUR(r.lo)} – ${fmtEUR(r.hi)}` : "–"}</div></div>
      ${r.used.map(i => `<div class="tile"><div class="t">${i.n} × ${esc(i.name)}</div><div class="v" style="font-size:1rem">${i.lo ? `${fmtEUR(i.lo * i.n)} – ${fmtEUR(i.hi * i.n)}` : "Reichweite fehlt"}</div></div>`).join("")}</div>
      ${r.missing.length ? `<p class="hint" style="margin:10px 0 0">Für ${r.missing.join(", ")} fehlt die Ø Reichweite.</p>` : ""}
      <details><summary>Wie wird gerechnet?</summary>
        <p>Grundlage ist der <b>TKP</b> (Tausend-Kontakt-Preis, engl. CPM): Preis pro 1.000 erreichte Konten. Faustregel-Spannen: Beitrag ${CPM.post.join("–")} €, Reel ${CPM.reel.join("–")} €, Story-Slide ${CPM.story.join("–")} € je 1.000 Reichweite.</p>
        <p>Engagement-Faktor: unter 3 % × 0,8, 3–6 % × 1,0, über 6 % × 1,2${er != null ? ` (aktuell × ${fmtNum(r.f)})` : ""}. Aufschläge für Nutzungsrechte und Exklusivität kommen dazu.</p>
        <p>Rechnung je Inhalt: Reichweite ÷ 1.000 × TKP × Engagement-Faktor × Aufschläge.</p>
        <p>Das sind grobe Orientierungswerte – echte Preise hängen stark von Nische, Content-Qualität, Produktionsaufwand und Verhandlung ab. Nischen mit kaufkräftiger Zielgruppe (Finanzen, B2B, Beauty) liegen oft deutlich höher.</p></details>
    </section>` : `<div class="card"><p class="hint" style="margin:0">Paket zusammenstellen, um eine Einschätzung zu sehen.</p></div>`}
    <section class="card"><h2>Angebot prüfen</h2><p class="hint">Was bietet die Marke für das Paket?</p>
      <div class="grid">${num("offer", "Angebotener Preis (€)")}</div>${check}
      <details><summary>TKP und Kosten pro Interaktion</summary><p>Marken vergleichen Influencer-Kooperationen mit anderen Werbekanälen über den <b>TKP</b>. Die <b>Kosten pro Interaktion</b> (CPE) zeigen, was eine einzelne Reaktion kostet – hier punkten Kanäle mit hoher Engagement-Rate. Wer seine Zahlen kennt, kann Preise mit Daten begründen statt zu raten.</p></details>
    </section>`;
  v.querySelectorAll("[data-d]").forEach(i => i.addEventListener("change", () => {
    const val = parseFloat(i.value.replace(",", ".")); if (isFinite(val)) d[i.dataset.d] = val; else delete d[i.dataset.d];
    save(); renderDeals(v);
  }));
  v.querySelectorAll("[data-dc]").forEach(c => c.onchange = () => { d[c.dataset.dc] = c.checked; save(); renderDeals(v); });
  $("#dhist").onclick = () => { const n = dealFromHistory(); toast(n ? `${n} Werte aus dem Verlauf übernommen` : "Noch kein Verlauf vorhanden"); renderDeals(v); };
}

/* ================= Bestandsaufnahme ================= */
const RECENT = 5; // Basis: die letzten 5 Einträge je Bereich
const SCORE = { good: 100, ok: 60, bad: 20 };
const AREA_LABEL = t => ({ konto: "Konto", export: "Insights-Export" }[t] || TYPES[t].plural);
const fmtDeltaPct = v => v == null ? "" : `${v > 0 ? "+" : v < 0 ? "−" : "±"}${fmtNum(Math.abs(v), 1)} %`;

function snapshot(chId) {
  const data = S.data[chId];
  const sorted = t => [...data.hist[t]].sort((a, b) => a.date.localeCompare(b.date));
  const out = { areas: {}, strengths: [], issues: [], gaps: [], total: 0, last: "", kv: {} };
  const scores = [];
  const rate = (t, k, a) => {
    const r = rateKpi(k, a);
    out.areas[t].kpis.push({ k, a, r }); out.kv[k.id] = a;
    if (r) { scores.push(SCORE[r]); if (r === "good") out.strengths.push({ k, a, t }); if (r === "bad") out.issues.push({ k, a, t }); }
  };
  const ks = latestKonto(chId);
  out.konto = ks;
  if (ks) {
    out.areas.konto = { n: 1, kpis: [], score: null };
    for (const k of kpisOf("konto")) { const a = evalKpi(k, ks.d); if (a != null) rate("konto", k, a); }
    if (ks.ex) for (const k of kpisOf("export")) { const a = evalKpi(k, ks.ex); if (a != null) rate("konto", k, a); }
    out.last = ks.date; out.total += 1;
  }
  for (const t in TYPES) {
    const all = sorted(t), rec = all.slice(-RECENT);
    out.areas[t] = { n: all.length, kpis: [], score: null };
    if (all.length && all[all.length - 1].date > out.last) out.last = all[all.length - 1].date;
    out.total += all.length;
    for (const k of kpisOf(t)) { const a = avg(rec.map(e => evalKpi(k, e.d)).filter(v => v != null)); if (a != null) rate(t, k, a); }
    if (!all.length && t !== "profil" && !ks) out.gaps.push(`Keine ${TYPES[t].plural}-Daten – mindestens 3 erfassen für eine Einschätzung.`);
    else if (all.length && all.length < 3) out.gaps.push(`Erst ${all.length} ${all.length === 1 ? TYPES[t].label : TYPES[t].plural} – ab 3 Einträgen wird das Bild verlässlicher.`);
  }
  for (const a of Object.values(out.areas)) { const rs = a.kpis.filter(x => x.r).map(x => SCORE[x.r]); a.score = rs.length ? Math.round(avg(rs)) : null; }
  out.score = scores.length ? Math.round(avg(scores)) : null;
  if (!ks) out.gaps.unshift("Noch keine Konto-Bestandsaufnahme – Schnell-Check mit 4 Screenshots machen.");
  else if (!data.hist.beitrag.length) out.gaps.push("Einzelne Beiträge sind noch nicht ausgewertet – optional über die vollständige Bestandsaufnahme (Inhalte-Listen) oder unter „Erfassen“.");
  if (!Object.keys(data.goals).some(id => KPI_BY_ID[id]) && out.total) out.gaps.push("Noch keine Ziele gesetzt.");
  if (out.last) { const age = Math.floor((new Date() - new Date(out.last)) / 864e5); if (age > 30) out.gaps.push(`Letzte Daten sind ${age} Tage alt – aktualisieren.`); }
  const prof = sorted("profil"), post = sorted("beitrag");
  out.followers = ks?.d.followers ?? [...prof, ...post].map(e => e.d.followers).filter(Boolean).pop() ?? null;
  const ra = t => avg(sorted(t).slice(-RECENT).map(e => t === "story" ? e.d.first : e.d.reach).filter(Boolean));
  out.reachPost = ra("beitrag"); out.reachReel = ra("reel"); out.reachStory = ra("story");
  const kv = id => out.kv[id] ?? null;
  out.erPost = kv("b_er_reach"); out.erReel = kv("r_er"); out.growth = kv("k_growth") ?? kv("p_growth"); out.conv = kv("k_conv") ?? kv("p_conv");
  out.issues.sort((a, b) => a.a / (a.k.ok || 1) - b.a / (b.k.ok || 1));
  out.findings = findings(out, data);
  return out;
}

/* Befunde: Zahlen in Klartext übersetzen */
function findings(sn, data) {
  const F = [], ks = sn.konto, d = ks?.d || {}, ex = ks?.ex, kv = sn.kv;
  const add = (lvl, title, text) => F.push({ lvl, title, text });
  if (ex && ex.reels === 0) add("bad", "Keine Reels im Zeitraum", `In ${ex.days || "den letzten"} Tagen wurde kein Reel veröffentlicht. Reels sind das Format, das Instagram am stärksten an Menschen ausspielt, die noch nicht folgen – hier liegt der größte Hebel für Wachstum.`);
  else if (kv.k_reels != null && kv.k_reels < 10) add("bad", "Reels kaum genutzt", `Nur ${fmtNum(kv.k_reels, 1)} % aller Aufrufe stammen aus Reels. Reels sind das wichtigste Format, um neue Zuschauer zu erreichen.`);
  if (ks?.delta?.reached != null && ks.delta.reached <= -15) add("bad", "Deutlich weniger Menschen erreicht", `Die Zahl der Betrachter ist um ${fmtNum(Math.abs(ks.delta.reached), 1)} % gegenüber dem Vorzeitraum gesunken${ks.delta.views != null ? `, während die Aufrufe ${fmtDeltaPct(ks.delta.views)} liegen` : ""}. Es schauen also weniger verschiedene Menschen zu, diese dafür häufiger.`);
  if (kv.k_nonf != null && kv.k_nonf < 40) add(kv.k_nonf < 25 ? "bad" : "ok", "Reichweite kommt vor allem von Followern", `${fmtNum(100 - kv.k_nonf, 1)} % der Aufrufe kommen von bestehenden Followern, nur ${fmtNum(kv.k_nonf, 1)} % von Nicht-Followern${ks?.delta?.viewsNF != null ? ` (${fmtDeltaPct(ks.delta.viewsNF)} ggü. Vorzeitraum)` : ""}. Für Wachstum braucht es mehr Inhalte, die über die eigene Community hinaus ausgespielt werden.`);
  if (kv.k_freq != null && kv.k_freq > 8) add("good", "Sehr treue Stamm-Community", `Jedes erreichte Konto hat im Schnitt ${fmtNum(kv.k_freq, 1)} Inhalte gesehen. Die Community ist eng gebunden – eine gute Basis für Kooperationen mit Vertrauensvorschuss.`);
  if (kv.x_ipf != null && kv.x_ipf >= 50) add("good", "Hohe Aktivität der Follower", `Pro Monat kommen Interaktionen in Höhe von ${fmtNum(kv.x_ipf, 0)} % der Followerzahl zusammen – die Community reagiert stark auf Inhalte.`);
  if (d.vStories && d.vPosts) {
    const sv = d.vStories / (d.vPosts + d.vStories + (d.vReels || 0)) * 100;
    if (sv > 25) add("good", "Stories tragen die Beziehung", `${fmtNum(sv, 0)} % der Aufrufe stammen aus Stories${kv.k_istory != null ? `, mit ${fmtNum(kv.k_istory, 1)} Interaktionen je 100 Aufrufe` : ""}. Stories sind der Ort, an dem die Community am direktesten erreicht wird – ideal für Umfragen, Einblicke und später Kooperations-Stories.`);
  }
  if (kv.k_link != null && kv.k_link < 3) {
    const toSocial = /tiktok|youtube|instagram|facebook/i.test(ks?.bioLink || "");
    add("bad", "Bio-Link wird kaum genutzt", `Nur ${fmtNum(kv.k_link, 2)} % der Profilbesucher tippen auf den Link.${toSocial ? " Er führt aktuell zu einer anderen Social-Media-Plattform – für Kooperationen fehlt ein eigenes Ziel wie eine Linkseite mit Kontakt, Media-Kit und Angeboten." : " Der Link braucht ein klares, attraktives Ziel und einen Hinweis in der Bio."}`);
  }
  if (kv.k_conv != null && kv.k_conv < 8) add("ok", "Profil überzeugt noch nicht genug", `${fmtNum(kv.k_conv, 1)} % der Profilaufrufe werden zu Followern. Bio, angepinnte Beiträge und Highlights entscheiden, ob Besucher bleiben.`);
  if (d.female != null && Math.max(d.female, d.male ?? 100 - d.female) >= 65) {
    const f = d.female, maj = f >= 50 ? "Frauen" : "Männer", pct = f >= 50 ? f : (d.male ?? 100 - f);
    const top = Object.entries(ks.age || {}).sort((a, b) => b[1] - a[1])[0];
    add("info", "Zielgruppe ist sehr einseitig", `${fmtNum(pct, 1)} % der Follower sind ${maj}${top ? `, größte Altersgruppe ${top[0]} Jahre (${fmtNum(top[1], 1)} %)` : ""}. Für Kooperationen zählt, ob das zur Zielgruppe der Marke passt. Soll sich das Publikum verschieben, braucht es Inhalte, die gezielt die gewünschte Gruppe ansprechen.`);
  }
  if (kv.k_ratio != null && kv.k_ratio > 15) add("ok", "Viele gefolgte Accounts", `Das Profil folgt ${fmtNum(d.following, 0)} Accounts (${fmtNum(kv.k_ratio, 0)} % der Followerzahl). Marken achten darauf; ein Wert unter 10 % wirkt professioneller.`);
  if (kv.k_growth != null) add(kv.k_growth >= 1 ? "good" : "bad", kv.k_growth >= 1 ? "Stetiges Wachstum" : "Wachstum stockt", `Netto ${fmtNum(kv.k_growth, 1)} % Follower pro Monat${kv.k_churn != null ? `, bei ${fmtNum(kv.k_churn, 1)} % Abwanderung` : ""}.`);
  // Top-Beiträge
  const posts = data.hist.beitrag.filter(e => e.d.follows != null && e.d.reach);
  if (posts.length >= 3) {
    const top = [...posts].sort((a, b) => b.d.follows / b.d.reach - a.d.follows / a.d.reach).slice(0, 2);
    add("info", "Was neue Follower bringt", `Die meisten neuen Follower pro Reichweite brachten „${top.map(p => p.name).join("“ und „")}“ (${top.map(p => fmtNum(p.d.follows / p.d.reach * 100, 2) + " %").join(" bzw. ")}). Diese Art Inhalt als Vorlage für weitere Beiträge nutzen.`);
  }
  const order = { bad: 0, ok: 1, info: 2, good: 3 };
  return F.sort((a, b) => order[a.lvl] - order[b.lvl]);
}
const scoreLabel = s => s == null ? ["", "–"] : s >= 80 ? ["good", "sehr gut"] : s >= 60 ? ["ok", "solide"] : s >= 40 ? ["ok", "mit Luft nach oben"] : ["bad", "kritisch"];

function snapshotText(chId) {
  const sn = snapshot(chId), c = S.channels.find(x => x.id === chId), L = [], ks = sn.konto;
  L.push(`Bestandsaufnahme: ${c.name}`);
  L.push(`Stand ${sn.last ? dDE(sn.last) : "–"}${ks ? ` · Konto-Zeitraum ${ks.d.days || 90} Tage` : ""}`);
  L.push("");
  L.push(`Gesamt-Score: ${sn.score ?? "–"}/100 (${scoreLabel(sn.score)[1]})`);
  for (const t of Object.keys(sn.areas)) { const a = sn.areas[t]; if (a.score != null) L.push(`• ${AREA_LABEL(t)}: ${a.score}/100`); }
  L.push("");
  if (ks) {
    const d = ks.d, dl = ks.delta || {};
    L.push("KONTO");
    [["followers", "Follower"], ["net", "Netto-Follower"], ["views", "Aufrufe"], ["reached", "Betrachter"], ["profileVisits", "Profilaufrufe"], ["linkTaps", "Taps auf Bio-Link"]]
      .forEach(([k, l]) => d[k] != null && L.push(`• ${l}: ${fmtNum(d[k], 0)}${dl[k] != null ? ` (${fmtDeltaPct(dl[k])})` : ""}`));
    if (d.female != null) L.push(`• Zielgruppe: ${fmtNum(d.female, 1)} % Frauen, ${fmtNum(d.male ?? 100 - d.female, 1)} % Männer`);
    L.push("");
  }
  if (sn.findings.length) { L.push("BEFUNDE"); sn.findings.forEach(f => L.push(`• ${f.title}: ${f.text}`)); L.push(""); }
  if (sn.strengths.length) { L.push("STÄRKEN"); sn.strengths.forEach(s => L.push(`• ${s.k.n} (${AREA_LABEL(s.t)}): ${fmtKpi(s.k, s.a)}`)); L.push(""); }
  if (sn.issues.length) { L.push("BAUSTELLEN"); sn.issues.forEach(s => L.push(`• ${s.k.n} (${AREA_LABEL(s.t)}): ${fmtKpi(s.k, s.a)}${s.k.tips ? " → " + s.k.tips[0] : ""}`)); L.push(""); }
  if (sn.gaps.length) { L.push("DATENLÜCKEN"); sn.gaps.forEach(g => L.push(`• ${g}`)); }
  return L.join("\n");
}

const tileHTML = (t, val, delta) => val == null ? "" : `<div class="tile"><div class="t">${t}</div><div class="v">${val}</div>${delta != null ? `<div class="meta" style="color:${delta >= 0 ? "var(--good)" : "var(--bad)"};font-weight:650">${fmtDeltaPct(delta)}</div>` : ""}</div>`;
const barsHTML = rows => { const mx = Math.max(...rows.map(r => r[1])) || 1; return `<div class="bars">${rows.map(([l, v, txt]) => `<div class="bar"><span>${esc(l)}</span><span class="track"><span class="fill" style="display:block;width:${v / mx * 100}%"></span></span><span class="num">${esc(txt ?? fmtNum(v, 0))}</span></div>`).join("")}</div>`; };

function renderUeberblick(v) {
  const sn = snapshot(S.active);
  if (!sn.total) {
    v.innerHTML = `<div class="card empty-state"><div class="big">🔎</div><h2>Bestandsaufnahme für „${esc(channel().name)}“</h2>
      <p>Screenshots aus dem Instagram-Dashboard einlesen – die App ermittelt Kennzahlen, Zielgruppe, Stärken und Baustellen des Kanals.</p>
      <button class="btn grad block" id="u0">${I.cam} Schnell-Check starten · 4 Screenshots</button>
      <button class="btn block" id="uapi0" style="margin-top:8px">Per Instagram-API verbinden</button>
      <div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost" id="u1">Zahlen von Hand erfassen</button><button class="btn ghost" id="u2">Beispieldaten</button></div></div>`;
    $("#u0").onclick = openGuide;
    $("#uapi0").onclick = openApi;
    $("#u1").onclick = () => go("erfassen");
    $("#u2").onclick = () => { loadDemoHist(Object.keys(TYPES)); render(); };
    return;
  }
  const [cls, lbl] = scoreLabel(sn.score), ks = sn.konto, d = ks?.d || {}, dl = ks?.delta || {}, kv = sn.kv;
  const multi = S.channels.length > 1;
  const lvlIcon = { bad: "🔴", ok: "🟠", info: "🔵", good: "🟢" };
  const mixV = d.vPosts != null ? [["Beiträge", d.vPosts], ["Stories", d.vStories || 0], ["Reels", d.vReels || 0]] : null;
  const mixI = d.iPosts != null ? [["Beiträge", d.iPosts], ["Stories", d.iStories || 0], ["Reels", d.iReels || 0]] : null;
  const ages = Object.entries(ks?.age || {}).sort();
  const cities = Object.entries(ks?.cities || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const ex = ks?.ex;
  v.innerHTML = `
    <section class="card">
      <div class="row"><div class="spacer"><h2>Bestandsaufnahme</h2><p class="hint" style="margin:0">Stand ${dDE(sn.last)}${ks ? ` · Konto ${d.days || 90} Tage` : ""}</p></div>
        <div style="text-align:right"><div class="kpi-val" style="font-size:2rem">${sn.score ?? "–"}<span style="font-size:.9rem;color:var(--muted)">/100</span></div>${cls ? `<span class="badge ${cls}">${lbl}</span>` : ""}</div></div>
      <div class="bars" style="margin-top:14px">${Object.entries(sn.areas).filter(([, a]) => a.score != null || a.n).map(([t, a]) => `<div class="bar"><span>${AREA_LABEL(t)}${t !== "konto" ? ` <span class="meta">(${a.n})</span>` : ""}</span><span class="track"><span class="fill" style="display:block;width:${a.score ?? 0}%;${a.score == null ? "" : a.score < 40 ? "background:var(--bad)" : a.score < 60 ? "background:var(--ok)" : ""}"></span></span><span class="num">${a.score ?? "–"}</span></div>`).join("")}</div>
      <div class="row" style="margin-top:14px"><button class="btn grad spacer" id="unew">${I.cam} ${ks ? "Screenshots" : "Schnell-Check"}</button><button class="btn spacer" id="uapi">${channel().api ? "↻ API-Abruf" : "Per API verbinden"}</button></div>
      ${ks ? `<p class="hint" style="margin:8px 0 0">Konto-Daten vom ${dDE(ks.date)}${ks.src === "api" ? " · per API" : " · aus Screenshots"}</p>` : ""}
      <details><summary>Wie entsteht der Score?</summary><p>Jede Kennzahl mit Richtwert wird bewertet: stark = 100, solide = 60, ausbaufähig = 20 Punkte. Beiträge, Reels und Stories fließen mit dem Durchschnitt der letzten ${RECENT} Einträge ein, das Konto mit der letzten Bestandsaufnahme. Der Score ist eine schnelle Ampel – entscheidend sind die Befunde darunter.</p></details>
    </section>
    ${sn.findings.length ? `<div class="label">Befunde</div>${sn.findings.map(f => `<section class="card kpi ${f.lvl === "info" ? "" : f.lvl}"><div class="kpi-name">${lvlIcon[f.lvl]} ${esc(f.title)}</div><p style="margin:6px 0 0;font-size:.9rem">${esc(f.text)}</p></section>`).join("")}` : ""}
    ${ks ? `<div class="label">Konto · ${d.days || 90} Tage</div><section class="card"><div class="tiles" style="margin:0">
      ${tileHTML("Follower", d.followers != null ? fmtNum(d.followers, 0) : null, dl.followers)}
      ${tileHTML("Netto-Follower", d.net != null ? (d.net > 0 ? "+" : "") + fmtNum(d.net, 0) : null)}
      ${tileHTML("Aufrufe", d.views != null ? fmtNum(d.views, 0) : null, dl.views)}
      ${tileHTML("Betrachter", d.reached != null ? fmtNum(d.reached, 0) : null, dl.reached)}
      ${tileHTML("Nicht-Follower-Anteil", kv.k_nonf != null ? fmtNum(kv.k_nonf, 1) + " %" : null, dl.viewsNF)}
      ${tileHTML("Aufrufe/Betrachter", kv.k_freq != null ? fmtNum(kv.k_freq, 1) + " ×" : null)}
      ${tileHTML("Profilaufrufe", d.profileVisits != null ? fmtNum(d.profileVisits, 0) : null)}
      ${tileHTML("Follow-Conversion", kv.k_conv != null ? fmtNum(kv.k_conv, 1) + " %" : null)}
      ${tileHTML("Bio-Link-Klickrate", kv.k_link != null ? fmtNum(kv.k_link, 2) + " %" : null)}
      ${tileHTML("Wachstum/Monat", kv.k_growth != null ? fmtNum(kv.k_growth, 1) + " %" : null)}
    </div></section>` : ""}
    ${mixV ? `<section class="card"><h2>Content-Mix</h2><p class="hint" style="margin:0">Aufrufe nach Format</p>${barsHTML(mixV)}
      ${mixI ? `<p class="hint" style="margin:14px 0 0">Interaktionen nach Format (je 100 Aufrufe)</p>${barsHTML(mixI.map(([l, x], i) => [l, x, `${fmtNum(x, 0)} (${mixV[i][1] ? fmtNum(x / mixV[i][1] * 100, 1) : "–"})`]))}` : ""}</section>` : ""}
    ${d.female != null || ages.length ? `<section class="card"><h2>Zielgruppe</h2>
      ${d.female != null ? `<div class="row" style="font-size:.84rem;font-weight:650;margin-top:8px"><span class="spacer">Frauen ${fmtNum(d.female, 1)} %</span><span>Männer ${fmtNum(d.male ?? 100 - d.female, 1)} %</span></div>
        <div class="progress" style="height:14px;background:var(--accent2)"><i style="width:${d.female}%;background:var(--accent)"></i></div>` : ""}
      ${ages.length ? `<p class="hint" style="margin:12px 0 0">Altersgruppen</p>${barsHTML(ages.map(([a, p]) => [a, p, fmtNum(p, 1) + " %"]))}` : ""}
      ${cities.length ? `<p class="hint" style="margin:12px 0 0">Top-Städte</p>${barsHTML(cities.map(([c, p]) => [c, p, fmtNum(p, 1) + " %"]))}` : ""}
    </section>` : ""}
    ${ex ? `<section class="card"><h2>Insights-Export</h2><p class="hint" style="margin:0">${esc(ex.range || "")}${ex.days ? ` · ${ex.days} Tage` : ""} · Reels und Beiträge zusammen</p><div class="tiles">
      ${tileHTML("Veröffentlichte Reels", ex.reels != null ? fmtNum(ex.reels, 0) : null)}${tileHTML("Interaktionen gesamt", fmtNum(exInter(ex), 0))}
      ${tileHTML("„Gefällt mir“", ex.likes != null ? fmtNum(ex.likes, 0) : null)}${tileHTML("Kommentare", ex.comments != null ? fmtNum(ex.comments, 0) : null)}
      ${tileHTML("Geteilt", ex.shares != null ? fmtNum(ex.shares, 0) : null)}${tileHTML("Gespeichert", ex.saves != null ? fmtNum(ex.saves, 0) : null)}
      ${tileHTML("Betrachter", ex.reached != null ? fmtNum(ex.reached, 0) : null)}${tileHTML("Aufrufe von Reels", ex.reelViews != null ? fmtNum(ex.reelViews, 0) : null)}</div></section>` : ""}
    ${sn.strengths.length ? `<div class="label">Stärken</div><section class="card kpi good">${sn.strengths.map(s => `<div class="row" style="padding:5px 0"><span class="spacer">${esc(s.k.n)} <span class="meta">${AREA_LABEL(s.t)}</span></span><b style="color:var(--good);white-space:nowrap">${esc(fmtKpi(s.k, s.a))}</b></div>`).join("")}</section>` : ""}
    ${sn.issues.length ? `<div class="label">Baustellen</div>${sn.issues.map(s => `<section class="card kpi bad"><div class="kpi-top"><span class="kpi-name">${esc(s.k.n)} <span class="meta">${AREA_LABEL(s.t)}</span></span><span class="kpi-val" style="font-size:1.1rem;color:var(--bad)">${esc(fmtKpi(s.k, s.a))}</span></div><p class="bench" style="margin:2px 0 0">${esc(s.k.b)}</p>${s.k.tips ? `<ul class="tips">${s.k.tips.slice(0, 2).map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}</section>`).join("")}` : ""}
    ${ks ? `<details class="card"><summary>Alle Konto-Kennzahlen mit Rechenweg</summary>${[...kpisOf("konto").map(k => [k, ks.d]), ...(ex ? kpisOf("export").map(k => [k, ex]) : [])].map(([k, src]) => evalKpi(k, src) == null ? "" : kpiCard(k, src)).join("")}</details>` : ""}
    ${sn.gaps.length ? `<div class="label">Datenlücken</div><section class="card"><ul class="insights" style="margin:0">${sn.gaps.map(g => `<li>${esc(g)}</li>`).join("")}</ul></section>` : ""}
    ${multi ? channelCompare() : ""}
    <button class="btn block" id="ucopy" style="margin-top:4px">${I.copy} Bestandsaufnahme kopieren</button>`;
  $("#unew").onclick = openGuide;
  $("#uapi").onclick = () => channel().api ? runApiSync() : openApi();
  $("#ucopy").onclick = () => copyText(snapshotText(S.active));
  v.querySelectorAll("[data-sw]").forEach(b => b.onclick = () => { S.active = b.dataset.sw; editing = null; save(); render(); toast(`Kanal: ${channel().name}`); });
}
function channelCompare() {
  const rows = S.channels.map(c => ({ c, sn: snapshot(c.id) }));
  const line = (label, f) => `<tr><td>${label}</td>${rows.map(r => `<td>${f(r.sn)}</td>`).join("")}</tr>`;
  const n = (v, suf = "") => v == null ? "–" : fmtNum(v, suf ? 2 : 0) + suf;
  return `<div class="label">Kanalvergleich</div>
    <div class="tblwrap"><table><thead><tr><th>Kanal</th>${rows.map(r => `<th><button class="btn ghost small" data-sw="${r.c.id}" style="padding:0;min-height:0;${r.c.id === S.active ? "color:var(--ink)" : ""}">${esc(r.c.name)}</button></th>`).join("")}</tr></thead><tbody>
      ${line("Score", s => s.score ?? "–")}
      ${line("Follower", s => n(s.followers))}
      ${line("Wachstum/Monat", s => n(s.growth, " %"))}
      ${line("Ø Reichweite Beitrag", s => n(s.reachPost && Math.round(s.reachPost)))}
      ${line("Ø Reichweite Reel", s => n(s.reachReel && Math.round(s.reachReel)))}
      ${line("Ø ER Beitrag", s => n(s.erPost, " %"))}
      ${line("Ø ER Reel", s => n(s.erReel, " %"))}
      ${line("Nicht-Follower-Anteil", s => n(s.kv.k_nonf, " %"))}
      ${line("Frauenanteil", s => n(s.kv.k_female, " %"))}
      ${line("Einträge", s => s.total)}
    </tbody></table></div>`;
}

/* ---------- Bestandsaufnahme-Assistent ---------- */
let bestandPages = [];
const bestandMode = () => S.ui.bestandMode === "voll" ? "voll" : "schnell";
function checkSteps(c, i) {
  return `<div style="padding:10px 0;border-bottom:1px solid var(--line)">
    <div class="row" style="align-items:flex-start;gap:10px"><span class="badge" style="margin:0;min-width:24px;text-align:center">${i + 1}</span>
    <div><b>${esc(c.title)}</b>${c.optional ? ' <span class="meta">optional</span>' : ""}<div class="hint" style="margin:3px 0 0">${esc(c.where)}</div><div class="meta">Liefert: ${esc(c.what)}</div></div></div></div>`;
}
function openGuide() {
  const mode = bestandMode(), list = mode === "schnell" ? Bestand.QUICK : Bestand.CHECKLIST;
  openSheet(`<h2>Bestandsaufnahme per Screenshots</h2>
    ${seg([["schnell", "Schnell-Check · 4 Bilder"], ["voll", "Vollständig"]], mode, "bm")}
    <p class="hint">${mode === "schnell"
      ? "Vier Screenshots reichen für die wichtigsten Befunde: Reichweite, Reels, Zielgruppe, Wachstum und Interaktionen."
      : "Für die vollständige Analyse inklusive einzelner Beiträge, Nicht-Follower-Anteil und Bio-Link-Klicks. Dauert etwa 10 Minuten."}
      Danach alle Bilder auf einmal auswählen – die Reihenfolge ist egal.</p>
    <div class="card" style="padding:6px 14px">${list.map(checkSteps).join("")}</div>
    <details class="card"><summary>Tipps</summary><ul class="insights">
      <li>„Dein Dashboard“ steht im eigenen Profil direkt unter der Bio.</li>
      <li>Zeitraum überall auf <b>90 Tage</b> stellen${mode === "voll" ? ", bei „Inhalte“ auf <b>1 Jahr</b>" : ""}.</li>
      <li>Fehlt etwas, sagt die App nach dem Einlesen genau, welches Bild noch gebraucht wird.</li>
      <li>Die Bilder werden nur auf diesem Gerät ausgewertet.</li></ul></details>
    <button class="btn grad block" id="gpick">${I.cam} ${mode === "schnell" ? "4 Screenshots auswählen" : "Screenshots auswählen (bis zu 40)"}</button>
    <button class="btn ghost block" id="gapi" style="margin-top:6px">Lieber direkt per Instagram-API verbinden →</button>`, b => {
    b.querySelector("#gapi").onclick = openApi;
    b.querySelectorAll("[data-bm]").forEach(x => x.onclick = () => { S.ui.bestandMode = x.dataset.bm; save(); openGuide(); });
    b.querySelector("#gpick").onclick = () => { bestandPages = []; startBestandOcr(); };
  });
}
async function runBestand(files) {
  if (!files.length) return;
  openSheet(`<h2>Screenshots werden ausgewertet</h2><div class="spinner"></div><p class="hint" style="text-align:center" id="bstat">Texterkennung wird gestartet …</p>
    <p class="note" style="text-align:center">${files.length} Bilder · das kann etwa ${Math.max(1, Math.round(files.length * 3 / 60))} Minute(n) dauern. Die Bilder bleiben auf dem Gerät.</p>`);
  try {
    const pages = await OCR.recognize(files, p => { const el = $("#bstat"); if (el) el.textContent = `${p.status.startsWith("Screenshot") ? p.status : "Erkennung vorbereiten"} …`; });
    bestandPages = bestandPages.concat(pages);
    showBestandResult(Bestand.analyze(bestandPages));
  } catch (err) {
    openSheet(`<h2>Das hat nicht geklappt</h2><p class="hint">${esc(err.message || err)}</p><button class="btn block" onclick="closeSheet()">Schließen</button>`);
  }
}
function showBestandResult(r) {
  const acc = r.account, have = KONTO_FIELDS.filter(([k]) => acc[k] != null);
  const main = bestandMode() === "schnell" ? Bestand.QUICK : Bestand.CHECKLIST;
  const missing = main.filter(c => !c.need(r));
  const deeper = bestandMode() === "schnell" ? Bestand.CHECKLIST.filter(c => !c.need(r) && c.id !== "export" && c.id !== "profil") : [];
  const unknown = r.kinds.filter(k => k === "unbekannt").length;
  openSheet(`<h2>Ergebnis prüfen</h2>
    <p class="hint">${bestandPages.length} Screenshots gelesen${unknown ? `, ${unknown} davon ohne verwertbare Daten (z. B. Profilraster)` : ""}. Bitte die Werte kurz mit den Screenshots vergleichen.</p>
    <div class="card" style="padding:6px 14px">${main.map(c => { const ok = c.need(r); return `<div class="row" style="padding:7px 0;align-items:flex-start;gap:10px"><span>${ok ? "✅" : c.optional ? "⚪️" : "❌"}</span><div><b style="font-size:.9rem">${esc(c.title)}</b>${ok ? "" : `<div class="hint" style="margin:2px 0 0">${c.optional ? "Optional – " : "Fehlt – "}${esc(c.where)}</div>`}</div></div>`; }).join("")}</div>
    ${missing.some(c => !c.optional) ? `<button class="btn block" id="bmore" style="margin-bottom:12px">${I.cam} Fehlende Screenshots ergänzen</button>` : ""}
    ${deeper.length ? `<details class="card"><summary>Für mehr Tiefe (optional)</summary><p class="hint">Mit diesen Bildern kommen Nicht-Follower-Anteil, Bio-Link-Klicks und die Auswertung einzelner Beiträge dazu.</p>${deeper.map(c => `<div style="padding:6px 0"><b style="font-size:.88rem">${esc(c.title)}</b><div class="hint" style="margin:2px 0 0">${esc(c.where)}</div></div>`).join("")}<button class="btn small" id="bmore2" style="margin-top:6px">${I.cam} Bilder ergänzen</button></details>` : ""}
    ${have.length ? `<div class="label">Konto · ${acc.days} Tage</div><div class="card"><div class="grid">${KONTO_FIELDS.filter(([k]) => acc[k] != null || ["followers", "views", "reached", "profileVisits"].includes(k)).map(([k, l]) => `<label class="field"><span>${esc(l)}</span><input type="number" inputmode="decimal" step="any" data-ak="${k}" value="${acc[k] ?? ""}"></label>`).join("")}</div>
      ${Object.keys(r.age).length ? `<p class="hint" style="margin:10px 0 0">Alter: ${Object.entries(r.age).map(([a, p]) => `${a}: ${fmtNum(p, 1)} %`).join(" · ")}</p>` : ""}
      ${r.bioLink ? `<p class="hint" style="margin:6px 0 0">Bio-Link: ${esc(r.bioLink)}</p>` : ""}</div>` : ""}
    ${r.ex ? `<div class="label">Insights-Export · ${esc(r.ex.range || "")}</div><div class="card"><div class="grid">${[["days", "Tage"], ["followers", "Follower"], ["reached", "Betrachter"], ["reelViews", "Aufrufe von Reels"], ["likes", "„Gefällt mir“"], ["comments", "Kommentare"], ["reposts", "Reposts"], ["shares", "Geteilt"], ["saves", "Gespeichert"], ["reels", "Reels"]].map(([k, l]) => `<label class="field"><span>${l}</span><input type="number" inputmode="decimal" step="any" data-ek="${k}" value="${r.ex[k] ?? ""}"></label>`).join("")}</div></div>` : ""}
    ${r.posts.length ? `<div class="label">${r.posts.length} Beiträge erkannt</div><div class="card" style="padding:4px 14px">${r.posts.map((p, i) => `<label class="ocr-row" style="grid-template-columns:28px minmax(0,1fr) auto"><input type="checkbox" data-pi="${i}" checked><span class="lbl">${esc(p.name)}<small>${p.date ? dDE(p.date) : "Datum unklar"} · ${["reach", "views", "likes", "comments", "shares", "saves", "follows"].filter(k => p.d[k] != null).length}/7 Werte${Object.entries(p.sure || {}).some(([, v]) => !v) ? " · teils unsicher" : ""}</small></span><span class="meta" style="text-align:right">${p.d.reach != null ? fmtNum(p.d.reach, 0) + " erreicht" : p.d.likes != null ? fmtNum(p.d.likes, 0) + " ♥" : ""}</span></label>`).join("")}</div>
      <p class="note">Beiträge werden in den Verlauf (Bereich „Beitrag“) übernommen und lassen sich dort einzeln prüfen und korrigieren.</p>` : ""}
    <div class="row"><button class="btn primary spacer" id="bok">Bestandsaufnahme übernehmen</button><button class="btn" id="bno">Abbrechen</button></div>`, b => {
    if (b.querySelector("#bmore")) b.querySelector("#bmore").onclick = startBestandOcr;
    if (b.querySelector("#bmore2")) b.querySelector("#bmore2").onclick = startBestandOcr;
    b.querySelector("#bno").onclick = closeSheet;
    b.querySelector("#bok").onclick = () => {
      const d = { days: acc.days }, ex = r.ex ? { ...r.ex } : null;
      b.querySelectorAll("[data-ak]").forEach(i => { const v = parseFloat(i.value.replace(",", ".")); if (isFinite(v)) d[i.dataset.ak] = v; });
      if (ex) b.querySelectorAll("[data-ek]").forEach(i => { const v = parseFloat(i.value.replace(",", ".")); if (isFinite(v)) ex[i.dataset.ek] = v; else delete ex[i.dataset.ek]; });
      const date = today(), list = CH().konto;
      const prev = list.find(x => x.date === date);
      const snap = { id: prev?.id || newId(), date, d: { ...(prev?.d || {}), ...d }, delta: { ...(prev?.delta || {}), ...r.delta }, age: Object.keys(r.age).length ? r.age : prev?.age || {}, cities: Object.keys(r.cities).length ? r.cities : prev?.cities || {}, bioLink: r.bioLink || prev?.bioLink || null, ex: ex || prev?.ex || null };
      if (prev) list[list.indexOf(prev)] = snap; else list.push(snap);
      let n = 0;
      b.querySelectorAll("[data-pi]").forEach(cb => {
        if (!cb.checked) return;
        const p = r.posts[+cb.dataset.pi], dd = {};
        ["reach", "views", "likes", "comments", "shares", "saves", "follows"].forEach(k => { if (p.d[k] != null) dd[k] = p.d[k]; });
        if (snap.d.followers) dd.followers = snap.d.followers;
        const pd = p.date || date;
        const ex2 = CH().hist.beitrag.find(e => e.date === pd && e.name.toLowerCase() === p.name.toLowerCase());
        if (ex2) Object.assign(ex2.d, dd); else CH().hist.beitrag.push({ id: newId(), name: p.name, date: pd, d: dd, src: "screenshot" });
        n++;
      });
      bestandPages = []; save(); closeSheet(); go("ueberblick");
      toast(`Bestandsaufnahme gespeichert${n ? ` · ${n} Beiträge im Verlauf` : ""}`);
    };
  });
}

/* ================= Instagram-API ================= */
function openApi() {
  const c = channel(), api = c.api;
  if (api) {
    const left = api.expiresAt ? Math.max(0, Math.round((api.expiresAt - Date.now()) / 864e5)) : null;
    openSheet(`<h2>Instagram-API</h2>
      <div class="card"><div class="row"><span style="font-size:1.6rem">🔗</span><div class="spacer"><b>@${esc(api.username || "verbunden")}</b><div class="meta">Verbunden mit „${esc(c.name)}“${api.lastSync ? ` · zuletzt abgerufen ${new Date(api.lastSync).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}` : ""}</div></div></div>
      ${left != null ? `<p class="hint" style="margin:10px 0 0">Schlüssel gültig noch ca. ${left} Tage – wird bei jedem Abruf automatisch verlängert.</p>` : ""}</div>
      <label class="field"><span>Zeitraum</span><select id="apidays"><option value="30" ${(api.days || 30) === 30 ? "selected" : ""}>30 Tage</option><option value="90" ${api.days === 90 ? "selected" : ""}>90 Tage</option></select></label>
      <button class="btn grad block" id="apisync" style="margin-top:12px">↻ Daten jetzt abrufen</button>
      <p class="note">Profilaufrufe und Bio-Link-Klicks liefert die API nicht – dafür bei Bedarf den Leistung-Screenshot (unten) ergänzen.</p>
      <button class="btn block" id="apioff">Verbindung trennen</button>`, b => {
      b.querySelector("#apidays").onchange = e => { c.api.days = +e.target.value; save(); };
      b.querySelector("#apisync").onclick = () => runApiSync();
      armed(b.querySelector("#apioff"), "Wirklich trennen?", () => { delete c.api; save(); closeSheet(); render(); toast("Verbindung getrennt"); });
    });
    return;
  }
  openSheet(`<h2>Mit Instagram-API verbinden</h2>
    <p class="hint">Statt Screenshots holt die App die Zahlen direkt von Instagram – für eigene oder verwaltete Konten (Business oder Creator). Einmal einrichten, danach reicht ein Tipp.</p>
    <details class="card" open><summary>So bekommst du den Zugangsschlüssel (ca. 10 Minuten, am besten am Computer)</summary>
      <ol class="insights" style="padding-left:20px">
        <li><b>developers.facebook.com</b> öffnen, mit Facebook anmelden und – falls noch nicht geschehen – als Entwickler registrieren.</li>
        <li><b>„App erstellen“</b> → Anwendungsfall <b>„Nachrichten und Inhalte auf Instagram verwalten“</b> wählen, App-Namen vergeben (z. B. „KPI-Trainer“).</li>
        <li>In der App links <b>Instagram → „API-Einrichtung mit Instagram-Login“</b> öffnen.</li>
        <li>Bei <b>„Zugriffstoken generieren“</b> auf <b>„Konto hinzufügen“</b> tippen und mit dem Instagram-Konto anmelden. Wird eine Tester-Rolle verlangt: unter <b>App-Rollen → Rollen</b> das Konto als Instagram-Tester eintragen und die Einladung in Instagram annehmen (Einstellungen → Website-Berechtigungen → Apps und Websites → Tester-Einladungen).</li>
        <li><b>„Token generieren“</b>, Berechtigungen bestätigen und den langen Schlüssel kopieren.</li>
      </ol>
      <p class="hint" style="margin:6px 0 0">Die Meta-App muss dafür nicht veröffentlicht oder von Meta geprüft werden. Bezeichnungen im Meta-Dashboard können leicht abweichen.</p></details>
    <label class="field"><span>Zugangsschlüssel (Token)</span><textarea id="apitoken" placeholder="IGAA…" style="min-height:90px" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea></label>
    <p class="note">Der Schlüssel wird nur auf diesem Gerät gespeichert, nicht in Sicherungen übernommen und nur an Instagram (graph.instagram.com) gesendet. Wer Zugriff auf das Gerät hat, kann damit die Statistiken des Kontos lesen.</p>
    <button class="btn grad block" id="apigo">Verbinden & Daten abrufen</button>`, b => {
    b.querySelector("#apigo").onclick = async () => {
      const token = b.querySelector("#apitoken").value.trim().replace(/\s+/g, "");
      if (token.length < 30) return toast("Bitte den vollständigen Schlüssel einfügen");
      const btn = b.querySelector("#apigo"); btn.disabled = true; btn.textContent = "Prüfe Schlüssel …";
      try {
        const me = await IGApi.profile(token);
        c.api = { token, username: me.username, savedAt: Date.now(), expiresAt: Date.now() + 60 * 864e5, days: 30 };
        if (/^mein kanal$/i.test(c.name)) c.name = "@" + me.username;
        save(); runApiSync();
      } catch (e) { btn.disabled = false; btn.textContent = "Verbinden & Daten abrufen"; toast(IGApi.explain(e)); }
    };
  });
}

async function runApiSync() {
  const c = channel();
  if (!c.api) return openApi();
  openSheet(`<h2>Daten werden abgerufen</h2><div class="spinner"></div><p class="hint" style="text-align:center" id="apistat">Verbindung wird aufgebaut …</p>`);
  const stat = t => { const el = $("#apistat"); if (el) el.textContent = t + " …"; };
  try {
    c.api = await IGApi.refreshIfDue(c.api); save();
    const r = await IGApi.sync(c.api, { days: c.api.days || 30 }, stat);
    applyApiResult(r);
    c.api.lastSync = Date.now(); c.api.username = r.me.username; save();
    closeSheet(); go("ueberblick");
    const nP = r.items.filter(x => !x.isReel).length, nR = r.items.filter(x => x.isReel).length;
    toast(`Aktualisiert · ${nP} Beiträge, ${nR} Reels`);
  } catch (e) {
    openSheet(`<h2>Abruf fehlgeschlagen</h2><p class="hint">${esc(IGApi.explain(e))}</p>
      <div class="row"><button class="btn primary spacer" id="aretry">Erneut versuchen</button><button class="btn spacer" id="anew">Neuen Schlüssel eingeben</button></div>`, b => {
      b.querySelector("#aretry").onclick = runApiSync;
      b.querySelector("#anew").onclick = () => { delete c.api; save(); openApi(); };
    });
  }
}

function applyApiResult(r) {
  const date = today(), list = CH().konto, prev = list.find(x => x.date === date);
  const d = Object.fromEntries(Object.entries(r.account).filter(([, v]) => v != null));
  const snap = { id: prev?.id || newId(), date, src: "api", d: { ...(prev?.d || {}), ...d }, delta: { ...(prev?.delta || {}), ...Object.fromEntries(Object.entries(r.delta).filter(([, v]) => v != null)) },
    age: Object.keys(r.age).length ? r.age : prev?.age || {}, cities: Object.keys(r.cities).length ? r.cities : prev?.cities || {}, bioLink: r.bioLink || prev?.bioLink || null, ex: r.ex };
  if (prev) list[list.indexOf(prev)] = snap; else list.push(snap);
  const clean = s => (s || "").replace(/\s+/g, " ").replace(/[#@][\w.]+/g, m => m).trim();
  for (const { m, isReel, v } of r.items) {
    const t = isReel ? "reel" : "beitrag", dt = m.timestamp.slice(0, 10);
    const name = clean(m.caption).slice(0, 30) || `${isReel ? "Reel" : "Beitrag"} ${dDE(dt)}`;
    const dd = isReel
      ? { reach: v.reach, plays: v.views, interactions: v.total_interactions, saves: v.saved, shares: v.shares, avgwatch: v.ig_reels_avg_watch_time != null ? Math.round(v.ig_reels_avg_watch_time / 100) / 10 : null }
      : { format: m.media_type === "CAROUSEL_ALBUM" ? "Karussell" : "Einzelbild", reach: v.reach, views: v.views, likes: v.likes ?? m.like_count, comments: v.comments ?? m.comments_count, saves: v.saved, shares: v.shares, follows: v.follows, followers: r.account.followers };
    Object.keys(dd).forEach(k => dd[k] == null && delete dd[k]);
    const hist = CH().hist[t], ex = hist.find(e => e.igId === m.id);
    if (ex) { Object.assign(ex.d, dd); ex.date = dt; } else hist.push({ id: newId(), igId: m.id, name, date: dt, d: dd, src: "api" });
  }
  save();
}

/* ================= Kein Zoom, App-Gefühl ================= */
["gesturestart", "gesturechange", "gestureend"].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener("touchmove", e => { if (e.scale !== undefined && e.scale !== 1) e.preventDefault(); }, { passive: false });
document.addEventListener("dblclick", e => e.preventDefault(), { passive: false });
document.addEventListener("contextmenu", e => { if (!e.target.closest("input,textarea,.report")) e.preventDefault(); });

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

go(location.hash.slice(1) || S.ui.view);
