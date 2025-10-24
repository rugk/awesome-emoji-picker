# Droits requis

Pour une explication générale des droits des modules complémentaires, cf. [cet article du support Mozilla pour Firefox](
https://support.mozilla.org/fr/kb/messages-demande-permission-extensions-firefox) et [celui-ci pour Thunderbird](https://support.mozilla.org/fr/kb/messages-demande-permission-extensions-thunderbird).

## Droits lors de l'installation

Les droits suivants sont demandés lors de l’installation ou de la mise-à-jour :

| ID Interne       | Droits                                    | Explication                                                                             |
| :--------------- | :---------------------------------------- | :-------------------------------------------------------------------------------------- |
| `[context]menus` | Modifier le menu contextuel du navigateur | Nécessaire pour ajouter une entrée au menu contextuel pour ouvrir le sélecteur d'émojis |

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

## Précision sur l’avertissement de permission dans la version `3.0.1`

Certains navigateurs peuvent afficher le message **`accès à toutes les données sur tous les sites web`** après la mise à jour de l’extension vers la version **`3.0.1`**.
Cela se produit car les navigateurs ne disposent pas encore de permissions plus précises. L’utilisation d’un script de contenu (nécessaire pour l’insertion automatique d’emojis sur les sites web) impose automatiquement l’ajout de la permission étendue `<all_urls>` dans la section `content_scripts` du manifeste.
À moins que les navigateurs n’introduisent un nouveau type de permission permettant de charger des scripts de contenu dans tous les onglets sans accorder l’accès réseau complet impliqué par `<all_urls>`, ce message ne peut pas être évité.
Aucune permission supplémentaire n’est techniquement demandée par rapport aux versions précédentes, et l’extension ne lit ni ne transmet aucune donnée de vos onglets ou sites web.
**La mise à jour de l’extension est sans danger.**

Pour plus de détails, voir [Issue #171](https://github.com/rugk/awesome-emoji-picker/issues/171)