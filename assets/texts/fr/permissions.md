# Autorisations requises

Pour une explication générale des autorisations de modules complémentaires, cf. [cet article du support Mozilla](
https://support.mozilla.org/fr/kb/messages-de-demande-de-autorisation-pour-les-extensi).

## Autorisations d'installation

Actuellement, aucune autoristation n'est requise à l'installation ou lors des mises à jour.

## Autorisations spécifiques à certaines fonctionnalités (optionnelles)

Ces autoristations sont requises pour effectuer certaines actions, si elles sont nécéssaires.

|  ID Interne | Autorisations                                                                           | Demandé au …                              | Explication  |
|:------------|:----------------------------------------------------------------------------------------|:------------------------------------------|:-------------|
| `downloads` | Télécharge les fichiers, et lit et modifie l'historique de téléchargement du navigateur | Téléchargement de QR code en tant que SVG | Needed for … |

## Autorisations cachées
De plus, l'extension requiert ces autoristations, qui ne sont pas requises dans Firefox quand l'extension est installée, car elle sont superficielles

| Id Interne  | Autorisations                                | Explication                                                                           |
|:------------|:---------------------------------------------|:--------------------------------------------------------------------------------------|
| `activeTab` | Accéder à l'onglet actif                     | Requis pour récupérer l'URL du site courant pour le QR-Code                           |
| `storage`   | Accéder au stockage local                    | Requis pour sauvegarder les paramètres                                                |
| `menus`     | Modifier les menus contextuels du navigateur | Requis pour ajouter les menus contextuels "QR-Code à partir de la sélection" (etc.)   |
