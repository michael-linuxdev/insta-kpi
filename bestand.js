/* Bestandsaufnahme: Parser für Instagram-Dashboard-, Zielgruppen-, Profil- und Inhalte-Screenshots.
   Arbeitet mit Wortpositionen (Tesseract-TSV), damit Kacheln und Spalten richtig zugeordnet werden. */
"use strict";

const Bestand = (() => {
  /* ---------- Layout aus TSV ---------- */
  function layout(tsv) {
    const words = [];
    for (const row of String(tsv || "").split("\n").slice(1)) {
      const c = row.split("\t");
      if (c.length < 12 || c[0] !== "5") continue;
      const t = c.slice(11).join(" ").trim();
      if (!t) continue;
      words.push({ t, x: +c[6], y: +c[7], w: +c[8], h: +c[9], key: `${c[2]}-${c[3]}-${c[4]}` });
    }
    const map = new Map();
    for (const w of words) { if (!map.has(w.key)) map.set(w.key, []); map.get(w.key).push(w); }
    const lines = [...map.values()].map(ws => {
      ws.sort((a, b) => a.x - b.x);
      const y = Math.min(...ws.map(w => w.y)), h = Math.max(...ws.map(w => w.h));
      return { words: ws, y, h, x0: ws[0].x, x1: Math.max(...ws.map(w => w.x + w.w)), text: ws.map(w => w.t).join(" ") };
    }).sort((a, b) => a.y - b.y);
    const width = Math.max(1, ...words.map(w => w.x + w.w));
    return { lines, width };
  }
  const norm = s => s.toLowerCase().replace(/[„“”"'’]/g, "").replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss").trim();

  /* Zahl aus Wörtern ab Index i (verbindet "14,6" + "Tsd.") */
  function numAt(words, i) {
    if (i >= words.length) return null;
    const s = words[i].t + (words[i + 1] && /^(tsd\.?|mio\.?|k|%)$/i.test(words[i + 1].t) ? " " + words[i + 1].t : "");
    const clean = s.replace(/^[^\d+\-−]+/, "").replace("−", "-");
    if (!/^[+\-]?\d/.test(clean)) return null;
    const neg = /^-/.test(clean);
    const r = OCR.parseNumber(clean.replace(/^[+\-]/, ""));
    if (!r) return null;
    return { v: neg ? -r.v : r.v, pct: r.pct || /%/.test(s), raw: s };
  }
  function numbersIn(line, from = 0) {
    const out = [];
    for (let i = from; i < line.words.length; i++) { const n = numAt(line.words, i); if (n) out.push({ ...n, x: line.words[i].x, w: line.words[i].w }); }
    return out;
  }
  /* Phrase suchen: liefert Treffer mit Position */
  function find(L, re, { maxWords = 5, used } = {}) {
    const hits = [];
    L.lines.forEach((ln, li) => {
      for (let i = 0; i < ln.words.length; i++) {
        let s = "";
        for (let j = i; j < Math.min(ln.words.length, i + maxWords); j++) {
          s += (j > i ? " " : "") + norm(ln.words[j].t);
          if (re.test(s)) {
            const id = `${li}:${i}`;
            if (used && used.has(id)) continue;
            hits.push({ li, i, j, x0: ln.words[i].x, x1: ln.words[j].x + ln.words[j].w, y: ln.y, h: ln.h, id });
            break;
          }
        }
      }
    });
    return hits;
  }
  // Wert unter einer Kachel-Beschriftung
  function below(L, hit, tileW) {
    for (let li = hit.li + 1; li < L.lines.length; li++) {
      const ln = L.lines[li];
      if (ln.y - hit.y > hit.h * 4) break;
      const nums = numbersIn(ln).filter(n => n.x + n.w > hit.x0 - 30 && n.x < hit.x0 + tileW && !n.pct);
      if (nums.length) {
        // Veränderung (z. B. "+7,6 % im Vergleich") eine Zeile darunter
        let delta = null;
        const nx = L.lines[li + 1];
        if (nx && nx.y - ln.y < ln.h * 3 && /vergleich|%/.test(norm(nx.text))) {
          const d = numbersIn(nx).find(n => n.pct && n.x + n.w > hit.x0 - 30 && n.x < hit.x0 + tileW);
          if (d) delta = d.v;
        }
        return { v: nums[0].v, delta };
      }
    }
    return null;
  }
  function above(L, hit, tileW) {
    for (let li = hit.li - 1; li >= 0; li--) {
      const ln = L.lines[li];
      if (hit.y - ln.y > hit.h * 4) break;
      const nums = numbersIn(ln).filter(n => n.x + n.w > hit.x0 - tileW * 0.4 && n.x < hit.x1 + tileW * 0.4);
      if (nums.length) return { v: nums[0].v };
    }
    return null;
  }
  // Wert rechts in derselben Zeile, sonst rechtsbündig in der nächsten Zeile (Balkendiagramme)
  function right(L, hit, wantPct) {
    const ok = n => wantPct ? true : !n.pct;
    const same = numbersIn(L.lines[hit.li], hit.j + 1).filter(ok);
    if (same.length) return { v: same[same.length - 1].v };
    const nx = L.lines[hit.li + 1];
    if (nx && nx.y - hit.y < hit.h * 3) {
      const nums = numbersIn(nx).filter(ok).filter(n => n.x > L.width * 0.55);
      if (nums.length) return { v: nums[nums.length - 1].v };
    }
    return null;
  }

  /* ---------- Screenshot-Art erkennen ---------- */
  const LIST_LABELS = [
    ["saves", /^gespeicherte$/], ["shares", /^geteilte$/], ["reposts", /^reposts$/], ["likes", /^gefallt$/],
    ["comments", /^kommentare$/], ["reach", /^betrachter$/], ["views", /^aufrufe$/], ["follows", /^neue$/],
  ];
  function classify(L) {
    const t = norm(L.lines.map(l => l.text).join("\n"));
    if (/aufrufe von reels/.test(t) && /\d+\s*tage/.test(t) && /\bbis\b/.test(t)) return "export";
    if (/beitrage/.test(t) && /gefolgt/.test(t) && /follower/.test(t) && !/dashboard\b.*\n.*startseite/.test(t)) return "profil";
    // Inhaltsliste: eine Kennzahl-Beschriftung wiederholt sich rechts
    const counts = {};
    for (const ln of L.lines) {
      const last = ln.words.slice(-2).map(w => norm(w.t));
      for (const [k, re] of LIST_LABELS) if (last.some(w => re.test(w))) counts[k] = (counts[k] || 0) + 1;
    }
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 3 && /\d{1,2}\.\d{1,2}\./.test(t)) return "liste:" + best[0];
    if (/dashboard|startseite|leistung|zielgruppe/.test(t)) return "dashboard";
    return "unbekannt";
  }

  /* ---------- Konto-Werte aus Dashboard/Zielgruppe/Profil ---------- */
  function parseAccount(L, acc) {
    const tileW = L.width * 0.36, used = new Set();
    const put = (k, r, q = 1) => { if (r && r.v != null && isFinite(r.v) && (!acc.q[k] || acc.q[k] < q)) { acc.m[k] = r.v; acc.q[k] = q; if (r.delta != null) acc.delta[k] = r.delta; } };
    const tile = (k, re, q = 2) => find(L, re, { used }).forEach(h => {
      const r = below(L, h, tileW); if (r) { put(k, r, q); for (let i = h.i; i <= h.j; i++) used.add(`${h.li}:${i}`); }
    });
    // längere Phrasen zuerst
    tile("viewsF", /^aufrufe durch follower$/, 3); tile("viewsF", /^aufrufe durch$/, 1);
    tile("viewsNF", /^aufrufe von nicht-?follow/, 3);
    tile("net", /^netto-?follower$/); tile("newF", /^neue follower$/); tile("lost", /^verlorene follower$/);
    find(L, /^aufrufe$/, { used }).forEach(h => {
      const nxt = norm(L.lines[h.li].words[h.i + 1]?.t || "");
      if (/^(durch|von|nach|in)$/.test(nxt)) return;
      const r = below(L, h, tileW); if (r) put("views", r, 2);
    });
    find(L, /^betrachter$/).forEach(h => { const r = below(L, h, tileW); if (r) put("reached", r, 2); });
    find(L, /^follower$/).forEach(h => {
      const prev = norm(L.lines[h.li].words[h.i - 1]?.t || "");
      if (/^(neue|netto|verlorene|nicht|@|durch)$/.test(prev) || /nicht-follower/.test(norm(L.lines[h.li].text))) return;
      const r = below(L, h, tileW); if (r) put("followers", r, 2);
    });
    // Content-Art: Abschnitt bestimmen
    const heads = [...find(L, /^aufrufe nach content-art/).map(h => ({ ...h, sec: "v" })), ...find(L, /^interaktionen nach content-art/).map(h => ({ ...h, sec: "i" }))];
    const secOf = li => { const hs = heads.filter(h => h.li < li).sort((a, b) => b.li - a.li); return hs[0]?.sec || null; };
    for (const [k, re] of [["Posts", /^beit?ra?ge$/], ["Stories", /^stories$/], ["Reels", /^reels$/], ["Live", /^live-?videos$/]]) {
      find(L, re).forEach(h => {
        if (L.lines[h.li].words.length > 2) return;
        let sec = secOf(h.li);
        if (!sec) sec = acc.m["v" + k] != null && acc.m["v" + k] !== undefined ? "i" : null; // Abschnitt außerhalb des Bildes
        if (!sec) return;
        const r = right(L, h); if (r) put(sec + k, r, 2);
      });
    }
    find(L, /profilaufrufe$/).forEach(h => { const r = right(L, h); if (r) put("profileVisits", r, 2); });
    find(L, /link in bio( getippt)?$/).forEach(h => { const r = right(L, h); if (r) put("linkTaps", r, 2); });
    find(L, /geschaftsadresse( getippt)?$/).forEach(h => { const r = right(L, h); if (r) put("addrTaps", r, 2); });
    // Zielgruppe
    find(L, /^frauen$/).forEach(h => { if (L.lines[h.li].words.length <= 2) { const r = right(L, h, true); if (r && r.v <= 100) put("female", r, 2); } });
    find(L, /^(manner|maenner)$/).forEach(h => { if (L.lines[h.li].words.length <= 2) { const r = right(L, h, true); if (r && r.v <= 100) put("male", r, 2); } });
    find(L, /^(\d{2}-\d{2}|65\+)$/).forEach(h => {
      if (L.lines[h.li].words.length > 2) return;
      const r = right(L, h, true); if (r && r.v <= 100) acc.age[norm(L.lines[h.li].words[h.i].t)] = r.v;
    });
    // Orte (Städte / Länder)
    const oh = find(L, /^(top-?orte|stadte|orte)$/);
    if (oh.length) {
      const start = oh[0].li + 1;
      for (let li = start; li < L.lines.length; li++) {
        const ln = L.lines[li];
        if (/altersgruppen|geschlecht|lander/.test(norm(ln.text)) && li > start) break;
        if (/^[A-Za-zÄÖÜäöüß .\-]{3,}$/.test(ln.text) && !/stadte|lander|orte/.test(norm(ln.text))) {
          const r = right(L, { li, j: ln.words.length - 1, y: ln.y, h: ln.h }, true);
          if (r && r.v <= 100) acc.cities[ln.text.trim()] = r.v;
        }
      }
    }
    // Zeitraum
    const p = norm(L.lines.slice(0, 8).map(l => l.text).join(" ")).match(/(\d+)\s*tage|1\s*jahr/);
    if (p && !/inhalte v 1 ?jahr/.test(norm(L.lines.slice(0, 8).map(l => l.text).join(" ")))) acc.days = acc.days || (p[1] ? +p[1] : 365);
    // Profilseite
    for (const [k, re] of [["posts", /^beitrage$/], ["followers", /^follower$/], ["following", /^gefolgt$/]]) {
      find(L, re).forEach(h => {
        const ln = norm(L.lines[h.li].text);
        if (!(/beitrage/.test(ln) && /gefolgt/.test(ln))) return;
        const r = above(L, h, L.width * 0.2); if (r) put(k, r, k === "followers" ? 1 : 2);
      });
    }
    find(L, /aufrufe in den letzten 30/).forEach(h => {
      const n = numbersIn(L.lines[h.li]).find(x => x.x < L.lines[h.li].words[h.i].x); if (n) put("views30", n, 2);
    });
    for (const ln of L.lines) {
      const m = ln.text.match(/((?:https?:\/\/|www\.)[^\s]+|[a-z0-9-]+\.(?:com|de|net|io|me|link|bio)\/?[^\s]*)/i);
      if (m && !acc.bioLink && /beitrage|gefolgt|profil/.test(norm(L.lines.map(l => l.text).join(" ")))) acc.bioLink = m[1];
    }
  }

  /* ---------- Export-Zusammenfassung (Instagram/Edits) ---------- */
  function nearestBelow(L, hit) {
    for (let li = hit.li + 1; li < L.lines.length; li++) {
      const ln = L.lines[li];
      if (ln.y - hit.y > hit.h * 5) break;
      const nums = numbersIn(ln).filter(n => !n.pct);
      if (nums.length) {
        const best = nums.map(n => ({ n, d: Math.abs(n.x - hit.x0) })).sort((a, b) => a.d - b.d)[0];
        if (best.d < L.width * 0.12) return best.n.v;
      }
    }
    return null;
  }
  function parseExport(L, ex) {
    const all = L.lines.map(l => l.text).join(" ");
    const dm = norm(all).match(/(\d+)\s*tage/); if (dm) ex.days = +dm[1];
    const rm = all.match(/(\d{1,2}\.\s*[A-Za-zäöü]+\.?(?:\s*\d{4})?|\d{1,2}\.\d{1,2}\.\d{2,4})\s+bis\s+(\d{1,2}\.\d{1,2}\.\d{4}|\d{1,2}\.\s*[A-Za-zäöü]+\.?\s*\d{4})/);
    if (rm) ex.range = `${rm[1]} bis ${rm[2]}`;
    for (const ln of L.lines) {
      const i = ln.words.findIndex(w => /^follower$/i.test(w.t));
      if (i > 0) { const n = numAt(ln.words, i - 1); if (n) ex.followers = n.v; }
    }
    const spec = [["reelViews", /^aufrufe von reels$/], ["reached", /^betrachter$/], ["likes", /^gefallt mir/], ["comments", /^kommentare$/],
      ["reposts", /^reposts$/], ["shares", /^geteilte( inhalte)?$/], ["saves", /^gespeicherte( inhalte)?$/], ["reels", /^reels$/], ["posts", /^beitrage$/]];
    for (const [k, re] of spec) find(L, re).forEach(h => { if ((k === "reels" || k === "posts") && L.lines[h.li].words.length > 1) return; if (ex[k] == null) { const v = nearestBelow(L, h); if (v != null) ex[k] = v; } });
  }

  /* ---------- Inhaltslisten ---------- */
  const ROW_ORDER = ["likes", "comments", "reposts", "shares"];
  const DATE_RE = /(\d{1,2})\.(\d{1,2})\.(\d{2})?/;
  function rowNumbers(line) {
    const out = [];
    for (const w of line.words) {
      let s = w.t.replace(/[ıl|]/g, "1").replace(/[!]/g, "1");
      if (!/\d/.test(s)) continue;
      s = s.replace(/^[^\d]+/, "");
      if (s.length > 1 && s[0] === "0") s = s.slice(1); // Herz-Symbol als 0 gelesen
      const n = parseInt(s.replace(/[^\d]/g, ""), 10);
      if (isFinite(n)) out.push(n);
    }
    return out;
  }
  function parseList(L, metric, today, sightings) {
    for (let li = 0; li < L.lines.length; li++) {
      const ln = L.lines[li];
      // Vorschaubild links ignorieren: nur Wörter rechts davon
      const ws = ln.words.filter(w => w.x > L.width * 0.145);
      if (ws.length < 2) continue;
      const last = ws[ws.length - 1];
      if (!/^\d{1,3}([.,]\d{3})*$|^\d+$/.test(last.t) || last.x < L.width * 0.6) continue;
      const value = OCR.parseNumber(last.t)?.v;
      if (value == null) continue;
      const head = ws.slice(0, -1).map(w => w.t).join(" ");
      if (/startseite|dashboard|alle inhalte/.test(norm(head))) continue;
      const m = head.match(/^(.*?)\s*(\d{1,2})\.(\d{1,2})\.(\d{2})?\s*$/);
      let date = null, cap = head;
      if (m) {
        cap = m[1];
        const d = +m[2], mo = +m[3];
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
          let y = m[4] ? 2000 + +m[4] : today.getFullYear();
          if (!m[4] && new Date(y, mo - 1, d) > today) y--;
          date = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        }
      } else cap = head.replace(/\s*\S*\d\S*\s*$/, "");
      if (!/[A-Za-z@]/.test(cap) && !date) cap = "";
      const nx = L.lines[li + 1];
      let row = null;
      if (nx && nx.y - ln.y < ln.h * 2.5) {
        const nums = rowNumbers({ words: nx.words.filter(w => w.x > L.width * 0.145 && w.x < L.width * 0.72) });
        const order = ROW_ORDER.filter(k => k !== metric);
        if (nums.length === order.length) row = Object.fromEntries(order.map((k, i) => [k, nums[i]]));
      }
      const likes = metric === "likes" ? value : row?.likes, comments = metric === "comments" ? value : row?.comments;
      sightings.push({ cap: capKey(cap), date, metric, value, row, sig: likes != null && comments != null ? `${likes}|${comments}` : null, likes });
    }
  }
  function capKey(s) {
    if (s.includes("@")) s = s.slice(s.indexOf("@")).replace(/^(@[\w.]+?)\.\s+(\w)/, "$1.$2"); else s = s.replace(/^(\S{1,2}\s+)+/, "");
    return s.toLowerCase().replace(/[^a-z0-9@_.äöüß ]/g, " ").replace(/\.{2,}.*$/, "").replace(/\s+/g, " ").trim().slice(0, 28);
  }
  function dice(a, b) {
    const bg = x => { const m = new Map(); for (let i = 0; i < x.length - 1; i++) { const g = x.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
    const A = bg(a), B = bg(b); let inter = 0, tot = 0;
    A.forEach((n, g) => { inter += Math.min(n, B.get(g) || 0); tot += n; }); B.forEach(n => tot += n);
    return tot ? 2 * inter / tot : 0;
  }
  function capSim(a, b) {
    if (!a || !b) return 0;
    const ha = a.match(/^@[\w.]+/)?.[0], hb = b.match(/^@[\w.]+/)?.[0];
    if (ha || hb) { if (ha !== hb) return 0; a = a.slice(ha.length).trim(); b = b.slice(hb.length).trim(); if (a.length < 3 || b.length < 3) return 0.5; }
    if (Math.min(a.length, b.length) < 4) return 0.3;
    return dice(a.slice(0, 18), b.slice(0, 18));
  }
  function mergePosts(sightings) {
    const posts = [];
    // zuverlässigere Sichtungen (mit Datum und Text) zuerst
    const order = [...sightings].sort((a, b) => (b.date ? 2 : 0) + (b.cap.length > 6 ? 1 : 0) - ((a.date ? 2 : 0) + (a.cap.length > 6 ? 1 : 0)));
    for (const s of order) {
      let hit = null;
      if (s.sig) hit = posts.find(p => p.sigs.has(s.sig));
      if (!hit && s.date) hit = posts.find(p => p.dates[s.date] && Math.max(...p.caps.map(c => capSim(c, s.cap))) >= 0.4);
      if (!hit) {
        // gleicher Text, Datum fehlt oder ist um eine Ziffer verlesen (7.2. statt 7.3.)
        const near = p => !s.date || !Object.keys(p.dates).length || Object.keys(p.dates).some(d => [...d].filter((ch, i) => ch !== s.date[i]).length <= 1);
        const c = posts.filter(p => Math.max(...p.caps.map(c => capSim(c, s.cap))) >= 0.85 && s.cap.length >= 8 && near(p));
        if (c.length === 1) hit = c[0];
      }
      if (!hit && !s.date && s.row && s.cap.startsWith("@")) {
        const h = s.cap.match(/^@[\w.]+/)[0], com = s.metric === "comments" ? s.value : s.row.comments;
        const c = posts.filter(p => p.caps.some(c => c.startsWith(h)) && (p.vals.comments || []).some(x => x.v === com));
        if (c.length === 1) hit = c[0];
      }
      if (!hit && s.likes) { const c = posts.filter(p => (p.vals.likes || []).some(x => x.v === s.likes && x.q === 3)); if (c.length === 1) hit = c[0]; }
      if (!hit) { hit = { caps: [], dates: {}, vals: {}, sigs: new Set() }; posts.push(hit); }
      if (s.cap && !hit.caps.includes(s.cap)) hit.caps.push(s.cap);
      if (s.date) hit.dates[s.date] = (hit.dates[s.date] || 0) + 1;
      if (s.sig) hit.sigs.add(s.sig);
      (hit.vals[s.metric] = hit.vals[s.metric] || []).push({ v: s.value, q: 3 });
      if (s.row) for (const k in s.row) (hit.vals[k] = hit.vals[k] || []).push({ v: s.row[k], q: 1 });
    }
    return posts.map(p => {
      const d = {}, sure = {};
      for (const k in p.vals) {
        const strong = p.vals[k].filter(x => x.q === 3);
        let pool = (strong.length ? strong : p.vals[k]).map(x => x.v);
        // Symbol als Ziffer gelesen (9131 statt 131): längere Variante verwerfen, wenn kürzere auch vorkommt
        pool = pool.filter(v => !pool.some(u => u !== v && String(v).length > String(u).length && String(v).endsWith(String(u))));
        // Teilen/Repost-Symbol als führende Ziffer gelesen (913 statt 13)
        if (!strong.length) {
          const lk = (p.vals.likes || []).find(x => x.q === 3)?.v ?? (p.vals.likes || [])[0]?.v, cm = (p.vals.comments || []).find(x => x.q === 3)?.v ?? (p.vals.comments || [])[0]?.v;
          if (k === "shares" && lk) pool = pool.map(v => v > lk * 0.5 && /^[2389]\d/.test(String(v)) ? +String(v).slice(1) : v);
          if (k === "reposts" && cm) pool = pool.map(v => v >= 10 && v > cm * 0.5 ? +String(v).slice(1) : v);
        }
        const cnt = {}; pool.forEach(v => cnt[v] = (cnt[v] || 0) + 1);
        d[k] = +Object.entries(cnt).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0];
        sure[k] = strong.length > 0 || (cnt[d[k]] >= 2);
      }
      const date = Object.entries(p.dates).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      const name = p.caps.slice().sort((a, b) => b.length - a.length)[0] || "";
      return { name: prettyName(name) || (date ? "Beitrag " + date.split("-").reverse().slice(0, 2).join(".") + "." : "Beitrag ohne Titel"), date, d, sure };
    }).filter(p => Object.keys(p.d).length);
  }
  const prettyName = s => s.replace(/\s+/g, " ").replace(/\s*\.+$/, "").trim().replace(/^[a-zäöü]/, c => c.toUpperCase()).slice(0, 30);

  /* ---------- Gesamtablauf ---------- */
  function analyze(pages, today = new Date()) {
    const acc = { m: {}, q: {}, delta: {}, age: {}, cities: {}, days: null, bioLink: null }, ex = {};
    const sightings = [], kinds = [];
    for (const pg of pages) {
      const L = layout(pg.tsv);
      const kind = classify(L);
      kinds.push(kind);
      if (kind.startsWith("liste:")) parseList(L, kind.slice(6), today, sightings);
      else if (kind === "export") parseExport(L, ex);
      else parseAccount(L, acc);
    }
    const posts = mergePosts(sightings);
    if (acc.m.lost != null) acc.m.lost = Math.abs(acc.m.lost);
    return { ex: Object.keys(ex).length ? ex : null, account: { ...acc.m, days: acc.days || 90 }, delta: acc.delta, age: acc.age, cities: acc.cities, bioLink: acc.bioLink, posts, kinds, lists: [...new Set(kinds.filter(k => k.startsWith("liste:")).map(k => k.slice(6)))] };
  }

  /* Checkliste: was wird für eine vollständige Bestandsaufnahme gebraucht? */
  const CHECKLIST = [
    { id: "profil", title: "Profil", where: "Eigenes Profil öffnen, ganz nach oben scrollen.", need: r => r.account.posts != null && r.account.following != null, what: "Beiträge, Follower, Gefolgt, Bio-Link" },
    { id: "leistung", title: "Dashboard → Leistung (Kacheln)", where: "Profil → „Dein Dashboard“ → Tab „Leistung“, Zeitraum „90 Tage“. Kacheln oben nach links wischen, bis alle 4 einmal zu sehen waren (meist 2 Screenshots).", need: r => r.account.views != null && r.account.reached != null && r.account.viewsF != null && r.account.viewsNF != null, what: "Aufrufe, Betrachter, Aufrufe durch Follower / Nicht-Follower" },
    { id: "content", title: "Leistung → nach Content-Art", where: "Im Tab „Leistung“ nach unten scrollen.", need: r => r.account.vPosts != null && r.account.iPosts != null, what: "Aufrufe und Interaktionen nach Beiträgen, Stories, Reels" },
    { id: "aktiv", title: "Leistung → Aktivitäten im Profil", where: "Im Tab „Leistung“ ganz nach unten scrollen.", need: r => r.account.profileVisits != null, what: "Profilaufrufe, Taps auf Link in Bio" },
    { id: "follower", title: "Dashboard → Zielgruppe (Kacheln)", where: "Tab „Zielgruppe“, Zeitraum „90 Tage“. Kacheln wischen: Follower, Netto-, Neue, Verlorene Follower.", need: r => r.account.followers != null && r.account.newF != null && r.account.lost != null, what: "Follower-Wachstum und Abwanderung" },
    { id: "demo", title: "Zielgruppe → Geschlecht & Alter", where: "Im Tab „Zielgruppe“ nach unten scrollen bis inkl. Altersgruppen.", need: r => r.account.female != null && Object.keys(r.age).length >= 3, what: "Frauen-/Männeranteil, Altersgruppen" },
    { id: "orte", title: "Zielgruppe → Top-Orte (optional)", where: "Im Tab „Zielgruppe“ weiter nach unten: „Top-Orte“ → „Städte“.", need: r => Object.keys(r.cities).length > 0, what: "Wichtigste Städte der Follower", optional: true },
    { id: "export", title: "Insights-Export (optional)", where: "Dashboard → oben rechts „Teilen“-Symbol → Zusammenfassung als Bild sichern, oder Export aus der Edits-App.", need: r => !!r.ex, what: "Summe aller Interaktionen und Anzahl Reels im Zeitraum", optional: true },
    { id: "listen", title: "Dashboard → Inhalte (je Sortierung)", where: "Tab „Inhalte“, „Alle Inhalte“, Zeitraum „1 Jahr“. Für jede Sortierung oben einen Screenshot: Aufrufe, Betrachter, Neue Follower, „Gefällt mir“, Kommentare, Geteilte Inhalte, Gespeicherte Inhalte.", need: r => ["views", "reach", "follows", "likes", "comments", "shares", "saves"].every(k => r.lists.includes(k)), what: "Kennzahlen der Top-Beiträge" },
  ];
  /* Schnell-Check: 4 Screenshots für die wichtigsten Befunde */
  const QUICK = [
    { id: "q_profil", title: "Profil", where: "Eigenes Profil öffnen, ganz nach oben scrollen.", need: r => r.account.posts != null && r.account.following != null, what: "Beiträge, Follower, Gefolgt, Bio-Link" },
    { id: "q_leistung", title: "Dashboard → Leistung", where: "Im Profil auf „Dein Dashboard“ tippen → Tab „Leistung“ → Zeitraum „90 Tage“. Screenshot vom oberen Teil.", need: r => r.account.views != null && r.account.reached != null, what: "Aufrufe, Betrachter und Aufrufe nach Beiträgen, Stories, Reels" },
    { id: "q_zielgruppe", title: "Dashboard → Zielgruppe", where: "Tab „Zielgruppe“ → Zeitraum „90 Tage“. Etwas nach unten scrollen, sodass Follower-Kacheln, Geschlecht und Altersgruppen zu sehen sind.", need: r => r.account.followers != null && r.account.female != null, what: "Follower-Wachstum, Frauen-/Männeranteil, Alter" },
    { id: "q_export", title: "Insights-Zusammenfassung", where: "Im Dashboard oben rechts auf das Teilen-Symbol tippen und die Zusammenfassung als Bild sichern (alternativ der Export aus der Edits-App).", need: r => !!r.ex, what: "Alle Interaktionen und Anzahl der Reels im Zeitraum" },
  ];
  return { analyze, layout, classify, CHECKLIST, QUICK };
})();
