import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import * as EmojiInteraction from "/common/modules/EmojiInteraction.js";

import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

const CLIPBOARD_WRITE_PERMISSION = {
    permissions: ["clipboardWrite"]
};

let emojiMartIsLoaded = false;

/**
 * Lazy-load the emoji-mart library.
 *
 * This consumes some memory (RAM), up-to 10MB, as remount and other things are loaded.
 *
 * @private
 * @returns {void}
 */
function loadEmojiMart() {
    // prevent that it is loaded twice
    if (emojiMartIsLoaded) {
        return;
    }

    const emojiMartLoader = document.createElement("script");
    emojiMartLoader.setAttribute("async", true);
    emojiMartLoader.setAttribute("src", "/common/lib/emoji-mart-embed/dist/emoji-mart.js");
    document.querySelector("head").append(emojiMartLoader);

    emojiMartIsLoaded = true;
}

/**
 * Navigates to the URL in this tab or a new tab.
 *
 * @private
 * @param {string} url the URL that should be opened
 * @param {string} disposition as per {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/onInputEntered}
 * @returns {void}
 */
function openTabUrl(url, disposition) {
    switch (disposition) {
    case "currentTab":
        browser.tabs.update({
            url
        });
        break;
    case "newForegroundTab":
        browser.tabs.create({
            active: true,
            url
        });
        break;
    case "newBackgroundTab":
        browser.tabs.create({
            active: false,
            url
        });
        break;
    }
}

/**
 * Trigger the evaluation for the search for emojis.
 *
 * @public
 * @param {string} text the string the user entered
 * @param {function} suggest function to call to add suggestions
 * @returns {void}
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/onInputChanged}
 */
export function triggerOmnixboxSuggestion(text, suggest) {
    const searchResult = window.emojiMart.emojiIndex.search(text);

    // if none are found, return…
    if (!searchResult) {
        return;
    }

    const suggestions = searchResult.map((emoji) => {
        return {
            description: browser.i18n.getMessage("searchResultDescription", [
                emoji.native,
                emoji.name,
                emoji.colons
            ]),
            content: emoji.native
        };
    });

    suggest(suggestions);
}

/**
 * Triggered when the search is actually executed, but the omnibox feature is disabled.
 *
 * @public
 * @param {string} text the string the user entered or selected
 * @param {string} disposition how the result should be possible
 * @returns {Promise}
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/onInputEntered}
 */
export async function triggerOmnixboxDisabledSearch(text, disposition) {
    // if search API is allowed, we just fall-back to default search
    if (browser.search) {
        let tabId;

        switch (disposition) {
        case "currentTab": {
            const currentTab = await browser.tabs.query({
                active: true,
                currentWindow: true
            });

            if (currentTab.length >= 1) {
                tabId = currentTab[0].id;
            }

            // deliberately fall-through
        }
        default: // eslint-disable-line no-fallthrough
            return browser.search.search({
                query: text,
                tabId
            });
        }
    }

    // otherwise we just open the options page
    return browser.runtime.openOptionsPage();
}

/**
 * Triggered when the search is actually executed.
 *
 * @public
 * @param {string} text the string the user entered or selected
 * @param {string} disposition how the result should be possible
 * @returns {Promise<void>}
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/onInputEntered}
 */
export async function triggerOmnixboxSearch(text, disposition) {
    text = text.trim();
    const searchResult = window.emojiMart.emojiIndex.search(text);

    const emojiSearch = await AddonSettings.get("emojiSearch");

    // if a single emoji is selected or searched for, detect this and return
    // emoji data
    try {
        const foundEmoji = window.emojiMart.getEmojiDataFromNative(text);

        if (foundEmoji) {
            searchResult.push(foundEmoji);
        }
    } catch {
        // ignore errors, as we usually expect text strings there and these are
        // totally fine, too; search may find something here
    }

    // emoji itself copied or found
    if (searchResult.length === 1) {
        const emojiText = searchResult[0][emojiSearch.resultType];

        if (emojiSearch.action === "copy") {
            // if result is only one emoji, also instantly copy it
            EmojiInteraction.insertOrCopy(emojiText, {
                insertIntoPage: false,
                copyOnlyOnFallback: false,
                copyToClipboard: true
            });
        } else if (emojiSearch.action === "emojipedia") {
            const resultUrl = `https://emojipedia.org/search/?${new URLSearchParams({ q: emojiText })}`;

            // navigate to URL in current or new tab
            openTabUrl(resultUrl, disposition);
        } else {
            throw new Error(`invalid emojiSearch.resultType setting: ${emojiSearch.resultType}`);
        }
    } else {
        // fallback when we have either too many or too few emoji results

        // otherwise open popup to show all emoji choices
        // does not work, because we have no permission
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=1542358
        // browser.browserAction.openPopup();

        // search for result in emojipedia
        const resultUrl = `https://emojipedia.org/search/?${new URLSearchParams({ q: text })}`;
        openTabUrl(resultUrl, disposition);
    }
}

/**
 * Enables or disables the search in the omnibar.
 *
 * @private
 * @param {boolean} toEnable
 * @returns {Promise<void>}
 * @throws TypeError
 */
async function toggleEnabledStatus(toEnable) {
    // Thunderbird
    if (typeof messenger !== "undefined") {
        return;
    }

    // if we do not have the permission for clipboard, and need it for settings, force-disable feature
    if (!await browser.permissions.contains(CLIPBOARD_WRITE_PERMISSION)) {
        const emojiSearch = await AddonSettings.get("emojiSearch");

        if (emojiSearch.action === "copy") {
            toEnable = false;
        }
    }

    // disable previously registered triggers
    browser.omnibox.onInputChanged.removeListener(triggerOmnixboxSuggestion);
    browser.omnibox.onInputEntered.removeListener(triggerOmnixboxSearch);

    browser.omnibox.onInputEntered.removeListener(triggerOmnixboxDisabledSearch);

    // enable it
    if (toEnable) {
        // lazy-load emoji-mart
        loadEmojiMart();

        browser.omnibox.onInputChanged.addListener(triggerOmnixboxSuggestion);
        browser.omnibox.onInputEntered.addListener(triggerOmnixboxSearch);

        browser.omnibox.setDefaultSuggestion({
            description: browser.i18n.getMessage("searchTipDescription", [
                browser.i18n.getMessage("extensionName")
            ])
        });
    } else if (!toEnable) {
        browser.omnibox.onInputEntered.addListener(triggerOmnixboxDisabledSearch);

        browser.omnibox.setDefaultSuggestion({
            description: browser.i18n.getMessage("searchTipDescriptionDisabled", [
                browser.i18n.getMessage("extensionName")
            ])
        });
    } else {
        throw new TypeError("isEnabled must be boolean!");
    }
}


/**
 * Init omnibox search.
 *
 * @public
 * @returns {Promise}
 */
export async function init() {
    // load whether it is enabled
    const emojiSearch = await AddonSettings.get("emojiSearch");

    toggleEnabledStatus(emojiSearch.enabled);
}

BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.OMNIBAR_TOGGLE, async (request) => {
    // clear cache by reloading all options
    await AddonSettings.loadOptions();

    return toggleEnabledStatus(request.toEnable);
});
