# Insta-KPI-Trainer

Lern-App für angehende Social Media Manager: Zahlen aus Instagram Insights eintragen oder per Screenshot einlesen, Kennzahlen mit Rechenweg verstehen, Verlauf vergleichen, Ziele setzen und Reports erstellen.

**Live:** https://insta-kpi.micana.de

## Funktionen
- **Überblick:** Bestandsaufnahme je Kanal mit Score je Bereich, Steckbrief, Stärken, Baustellen, Datenlücken und Kanalvergleich
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
- Daten bleiben im Browser (localStorage); Screenshots werden nur lokal verarbeitet
- Die Texterkennung lädt beim ersten Einsatz einmalig Tesseract.js und Sprachdaten von jsDelivr

## Dateien
| Datei | Inhalt |
|---|---|
| `index.html` | App-Gerüst |
| `style.css` | Gestaltung (hell/dunkel) |
| `kpis.js` | Felder, Kennzahlen, Richtwerte, Empfehlungen |
| `ocr.js` | Screenshot-Import: Vorverarbeitung, Texterkennung, Parser |
| `app.js` | Ansichten, Kanäle, Verlauf, Ziele, Report, Deals, Bestandsaufnahme |
| `sw.js` | Offline-Cache |

Richtwerte und Preis-Faustregeln sind grobe Orientierungen und ersetzen keine Marktanalyse.
