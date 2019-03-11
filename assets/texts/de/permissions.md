# Erfragte Berechtigungen

Für eine allgemeine Erklärung von Add-on-Berechtigungen siehe [diesen Support-Artikel]https://support.mozilla.org/de/kb/berechtigungsdialoge-der-firefox-erweiterungen).

## Berechtigungen bei Installation

Zurzeit werden bei Installation des Add-ons oder beim Update keine Berechtigungen abgefragt.

## Feature-spezifische (optionale) Berechtigungen

Diese Berechtigungen werden bei bestimmten Aktionen abgefragt, wenn sie dafür benötigt werden.

| Interne ID  | Berechtigung                                                       | Abgefragt bei…                 | Erklärung     |
|:------------|:-------------------------------------------------------------------|:-------------------------------|:--------------|
| `downloads` | Dateien herunterladen und die Download-Chronik lesen und verändern | Speichern des QR-Codes als SVG | Benötigt um … |

## Versteckte Berechtigungen

Zusätzlich verlangt dieses Add-on folgende Berechtigungen, welche in Firefox aber nicht abgefragt werden, da sie keine tiefgreifenden Berechtigungen sind.

| Interne ID | Berechtigung                 | Erklärung                               |
|:-----------|:-----------------------------|:----------------------------------------|
| `storage`  | Zugriff auf lokalen Speicher | Benötigt um Einstellungen abzuspeichern |
