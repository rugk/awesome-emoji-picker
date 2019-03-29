# Erfragte Berechtigungen

Für eine allgemeine Erklärung von Add-on-Berechtigungen siehe [diesen Support-Artikel]https://support.mozilla.org/de/kb/berechtigungsdialoge-der-firefox-erweiterungen).

## Berechtigungen bei Installation

Zurzeit werden bei Installation des Add-ons oder beim Update keine Berechtigungen abgefragt.

## Versteckte Berechtigungen

Zusätzlich verlangt dieses Add-on folgende Berechtigungen, welche in Firefox aber nicht abgefragt werden, da sie keine tiefgreifenden Berechtigungen sind.

| Interne ID  | Berechtigung                      | Erklärung                                                                     |
|:------------|:----------------------------------|:------------------------------------------------------------------------------|
| `activeTab` | Auf aktuelle Webseite zugreifen   | Benötigt, um die URL des aktuellen Tabs für den QR-Code zu erhalten           |
| `storage`   | Zugriff auf lokalen Speicher      | Benötigt um Einstellungen abzuspeichern                                       |
| `menus`     | Browser-Kontextemnüs modifizieren | Benötigt um Kontextmenueinträge wie "QR-Code aus Auswahl" (etc.) hinzuzufügen |
