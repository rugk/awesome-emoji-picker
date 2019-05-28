import * as EmojiInteraction from "/common/modules/EmojiInteraction.js";

/**
 * Lazy-load the emoji-mart library, .
 *
 * This consumes some memory (RAM), up-to 10MB, as remount and other things are loaded.
 *
 * @public
 * @returns {void}
 */
function loadEmojiMart() {
    const emojiMartLoader = document.createElement("script");
    emojiMartLoader.setAttribute("async", true);
    emojiMartLoader.setAttribute("src", "/common/lib/emoji-mart-embed/dist/emoji-mart.js");
    document.querySelector("head").appendChild(emojiMartLoader);
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
 * Triggered when the search is actually executed,.
 *
 * @public
 * @param {string} text the string the user entered or selected
 * @param {string} disposition how the result should be possible
 * @returns {void}
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/omnibox/onInputEntered}
 */
export function triggerOmnixboxSearch(text) {
    const searchResult = window.emojiMart.emojiIndex.search(text);

    // if a single emoji is selected or searched for, detect this and return
    // emoji data
    try {
        const foundEmoji = window.emojiMart.getEmojiDataFromNative(text);

        if (foundEmoji) {
            searchResult.push(foundEmoji);
        }
    } catch (e) {
        // ignore errors, as we usually expect text strings there and these are
        // totally fine, too; search may find something here
    }

    // emoji itself copied or found
    if (searchResult.length === 1) {
        // if result is only one emoji, also instantly copy it
        EmojiInteraction.insertOrCopy(searchResult[0]);
    } else {
        // otherwise open popup to show all emoji choices
        browser.browserAction.openPopup();
    }

}

/**
 * Init omnibox search.
 *
 * @public
 * @returns {void}
 */
export function init() {
    // lazy-load emoji-mart
    loadEmojiMart();

    browser.omnibox.onInputChanged.addListener(triggerOmnixboxSuggestion);
    browser.omnibox.onInputEntered.addListener(triggerOmnixboxSearch);

    browser.omnibox.setDefaultSuggestion({
        description: browser.i18n.getMessage("searchTipDescription", [
            browser.i18n.getMessage("extensionName")
        ])
    });
}
