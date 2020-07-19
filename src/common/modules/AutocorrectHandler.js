"use strict";

import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";

import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";
import * as symbols from "/common/modules/data/symbols.js";
import * as emojimart from "/common/lib/emoji-mart-embed/dist/emoji-mart.js";

let autocorrectSymbols = true;
let autocorrectEmojis = true;
let autocorrectCharEmojis = false;
let autocorrectEmojiShortcodes = true;
let autocomplete = true;
let quotes = true;
let fracts = true;

let autocorrections = {};

let longest = 0;

let symbolpatterns = [];
// Do not autocorrect for these patterns
let apatterns = [];

const emojiShortcodes = {};

/**
 * Apply autocorrect settings.
 *
 * @returns {void}
 */
function settings() {
    autocorrections = {};

    if (autocorrectSymbols) {
        Object.assign(autocorrections, symbols.symbols);
    }
    if (autocorrectEmojis) {
        Object.assign(autocorrections, symbols.emojis);
        if (autocorrectCharEmojis) {
            Object.assign(autocorrections, symbols.charEmojis);
        }
    }
    if (autocorrectEmojiShortcodes) {
        Object.assign(autocorrections, emojiShortcodes);
    }

    longest = 0;

    for (const symbol in autocorrections) {
        if (symbol.length > longest) {
            longest = symbol.length;
        }
    }
    console.log(longest);

    symbolpatterns = [];
    // Escape special characters
    const re = /[.*+?^${}()|[\]\\]/g;

    for (const symbol in autocorrections) {
        symbolpatterns.push(symbol.replace(re, "\\$&"));
    }

    apatterns = [];
    for (const x in autocorrections) {
        let length = 0;
        let index = x.length;

        for (const y in autocorrections) {
            if (x !== y) {
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
        }

        if (length > 0) {
            length = x.length - (index + length);
            if (length > 1) {
                apatterns.push(x.slice(0, -(length - 1)));
            }
        }
    }
    apatterns = apatterns.filter((item, pos) => apatterns.indexOf(item) === pos);
    console.log(apatterns);

    apatterns.forEach((symbol, index) => {
        apatterns[index] = symbol.replace(re, "\\$&");
    });

    symbolpatterns = new RegExp(`(${symbolpatterns.join("|")})$`);
    apatterns = new RegExp(`(${apatterns.join("|")})$`);
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
 * @param {Object} pickerResult
 * @returns {void}
 */
function set(pickerResult) {
    autocorrectEmojis = pickerResult.autocorrectEmojis;
    autocorrectCharEmojis = pickerResult.autocorrectCharEmojis;
    autocorrectEmojiShortcodes = pickerResult.autocorrectEmojiShortcodes;
    autocorrectSymbols = pickerResult.autocorrectSymbols;
    autocomplete = pickerResult.autocompleteEmojiShortcodes;
    quotes = pickerResult.autocorrectUnicodeQuotes;
    fracts = pickerResult.autocorrectUnicodeFracts;

    settings();
}

/**
 * Send autocorrect settings to content scripts.
 *
 * @param {Object} pickerResult
 * @returns {void}
 */
function apply(pickerResult) {
    set(pickerResult);

    browser.tabs.query({}).then((tabs) => {
        for (const tab of tabs) {
            browser.tabs.sendMessage(
                tab.id,
                {
                    "type": COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_CONTENT,
                    "autocomplete": autocomplete,
                    "quotes": quotes,
                    "fracts": fracts,
                    "autocorrections": autocorrections,
                    "longest": longest,
                    "symbolpatterns": symbolpatterns,
                    "apatterns": apatterns,
                    "emojiShortcodes": emojiShortcodes
                }
            ).catch(onError);
        }
    }).catch(onError);
}

/**
 * Init autocorrect module.
 *
 * @public
 * @returns {void}
 */
export async function init() {
    const pickerResult = await AddonSettings.get("pickerResult");

    for (const key in emojiMart.emojiIndex.emojis) {
        const emoji = emojiMart.emojiIndex.emojis[key];
        emojiShortcodes[emoji.colons] = emoji.native;
    }

    Object.freeze(emojiShortcodes);

    set(pickerResult);

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // console.log(message);
        if (message.type === COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_CONTENT) {
            const response = {
                "type": COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_CONTENT,
                "autocomplete": autocomplete,
                "quotes": quotes,
                "fracts": fracts,
                "autocorrections": autocorrections,
                "longest": longest,
                "symbolpatterns": symbolpatterns,
                "apatterns": apatterns,
                "emojiShortcodes": emojiShortcodes
            };
            // console.log(response);
            sendResponse(response);
        }
    });

    /* browser.tabs.query({}).then((tabs) => {
		for (let tab of tabs) {
			browser.tabs.executeScript(tab.id, {file: "content_scripts/autocorrect.js"});
		}
	}).catch(onError); */
}

BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_BACKGROUND, (request) => {
    // clear cache by reloading all options
    // await AddonSettings.loadOptions();

    return apply(request.optionValue);
});
