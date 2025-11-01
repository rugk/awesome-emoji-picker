# Requested permissions

For a general explanation of add-on permission see [this support article for Firefiox](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions) and [this for Thunderbird](https://support.mozilla.org/kb/permission-request-messages-thunderbird-extensions).

## Installation permissions

The following permissions are requested at the installation or when updating:

| Internal Id      | Permission                   | Explanation                                                        |
|:-----------------|:-----------------------------|:-------------------------------------------------------------------|
| `[context]menus` | Modify browser context menus | Needed for adding the a context menu item to open the emoji picker |

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

## Clarification on permission prompt in version `3.0`.

Some browsers may display that this extension can **`access your data for all websites`** message after updating the extension to version **`3.0.1`**.
This occurs because browsers currently lack more fine-grained permissions. Using a content script (needed for automatic emoji insertion on websites) automatically requires the broad `<all_urls>` permission.
Unless browsers introduce a new permission type that allows loading content scripts in all tabs without also granting the full network access implied by `<all_urls>`, this message cannot be avoided.

No additional permissions are technically requested compared to previous versions, and the extension does not read or transmit any data from your tabs or websites.

> [!NOTE]  
> It is safe to update the extension.

For more clarification, see [Issue #171](https://github.com/rugk/awesome-emoji-picker/issues/171)