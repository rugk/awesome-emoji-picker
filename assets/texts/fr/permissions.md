# Autorisations requises

Pour une explication générale des autorisations de modules complémentaires, cf. [cet article du support Mozilla](
https://support.mozilla.org/fr/kb/messages-de-demande-de-autorisation-pour-les-extensi).

## Autorisations d'installation

Actuellement, aucune autorisation n'est requise à l'installation ou lors des mises à jour.

## Autorisations spécifiques à certaines fonctionnalités (optionnelles)

Ces autorisations sont requises pour effectuer certaines actions, si elles sont nécessaires.

|    ID Interne    | Autorisations                           | Demandé …                                                                         | Explication                                                                                                                                                                                                                                |
|:-----------------|:----------------------------------------|:----------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `clipboardWrite` | Écrit des données vers le presse-papier | À l'activation d'une option nécessitant de copier les émojis de façon asynchrone. | Utilisée pour copier les émojis, _seulement_ si l'insertion dans la page échoue (si vous voulez tout le temps les copier, il n'y a pas besoin de cette permission). _ou_ si vous voulez copier l'émoji via la barre d'adresse (recherche). |

## Autorisations cachées
De plus, l'extension requiert ces autorisations, qui ne sont pas requises dans Firefox quand l'extension est installée, car elles sont superficielles.

| Id Interne  | Autorisations                 | Explication                                                       |
|:------------|:------------------------------|:------------------------------------------------------------------|
| `activeTab` | Accéder à l'onglet/site actif | Requis pour insérer l'émoji dans le site courant, le cas échéant. |
| `storage`   | Accéder au stockage local     | Requis pour sauvegarder les paramètres.                           |
