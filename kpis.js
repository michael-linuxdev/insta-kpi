/* Kennzahlen-Definitionen, Richtwerte und Handlungsempfehlungen */
"use strict";

const TYPES = {
  beitrag: {
    label: "Beitrag", plural: "Beiträge",
    where: "Beitrag öffnen → „Insights ansehen“ (Business- oder Creator-Konto nötig).",
    formats: ["Einzelbild", "Karussell"],
    fields: [
      ["reach", "Konten erreicht", "Reichweite: einzelne Konten, die den Beitrag gesehen haben"],
      ["views", "Aufrufe", "Wie oft der Beitrag angezeigt wurde (früher „Impressionen“)"],
      ["likes", "Gefällt mir", ""],
      ["comments", "Kommentare", ""],
      ["saves", "Gespeichert", ""],
      ["shares", "Geteilt", ""],
      ["follows", "Neue Follower", "Durch diesen Beitrag gewonnen (Follows), optional"],
      ["followers", "Follower", "Followerzahl zum Zeitpunkt, steht oben im Profil"],
      ["nonfollow", "Anteil Nicht-Follower (%)", "In den Insights unter „Aufrufe“ als Prozentwert", "pct"],
    ],
    demo: { format: "Karussell", reach: 4200, views: 5600, likes: 310, comments: 24, saves: 58, shares: 41, followers: 8500, nonfollow: 38 },
  },
  reel: {
    label: "Reel", plural: "Reels",
    where: "Reel öffnen → „Insights ansehen“.",
    fields: [
      ["reach", "Konten erreicht", ""],
      ["plays", "Aufrufe", "Wiedergaben inkl. Wiederholungen"],
      ["interactions", "Interaktionen gesamt", "Likes + Kommentare + Gespeichert + Geteilt"],
      ["saves", "Gespeichert", "Optional"],
      ["shares", "Geteilt", ""],
      ["avgwatch", "Ø Wiedergabedauer (Sek.)", "„Durchschnittliche Wiedergabedauer“", "sec"],
      ["length", "Länge des Reels (Sek.)", "", "sec"],
      ["skip", "Übersprungen-Rate (%)", "Anteil, der in den ersten Sekunden weiterwischt (falls angezeigt)", "pct"],
    ],
    demo: { reach: 12800, plays: 16500, interactions: 740, saves: 88, shares: 96, avgwatch: 9.5, length: 18, skip: 52 },
  },
  story: {
    label: "Story", plural: "Stories",
    where: "Story öffnen → nach oben wischen, oder Profil → Insights → Stories.",
    fields: [
      ["first", "Aufrufe 1. Slide", ""],
      ["last", "Aufrufe letzter Slide", ""],
      ["slides", "Anzahl Slides", ""],
      ["fwd", "Vorwärts getippt", "„Weiter“ zur nächsten Slide"],
      ["exit", "Verlassen", "Story-Bereich verlassen"],
      ["replies", "Antworten", ""],
      ["linkclicks", "Link-Klicks", "Nur mit Link-Sticker"],
    ],
    demo: { first: 820, last: 610, slides: 4, fwd: 430, exit: 95, replies: 12, linkclicks: 38 },
  },
  profil: {
    label: "Profil", plural: "Profil-Auswertungen",
    where: "Profil → „Professionelles Dashboard“ → Insights, Zeitraum z. B. 30 Tage.",
    fields: [
      ["followers", "Follower aktuell", ""],
      ["gained", "Neue Follower", "Im Zeitraum gewonnen (Follows)"],
      ["lost", "Entfolgt", "Im Zeitraum verloren"],
      ["reach", "Konten erreicht", "Im gesamten Zeitraum"],
      ["profilevisits", "Profilaufrufe", ""],
      ["linktaps", "Taps auf externe Links", "Link in Bio"],
      ["posts", "Veröffentlichte Inhalte", "Beiträge + Reels im Zeitraum"],
    ],
    demo: { followers: 8500, gained: 420, lost: 130, reach: 61000, profilevisits: 2900, linktaps: 210, posts: 14 },
  },
};

const fmtNum = (n, d = 2) => Number(n).toLocaleString("de-DE", { maximumFractionDigits: d });
const sumOf = (d, keys) => keys.reduce((s, k) => s + (Number(d[k]) || 0), 0);
const has = (d, k) => d[k] !== undefined && d[k] !== null && d[k] !== "" && isFinite(d[k]);

/*
 KPI-Definition:
 id, n (Name), t (Typ), req (Pflichtfelder), v (Berechnung), c (Rechenweg),
 unit: pct | x | n | acc | signed
 ok/good: Schwellen, inv: niedriger = besser, b: Richtwert-Text, e: Erklärung, tips: Hebel
*/
const KPIS = [
  // ---------- Beitrag ----------
  { id: "b_er_reach", t: "beitrag", n: "Engagement-Rate (Reichweite)", short: "ER Reichweite",
    req: d => has(d, "reach") && ["likes", "comments", "saves", "shares"].some(k => has(d, k)),
    v: d => sumOf(d, ["likes", "comments", "saves", "shares"]) / d.reach * 100,
    c: d => `(${fmtNum(d.likes || 0)} + ${fmtNum(d.comments || 0)} + ${fmtNum(d.saves || 0)} + ${fmtNum(d.shares || 0)}) ÷ ${fmtNum(d.reach)} × 100`,
    unit: "pct", ok: 3, good: 6, b: "Richtwert: 3–6 % solide, über 6 % stark",
    e: "Wie viele der Menschen, die den Beitrag gesehen haben, aktiv reagiert haben. Die aussagekräftigste Engagement-Rate, weil sie nur Konten zählt, die den Inhalt wirklich gesehen haben. Ideal, um eigene Beiträge untereinander zu vergleichen.",
    tips: ["Erste Zeile der Caption als Hook formulieren – sie entscheidet, ob weitergelesen wird.", "Konkrete Frage oder Aufforderung ans Ende stellen („Speicher dir das“, „Welche Variante?“).", "In der ersten Stunde nach Veröffentlichung auf Kommentare antworten – das hält die Diskussion am Laufen."] },
  { id: "b_er_follow", t: "beitrag", n: "Engagement-Rate (Follower)", short: "ER Follower",
    req: d => has(d, "followers") && d.followers > 0 && ["likes", "comments", "saves", "shares"].some(k => has(d, k)),
    v: d => sumOf(d, ["likes", "comments", "saves", "shares"]) / d.followers * 100,
    c: d => `(${fmtNum(d.likes || 0)} + ${fmtNum(d.comments || 0)} + ${fmtNum(d.saves || 0)} + ${fmtNum(d.shares || 0)}) ÷ ${fmtNum(d.followers)} × 100`,
    unit: "pct", ok: 1, good: 3, b: "Richtwert: 1–3 % solide, über 3 % stark",
    e: "Die „klassische“ Engagement-Rate, die Marken oft abfragen, weil sie auch ohne Insights-Zugang berechenbar ist. Nachteil: Virale Beiträge (viele Nicht-Follower) und inaktive Follower verzerren sie.",
    tips: ["Inaktive oder gekaufte Follower drücken diesen Wert – nie Follower kaufen.", "Inhalte auf die Kernzielgruppe zuschneiden statt auf Trends ohne Bezug.", "Regelmäßig posten, damit Follower den Account im Feed überhaupt sehen."] },
  { id: "b_save", t: "beitrag", n: "Save-Rate", short: "Save-Rate",
    req: d => has(d, "saves") && d.reach > 0, v: d => d.saves / d.reach * 100,
    c: d => `${fmtNum(d.saves)} ÷ ${fmtNum(d.reach)} × 100`,
    unit: "pct", ok: 0.5, good: 1.5, b: "Richtwert: ab 0,5 % solide, über 1,5 % stark",
    e: "Speichern heißt: „Will ich später wieder anschauen.“ Für den Algorithmus ein starkes Qualitätssignal. Hohe Werte erreichen Mehrwert-Inhalte wie Anleitungen, Checklisten oder Infografiken.",
    tips: ["Mehrwert-Formate testen: Checkliste, Schritt-für-Schritt, „5 Fehler bei …“.", "Karussells nutzen – kompaktes Wissen auf mehreren Slides wird häufiger gespeichert.", "Auf der letzten Slide ausdrücklich zum Speichern auffordern."] },
  { id: "b_share", t: "beitrag", n: "Share-Rate", short: "Share-Rate",
    req: d => has(d, "shares") && d.reach > 0, v: d => d.shares / d.reach * 100,
    c: d => `${fmtNum(d.shares)} ÷ ${fmtNum(d.reach)} × 100`,
    unit: "pct", ok: 0.5, good: 1.5, b: "Richtwert: ab 0,5 % solide, über 1,5 % stark",
    e: "Teilen per DM oder in der eigenen Story ist das wichtigste Signal für Reichweite bei Nicht-Followern. Geteilt wird, was unterhält, überrascht oder bei dem man denkt „das muss XY sehen“.",
    tips: ["Inhalte bauen, die man jemandem schicken will: wiedererkennbare Alltagssituationen, Humor, überraschende Fakten.", "Klare Botschaft in einem Satz – komplizierte Inhalte werden selten weitergeleitet.", "Aufforderung „Schick das jemandem, der …“ gezielt einsetzen."] },
  { id: "b_comment", t: "beitrag", n: "Kommentar-Rate", short: "Kommentar-Rate",
    req: d => has(d, "comments") && d.reach > 0, v: d => d.comments / d.reach * 100,
    c: d => `${fmtNum(d.comments)} ÷ ${fmtNum(d.reach)} × 100`,
    unit: "pct", ok: 0.2, good: 0.6, b: "Richtwert: ab 0,2 % solide, über 0,6 % stark",
    e: "Kommentare kosten mehr Aufwand als ein Like und zeigen echte Auseinandersetzung. Ein guter Indikator für Community.",
    tips: ["Offene Fragen stellen, die leicht zu beantworten sind („A oder B?“).", "Jeden Kommentar beantworten, gern mit Gegenfrage.", "Meinungsstarke Aussagen fördern Diskussion – sachlich bleiben."] },
  { id: "b_follow", t: "beitrag", n: "Follow-Rate", short: "Follow-Rate",
    req: d => has(d, "follows") && d.reach > 0, v: d => d.follows / d.reach * 100,
    c: d => `${fmtNum(d.follows)} ÷ ${fmtNum(d.reach)} × 100`,
    unit: "pct", ok: 0.3, good: 1, b: "Richtwert: ab 0,3 % solide, über 1 % stark",
    e: "Wie viele der erreichten Konten nach diesem Beitrag gefolgt sind. Zeigt, welche Inhalte wirklich Wachstum bringen – nicht nur Likes.",
    tips: ["Inhalte mit hoher Follow-Rate als Vorlage nutzen und als Serie fortsetzen.", "In der Caption sagen, was es bei dir regelmäßig gibt („Folge für mehr …“).", "Beiträge so gestalten, dass sie auch ohne Vorwissen verständlich sind – für Nicht-Follower."] },
  { id: "b_reachq", t: "beitrag", n: "Reichweitenquote", short: "Reichweitenquote",
    req: d => d.reach > 0 && d.followers > 0, v: d => d.reach / d.followers * 100,
    c: d => `${fmtNum(d.reach)} ÷ ${fmtNum(d.followers)} × 100`,
    unit: "pct", ok: 20, good: 50, b: "Richtwert: 20–50 % üblich, darüber stark",
    e: "Welcher Anteil der Followerzahl als Reichweite erreicht wurde. Da Reichweite auch Nicht-Follower enthält, sind über 100 % möglich. Dauerhaft niedrige Werte deuten auf inaktive Follower oder schwache Ausspielung hin.",
    tips: ["Zu Zeiten posten, an denen die Follower aktiv sind (Insights → Follower → Aktivste Zeiten).", "Neue Beiträge in der Story teilen, um die ersten Interaktionen anzuschieben.", "Formate mit hoher Share-Rate fördern die Ausspielung über die Follower hinaus."] },
  { id: "b_freq", t: "beitrag", n: "Frequenz", short: "Frequenz",
    req: d => d.views > 0 && d.reach > 0, v: d => d.views / d.reach,
    c: d => `${fmtNum(d.views)} ÷ ${fmtNum(d.reach)}`,
    unit: "x", b: "Typisch: 1,1–1,5 Aufrufe pro erreichtem Konto",
    e: "Wie oft ein erreichtes Konto den Beitrag im Schnitt gesehen hat. Bei Karussells sind höhere Werte normal, weil Instagram sie mit der nächsten Slide erneut ausspielt. In der Werbung wichtig, um Werbemüdigkeit zu erkennen." },
  { id: "b_nonf", t: "beitrag", n: "Nicht-Follower erreicht", short: "Nicht-Follower",
    req: d => has(d, "nonfollow") && d.reach > 0, v: d => d.reach * d.nonfollow / 100,
    c: d => `${fmtNum(d.reach)} × ${fmtNum(d.nonfollow)} ÷ 100`,
    unit: "acc", b: "Je höher, desto mehr Potenzial für neue Follower",
    e: "Zeigt, wie stark ein Inhalt über die eigene Community hinaus wirkt (Entdecken, Teilen, Reels-Feed). Für Wachstum entscheidend; für Community-Pflege zählt eher das Engagement der Follower." },

  // ---------- Reel ----------
  { id: "r_wtr", t: "reel", n: "Watch-Through-Rate", short: "Watch-Through",
    req: d => d.avgwatch > 0 && d.length > 0, v: d => d.avgwatch / d.length * 100,
    c: d => `${fmtNum(d.avgwatch)} s ÷ ${fmtNum(d.length)} s × 100`,
    unit: "pct", ok: 40, good: 70, b: "Richtwert: ab 40 % solide, über 70 % stark",
    e: "Welcher Anteil des Reels im Schnitt angeschaut wurde. Eine der wichtigsten Reel-Kennzahlen, weil Wiedergabezeit stark gewichtet wird. Über 100 % sind möglich, wenn Reels in Schleife laufen.",
    tips: ["Kürzer schneiden: Pausen, Intros und Wiederholungen raus.", "Spannung bis zum Schluss halten – Auflösung erst am Ende.", "Nahtlosen Loop bauen: Ende geht direkt in den Anfang über."] },
  { id: "r_hook", t: "reel", n: "Hook-Rate (nicht übersprungen)", short: "Hook-Rate",
    req: d => has(d, "skip"), v: d => 100 - d.skip,
    c: d => `100 − ${fmtNum(d.skip)}`,
    unit: "pct", ok: 40, good: 60, b: "Richtwert: ab 40 % solide, über 60 % stark",
    e: "Anteil der Zuschauer, die nach den ersten Sekunden dranbleiben statt weiterzuwischen. Misst direkt, wie gut die ersten 1–3 Sekunden funktionieren.",
    tips: ["Text-Overlay in der ersten Sekunde, der neugierig macht.", "Mit Bewegung oder dem spannendsten Moment starten, nicht mit Begrüßung.", "Ein klares Versprechen geben: „So sparst du …“, „Der Fehler, den alle machen …“."] },
  { id: "r_er", t: "reel", n: "Engagement-Rate (Reichweite)", short: "ER Reichweite",
    req: d => has(d, "interactions") && d.reach > 0, v: d => d.interactions / d.reach * 100,
    c: d => `${fmtNum(d.interactions)} ÷ ${fmtNum(d.reach)} × 100`,
    unit: "pct", ok: 3, good: 6, b: "Richtwert: 3–6 % solide, über 6 % stark",
    e: "Aktive Reaktionen pro erreichtem Konto. Reels haben oft mehr Reichweite, aber eine etwas niedrigere Engagement-Rate, weil viele Nicht-Follower nur vorbeiwischen.",
    tips: ["Am Ende eine Frage oder Aufforderung einblenden.", "Kommentar-Anlass schaffen: Meinung, Wahl, Ergänzung.", "Trend-Audios nur nutzen, wenn sie zur Botschaft passen."] },
  { id: "r_share", t: "reel", n: "Share-Rate", short: "Share-Rate",
    req: d => has(d, "shares") && d.reach > 0, v: d => d.shares / d.reach * 100,
    c: d => `${fmtNum(d.shares)} ÷ ${fmtNum(d.reach)} × 100`,
    unit: "pct", ok: 0.5, good: 1.5, b: "Richtwert: ab 0,5 % solide, über 1,5 % stark",
    e: "Bei Reels der wichtigste Treiber für virale Verbreitung. Reels, die oft per DM verschickt werden, spielt Instagram immer weiter an Nicht-Follower aus.",
    tips: ["Relatable-Inhalte: Situationen, in denen sich Zuschauer wiedererkennen.", "Überraschende Fakten oder Vorher-Nachher-Effekte.", "Kurz und klar – teilbar ist, was man in 5 Sekunden versteht."] },
  { id: "r_save", t: "reel", n: "Save-Rate", short: "Save-Rate",
    req: d => has(d, "saves") && d.reach > 0, v: d => d.saves / d.reach * 100,
    c: d => `${fmtNum(d.saves)} ÷ ${fmtNum(d.reach)} × 100`,
    unit: "pct", ok: 0.5, good: 1.5, b: "Richtwert: ab 0,5 % solide, über 1,5 % stark",
    e: "Wie oft das Reel zum späteren Anschauen gespeichert wurde. Tutorials und Tipps erreichen hier die besten Werte.",
    tips: ["Tutorials und Anleitungen als Reel umsetzen.", "Wichtige Schritte als Text einblenden – das macht Speichern sinnvoll.", "Zum Speichern auffordern: „Speicher dir das für später“."] },
  { id: "r_rewatch", t: "reel", n: "Wiedergaben pro Konto", short: "Wiedergaben/Konto",
    req: d => d.plays > 0 && d.reach > 0, v: d => d.plays / d.reach,
    c: d => `${fmtNum(d.plays)} ÷ ${fmtNum(d.reach)}`,
    unit: "x", b: "Über 1,3 deutet auf Rewatch-Effekt hin",
    e: "Wie oft ein erreichtes Konto das Reel im Schnitt gesehen hat. Hohe Werte entstehen durch Zurückspulen, Nachlesen oder nahtlose Loops – ein gutes Zeichen." },

  // ---------- Story ----------
  { id: "s_compl", t: "story", n: "Completion-Rate", short: "Completion",
    req: d => d.first > 0 && has(d, "last"), v: d => d.last / d.first * 100,
    c: d => `${fmtNum(d.last)} ÷ ${fmtNum(d.first)} × 100`,
    unit: "pct", ok: 60, good: 80, b: "Richtwert: ab 60 % solide, über 80 % stark",
    e: "Wie viele, die die erste Slide gesehen haben, bis zur letzten durchgehalten haben. Je mehr Slides, desto mehr Abbruch ist normal.",
    tips: ["Story pro Thema auf 3–5 Slides begrenzen.", "Auf der ersten Slide sagen, was kommt („3 Tipps für …“).", "Interaktive Sticker (Umfrage, Quiz) in der Mitte einbauen, um Aufmerksamkeit zu halten."] },
  { id: "s_drop", t: "story", n: "Ø Verlust pro Slide", short: "Verlust/Slide",
    req: d => d.first > 0 && d.last > 0 && d.slides > 1, v: d => (1 - Math.pow(d.last / d.first, 1 / (d.slides - 1))) * 100,
    c: d => `(1 − (${fmtNum(d.last)} ÷ ${fmtNum(d.first)})^(1 ÷ ${fmtNum(d.slides - 1)})) × 100`,
    unit: "pct", ok: 10, good: 5, inv: true, b: "Richtwert: unter 5 % stark, bis 10 % solide",
    e: "Macht Stories unterschiedlicher Länge vergleichbar: Wie viel Prozent gehen im Schnitt von Slide zu Slide verloren? Berechnet als durchschnittliche Abnahme pro Übergang (geometrisches Mittel).",
    tips: ["Jede Slide braucht einen Grund zum Weitertippen – kein Füllmaterial.", "Lange Videos aufteilen oder kürzen.", "Abwechseln: Text, Video, Sticker, Gesicht."] },
  { id: "s_exit", t: "story", n: "Exit-Rate", short: "Exit-Rate",
    req: d => has(d, "exit") && d.first > 0, v: d => d.exit / d.first * 100,
    c: d => `${fmtNum(d.exit)} ÷ ${fmtNum(d.first)} × 100`,
    unit: "pct", ok: 15, good: 8, inv: true, b: "Richtwert: unter 8 % stark, bis 15 % solide",
    e: "Anteil derer, die die Stories ganz verlassen haben. Ein deutliches Desinteresse-Signal – negativer als Weitertippen.",
    tips: ["Werbliche Slides nicht an den Anfang stellen.", "Erste Slide mit Gesicht oder starker Aussage beginnen.", "Prüfen, an welcher Slide die meisten aussteigen, und diese Art Inhalt reduzieren."] },
  { id: "s_fwd", t: "story", n: "Weiter-Tipp-Rate", short: "Weiter-Tipps",
    req: d => has(d, "fwd") && d.first > 0, v: d => d.fwd / d.first * 100,
    c: d => `${fmtNum(d.fwd)} ÷ ${fmtNum(d.first)} × 100`,
    unit: "pct", inv: true, b: "Allein schwer zu bewerten – im Verlauf vergleichen",
    e: "Vorwärts tippen kann „langweilig“ oder einfach „schon gelesen“ bedeuten. Darum nur im Vergleich zwischen eigenen Stories nutzen." },
  { id: "s_reply", t: "story", n: "Antwort-Rate", short: "Antwort-Rate",
    req: d => has(d, "replies") && d.first > 0, v: d => d.replies / d.first * 100,
    c: d => `${fmtNum(d.replies)} ÷ ${fmtNum(d.first)} × 100`,
    unit: "pct", ok: 0.5, good: 2, b: "Richtwert: ab 0,5 % solide, über 2 % stark",
    e: "Direktnachrichten auf eine Story zeigen echte Beziehung zur Community.",
    tips: ["Fragen-Sticker und Umfragen nutzen.", "Persönliche Einblicke statt nur Ankündigungen.", "Antworten in der nächsten Story aufgreifen – das motiviert zum Mitmachen."] },
  { id: "s_link", t: "story", n: "Link-Klickrate", short: "Link-Klicks",
    req: d => has(d, "linkclicks") && d.linkclicks > 0 && d.first > 0, v: d => d.linkclicks / d.first * 100,
    c: d => `${fmtNum(d.linkclicks)} ÷ ${fmtNum(d.first)} × 100`,
    unit: "pct", ok: 1, good: 3, b: "Richtwert: ab 1 % solide, über 3 % stark",
    e: "Wie gut eine Story Besucher auf Website, Shop oder Blog lenkt – die zentrale Kennzahl für Verkäufe und Leads.",
    tips: ["Konkreten Nutzen nennen statt nur „Link“.", "Link-Sticker groß und gut sichtbar platzieren, nicht am Rand.", "Vor dem Link 1–2 Slides Kontext geben, warum sich der Klick lohnt."] },

  // ---------- Profil ----------
  { id: "p_net", t: "profil", n: "Netto-Follower-Wachstum", short: "Netto-Wachstum",
    req: d => has(d, "gained") && has(d, "lost"), v: d => d.gained - d.lost,
    c: d => `${fmtNum(d.gained)} − ${fmtNum(d.lost)}`,
    unit: "signed", ok: 0, good: 1, b: "Positiv = Account wächst",
    e: "Neue Follower minus Entfolgungen. Nur die Netto-Zahl zeigt die echte Entwicklung.",
    tips: ["Formate mit hohem Nicht-Follower-Anteil häufiger einsetzen.", "Profil auf Follow-Gründe prüfen (Bio, Highlights).", "Kooperationen oder Collab-Posts mit passenden Accounts."] },
  { id: "p_growth", t: "profil", n: "Wachstumsrate", short: "Wachstumsrate",
    req: d => has(d, "gained") && has(d, "lost") && d.followers - (d.gained - d.lost) > 0,
    v: d => (d.gained - d.lost) / (d.followers - (d.gained - d.lost)) * 100,
    c: d => `${fmtNum(d.gained - d.lost)} ÷ (${fmtNum(d.followers)} − ${fmtNum(d.gained - d.lost)}) × 100`,
    unit: "pct", ok: 1, good: 3, b: "Richtwert pro Monat: 1–3 % solide, darüber stark",
    e: "Netto-Wachstum im Verhältnis zur Followerzahl zu Beginn des Zeitraums. Macht Wachstum zwischen kleinen und großen Accounts vergleichbar.",
    tips: ["Reels mit hoher Share-Rate gezielt wiederholen (gleiches Format, neues Thema).", "Regelmäßigkeit: lieber 3 Inhalte pro Woche dauerhaft als 10 in einer Woche.", "Collab-Posts nutzen – sie erscheinen bei beiden Accounts."] },
  { id: "p_churn", t: "profil", n: "Churn-Rate (Abwanderung)", short: "Churn",
    req: d => has(d, "lost") && d.followers - ((d.gained || 0) - d.lost) > 0,
    v: d => d.lost / (d.followers - ((d.gained || 0) - d.lost)) * 100,
    c: d => `${fmtNum(d.lost)} ÷ ${fmtNum(d.followers - ((d.gained || 0) - d.lost))} × 100`,
    unit: "pct", ok: 3, good: 1.5, inv: true, b: "Richtwert pro Monat: unter 1,5 % stark, bis 3 % solide",
    e: "Wie viele bestehende Follower verloren gingen. Steigt die Quote, passen Inhalte oft nicht mehr zu dem, wofür man gefolgt ist – oder es wird zu werblich.",
    tips: ["Themen-Fokus prüfen: Weicht der Inhalt von dem ab, wofür Leute gefolgt sind?", "Werbeanteil reduzieren (Faustregel: max. jeder 5. Inhalt werblich).", "Nicht zu viele Inhalte in kurzer Zeit – das wirkt wie Spam."] },
  { id: "p_visit", t: "profil", n: "Profilaufruf-Rate", short: "Profilaufrufe",
    req: d => has(d, "profilevisits") && d.reach > 0, v: d => d.profilevisits / d.reach * 100,
    c: d => `${fmtNum(d.profilevisits)} ÷ ${fmtNum(d.reach)} × 100`,
    unit: "pct", ok: 2, good: 5, b: "Richtwert: 2–5 % solide, darüber stark",
    e: "Wie viele erreichte Konten das Profil besucht haben. Erste Stufe des Funnels: Inhalt gesehen → Profil besucht → gefolgt oder Link geklickt.",
    tips: ["Neugier auf mehr wecken: Serien und Teile („Teil 2 im Profil“).", "Persönlichkeit zeigen – Menschen schauen sich Menschen an.", "Im Inhalt auf das Profil verweisen („Mehr dazu im Profil“)."] },
  { id: "p_conv", t: "profil", n: "Follow-Conversion", short: "Follow-Conversion",
    req: d => has(d, "gained") && d.profilevisits > 0, v: d => d.gained / d.profilevisits * 100,
    c: d => `${fmtNum(d.gained)} ÷ ${fmtNum(d.profilevisits)} × 100`,
    unit: "pct", ok: 8, good: 15, b: "Richtwert: 8–15 % solide, darüber stark",
    e: "Wie viele Profilbesucher am Ende folgen. Misst, wie überzeugend das Profil selbst ist: Bio, Profilbild, Highlights und die obersten Beiträge.",
    tips: ["Bio in einem Satz: Für wen? Welcher Nutzen? (z. B. „Ernährungstipps für Berufstätige“).", "Beste Beiträge oben anpinnen.", "Highlights als „Startseite“ nutzen: Über mich, Angebote, FAQ."] },
  { id: "p_link", t: "profil", n: "Link-Klickrate (Bio)", short: "Bio-Link-Klicks",
    req: d => has(d, "linktaps") && d.profilevisits > 0, v: d => d.linktaps / d.profilevisits * 100,
    c: d => `${fmtNum(d.linktaps)} ÷ ${fmtNum(d.profilevisits)} × 100`,
    unit: "pct", ok: 3, good: 8, b: "Richtwert: 3–8 % solide, darüber stark",
    e: "Wie viele Profilbesucher auf den Link in der Bio tippen. Entscheidend für Accounts, die verkaufen oder Leads sammeln.",
    tips: ["Konkreten Grund in die Bio: „Kostenlose Checkliste ↓“.", "In Beiträgen und Stories auf den Link hinweisen.", "Link-Ziel mobil optimieren – langsame Seiten kosten Klicks."] },
  { id: "p_reachpost", t: "profil", n: "Reichweite pro Inhalt", short: "Reichweite/Inhalt",
    req: d => d.reach > 0 && d.posts > 0, v: d => d.reach / d.posts,
    c: d => `${fmtNum(d.reach)} ÷ ${fmtNum(d.posts)}`,
    unit: "acc", b: "Im Monatsvergleich beobachten",
    e: "Grober Effizienz-Wert: Wie viel Reichweite bringt jeder Inhalt im Schnitt? Hilft bei der Frage, ob mehr Posts wirklich mehr bringen. Näherungswert, da Konten im Zeitraum nur einmal zählen." },
];

// ---------- Konto (aus Dashboard-Screenshots) ----------
const KONTO_FIELDS = [
  ["followers", "Follower"], ["net", "Netto-Follower"], ["newF", "Neue Follower"], ["lost", "Verlorene Follower"],
  ["views", "Aufrufe"], ["reached", "Betrachter"], ["viewsF", "Aufrufe durch Follower"], ["viewsNF", "Aufrufe von Nicht-Followern"],
  ["vPosts", "Aufrufe Beiträge"], ["vStories", "Aufrufe Stories"], ["vReels", "Aufrufe Reels"],
  ["iPosts", "Interaktionen Beiträge"], ["iStories", "Interaktionen Stories"], ["iReels", "Interaktionen Reels"],
  ["profileVisits", "Profilaufrufe"], ["linkTaps", "Taps auf Bio-Link"], ["female", "Frauen (%)"], ["male", "Männer (%)"],
  ["posts", "Beiträge gesamt"], ["following", "Gefolgt"], ["days", "Zeitraum (Tage)"],
];
const perMonth = d => 30 / (d.days || 90);
const startF = d => d.followers - (d.net ?? ((d.newF || 0) - (d.lost || 0)));
KPIS.push(
  { id: "k_nonf", t: "konto", n: "Aufrufe von Nicht-Followern", short: "Nicht-Follower-Anteil",
    req: d => has(d, "viewsNF") && (has(d, "viewsF") || d.views > 0), v: d => d.viewsNF / (has(d, "viewsF") ? d.viewsF + d.viewsNF : d.views) * 100,
    c: d => `${fmtNum(d.viewsNF)} ÷ ${has(d, "viewsF") ? `(${fmtNum(d.viewsF)} + ${fmtNum(d.viewsNF)})` : fmtNum(d.views)} × 100`,
    unit: "pct", ok: 25, good: 40, b: "Richtwert: 25–40 % solide, darüber stark",
    e: "Welcher Anteil aller Aufrufe von Menschen kommt, die noch nicht folgen. Das ist der Treibstoff für Wachstum: Ohne Nicht-Follower keine neuen Follower.",
    tips: ["Mehr Reels – sie werden am stärksten an Nicht-Follower ausgespielt.", "Collab-Posts mit Fotografen oder anderen Creators: erscheinen bei beiden Accounts.", "Teilbare Inhalte bauen (Share-Rate steigern)."] },
  { id: "k_reels", t: "konto", n: "Reels-Anteil an Aufrufen", short: "Reels-Anteil",
    req: d => has(d, "vReels") && has(d, "vPosts"), v: d => d.vReels / (d.vPosts + (d.vStories || 0) + d.vReels) * 100,
    c: d => `${fmtNum(d.vReels)} ÷ (${fmtNum(d.vPosts)} + ${fmtNum(d.vStories || 0)} + ${fmtNum(d.vReels)}) × 100`,
    unit: "pct", ok: 10, good: 25, b: "Richtwert: ab 10 % solide, über 25 % stark",
    e: "Wie groß der Anteil der Reels an allen Aufrufen ist. Ein sehr kleiner Anteil heißt meist: Das wichtigste Reichweiten-Format wird kaum genutzt.",
    tips: ["1–2 Reels pro Woche fest einplanen, z. B. Behind-the-Scenes vom Shooting.", "Vorhandenes Material nutzen: Fotostrecken als kurze Slideshow-Reels mit Musik.", "Erste Sekunde mit dem stärksten Bild oder Moment starten."] },
  { id: "k_visit", t: "konto", n: "Profilaufruf-Rate", short: "Profilaufrufe",
    req: d => has(d, "profileVisits") && d.reached > 0, v: d => d.profileVisits / d.reached * 100,
    c: d => `${fmtNum(d.profileVisits)} ÷ ${fmtNum(d.reached)} × 100`,
    unit: "pct", b: "Profilaufrufe zählen Besuche, nicht Personen – im Zeitverlauf vergleichen",
    e: "Profilaufrufe im Verhältnis zu den erreichten Konten. Da Instagram jeden Besuch zählt, sind Werte nahe oder über 100 % möglich: Viele schauen wiederholt vorbei. Aussagekräftig ist die Entwicklung über mehrere Bestandsaufnahmen.",
    tips: ["Serien und Fortsetzungen schaffen einen Grund, ins Profil zu schauen.", "Im Inhalt aufs Profil verweisen.", "Persönlichkeit zeigen."] },
  { id: "k_conv", t: "konto", n: "Follow-Conversion", short: "Follow-Conversion",
    req: d => has(d, "newF") && d.profileVisits > 0, v: d => d.newF / d.profileVisits * 100,
    c: d => `${fmtNum(d.newF)} ÷ ${fmtNum(d.profileVisits)} × 100`,
    unit: "pct", ok: 8, good: 15, b: "Richtwert: 8–15 % solide, darüber stark",
    e: "Wie viele Profilaufrufe zu einem neuen Follower werden. Misst, wie gut das Profil überzeugt: Bio, Highlights, angepinnte Beiträge.",
    tips: ["Bio mit klarem Nutzen: Was bekommt man, wenn man folgt?", "Die drei angepinnten Beiträge als „Schaufenster“ wählen: beste und typischste Inhalte.", "Highlights anlegen (z. B. Shootings, Über mich, Kooperationen)."] },
  { id: "k_link", t: "konto", n: "Bio-Link-Klickrate", short: "Bio-Link",
    req: d => has(d, "linkTaps") && d.profileVisits > 0, v: d => d.linkTaps / d.profileVisits * 100,
    c: d => `${fmtNum(d.linkTaps)} ÷ ${fmtNum(d.profileVisits)} × 100`,
    unit: "pct", ok: 3, good: 8, b: "Richtwert: 3–8 % solide, darüber stark",
    e: "Wie viele Profilbesucher den Link in der Bio antippen. Wichtig, sobald der Kanal auf ein Ziel lenken soll: Shop, Media-Kit, Kontakt, Terminbuchung.",
    tips: ["Link auf ein eigenes Ziel setzen (Linkseite mit Kontakt, Media-Kit, Angeboten).", "In der Bio sagen, was hinter dem Link wartet.", "In Stories gelegentlich auf den Link hinweisen."] },
  { id: "k_growth", t: "konto", n: "Wachstumsrate pro Monat", short: "Wachstum/Monat",
    req: d => has(d, "followers") && (has(d, "net") || has(d, "newF")) && startF(d) > 0, v: d => (d.net ?? (d.newF - (d.lost || 0))) / startF(d) * 100 * perMonth(d),
    c: d => `${fmtNum(d.net ?? (d.newF - (d.lost || 0)))} ÷ ${fmtNum(startF(d))} × 100 × 30 ÷ ${d.days || 90} Tage`,
    unit: "pct", ok: 1, good: 3, b: "Richtwert: 1–3 % pro Monat solide, darüber stark",
    e: "Netto-Wachstum im Verhältnis zur Followerzahl am Anfang des Zeitraums, umgerechnet auf einen Monat.",
    tips: ["Formate mit hoher Follow-Rate häufiger nutzen.", "Regelmäßig posten statt in Schüben.", "Kooperationen mit Accounts, deren Publikum passt."] },
  { id: "k_churn", t: "konto", n: "Abwanderung pro Monat", short: "Churn/Monat",
    req: d => has(d, "lost") && has(d, "followers") && startF(d) > 0, v: d => d.lost / startF(d) * 100 * perMonth(d),
    c: d => `${fmtNum(d.lost)} ÷ ${fmtNum(startF(d))} × 100 × 30 ÷ ${d.days || 90} Tage`,
    unit: "pct", ok: 3, good: 1.5, inv: true, b: "Richtwert: unter 1,5 % stark, bis 3 % solide",
    e: "Wie viele Follower pro Monat wieder gehen. Steigt der Wert, passen Inhalte nicht mehr zu dem, wofür man gefolgt ist.",
    tips: ["Thema und Stil beständig halten.", "Werbliche Inhalte dosieren.", "Prüfen, nach welchen Beiträgen Entfolgungen steigen."] },
  { id: "k_ratio", t: "konto", n: "Gefolgt im Verhältnis zu Followern", short: "Gefolgt/Follower",
    req: d => has(d, "following") && d.followers > 0, v: d => d.following / d.followers * 100,
    c: d => `${fmtNum(d.following)} ÷ ${fmtNum(d.followers)} × 100`,
    unit: "pct", ok: 25, good: 10, inv: true, b: "Richtwert: unter 10 % stark, bis 25 % solide",
    e: "Marken und Agenturen schauen auch darauf, wie vielen Accounts ein Profil selbst folgt. Ein niedriger Wert wirkt professioneller und weniger nach „Follow for Follow“.",
    tips: ["Inaktiven oder themenfremden Accounts nach und nach entfolgen.", "Gezielt Accounts folgen, die zur eigenen Nische passen.", "Keine Follow-for-Follow-Aktionen."] },
  { id: "k_freq", t: "konto", n: "Aufrufe pro Betrachter", short: "Aufrufe/Betrachter",
    req: d => d.views > 0 && d.reached > 0, v: d => d.views / d.reached, c: d => `${fmtNum(d.views)} ÷ ${fmtNum(d.reached)}`,
    unit: "x", b: "Hoch = treue Stammzuschauer, niedrig = viel Laufkundschaft",
    e: "Wie oft jedes erreichte Konto im Zeitraum Inhalte gesehen hat. Ein hoher Wert zeigt eine treue Kern-Community, aber wenig neue Gesichter." },
  { id: "k_ipost", t: "konto", n: "Interaktionen je 100 Aufrufe: Beiträge", short: "Interaktion Beiträge",
    req: d => d.vPosts > 0 && has(d, "iPosts"), v: d => d.iPosts / d.vPosts * 100, c: d => `${fmtNum(d.iPosts)} ÷ ${fmtNum(d.vPosts)} × 100`,
    unit: "pct", b: "Vergleich der Formate untereinander",
    e: "Wie viele Interaktionen auf 100 Aufrufe kommen – für den Vergleich, welches Format die Community am meisten aktiviert." },
  { id: "k_istory", t: "konto", n: "Interaktionen je 100 Aufrufe: Stories", short: "Interaktion Stories",
    req: d => d.vStories > 0 && has(d, "iStories"), v: d => d.iStories / d.vStories * 100, c: d => `${fmtNum(d.iStories)} ÷ ${fmtNum(d.vStories)} × 100`,
    unit: "pct", b: "Vergleich der Formate untereinander", e: "Interaktionen auf 100 Story-Aufrufe (Antworten, Sticker, Likes)." },
  { id: "k_ireel", t: "konto", n: "Interaktionen je 100 Aufrufe: Reels", short: "Interaktion Reels",
    req: d => d.vReels > 0 && has(d, "iReels"), v: d => d.iReels / d.vReels * 100, c: d => `${fmtNum(d.iReels)} ÷ ${fmtNum(d.vReels)} × 100`,
    unit: "pct", b: "Vergleich der Formate untereinander", e: "Interaktionen auf 100 Reel-Aufrufe." },
  { id: "k_female", t: "konto", n: "Frauenanteil der Follower", short: "Frauenanteil",
    req: d => has(d, "female"), v: d => d.female, c: d => `laut Zielgruppe: ${fmtNum(d.female)} %`,
    unit: "pct", b: "Kein „gut“ oder „schlecht“ – entscheidend ist, ob es zur Zielgruppe passt",
    e: "Geschlechterverteilung der Follower. Für Kooperationen zählt, ob das Publikum zur Zielgruppe der Marke passt. Als Ziel nutzbar, wenn die Zielgruppe verschoben werden soll." },
);

// ---------- Insights-Export (Summe über den Zeitraum) ----------
const exInter = d => (d.likes || 0) + (d.comments || 0) + (d.reposts || 0) + (d.shares || 0) + (d.saves || 0);
KPIS.push(
  { id: "x_reels", t: "export", n: "Reels pro Monat", short: "Reels/Monat",
    req: d => has(d, "reels"), v: d => d.reels * 30 / (d.days || 30), c: d => `${fmtNum(d.reels)} Reels × 30 ÷ ${d.days || 30} Tage`,
    unit: "n", ok: 2, good: 4, b: "Richtwert: ab 2 pro Monat solide, ab 4 stark",
    e: "Wie viele Reels im Zeitraum veröffentlicht wurden, umgerechnet auf einen Monat. Ohne Reels fehlt das Format, mit dem Instagram neue Zuschauer erreicht.",
    tips: ["Mit einem festen Reel pro Woche starten – Regelmäßigkeit schlägt Perfektion.", "Behind-the-Scenes vom Shooting filmen: Vorher/Nachher, Outfit, Location.", "Fotostrecken als 5–7-Sekunden-Slideshow mit Trend-Audio umsetzen."] },
  { id: "x_ipf", t: "export", n: "Interaktionen pro Follower und Monat", short: "Interaktion/Follower",
    req: d => d.followers > 0 && d.likes != null, v: d => exInter(d) / d.followers * 100 * 30 / (d.days || 30),
    c: d => `${fmtNum(exInter(d))} ÷ ${fmtNum(d.followers)} × 100 × 30 ÷ ${d.days || 30} Tage`,
    unit: "pct", ok: 20, good: 50, b: "Richtwert: ab 20 % solide, über 50 % stark",
    e: "Summe aller Interaktionen (Likes, Kommentare, Reposts, Teilen, Speichern) im Verhältnis zur Followerzahl, pro Monat. Zeigt, wie aktiv die Community insgesamt ist – unabhängig vom einzelnen Beitrag.",
    tips: ["Häufiger posten, solange die Qualität stimmt.", "Kommentare beantworten und Fragen stellen.", "Stories mit Umfragen und Fragen-Stickern nutzen."] },
  { id: "x_share", t: "export", n: "Anteil Teilen an Interaktionen", short: "Teilen-Anteil",
    req: d => has(d, "shares") && exInter(d) > 0, v: d => d.shares / exInter(d) * 100, c: d => `${fmtNum(d.shares)} ÷ ${fmtNum(exInter(d))} × 100`,
    unit: "pct", ok: 3, good: 6, b: "Richtwert: ab 3 % solide, über 6 % stark",
    e: "Welcher Teil aller Interaktionen aufs Teilen entfällt. Teilen ist die wertvollste Interaktion für Reichweite, weil Inhalte so zu neuen Menschen kommen.",
    tips: ["Inhalte bauen, die man jemandem schicken will.", "Aufforderung „Schick das an …“ testen.", "Kurze, klare Botschaften."] },
  { id: "x_save", t: "export", n: "Anteil Speichern an Interaktionen", short: "Speichern-Anteil",
    req: d => has(d, "saves") && exInter(d) > 0, v: d => d.saves / exInter(d) * 100, c: d => `${fmtNum(d.saves)} ÷ ${fmtNum(exInter(d))} × 100`,
    unit: "pct", ok: 2, good: 5, b: "Richtwert: ab 2 % solide, über 5 % stark",
    e: "Welcher Teil der Interaktionen aufs Speichern entfällt. Gespeichert wird, was später nützlich ist – Inspiration, Anleitungen, Ideen.",
    tips: ["Inspirations-Karussells: Posing-Ideen, Outfit-Kombinationen, Locations.", "Mehrwert in die Caption (Tipps, Hintergründe).", "Auf der letzten Slide zum Speichern auffordern."] },
  { id: "x_comment", t: "export", n: "Anteil Kommentare an Interaktionen", short: "Kommentar-Anteil",
    req: d => has(d, "comments") && exInter(d) > 0, v: d => d.comments / exInter(d) * 100, c: d => `${fmtNum(d.comments)} ÷ ${fmtNum(exInter(d))} × 100`,
    unit: "pct", ok: 2, good: 5, b: "Richtwert: ab 2 % solide, über 5 % stark",
    e: "Welcher Teil der Interaktionen Kommentare sind. Kommentare zeigen Gespräch statt nur schnellem Daumen hoch.",
    tips: ["Konkrete Fragen in die Caption.", "Auf jeden Kommentar antworten, gern mit Gegenfrage.", "Meinungs-Posts („Welches Outfit: 1 oder 2?“)."] },
  { id: "x_ipb", t: "export", n: "Interaktionen pro Betrachter", short: "Interaktion/Betrachter",
    req: d => d.reached > 0 && d.likes != null, v: d => exInter(d) / d.reached, c: d => `${fmtNum(exInter(d))} ÷ ${fmtNum(d.reached)}`,
    unit: "x", b: "Über 1 = viele Betrachter interagieren mehrfach",
    e: "Wie viele Interaktionen auf jedes erreichte Konto im Zeitraum kommen. Werte über 1 zeigen eine sehr aktive Stamm-Community." },
);

const KPI_BY_ID = Object.fromEntries(KPIS.map(k => [k.id, k]));
const kpisOf = t => KPIS.filter(k => k.t === t);

function evalKpi(k, d) {
  if (!d || !k.req(d)) return null;
  const v = k.v(d);
  return isFinite(v) ? v : null;
}
function rateKpi(k, v) {
  if (v == null || k.ok === undefined) return "";
  if (k.inv) return v <= k.good ? "good" : v <= k.ok ? "ok" : "bad";
  return v >= k.good ? "good" : v >= k.ok ? "ok" : "bad";
}
function fmtKpi(k, v) {
  if (v == null) return "–";
  switch (k.unit) {
    case "pct": return fmtNum(v) + " %";
    case "x": return fmtNum(v) + " ×";
    case "acc": return fmtNum(Math.round(v), 0) + " Konten";
    case "signed": return (v > 0 ? "+" : "") + fmtNum(v, 0);
    default: return fmtNum(v);
  }
}
/* Differenz: Prozentpunkte bei Raten, sonst relative Veränderung */
function fmtDelta(k, a, b) {
  if (a == null || b == null) return "";
  const diff = b - a;
  if (Math.abs(diff) < 1e-9) return "±0";
  const sign = diff > 0 ? "+" : "−";
  if (k.unit === "pct") return `${sign}${fmtNum(Math.abs(diff))} PP`;
  if (a === 0) return `${sign}${fmtNum(Math.abs(diff))}`;
  return `${sign}${fmtNum(Math.abs(diff / Math.abs(a) * 100), 1)} %`;
}
const RATE_LABEL = { good: "stark", ok: "solide", bad: "ausbaufähig" };
