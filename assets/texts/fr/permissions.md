# Droits requises

Pour une explication générale des droits des modules complémentaires, cf. [cet article du support Mozilla pour Firefox](
https://support.mozilla.org/fr/kb/messages-demande-permission-extensions-firefox) et [celui-ci pour Thunderbird](https://support.mozilla.org/fr/kb/messages-demande-permission-extensions-thunderbird).

## Droits lors de l'installation

Les droits suivants sont demandés lors de l’installation ou de la mise-à-jour :

| ID Interne       | Droits                                    | Explication                                                                             |
| :--------------- | :---------------------------------------- | :-------------------------------------------------------------------------------------- |
| `[context]menus` | Modifier le menu contextuel du navigateur | Nécéssaire pour ajouter une entrée au menu contextuel pour ouvrir le sélecteur d'émojis |

## Droits spécifiques à certaines fonctionnalités (optionnelles)

Ces droits sont requis pour effectuer certaines actions, s'ils sont nécessaires.

| ID Interne       | Droits                                  | Demandé …                                                                         | Explication                                                                                                                                                                                                                      |
| :--------------- | :-------------------------------------- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clipboardWrite` | Écrit des données vers le presse-papier | À l'activation d'une option nécessitant de copier les émojis de façon asynchrone. | Utilisé pour copier les émojis, _seulement_ si l'insertion dans la page échoue (si vous voulez tout le temps les copier, il n'y a pas besoin de ce droit) _ou_ si vous voulez copier l'émoji via la barre d'adresse (recherche). |

## Droits cachées

De plus, l'extension requiert ces droits, qui ne sont pas requis dans Firefox quand l'extension est installée, car ils sont superficiels.

| Id Interne  | Droits                        | Explication                                                       |
| :---------- | :---------------------------- | :---------------------------------------------------------------- |
| `activeTab` | Accéder à l'onglet/site actif | Requis pour insérer l'émoji dans le site courant, le cas échéant. |
| `storage`   | Accéder au stockage local     | Requis pour sauvegarder les paramètres.                           |
