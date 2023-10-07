"use strict";

import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";

import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";
import * as symbols from "/common/modules/data/Symbols.js";
// Not actually a module, but sets the emojiMart global
import "/common/lib/emoji-mart-embed/dist/emoji-mart.js";

const settings = {
    enabled: null,
    autocorrectEmojis: null,
    autocorrectEmojiShortcodes: null,
    autocomplete: null,
    autocompleteSelect: null
};

// Leaf node
const LEAF = Symbol("leaf");

let autocorrections = {};

// Longest autocorrection
let longest = 0;

let symbolpatterns = [];
// Exceptions, do not autocorrect for these patterns
let antipatterns = [];

const emojiShortcodes = {};

// Chrome
// Adapted from: https://github.com/mozilla/webextension-polyfill/blob/master/src/browser-polyfill.js
const IS_CHROME = Object.getPrototypeOf(browser) !== Object.prototype;

/**
 * Traverse Trie tree of objects to create RegEx.
 *
 * @param {Object.<string, Object|boolean>} tree
 * @returns {string}
 */
function createRegEx(tree) {
    const alternatives = [];
    const characterClass = [];

    // Escape special characters
    const regExSpecialChars = /[.*+?^${}()|[\]\\]/gu;

    for (const char in tree) {
        if (char) {
            const escaptedChar = char.replace(regExSpecialChars, "\\$&");

            const atree = tree[char];
            if (!(LEAF in atree && Object.keys(atree).length === 1)) {
                const recurse = createRegEx(atree);
                alternatives.push(recurse + escaptedChar);
                // alternatives.push(escaptedChar + recurse);
            } else {
                characterClass.push(escaptedChar);
            }
        }
    }

    if (characterClass.length) {
        alternatives.push(characterClass.length === 1 ? characterClass[0] : `[${characterClass.join("")}]`);
    }

    let result = alternatives.length === 1 ? alternatives[0] : `(?:${alternatives.join("|")})`;

    if (LEAF in tree) {
        if (characterClass.length || alternatives.length > 1) {
            result += "?";
        } else {
            result = `(?:${result})?`;
        }
    }

    return result;
}

/**
 * Convert autocorrections into Trie tree of objects.
 *
 * @param {string[]} arr
 * @returns {string}
 */
function createTree(arr) {
    const tree = {};

    arr.sort((a, b) => b.length - a.length);

    for (const str of arr) {
        let temp = tree;

        for (const char of Array.from(str).reverse()) {
            // for (const char of str) {
            if (!(char in temp)) {
                temp[char] = {};
            }
            temp = temp[char];
        }

        // Leaf node
        temp[LEAF] = true;
    }

    Object.freeze(tree);
    return createRegEx(tree);
}

/**
 * Apply new autocorrect settings and create regular expressions.
 *
 * @returns {void}
 */
function applySettings() {
    const start = performance.now();
    autocorrections = {};

    // Add all symbols to our autocorrections map, we want to replace
    if (settings.autocorrectEmojis) {
        Object.assign(autocorrections, symbols.emojis);
    }
    if (settings.autocorrectEmojiShortcodes) {
        Object.assign(autocorrections, emojiShortcodes);
    }

    // Longest autocorrection
    longest = 0;

    for (const symbol in autocorrections) {
        if (symbol.length > longest) {
            longest = symbol.length;
        }
    }
    console.log("Longest autocorrection", longest);

    symbolpatterns = createTree(Object.keys(autocorrections));

    // Do not autocorrect for these patterns
    antipatterns = [];
    for (const x in autocorrections) {
        let length = 0;
        let index = x.length;

        for (const y in autocorrections) {
            if (x === y) {
                continue;
            }
            const aindex = x.indexOf(y);
            if (aindex >= 0) {
                if (aindex < index) {
                    index = aindex;
                    length = y.length;
                } else if (aindex === index && y.length > length) {
                    length = y.length;
                }
            }
        }

        if (length) {
            length = x.length - (index + length);
            if (length > 1) {
                antipatterns.push(x.slice(0, -(length - 1)));
            }
        }
    }
    antipatterns = antipatterns.filter((item, pos) => antipatterns.indexOf(item) === pos);
    console.log("Do not autocorrect for these patterns", antipatterns);

    antipatterns = createTree(antipatterns);

    symbolpatterns = new RegExp(`(${symbolpatterns})$`, "u");
    antipatterns = new RegExp(`(${antipatterns})$`, "u");
    const end = performance.now();
    console.log(`The new autocorrect settings were applied in ${end - start} ms.`);
}

/**
 * On error.
 *
 * @param {string} error
 * @returns {void}
 */
function onError(error) {
    console.error(`Error: ${error}`);
}

/**
 * Set autocorrect settings.
 *
 * @param {Object} autocorrect
 * @returns {void}
 */
function setSettings(autocorrect) {
    settings.enabled = autocorrect.enabled;
    settings.autocorrectEmojis = autocorrect.autocorrectEmojis;
    settings.autocorrectEmojiShortcodes = autocorrect.autocorrectEmojiShortcodes;
    settings.autocomplete = autocorrect.autocompleteEmojiShortcodes;
    settings.autocompleteSelect = autocorrect.autocompleteSelect;

    if (settings.enabled) {
        applySettings();
    }
}

/**
 * Send autocorrect settings to content scripts.
 *
 * @param {Object} autocorrect
 * @returns {void}
 */
function sendSettings(autocorrect) {
    setSettings(autocorrect);

    browser.tabs.query({}).then((tabs) => {
        for (const tab of tabs) {
            browser.tabs.sendMessage(
                tab.id,
                {
                    type: COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_CONTENT,
                    enabled: settings.enabled,
                    autocomplete: settings.autocomplete,
                    autocompleteSelect: settings.autocompleteSelect,
                    autocorrections,
                    longest,
                    symbolpatterns: IS_CHROME ? symbolpatterns.source : symbolpatterns,
                    antipatterns: IS_CHROME ? antipatterns.source : antipatterns,
                    emojiShortcodes
                }
            ).catch(onError);
        }
    }).catch(onError);
}

/**
 * Init autocorrect module.
 *
 * @public
 * @returns {Promise<void>}
 */
export async function init() {
    const autocorrect = await AddonSettings.get("autocorrect");

    for (const emoji of Object.values(emojiMart.emojiIndex.emojis)) {
        if (!emoji.native) {
            emojiShortcodes[emoji[1].colons] = emoji[1].native;
        } else {
            emojiShortcodes[emoji.colons] = emoji.native;
        }
    }

    Object.freeze(emojiShortcodes);

    setSettings(autocorrect);

    browser.runtime.onMessage.addListener((message, sender) => {
        // console.log(message);
        if (message.type === COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_CONTENT) {
            const response = {
                type: COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_CONTENT,
                enabled: settings.enabled,
                autocomplete: settings.autocomplete,
                autocompleteSelect: settings.autocompleteSelect,
                autocorrections,
                longest,
                symbolpatterns: IS_CHROME ? symbolpatterns.source : symbolpatterns,
                antipatterns: IS_CHROME ? antipatterns.source : antipatterns,
                emojiShortcodes
            };
            // console.log(response);
            return Promise.resolve(response);
        }
    });

    // Thunderbird
    // Remove if part 3 of https://bugzilla.mozilla.org/show_bug.cgi?id=1630786#c4 is ever done
    if (typeof messenger !== "undefined") {
        browser.composeScripts.register({
            js: [
                { file: "/content_scripts/autocorrect.js" }
            ]
        });
    }
}

BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_BACKGROUND, (request) => {
    // clear cache by reloading all options
    // await AddonSettings.loadOptions();

    return sendSettings(request.optionValue);
});
