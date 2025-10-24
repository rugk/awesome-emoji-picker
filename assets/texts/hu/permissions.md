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

## Magyarázat az engedélykérésre a 3.0.1 verzióban

Egyes böngészők a **`hozzáférés az összes webhely összes adatához`** üzenetet jeleníthetik meg, miután a bővítményt frissítették a **`3.0.1`** verzióra.
Ez azért történik, mert a böngészők jelenleg nem támogatnak finomabb engedélyeket. A tartalmi szkript használata (amely az automatikus emoji-beillesztéshez szükséges) automatikusan megköveteli a széleskörű `<all_urls>` engedélyt a `content_scripts` szekcióban a manifest fájlban.
Amíg a böngészők nem vezetnek be új engedélyt, amely lehetővé teszi tartalmi szkriptek betöltését minden fülön anélkül, hogy teljes hálózati hozzáférést adna, a `<all_urls>` engedélyhez hasonlóan, addig ez az üzenet nem kerülhető el.
Technikailag nem kér több engedélyt, mint a korábbi verziók, és a bővítmény nem olvassa vagy továbbítja a lapok és webhelyek adatait.
**A bővítmény frissítése biztonságos.**

További információ: Issue [Issue #171](https://github.com/rugk/awesome-emoji-picker/issues/171)