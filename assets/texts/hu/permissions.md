# Kért engedélyek

A kiegészítőengedélyek általános magyarázatáért lásd [ezt a támogatási leírást](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Telepítési engedélyek

Jelenleg nem szükségesek engedélyek telepítéskor vagy frissítéskor.

## Funkcióspecifikus (nem kötelező) engedélyek

Ezek az engedélyek lesznek kérve, ha adott műveleteket végez, és azokhoz ez szükséges.

| Belső azonosító  | Engedély                  | Ekkor lesz kérve…                                                            | Magyarázat                                                                                                                                                                                                                           |
|:-----------------|:--------------------------|:-----------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `clipboardWrite` | Adatok vágólapra másolása | Ha engedélyezi a beállítást, hogy az emodzsi aszinkron kerüljön a vágólapra. | Az emodzsi vágólapra másolásához szükséges, de _csak_ akkor ha az oldalra beszúrás sikertelen (ha mindig másolni akarja az emodzsit, akkor az engedély _nem_ lesz kérve.) _vagy_ ha a címsáv keresőjével akarja másolni az emodzsit. |

## Rejtett engedélyek

Továbbá ezeket az engedélyeket kéri, melyek nem lesznek kérve a Firefoxban a kiegészítő telepítésekor, mert nem felhasználótól kért engedélyek.

| Belső azonosító | Engedély                       | Magyarázat                                                                |
|:----------------|:-------------------------------|:--------------------------------------------------------------------------|
| `activeTab`     | Jelenlegi lap/weboldal elérése | Az emodzsi a jelenlegi lapra beszúrásához szükséges, ha az engedélyezett. |
| `storage`       | Helyi tároló elérése           | A mentési beállításokhoz szükséges.                                       |
