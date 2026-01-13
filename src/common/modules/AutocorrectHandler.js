"use strict";

import { isChrome } from "../BrowserCompat.js";
import { getEmojiMartInitialisationData } from "./EmojiMartInitialisationData.js";
import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";
import * as symbols from "/common/modules/data/Symbols.js";

// Deferred initialization promise to ensure all data is ready before use handling messages
let initializedResolver;
const isInitialized = new Promise((resolve) => {
    initializedResolver = resolve;
});

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

/* @type {RegExp|null} */
let symbolpatterns = null;
// Exceptions, do not autocorrect for these patterns
/* @type {RegExp|null} */
let antipatterns = null;

const emojiShortcodes = {};

// Chrome
const IS_CHROME = isChrome();

/**
 * Traverse Trie tree of objects to create RegEx.
 *
 * @param {Object.<string, object | boolean>} tree
 * @returns {string}
 */
function createRegEx(tree) {
    const alternatives = [];
    const characterClass = [];

    // Escape special characters
    const regExSpecialChars = /[.*+?^${}()|[\]\\]/gu;

    for (const [char, atree] of Object.entries(tree)) {
        if (char) {
            const escaptedChar = RegExp.escape ? RegExp.escape(char) : char.replaceAll(regExSpecialChars, String.raw`\$&`);

            if (LEAF in atree && Object.keys(atree).length === 0) {
                characterClass.push(escaptedChar);
            } else {
                const recurse = createRegEx(atree);
                alternatives.push(recurse + escaptedChar);
                // alternatives.push(escaptedChar + recurse);
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
 * @param {boolean} forceRebuild whether to force rebuild of the autocorrect RegExp patterns
 * @returns {Promise<void>}
 */
async function applySettings(forceRebuild) {
    const start = performance.now();

    let symbolpatternsRegexpString = "";
    let antipatternsRegexpString = "";

    autocorrections = {};

    // Add all symbols to our autocorrections map, we want to replace
    if (settings.autocorrectEmojis) {
        Object.assign(autocorrections, symbols.emojis);
    }
    if (settings.autocorrectEmojiShortcodes) {
        Object.assign(autocorrections, emojiShortcodes);
    }

    // Longest autocorrection
    longest = Math.max(...Object.keys(autocorrections).map((s) => s.length), 0);
    console.log("Longest autocorrection", longest);

    if (!forceRebuild) {
        const cachedRegexpStrings = await browser.storage.session.get({
            symbolpatternsRegexpString: "",
            antipatternsRegexpString: ""
        });
        symbolpatternsRegexpString = cachedRegexpStrings.symbolpatternsRegexpString;
        antipatternsRegexpString = cachedRegexpStrings.antipatternsRegexpString;
    }

    if (!symbolpatternsRegexpString || !antipatternsRegexpString) {
        console.log("Building autocorrect RegExp patterns");
        // Do not autocorrect for these patterns
        let antipatternsList = [];
        for (const x in autocorrections) {
            let length = 0;
            let index = x.length;

            for (const y in autocorrections) {
                if (x === y) {
                    continue;
                }
                const aindex = x.indexOf(y);
                if (aindex !== -1) {
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
                    antipatternsList.push(x.slice(0, -(length - 1)));
                }
            }
        }
        antipatternsList = antipatternsList.filter((item, pos) => antipatternsList.indexOf(item) === pos);
        console.log("Do not autocorrect for these patterns", antipatternsList);

        symbolpatternsRegexpString = createTree(Object.keys(autocorrections));
        antipatternsRegexpString = createTree(antipatternsList);
        await browser.storage.session.set({
            symbolpatternsRegexpString,
            antipatternsRegexpString
        });
    }

    symbolpatterns = new RegExp(`(${symbolpatternsRegexpString})$`, "u");
    antipatterns = new RegExp(`(${antipatternsRegexpString})$`, "u");

    const end = performance.now();
    console.log(`The new autocorrect settings were applied in ${end - start} ms.`);
}

/**
 * Set autocorrect settings.
 *
 * @param {object} autocorrect
 * @param {boolean} [modified] whether settings were modified (true) or loaded from storage (false)
 * @returns {Promise<void>}
 */
async function setSettings(autocorrect, modified = true) {
    settings.enabled = autocorrect.enabled;
    settings.autocorrectEmojis = autocorrect.autocorrectEmojis;
    settings.autocorrectEmojiShortcodes = autocorrect.autocorrectEmojiShortcodes;
    settings.autocomplete = autocorrect.autocompleteEmojiShortcodes;
    settings.autocompleteSelect = autocorrect.autocompleteSelect;

    if (settings.enabled) {
        await applySettings(/* forceRebuild= */ modified);
    }
}

/**
 * Send autocorrect settings to content scripts.
 *
 * @param {object} autocorrect
 * @returns {Promise<void>}
 */
async function sendSettings(autocorrect) {
    await setSettings(autocorrect, /* modified= */ true);

    try {
        const tabs = await browser.tabs.query({});
        await Promise.allSettled(
            tabs.map(async (tab) => {
                if (!tab.id) {
                    return;
                }
                try {
                    await browser.tabs.sendMessage(tab.id, {
                        type: COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_CONTENT,
                        enabled: settings.enabled,
                        autocomplete: settings.autocomplete,
                        autocompleteSelect: settings.autocompleteSelect,
                        autocorrections,
                        longest,
                        symbolpatterns: IS_CHROME ? symbolpatterns.source : symbolpatterns,
                        antipatterns: IS_CHROME ? antipatterns.source : antipatterns,
                        emojiShortcodes,
                    });
                } catch (error) {
                    console.error(
                        `Error sending autocorrect settings to tab ${tab.id}:`,
                        error
                    );
                }
            })
        );
    } catch (error) {
        console.error("Error querying tabs:", error);
    }
}

/**
 * Init autocorrect module.
 *
 * @public
 * @returns {Promise<void>}
 */
export async function init() {
    const initData = await (await getEmojiMartInitialisationData()).data();
    const emojiData = initData.emojis;

    const autocorrect = await AddonSettings.get("autocorrect");

    for (const emoji of Object.values(emojiData)) {
        // The shortcode is just the emoji ID, so we manually add it here
        // https://github.com/missive/emoji-mart/pull/996#issuecomment-2873326636
        emojiShortcodes[`:${emoji.id}:`] = emoji.skins[0].native;
    }

    Object.freeze(emojiShortcodes);
    console.debug("Emoji shortcodes:", emojiShortcodes);

    await setSettings(autocorrect, /* modified= */ false);

    // Thunderbird
    // Cannot register scripts in manifest.json file: https://bugzilla.mozilla.org/show_bug.cgi?id=1902843
    if (browser.composeScripts) {
        browser.composeScripts.register({
            js: [
                { file: "/content_scripts/autocorrect.js" }
            ]
        });
    }

    initializedResolver();
}

BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_BACKGROUND, async (request) => {
    // clear cache by reloading all options
    // await AddonSettings.loadOptions();

    return sendSettings(request.optionValue);
});

browser.runtime.onMessage.addListener(async (message, _sender) => {
    if (message.type === COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_CONTENT) {
        // Ensure autocorrect data is initialized before responding to content script requests.
        await isInitialized;

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
        return response;
    }
});

console.warn("background: AutocorrectHandler loaded");
