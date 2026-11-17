# Insta-KPI-Trainer

Lern-App für angehende Social Media Manager: Zahlen aus Instagram Insights eintragen oder per Screenshot einlesen, Kennzahlen mit Rechenweg verstehen, Verlauf vergleichen, Ziele setzen und Reports erstellen.

**Live:** https://insta-kpi.micana.de

## Funktionen
Vier Bereiche, Daten holen immer über ＋ oben rechts:

- **Heute:** Score, drei Kernzahlen (inkl. 30-Tage-Trend), Aufgaben aus Redaktionsplan, Experimenten und Baustellen, Hinweis auf gut laufende Beiträge, nächster Anlass
- **Analyse:** Überblick (Befunde, Stärken, Baustellen, Kanalvergleich) · Inhalte (Kategorien je Rolle, Partner-Ranking, Posting-Rhythmus, Vergleich zum eigenen Schnitt) · Zielgruppe (Follower vs. Interagierende, Alter, Städte, beste Posting-Zeiten) · Wachstum (Follower, Prognose, Reichweite)
- **Planen:** Redaktionsplan mit Wochenziel je Rolle, Anlässe-Kalender (Feiertage nach Bundesland, Branchenanlässe, eigene Termine), Experimente mit Ausgangswert und Auswertung
- **Berichte:** Ziele, PDF-Report, je Rolle Media-Kit und Kooperations-Rechner (Creator), Werbewert (Unternehmen) oder Reichweite in der Bevölkerung (Verwaltung)
- **Daten holen:** Instagram-API (Abruf beim Öffnen alle 6 Std.), Screenshots (Schnell-Check oder vollständig), Handeingabe mit Rechenweg und Erklärungen
- **Rollen:** Creator/Model, Unternehmen (7 Branchen), Öffentliche Verwaltung – mit eigenen Kategorien, Wochenzielen, Tipps, Experiment-Vorlagen, Anlässen und Berichts-Bausteinen
- **Mehrere Kanäle**, Sicherung/Import per Kopieren und Einfügen

## Technik
- Reines HTML, CSS und JavaScript ohne Build-Schritt, gehostet über GitHub Pages
- Installierbar als PWA (Teilen → Zum Home-Bildschirm), offline nutzbar, ohne Zoom
- Daten bleiben im Browser (localStorage); Screenshots werden nur lokal verarbeitet. Ein API-Schlüssel wird nur lokal gespeichert, nicht in Sicherungen übernommen und nur an graph.instagram.com gesendet
- Die Texterkennung lädt beim ersten Einsatz einmalig Tesseract.js und Sprachdaten von jsDelivr

## Dateien
| Datei | Inhalt |
|---|---|
| `index.html` | App-Gerüst |
| `style.css` | Gestaltung (hell/dunkel) |
| `kpis.js` | Felder, Kennzahlen, Richtwerte, Empfehlungen |
| `ocr.js` | Texterkennung, Vorverarbeitung, Parser für einzelne Insights |
| `bestand.js` | Parser für Dashboard-, Zielgruppen-, Profil-, Inhalte- und Export-Screenshots (positionsbasiert) |
| `api.js` | Abruf über graph.instagram.com, Token-Verlängerung |
| `report.js` | Gestalteter A4-Report und PDF-Erzeugung |
| `roles.js` | Rollen, Branchen, Vorlagen, Anlässe-Kalender |
| `insights.js` | Kategorien, Partner, Rhythmus, Trend, Prognose |
| `views.js` | Heute, Analyse, Planen, Berichte, Media-Kit, Daten holen |
| `app.js` | Ansichten, Kanäle, Verlauf, Ziele, Report, Deals, Bestandsaufnahme |
| `sw.js` | Offline-Cache |

Richtwerte und Preis-Faustregeln sind grobe Orientierungen und ersetzen keine Marktanalyse.
