# Erfragte Berechtigungen

Für eine allgemeine Erklärung von Add-on-Berechtigungen siehe [diesen Support-Artikel](https://support.mozilla.org/de/kb/berechtigungsdialoge-der-firefox-erweiterungen).

## Berechtigungen bei Installation

Zurzeit werden bei Installation des Add-ons oder beim Update keine Berechtigungen abgefragt.

## Feature-spezifische (optionale) Berechtigungen

Diese Berechtigungen werden bei bestimmten Aktionen abgefragt, wenn sie dafür benötigt werden.

| Interne ID       | Berechtigung          | Abgefragt bei/wenn…                                                                                                                                 | Erklärung                                                                                                                                                                                                                                                          |
|:-----------------|:----------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `clipboardWrite` | Zwischenablage ändern | Wenn die Option des Kopierens des Emojis in die Zwischenablage, nur wenn das Einfügen des Emojis in die aktuelle Seite fehl schlägt, aktiviert ist. | Diese Berechtigung wird benötigt, um das Emoji asynchron in die Zwischenablage kopieren zu können, allerdings _nur_ wenn das Einfügen in die aktuelle Seite fehl schlägt. (Wenn das Emoji immer kopiert werden soll, so wird diese Berechtigung _nicht_ benötigt.) |


## Versteckte Berechtigungen

Zusätzlich verlangt dieses Add-on folgende Berechtigungen, welche in Firefox aber nicht abgefragt werden, da sie keine tiefgreifenden Berechtigungen sind.

| Interne ID  | Berechtigung                    | Erklärung                                                                      |
|:------------|:--------------------------------|:-------------------------------------------------------------------------------|
| `activeTab` | Auf aktuelle Webseite zugreifen | Benötigt, um Emojis in die aktuelle Seite einzufügen, wenn dies aktiviert ist. |
| `storage`   | Zugriff auf lokalen Speicher    | Benötigt um Einstellungen abzuspeichern                                        |
