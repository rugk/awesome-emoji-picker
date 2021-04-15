# Erfragte Berechtigungen

Für eine allgemeine Erklärung von Add-on-Berechtigungen siehe [diesen Support-Artikel](https://support.mozilla.org/de/kb/berechtigungsdialoge-der-firefox-erweiterungen).

## Berechtigungen bei Installation

Zurzeit werden bei Installation des Add-ons oder beim Update keine Berechtigungen abgefragt.

## Feature-spezifische (optionale) Berechtigungen

Diese Berechtigungen werden bei bestimmten Aktionen abgefragt, wenn sie dafür benötigt werden.

| Interne ID       | Berechtigung          | Abgefragt bei/wenn…                                                                                                                                 | Erklärung                                                                                                                                                                                                                                                          |
|:-----------------|:----------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `clipboardWrite` | Zwischenablage ändern | Wenn eine Option in den Einstellungen aktiviert wird, bei der Emojis auf spezielle Weise in die Zwischenablage kopiert werden müssen. | Diese Berechtigung wird benötigt, um Emojis in die Zwischenablage kopieren zu können, allerdings _nur_ wenn Emojis bei der Suche über die Adressleiste kopiert werden sollen. |

## Versteckte Berechtigungen

Zusätzlich verlangt dieses Add-on folgende Berechtigungen, welche in Firefox aber nicht abgefragt werden, da sie keine tiefgreifenden Berechtigungen sind.

| Interne ID  | Berechtigung                    | Erklärung                                                                      |
|:------------|:--------------------------------|:-------------------------------------------------------------------------------|
| `activeTab` | Auf aktuelle Webseite zugreifen | Benötigt, um Emojis in die aktuelle Seite einzufügen, wenn dies aktiviert ist. |
| `storage`   | Zugriff auf lokalen Speicher    | Benötigt um Einstellungen abzuspeichern                                        |
