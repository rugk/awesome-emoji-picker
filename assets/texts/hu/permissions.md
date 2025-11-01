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

## Magyarázat az engedélykérésre a 3.0-es verzióban

Egyes böngészők a **`hozzáférés az összes webhely összes adatához`** üzenetet jeleníthetik meg, miután a kiegészítő a **`3.0`-es** verzióra lett frissítve.
Ez azért történik, mert a böngészők jelenleg nem támogatnak finomabb engedélyeket. A tartalmi szkript használata (amely az automatikus emodzsibeillesztéshez szükséges) automatikusan megköveteli a széleskörű `<all_urls>` engedélyt a leírófájl `content_scripts` szakaszában.
Amíg a böngészők nem vezetnek be új engedélyt, amely anélkül teszi lehetővé a tartalmi szkriptek betöltését az összes lapon, hogy teljes hálózati hozzáférést adna, az `<all_urls>` engedélyhez hasonlóan, addig ez az üzenet nem kerülhető el.
Technikailag nem kér több engedélyt, mint a korábbi verziók, és a kiegészítő nem olvassa vagy továbbítja a lapok és webhelyek adatait.

> [!NOTE]
> A bővítmény frissítése biztonságos.

További információk: [Issue #171](https://github.com/rugk/awesome-emoji-picker/issues/171)