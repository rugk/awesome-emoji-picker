import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import * as EmojiInteraction from "/common/modules/EmojiInteraction.js";
import * as EmojiMartLazyLoaded from "/common/modules/EmojiMartLazyLoaded.js";
import * as EmojiMartDataStore from "/common/modules/EmojiMartDataStore.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

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
 * Return the last used (“current”) skin from emoji-mart.
 *
 * It is ensured that in any case of failure the default skin (0) is returned.
 *
 * @returns {Promise<number>} the current skin as ID or the default skin
 */
async function getCurrentSkinIndex() {
    const lastSkin = await EmojiMartDataStore.get("skin");

    if (!lastSkin) {
        // because undefined|null are valid entries
        return 0;
    } else if (isNaN(lastSkin)) {
        console.error(new TypeError(`Invalid skin value: ${lastSkin}, should be a number.`), "using default skin 0 instead of", lastSkin);
        return 0;
    }
    return Math.max((lastSkin - 1), 0) || 0;
}

/**
 * Trigger the evaluation for the search for emojis.
 *
 * @public
 * @param {string} text the string the user entered
 * @param {function} suggest function to call to add suggestions
 * @returns {Promise<void>}
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/onInputChanged}
 */
export async function triggerOmnixboxSuggestion(text, suggest) {
    const reloadCachedSettingsPromise = EmojiMartDataStore.reloadCachedSettings();

    const searchResult = await (await EmojiMartLazyLoaded.getEmojiMart()).SearchIndex.search(text);
    console.debug(`triggerOmnixboxSuggestion (searching for "${text}"), result:`, searchResult);

    // if none are found, return…
    if (!searchResult) {
        return;
    }

    // Ensures the skin settings are up-to-date by waiting for data refresh
    await reloadCachedSettingsPromise;
    const currentSkin = await getCurrentSkinIndex();

    const suggestions = searchResult.map((emoji) => {
        // This falls back to the default skin if the current skin is not available
        const chosenSkin = emoji.skins[currentSkin] || emoji.skins[0];
        return {
            description: browser.i18n.getMessage("searchResultDescription", [
                chosenSkin.native,
                emoji.name,
                // NOte: This uses the base skin, because the skin tone modifier as a shortcode is not useful UX-wise to display
                emoji.skins[0].shortcodes
            ]),
            content: chosenSkin.native
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
 * @returns {Promise<void>}
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
    const searchResult = await (await EmojiMartLazyLoaded.getEmojiMart()).SearchIndex.search(text);
    console.debug(`triggerOmnixboxSearch (searching for "${text}"), result:`, searchResult);

    const emojiSearch = await AddonSettings.get("emojiSearch");

    // if a single emoji is selected or searched for, detect this and return
    // emoji data
    const foundEmojiWithSkin = await (await EmojiMartLazyLoaded.getEmojiMart()).getEmojiDataFromNative(text)
            // ignore errors, as we also allow text strings there and these are
            // totally fine, too; search may find something here
            .catch(() => {debugger; return null;});

    // emoji itself copied or found
    const currentSkin = await getCurrentSkinIndex();

    if (foundEmojiWithSkin || searchResult.length === 1) {
        const foundEmoji = searchResult[0];
        // This falls back to the default skin if the current skin is not available
        const chosenSkin = foundEmoji.skins[currentSkin] || foundEmoji.skins[0];
        const emojiText = (foundEmojiWithSkin || chosenSkin)[emojiSearch.resultType];

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
            throw new Error(`invalid emojiSearch.action setting: ${emojiSearch.action}`);
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
    const CLIPBOARD_WRITE_PERMISSION = {
        permissions: ["clipboardWrite"]
    };

    // Thunderbird
    if (!browser.omnibox) {
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
        // No need to lazy-load emoji-mart yet, will be lazy-loadded as required.

        browser.omnibox.onInputChanged.addListener(triggerOmnixboxSuggestion);
        browser.omnibox.onInputEntered.addListener(triggerOmnixboxSearch);

        browser.omnibox.setDefaultSuggestion({
            description: browser.i18n.getMessage("searchTipDescription", [
                browser.i18n.getMessage("extensionName")
            ])
        });
    } else if (toEnable) {
        throw new TypeError("isEnabled must be boolean!");
    } else {
        browser.omnibox.onInputEntered.addListener(triggerOmnixboxDisabledSearch);

        browser.omnibox.setDefaultSuggestion({
            description: browser.i18n.getMessage("searchTipDescriptionDisabled", [
                browser.i18n.getMessage("extensionName")
            ])
        });
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

init();
console.log("background: OmniboxSearch loaded");
