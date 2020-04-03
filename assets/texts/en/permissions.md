# Requested permissions

For a general explanation of add-on permission see [this support article](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Installation permissions

Currently, no permissions are requested at the installation or when updating.

## Feature-specific (optional) permissions

These permissions are requested when doing some specific actions, if they are needed for that.

| Internal Id      | Permission                  | Requested at/when…                                                                            | Explanation                                                                                                                                                                                      |
|:-----------------|:----------------------------|:----------------------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `clipboardWrite` | Input data to the clipboard | If you enable an option that requires copying the emoji in a special way to the clipboard. | Needed to copy the emoji to clipboard, _only_ if you want to copy the emoji via the address bar search. |

## Hidden permissions

Additionally, it requests these permissions, which are not requested in Firefox when the add-on is installed, as they are not a profound permission.

| Internal Id | Permission                 | Explanation                                                       |
|:------------|:---------------------------|:------------------------------------------------------------------|
| `activeTab` | Access current tab/website | Needed for inserting the Emoji into the current site, if enabled. |
| `storage`   | Access local storage       | Needed for saving options                                         |
