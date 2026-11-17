# Insta-KPI-Trainer

Lern-App für angehende Social Media Manager: Zahlen aus Instagram Insights eintragen oder per Screenshot einlesen, Kennzahlen mit Rechenweg verstehen, Verlauf vergleichen, Ziele setzen und Reports erstellen.

**Live:** https://insta-kpi.micana.de

## Funktionen
- **Bestandsaufnahme per Screenshots:** Assistent mit Anleitung (Profil, Dashboard „Leistung“, „Zielgruppe“, „Inhalte“ je Sortierung, Insights-Export). Die App erkennt jede Seite selbst, prüft auf Vollständigkeit und übersetzt die Zahlen in Befunde
- **Instagram-API (optional):** Für eigene oder verwaltete Konten per Zugangsschlüssel aus dem Meta-App-Dashboard (Instagram Login, Standard Access, keine App-Prüfung nötig). Holt Konto-Kennzahlen mit Vorzeitraum-Vergleich, Zielgruppe sowie Beiträge und Reels mit Insights. Profilaufrufe und Bio-Link-Klicks liefert die API nicht
- **Überblick:** Score je Bereich, Befunde, Konto-Kennzahlen, Content-Mix, Zielgruppe, Stärken, Baustellen, Datenlücken und Kanalvergleich
- **Erfassen:** Beitrag, Reel, Story und Profil; über 25 Kennzahlen mit Rechenweg, Richtwert, Erklärung und Handlungsempfehlungen
- **Screenshot einlesen:** Texterkennung (Tesseract.js) direkt im Browser, Deutsch und Englisch, Hell- und Dunkelmodus; Werte werden vor der Übernahme geprüft
- **Verlauf:** Vergleichstabelle mit Bestwerten, Durchschnitt und Trend sowie ein Format-Vergleich (Einzelbild, Karussell, Reel, Story)
- **Ziele:** SMART-Ziele je Kennzahl mit Fortschritt und Frist
- **Report:** Monatsbericht mit Vormonatsvergleich, Zielen und Empfehlungen zum Kopieren oder Teilen
- **Deals:** Kooperations-Rechner (TKP-Faustregel, Engagement-Faktor, Aufschläge) und Angebotsprüfung
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
| `app.js` | Ansichten, Kanäle, Verlauf, Ziele, Report, Deals, Bestandsaufnahme |
| `sw.js` | Offline-Cache |

Richtwerte und Preis-Faustregeln sind grobe Orientierungen und ersetzen keine Marktanalyse.
