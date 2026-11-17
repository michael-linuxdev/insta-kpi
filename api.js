/* Instagram-API (Instagram Login, graph.instagram.com) – Daten direkt abrufen statt Screenshots.
   Für eigene/verwaltete Konten mit Standard Access: Token im Meta-App-Dashboard erzeugen und hier einfügen. */
"use strict";

const IGApi = (() => {
  const VERSION = "v25.0";
  const BASE = `https://graph.instagram.com/${VERSION}`;

  class ApiError extends Error { constructor(msg, code) { super(msg); this.code = code; } }

  function explain(err) {
    const c = err.code, m = err.message || "";
    if (c === 190) return "Der Zugangsschlüssel ist ungültig oder abgelaufen. Bitte im Meta-Dashboard einen neuen erzeugen.";
    if (c === 10 || c === 200 || /permission/i.test(m)) return "Dem Schlüssel fehlt eine Berechtigung (instagram_business_basic und instagram_business_manage_insights).";
    if ([4, 17, 32, 613].includes(c)) return "Instagram begrenzt gerade die Anzahl der Abfragen. Bitte in etwa einer Stunde erneut versuchen.";
    return m || "Unbekannter Fehler bei der Instagram-API.";
  }

  async function get(path, params, token) {
    const qs = new URLSearchParams({ ...params, access_token: token });
    let res;
    try { res = await fetch(`${path.startsWith("http") ? path : BASE + "/" + path}?${qs}`); }
    catch (e) { throw new ApiError("Keine Verbindung zur Instagram-API (Internet prüfen). Falls das dauerhaft so ist, blockiert der Browser den direkten Abruf.", -1); }
    let json = null;
    try { json = await res.json(); } catch (e) { /* leer */ }
    if (!res.ok || json?.error) throw new ApiError(json?.error?.message || `HTTP ${res.status}`, json?.error?.code ?? res.status);
    return json;
  }
  // Mehrere Kennzahlen; schlägt die Sammelabfrage fehl, einzeln nachfragen und Fehlende überspringen
  async function metrics(path, list, extra, token) {
    try {
      const r = await get(path, { metric: list.join(","), ...extra }, token);
      return r.data || [];
    } catch (e) {
      if (e.code === 190 || [4, 17, 32, 613].includes(e.code)) throw e;
      const out = [];
      for (const m of list) { try { const r = await get(path, { metric: m, ...extra }, token); out.push(...(r.data || [])); } catch (e2) { if (e2.code === 190) throw e2; } }
      return out;
    }
  }
  const tv = (data, name) => { const x = data.find(d => d.name === name); return x?.total_value?.value ?? x?.values?.[0]?.value ?? null; };
  const bd = (data, name) => {
    const x = data.find(d => d.name === name); const out = {};
    for (const b of x?.total_value?.breakdowns || []) for (const r of b.results || []) out[String(r.dimension_values.slice(-1)[0])] = r.value;
    return out;
  };

  async function pool(items, n, fn) {
    const out = new Array(items.length); let i = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
    return out;
  }

  async function refreshIfDue(api) {
    // Long-lived Token: nach 24 h verlängerbar, gilt dann wieder 60 Tage
    const age = Date.now() - (api.savedAt || 0);
    if (age < 864e5 * 1) return api;
    try {
      const r = await get("https://graph.instagram.com/refresh_access_token", { grant_type: "ig_refresh_token" }, api.token);
      return { ...api, token: r.access_token, savedAt: Date.now(), expiresAt: Date.now() + (r.expires_in || 5184000) * 1000 };
    } catch (e) { if (e.code === 190) throw e; return api; }
  }

  async function profile(token) {
    return get("me", { fields: "user_id,username,name,followers_count,follows_count,media_count,biography,website" }, token);
  }

  /* Alles holen: Konto (aktueller + vorheriger Zeitraum), Zielgruppe, Beiträge/Reels mit Insights */
  async function sync(api, { days = 30, maxMedia = 40 } = {}, onProgress = () => {}) {
    const token = api.token;
    onProgress("Profil laden");
    const me = await profile(token);
    const id = me.user_id || me.id;
    const now = Math.floor(Date.now() / 1000), span = days * 86400;
    const win = (u) => ({ period: "day", metric_type: "total_value", since: u - span, until: u });

    async function account(until) {
      const p = win(until), path = `${id}/insights`;
      const plain = await metrics(path, ["reach", "views", "total_interactions", "likes", "comments", "shares", "saves", "reposts", "accounts_engaged"], p, token);
      const vFol = await metrics(path, ["views"], { ...p, breakdown: "follow_type" }, token);
      const vType = await metrics(path, ["views"], { ...p, breakdown: "media_product_type" }, token);
      const iType = await metrics(path, ["total_interactions"], { ...p, breakdown: "media_product_type" }, token);
      const fu = await metrics(path, ["follows_and_unfollows"], { ...p, breakdown: "follow_type" }, token);
      const vf = bd(vFol, "views"), vt = bd(vType, "views"), it = bd(iType, "total_interactions"), f = bd(fu, "follows_and_unfollows");
      return {
        reached: tv(plain, "reach"), views: tv(plain, "views"), interactions: tv(plain, "total_interactions"),
        likes: tv(plain, "likes"), comments: tv(plain, "comments"), shares: tv(plain, "shares"), saves: tv(plain, "saves"), reposts: tv(plain, "reposts"),
        viewsF: vf.FOLLOWER ?? null, viewsNF: vf.NON_FOLLOWER ?? null,
        vPosts: vt.FEED ?? null, vStories: vt.STORY ?? null, vReels: vt.REELS ?? null,
        iPosts: it.FEED ?? null, iStories: it.STORY ?? null, iReels: it.REELS ?? null,
        newF: f.FOLLOWER ?? null, lost: f.NON_FOLLOWER ?? null,
      };
    }
    onProgress("Konto-Kennzahlen laden");
    const cur = await account(now);
    onProgress("Vorzeitraum zum Vergleich laden");
    let prev = null; try { prev = await account(now - span); } catch (e) { if (e.code === 190) throw e; }

    onProgress("Zielgruppe laden");
    const demo = { age: {}, cities: {}, female: null, male: null };
    for (const tf of ["this_month", "last_90_days", "last_30_days"]) {
      try {
        const base = { period: "lifetime", metric_type: "total_value", timeframe: tf };
        const g = bd(await metrics(`${id}/insights`, ["follower_demographics"], { ...base, breakdown: "gender" }, token), "follower_demographics");
        if (!Object.keys(g).length) continue;
        const tot = Object.values(g).reduce((s, v) => s + v, 0) || 1;
        demo.female = Math.round((g.F || 0) / tot * 1000) / 10; demo.male = Math.round((g.M || 0) / tot * 1000) / 10;
        const a = bd(await metrics(`${id}/insights`, ["follower_demographics"], { ...base, breakdown: "age" }, token), "follower_demographics");
        const at = Object.values(a).reduce((s, v) => s + v, 0) || 1;
        for (const [k, v] of Object.entries(a)) demo.age[k] = Math.round(v / at * 1000) / 10;
        const c = bd(await metrics(`${id}/insights`, ["follower_demographics"], { ...base, breakdown: "city" }, token), "follower_demographics");
        const ct = Object.values(c).reduce((s, v) => s + v, 0) || 1;
        Object.entries(c).sort((x, y) => y[1] - x[1]).slice(0, 8).forEach(([k, v]) => demo.cities[k.split(",")[0].trim()] = Math.round(v / ct * 1000) / 10);
        break;
      } catch (e) { if (e.code === 190) throw e; }
    }

    onProgress("Beiträge und Reels laden");
    let media = [], next = null, page = 0;
    const cutoff = Date.now() - 365 * 864e5;
    do {
      const r = next ? await get(next.split("?")[0], Object.fromEntries(new URL(next).searchParams), token)
        : await get(`${id}/media`, { fields: "id,caption,media_type,media_product_type,timestamp,like_count,comments_count,permalink", limit: 50 }, token);
      media = media.concat(r.data || []);
      next = r.paging?.next || null; page++;
    } while (next && media.length < maxMedia && page < 5 && new Date(media[media.length - 1]?.timestamp || 0) > cutoff);
    media = media.filter(m => new Date(m.timestamp) > cutoff).slice(0, maxMedia);

    let done = 0;
    const items = await pool(media, 4, async m => {
      const isReel = m.media_product_type === "REELS";
      const list = isReel ? ["reach", "views", "likes", "comments", "shares", "saved", "total_interactions", "ig_reels_avg_watch_time"]
        : ["reach", "views", "likes", "comments", "shares", "saved", "total_interactions", "follows", "profile_visits"];
      const data = await metrics(`${m.id}/insights`, list, {}, token);
      onProgress(`Insights ${++done} von ${media.length}`);
      const v = n => { const x = data.find(d => d.name === n); return x?.values?.[0]?.value ?? x?.total_value?.value ?? null; };
      return { m, isReel, v: Object.fromEntries(list.map(n => [n, v(n)])) };
    });

    const reelsInWindow = media.filter(m => m.media_product_type === "REELS" && new Date(m.timestamp) > Date.now() - span * 1000).length;
    const pct = (a, b) => a != null && b ? Math.round((a - b) / b * 1000) / 10 : null;
    const net = cur.newF != null && cur.lost != null ? cur.newF - cur.lost : null;
    return {
      me, days,
      account: {
        followers: me.followers_count, following: me.follows_count, posts: me.media_count, days,
        views: cur.views, reached: cur.reached, viewsF: cur.viewsF, viewsNF: cur.viewsNF,
        vPosts: cur.vPosts, vStories: cur.vStories, vReels: cur.vReels, iPosts: cur.iPosts, iStories: cur.iStories, iReels: cur.iReels,
        newF: cur.newF, lost: cur.lost, net, female: demo.female, male: demo.male,
      },
      delta: prev ? { views: pct(cur.views, prev.views), reached: pct(cur.reached, prev.reached), viewsNF: pct(cur.viewsNF, prev.viewsNF), followers: net != null && me.followers_count - net > 0 ? Math.round(net / (me.followers_count - net) * 1000) / 10 : null } : {},
      ex: { days, followers: me.followers_count, reached: cur.reached, reelViews: cur.vReels, likes: cur.likes, comments: cur.comments, reposts: cur.reposts, shares: cur.shares, saves: cur.saves, reels: reelsInWindow, range: `letzte ${days} Tage (API)` },
      age: demo.age, cities: demo.cities, bioLink: me.website || null,
      items,
    };
  }
  return { sync, profile, refreshIfDue, explain, VERSION };
})();
