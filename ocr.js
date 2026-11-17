/* Screenshot-Import: Texterkennung (Tesseract.js) + Parser für Instagram-Insights (DE/EN) */
"use strict";

const OCR = (() => {
  const TESS_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
  let loading = null, worker = null;

  function loadLib() {
    if (window.Tesseract) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = TESS_URL; s.async = true;
      s.onload = res;
      s.onerror = () => { loading = null; rej(new Error("Texterkennung konnte nicht geladen werden. Bitte Internetverbindung prüfen.")); };
      document.head.appendChild(s);
    });
    return loading;
  }

  async function getWorker(onProgress) {
    await loadLib();
    if (worker) return worker;
    onProgress && onProgress({ status: "Sprachdaten laden (nur beim ersten Mal)", p: 0 });
    worker = await Tesseract.createWorker(["deu", "eng"], 1, {
      logger: m => onProgress && onProgress({ status: m.status, p: m.progress || 0 }),
    });
    // Zeilenweise lesen (PSM 6): hält Beschriftung und Zahl in einer Zeile zusammen
    await worker.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
    return worker;
  }

  /* Bild vorbereiten: Graustufen, Dark-Mode invertieren, Kontrast anheben, Größe normalisieren */
  async function prepare(file) {
    const bmp = await createImageBitmap(file);
    const targetW = Math.min(1600, Math.max(1100, bmp.width));
    const scale = targetW / bmp.width;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const img = ctx.getImageData(0, 0, c.width, c.height), px = img.data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) {
      const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      px[i] = px[i + 1] = px[i + 2] = g; sum += g;
    }
    const dark = sum / (px.length / 4) < 115;
    for (let i = 0; i < px.length; i += 4) {
      let g = px[i];
      if (dark) g = 255 - g;
      g = Math.max(0, Math.min(255, (g - 128) * 1.35 + 128));
      px[i] = px[i + 1] = px[i + 2] = g;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  async function recognize(files, onProgress) {
    const w = await getWorker(onProgress);
    const texts = [];
    for (let i = 0; i < files.length; i++) {
      onProgress && onProgress({ status: `Screenshot ${i + 1} von ${files.length} wird gelesen`, p: i / files.length });
      const canvas = await prepare(files[i]);
      const { data } = await w.recognize(canvas);
      texts.push(data.text || "");
    }
    return texts;
  }

  /* ---------- Parser ---------- */

  // Zahl inkl. deutscher/englischer Schreibweise und Kürzeln (Tsd., K, Mio., M)
  const NUM_RE = /(\d{1,3}(?:[.,   ]\d{3})+|\d+(?:[.,]\d+)?)\s*(Mio\.?|Mrd\.?|Tsd\.?|K|k|M)?(?![a-zäöüß])\s*(%)?/;

  function parseNumber(str) {
    const m = str.match(NUM_RE);
    if (!m) return null;
    let raw = m[1], suf = (m[2] || "").toLowerCase().replace(".", "");
    let v;
    if (/^\d{1,3}([.,   ]\d{3})+$/.test(raw) && !suf) {
      v = parseFloat(raw.replace(/[.,   ]/g, ""));          // 4.200 / 4,200 / 4 200
    } else {
      v = parseFloat(raw.replace(",", "."));                            // 9,5 / 4.2
    }
    if (suf === "tsd" || suf === "k") v *= 1e3;
    else if (suf === "mio" || suf === "m") v *= 1e6;
    else if (suf === "mrd") v *= 1e9;
    return { v, pct: !!m[3], idx: m.index, raw: m[0].trim() };
  }

  // Dauer: "1 Min. 5 Sek.", "9,5 Sek.", "12 s", "0:14"
  function parseDuration(str) {
    const mmss = str.match(/\b(\d{1,2}):(\d{2})\b/);
    if (mmss) return { v: +mmss[1] * 60 + +mmss[2], raw: mmss[0] };
    const min = str.match(/(\d+)\s*(?:min\.?|minuten|m)\b/i);
    const sec = str.match(/(\d+(?:[.,]\d+)?)\s*(?:sek\.?|sekunden|sec|s)\b/i);
    if (!min && !sec) return null;
    const v = (min ? +min[1] * 60 : 0) + (sec ? parseFloat(sec[1].replace(",", ".")) : 0);
    return { v, raw: [min && min[0], sec && sec[0]].filter(Boolean).join(" ") };
  }

  // Suchbegriffe pro Feld (Kleinbuchstaben). Reihenfolge = Priorität.
  const L = {
    reach: [/konten erreicht/, /erreichte konten/, /accounts reached/, /^reichweite\b/, /\breach\b/],
    views: [/(^|[^a-zäöü-])aufrufe\b/, /^views?\b/, /impressionen/, /impressions/],
    plays: [/(^|[^a-zäöü-])aufrufe\b/, /wiedergaben/, /^plays\b/, /^views?\b/],
    likes: [/gefällt mir/, /gef[aä]llt/, /\blikes?\b/],
    comments: [/kommentare?\b/, /comments?\b/],
    saves: [/gespeichert/, /speicherungen/, /\bsaves?\b/, /saved/],
    shares: [/geteilt/, /\bteilen\b/, /\bshares?\b/, /reposts?/],
    interactions: [/^interaktionen\b/, /interaktionen mit/, /^interactions\b/, /content interactions/],
    followers: [/^follower(innen)?\b(?!.*nicht)/, /^followers\b/],
    nonfollow: [/nicht[- ]?follower/, /non[- ]?followers?/],
    avgwatch: [/durchschnittliche wiedergabedauer/, /ø.*wiedergabedauer/, /average watch time/, /avg\.? watch time/],
    length: [/länge des reels/, /video[- ]?länge/, /reel length/],
    skip: [/übersprungen/, /überspring/, /skip rate/, /skipped/],
    first: [/(^|[^a-zäöü-])aufrufe\b/, /^views?\b/, /impressionen/],
    fwd: [/vorwärts/, /^weiter\b/, /forward taps?/, /forwards?/, /nächste story/],
    exit: [/verlassen/, /exited/, /exits?\b/],
    replies: [/antworten/, /replies/],
    linkclicks: [/link[- ]?klicks/, /klicks auf links?/, /sticker[- ]?taps/, /link clicks/, /link taps/],
    gained: [/^follows\b/, /neue follower/, /^gefolgt\b/, /follows\b/],
    lost: [/entfolgt/, /unfollows/, /nicht mehr gefolgt/],
    profilevisits: [/profilaufrufe/, /profilbesuche/, /profile visits/, /profile activity/],
    linktaps: [/taps auf externe links/, /externe links/, /external link taps/, /link in bio/],
  };
  const DURATION_FIELDS = new Set(["avgwatch", "length"]);
  const PCT_FIELDS = new Set(["nonfollow", "skip"]);

  function detectType(text) {
    const t = text.toLowerCase();
    const score = {
      reel: /wiedergabedauer|watch time|übersprungen|skip rate|reel/.test(t) * 3,
      story: (/vorwärts|forward|verlassen|exited|nächste story|navigation/.test(t) * 3) + (/antworten|replies/.test(t) ? 1 : 0),
      profil: (/profilaufrufe|profile visits|taps auf externe|external link|entfolgt|unfollows/.test(t) * 2) + (/letzte[n]? \d+ tage|last \d+ days/.test(t) ? 2 : 0),
      beitrag: (/gefällt mir|likes/.test(t) ? 1 : 0) + (/gespeichert|saves/.test(t) ? 1 : 0) + (/karussell|beitrag|post/.test(t) ? 1 : 0),
    };
    const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? best[0] : "beitrag";
  }

  function valueNear(lines, i, labelEnd, field) {
    const parse = DURATION_FIELDS.has(field) ? parseDuration : parseNumber;
    const accept = r => r && isFinite(r.v) && (PCT_FIELDS.has(field) ? (r.pct || r.v <= 100) : !r.pct || DURATION_FIELDS.has(field));
    // 1) gleiche Zeile, hinter dem Begriff  2) gleiche Zeile, davor (Prozent vor Label)
    // 3) nächste Zeile  4) vorherige Zeile (große Zahl über dem Label)
    const after = lines[i].slice(labelEnd);
    let r = parse(after);
    if (accept(r)) return r;
    const before = lines[i].slice(0, labelEnd);
    r = parse(before);
    if (accept(r) && (PCT_FIELDS.has(field) ? r.pct : true)) return r;
    for (const j of [i + 1, i - 1]) {
      if (j < 0 || j >= lines.length) continue;
      const ln = lines[j];
      // Nachbarzeile darf nicht selbst ein anderes Label mit Zahl sein
      const onlyNumber = /^[\s\d.,:%+\-–KkMmioTsdSekMinsø]*$/i.test(ln.replace(/(sek\.?|min\.?|tsd\.?|mio\.?)/gi, ""));
      if (!onlyNumber) continue;
      r = parse(ln);
      if (accept(r)) return r;
    }
    return null;
  }

  function parse(texts, type) {
    const fields = TYPES[type].fields.map(f => f[0]);
    const found = {};
    const lines = texts.join("\n").split(/\n+/).map(l => l.replace(/[|]/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    const lower = lines.map(l => l.toLowerCase());
    const used = new Set();
    for (const f of fields) {
      const pats = L[f]; if (!pats) continue;
      outer: for (const re of pats) {
        for (let i = 0; i < lower.length; i++) {
          if (used.has(i + ":" + f)) continue;
          const m = lower[i].match(re);
          if (!m) continue;
          // "Profilaufrufe" nicht als "Aufrufe" zählen, "Nicht-Follower" nicht als "Follower"
          if ((f === "views" || f === "plays" || f === "first") && /profil/.test(lower[i])) continue;
          if (f === "followers" && /nicht|non|neue|new/.test(lower[i])) continue;
          if (f === "gained" && /nicht|non|un/.test(lower[i].slice(0, (m.index || 0) + m[0].length))) continue;
          const r = valueNear(lines, i, (m.index || 0) + m[0].length, f);
          if (r) { found[f] = { v: Math.round(r.v * 100) / 100, src: lines[i] + (r.raw && !lines[i].includes(r.raw) ? " → " + r.raw : "") }; used.add(i + ":" + f); break outer; }
        }
      }
    }
    // Beitrag: Format erkennen
    if (type === "beitrag") {
      const t = lower.join(" ");
      if (/karussell|carousel|\d+\s*\/\s*\d+/.test(t)) found.format = { v: "Karussell", src: "Karussell erkannt" };
    }
    return found;
  }

  return { recognize, parse, detectType, parseNumber, parseDuration, loadLib };
})();
