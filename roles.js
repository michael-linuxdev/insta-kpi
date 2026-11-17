/* Rollen: Vorlagen für Creator, Unternehmen (nach Branche) und öffentliche Verwaltung */
"use strict";

const ROLES = {
  creator: {
    label: "Creator / Model / Influencer", short: "Creator",
    desc: "Eigene Marke, Shootings, Kooperationen mit Marken und Läden",
    weekly: [["reel", 1, "Reel"], ["karussell", 1, "Karussell"], ["story", 3, "Story-Tage"]],
    partner: "Fotografen & Partner",
    categories: [
      ["werbung", "Werbung & Kooperation", /\b(werbung|anzeige|sponsored|ad|rabattcode|code|in kooperation|unbezahlte werbung)\b/i],
      ["shooting", "Shooting mit Fotograf", /@[\w.]+|📸|\bfoto|shooting|photo|fotograf/i],
      ["persoenlich", "Persönlich & Familie", /familie|baby|hochzeit|wedding|liebe|\blove\b|für immer|schwanger|mama|papa|kind|geburtstag|urlaub|three|wir\b/i],
    ],
    other: "Alltag & Sonstiges",
    berichte: ["ziele", "report", "mediakit", "deals"],
    tips: {
      k_reels: ["1–2 Reels pro Woche fest einplanen, z. B. Behind-the-Scenes vom Shooting.", "Fotostrecken als 5–7-Sekunden-Slideshow mit Musik umsetzen.", "Erste Sekunde mit dem stärksten Bild starten."],
      x_reels: ["Mit einem festen Reel pro Woche starten – Regelmäßigkeit schlägt Perfektion.", "Behind-the-Scenes vom Shooting filmen: Vorher/Nachher, Outfit, Location.", "Fotostrecken als Slideshow mit Trend-Audio umsetzen."],
      k_conv: ["Bio mit klarem Nutzen: Wofür steht der Kanal, was gibt es regelmäßig?", "Die drei angepinnten Beiträge als Schaufenster: beste und typischste Bilder.", "Highlights anlegen: Shootings, Über mich, Kooperationen."],
    },
    experiments: [
      { name: "Reels mit Text-Einstieg", hyp: "Ein Text in der ersten Sekunde bringt mehr Nicht-Follower.", kpi: "k_nonf", action: "Jede Woche 1 Reel mit Text-Hook in der ersten Sekunde" },
      { name: "Collab-Posts mit Fotografen", hyp: "Gemeinsame Beiträge (Collab) bringen mehr neue Follower als Markierungen.", kpi: "k_growth", action: "Shooting-Beiträge als Collab mit dem Fotografen veröffentlichen" },
      { name: "Inhalte für Frauen", hyp: "Outfit-, Styling- und Alltagsinhalte erhöhen den Frauenanteil.", kpi: "k_female", action: "2 Beiträge pro Woche mit Styling-Tipps oder Outfit-Details" },
    ],
  },
  business: {
    label: "Unternehmen", short: "Unternehmen",
    desc: "Laden, Gastronomie, Handwerk, Praxis, Dienstleister …",
    weekly: [["beitrag", 2, "Beiträge"], ["reel", 1, "Reel"], ["story", 3, "Story-Tage"]],
    partner: "Partner & Erwähnungen",
    categories: [
      ["recruiting", "Stellen & Ausbildung", /\b(job|jobs|stelle|stellen|wir suchen|bewirb|bewerbung|ausbildung|azubi|karriere|verstärkung)\b/i],
      ["angebot", "Produkt & Angebot", /angebot|aktion|rabatt|%|sale|\bneu\b|jetzt erhältlich|bestell|preis|gutschein|sortiment|menü|speisekarte|leistung/i],
      ["team", "Team & Einblicke", /team|mitarbeiter|kolleg|hinter den kulissen|behind|werkstatt|küche|einblick/i],
      ["kunden", "Kundenstimmen & Projekte", /kunde|kundin|bewertung|feedback|danke an|referenz|projekt|vorher|nachher/i],
      ["wissen", "Tipps & Wissen", /tipp|wusstest|so geht|anleitung|faq|frage|erklär|ratgeber/i],
      ["event", "Termine & Events", /event|veranstaltung|einladung|termin|messe|tag der offenen|eröffnung|feier/i],
    ],
    other: "Sonstiges",
    berichte: ["ziele", "report", "werbewert"],
    tips: {
      k_reels: ["Produkte oder Leistungen in Aktion zeigen – kurz und ohne Intro.", "Team-Einblicke: Wer steckt dahinter, wie entsteht etwas?", "Häufige Kundenfragen als 15-Sekunden-Antwort."],
      x_reels: ["Ein festes Reel-Format pro Woche, z. B. „Frage der Woche“.", "Vorher-Nachher oder Entstehung eines Produkts zeigen.", "Mit dem Ergebnis starten, dann den Weg dorthin zeigen."],
      k_conv: ["Bio: Was bietet ihr, für wen, wo? Plus Öffnungszeiten oder Kontakt.", "Angepinnte Beiträge: Angebot, Team, Kundenstimme.", "Highlights: Angebote, Team, Anfahrt, Jobs."],
    },
    experiments: [
      { name: "Team-Einblicke", hyp: "Beiträge mit Menschen aus dem Team bekommen mehr Interaktion als reine Produktbilder.", kpi: "b_er_reach", action: "1 Team-Beitrag pro Woche" },
      { name: "Kundenfrage als Reel", hyp: "Kurze Antworten auf Kundenfragen erreichen mehr Nicht-Follower.", kpi: "k_nonf", action: "1 Reel pro Woche mit einer echten Kundenfrage" },
      { name: "Story-Umfragen", hyp: "Umfragen in Stories steigern die Antworten und halten Zuschauer länger.", kpi: "s_reply", action: "3 Story-Tage pro Woche mit Umfrage-Sticker" },
    ],
  },
  public: {
    label: "Öffentliche Verwaltung / Kommune", short: "Verwaltung",
    desc: "Stadt, Gemeinde, Landkreis, Behörde, Eigenbetrieb",
    weekly: [["beitrag", 3, "Beiträge"], ["story", 2, "Story-Tage"], ["reel", 0, "Reels"]],
    partner: "Partner & Einrichtungen",
    categories: [
      ["warnung", "Warnungen & Störungen", /warnung|unwetter|achtung|sperrung|ausfall|störung|notfall|hochwasser|evakuier/i],
      ["verkehr", "Baustellen & Verkehr", /baustelle|straße|verkehr|umleitung|\bbus\b|bahn|winterdienst|parken/i],
      ["service", "Bürgerservice", /bürgerbüro|bürgeramt|antrag|öffnungszeit|online|termin|formular|ausweis|pass|wahl|steuer|abfall|müll/i],
      ["beteiligung", "Beteiligung", /umfrage|beteilig|mitmachen|meinung|bürgerversammlung|stadtrat|gemeinderat|vorschlag/i],
      ["stellen", "Stellen & Ausbildung", /stellen|ausbildung|\bjob|karriere|wir suchen|bewerb/i],
      ["events", "Veranstaltungen", /veranstaltung|\bfest\b|markt|konzert|ausstellung|einladung|feier/i],
      ["einblick", "Einblicke & Menschen", /team|mitarbeit|einblick|bürgermeister|landrat|amt|feuerwehr|kita|schule/i],
    ],
    other: "Sonstiges",
    berichte: ["ziele", "report", "einwohner"],
    tips: {
      k_reels: ["Kurze Erklär-Reels zu häufigen Bürgerfragen (Ausweis, Müll, Anträge).", "Einblicke in Ämter und Einrichtungen: Wer arbeitet hier?", "Baustellenfortschritt im Zeitraffer."],
      x_reels: ["Einmal im Monat ein Reel reicht für den Anfang, z. B. „Ein Tag im Bauhof“.", "Bürgerfrage des Monats in 20 Sekunden beantworten.", "Vorher-Nachher von Projekten zeigen."],
      k_conv: ["Bio: Wofür ist der Kanal da, und was nicht (z. B. keine Anträge per Nachricht)?", "Highlights: Bürgerservice, Termine, Warnungen, Jobs.", "Verlinkung auf Website und Online-Dienste."],
    },
    experiments: [
      { name: "Bürgerfrage der Woche", hyp: "Konkrete Antworten auf häufige Fragen werden häufiger gespeichert und geteilt.", kpi: "b_save", action: "1 Beitrag pro Woche mit einer echten Bürgerfrage" },
      { name: "Menschen statt Pressemitteilung", hyp: "Beiträge mit Gesichtern aus der Verwaltung erreichen mehr Menschen.", kpi: "b_reachq", action: "1 Beitrag pro Woche mit Mitarbeitenden statt Text-Grafik" },
      { name: "Reels für Service-Themen", hyp: "Ein Reel pro Monat bringt mehr Nicht-Follower als Text-Grafiken.", kpi: "k_nonf", action: "1 Erklär-Reel pro Monat" },
    ],
  },
};

const BRANCHEN = {
  handel: "Einzelhandel / Laden", gastro: "Gastronomie / Café", handwerk: "Handwerk", gesundheit: "Gesundheit / Pflege / Praxis",
  dienstleistung: "Dienstleistung / B2B", tourismus: "Tourismus / Freizeit", sonstige: "Sonstige Branche",
};
const LAENDER = { BW: "Baden-Württemberg", BY: "Bayern", BE: "Berlin", BB: "Brandenburg", HB: "Bremen", HH: "Hamburg", HE: "Hessen", MV: "Mecklenburg-Vorpommern", NI: "Niedersachsen", NW: "Nordrhein-Westfalen", RP: "Rheinland-Pfalz", SL: "Saarland", SN: "Sachsen", ST: "Sachsen-Anhalt", SH: "Schleswig-Holstein", TH: "Thüringen" };

const roleOf = c => ROLES[c?.role] || null;
function roleTips(k, c) { const r = roleOf(c); return (r && r.tips[k.id]) || k.tips; }

/* ---------- Anlässe-Kalender ---------- */
const Anlaesse = (() => {
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const D = (y, m, d) => new Date(y, m - 1, d);
  const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return D(y, month, day);
  }
  const nthWeekday = (y, m, wd, n) => { let d = D(y, m, 1); while (d.getDay() !== wd) d = add(d, 1); return add(d, 7 * (n - 1)); };
  const lastWeekday = (y, m, wd) => { let d = D(y, m + 1, 0); while (d.getDay() !== wd) d = add(d, -1); return d; };
  const advent4 = y => { let d = D(y, 12, 24); while (d.getDay() !== 0) d = add(d, -1); return d; };

  // [Datum, Name, Idee je Rolle (c/b/p), für Rollen, nur Bundesländer, nur Branchen]
  function list(y) {
    const e = easter(y), a1 = add(advent4(y), -21), tot = add(a1, -7);
    return [
      [D(y, 1, 1), "Neujahr", { c: "Jahresrückblick oder Vorsätze-Karussell", b: "Danke an Kundschaft, Ausblick aufs Jahr", p: "Neujahrsgruß, was ändert sich im neuen Jahr?" }],
      [D(y, 1, 6), "Heilige Drei Könige", null, "all", ["BW", "BY", "ST"]],
      [D(y, 2, 14), "Valentinstag", { c: "Paar- oder Selbstliebe-Shooting", b: "Geschenkideen, Aktion zu zweit" }, "cb", null, ["handel", "gastro", "dienstleistung", "tourismus"]],
      [D(y, 3, 8), "Weltfrauentag", { c: "Frauen hinter der Kamera vorstellen – passt zum Ziel Frauenanteil", b: "Frauen im Team vorstellen", p: "Gleichstellungsbeauftragte, Frauen in der Verwaltung" }],
      [lastWeekday(y, 3, 0), "Zeitumstellung (Sommerzeit)", { p: "Erinnerung an die Zeitumstellung" }, "p"],
      [D(y, 4, 7), "Weltgesundheitstag", { b: "Gesundheitstipp aus der Praxis" }, "b", null, ["gesundheit"]],
      [add(e, -2), "Karfreitag", { b: "Geänderte Öffnungszeiten", p: "Öffnungszeiten über Ostern, Abfallkalender" }, "bp"],
      [e, "Ostern", { c: "Frühlings-Shooting, Ostergruß", b: "Ostergruß und Öffnungszeiten", p: "Ostergruß, Veranstaltungen" }],
      [D(y, 5, 1), "Tag der Arbeit", { b: "Danke ans Team", p: "Maibaum, Veranstaltungen" }, "bp"],
      [D(y, 5, 12), "Internationaler Tag der Pflegenden", { b: "Pflegeteam vorstellen" }, "b", null, ["gesundheit"]],
      [nthWeekday(y, 5, 0, 2), "Muttertag", { c: "Mama-Moment oder Muttertags-Shooting", b: "Geschenkideen, Muttertags-Menü" }, "cb", null, ["handel", "gastro", "dienstleistung", "tourismus"]],
      [add(e, 39), "Christi Himmelfahrt / Vatertag", { b: "Öffnungszeiten, Vatertags-Aktion", p: "Öffnungszeiten" }],
      [add(e, 49), "Pfingsten", { p: "Öffnungszeiten über Pfingsten" }, "bp"],
      [add(e, 60), "Fronleichnam", null, "all", ["BW", "BY", "HE", "NW", "RP", "SL"]],
      [D(y, 6, 21), "Sommeranfang", { c: "Sommer-Shooting am Wasser", b: "Sommer-Angebot" }, "cb"],
      [D(y, 8, 1), "Ausbildungsstart", { b: "Neue Azubis vorstellen", p: "Neue Auszubildende begrüßen" }, "bp"],
      [nthWeekday(y, 9, 6, 3), "Tag des Handwerks", { b: "Werkstatt öffnen, Handwerk zeigen" }, "b", null, ["handwerk"]],
      [D(y, 9, 16), "Europäische Mobilitätswoche (bis 22.9.)", { p: "Radwege, ÖPNV, Aktionen der Stadt" }, "p"],
      [D(y, 9, 20), "Weltkindertag", { p: "Angebote für Kinder und Familien" }, "p"],
      [D(y, 9, 21), "Welt-Alzheimertag", { b: "Angebote für Angehörige" }, "b", null, ["gesundheit"]],
      [D(y, 10, 1), "Weihnachtsfeiern bewerben", { b: "Jetzt Weihnachtsfeiern und Gutscheine bewerben" }, "b", null, ["gastro"]],
      [D(y, 10, 3), "Tag der Deutschen Einheit", { c: "Herbst-Shooting", b: "Öffnungszeiten", p: "Feierstunde, Geschichte vor Ort" }],
      [lastWeekday(y, 10, 0), "Zeitumstellung (Winterzeit)", { p: "Erinnerung an die Zeitumstellung" }, "p"],
      [D(y, 10, 31), "Reformationstag", { p: "Feiertag, Öffnungszeiten" }, "all", ["BB", "HB", "HH", "MV", "NI", "SN", "ST", "SH", "TH"]],
      [D(y, 10, 31), "Halloween", { c: "Kostüm- oder Dark-Shooting", b: "Halloween-Aktion" }, "cb", null, ["handel", "gastro", "tourismus"]],
      [D(y, 11, 1), "Allerheiligen", null, "all", ["BW", "BY", "NW", "RP", "SL"]],
      [D(y, 11, 1), "Winterdienst startet", { p: "Winterdienst: Wer räumt was? Pflichten für Anwohner" }, "p"],
      [add(tot, -7), "Volkstrauertag", { p: "Gedenkveranstaltungen" }, "p"],
      [add(tot, -4), "Buß- und Bettag", { b: "Öffnungszeiten", p: "Feiertag, Öffnungszeiten" }, "all", ["SN"]],
      [add(nthWeekday(y, 11, 4, 4), 1), "Black Friday", { c: "Kooperationsangebote von Marken bündeln", b: "Black-Friday-Aktion – oder bewusst „Green Friday“" }, "cb", null, ["handel", "dienstleistung", "tourismus"]],
      [tot, "Totensonntag", null, "p"],
      [a1, "1. Advent", { c: "Winter- oder Advents-Shooting als Karussell", b: "Adventsaktion, Adventskalender", p: "Weihnachtsmarkt, Adventsprogramm" }],
      [D(y, 12, 6), "Nikolaus", { c: "Story-Gewinnspiel mit einem lokalen Laden", b: "Nikolaus-Überraschung für Kundschaft", p: "Nikolaus in Kita oder Rathaus" }],
      [add(a1, 7), "2. Advent", null, "c"],
      [add(a1, 14), "3. Advent", null, "c"],
      [add(a1, 21), "4. Advent", null, "c"],
      [D(y, 12, 24), "Heiligabend", { c: "Weihnachtsgruß", b: "Weihnachtsgruß und Öffnungszeiten", p: "Weihnachtsgruß, Notdienste" }],
      [D(y, 12, 28), "Jahresrückblick", { c: "Top-Beiträge des Jahres als Karussell", b: "Jahresrückblick mit Danke ans Team", p: "Was die Stadt dieses Jahr geschafft hat" }],
      [D(y, 12, 31), "Silvester", { c: "Glitzer-Shooting, Ausblick", b: "Öffnungszeiten, Neujahrsgruß", p: "Hinweise zu Feuerwerk und Abfall" }],
    ];
  }
  const RK = { creator: "c", business: "b", public: "p" };
  function upcoming(c, data, from = new Date(), days = 60) {
    const rk = RK[c?.role] || "c", land = c?.land || "SN", br = c?.branche || "sonstige";
    const end = add(from, days), start = add(from, -1), out = [];
    for (const y of [from.getFullYear(), from.getFullYear() + 1]) {
      for (const [d, name, ideas, roles = "all", laender = null, branchen = null] of list(y)) {
        if (d < start || d > end) continue;
        if (roles !== "all" && !roles.includes(rk)) continue;
        if (laender && !laender.includes(land)) continue;
        if (branchen && rk === "b" && !branchen.includes(br)) continue;
        out.push({ date: iso(d), name, idea: ideas?.[rk] || "", kind: laender ? "feiertag" : "anlass" });
      }
    }
    for (const ev of data.events || []) if (ev.date >= iso(start) && ev.date <= iso(end)) out.push({ ...ev, kind: "eigen" });
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }
  return { upcoming, iso };
})();
