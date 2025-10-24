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

## Klarstellung zur Berechtigungsabfrage in Version `3.0.1`

Einige Browser können nach dem Update der Erweiterung auf Version **`3.0.1`** die Meldung anzeigen, dass diese Erweiterung **`auf Ihre Daten für alle Websites zugreifen kann`**.
Dies liegt daran, dass Browser derzeit keine feineren Berechtigungen unterstützen. Die Verwendung eines Content Scripts (erforderlich für das automatische Einfügen von Emojis auf Websites) erfordert automatisch die Angabe der weitreichenden Berechtigung `<all_urls>` im Abschnitt `content_scripts` der Manifest-Datei.
Sofern Browser keinen neuen Berechtigungstyp einführen, der das Laden von Content Scripts in allen Tabs erlaubt, ohne den vollständigen Netzwerkzugriff von `<all_urls>` zu gewähren, kann diese Meldung nicht vermieden werden.

Es werden technisch keine zusätzlichen Berechtigungen im Vergleich zu früheren Versionen angefordert, und die Erweiterung liest oder überträgt keine Daten aus Ihren Tabs oder Websites.
**Das Aktualisieren der Erweiterung ist sicher.**

Weitere Informationen finden Sie in [Issue #171](https://github.com/rugk/awesome-emoji-picker/issues/171)