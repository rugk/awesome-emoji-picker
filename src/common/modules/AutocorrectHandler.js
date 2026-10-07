

import { isChrome } from "/common/modules/BrowserCompat/BrowserCompat.js";
import { getEmojiMartInitialisationData } from "./EmojiMartInitialisationData.js";
import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";
import * as symbols from "/common/modules/data/Symbols.js";

/**
 * Deferred initialization promise to ensure all data is ready before use handling messages
 *
 * @type {PromiseWithResolvers<void>}
 */
const { promise: isInitialized, resolve: initializedResolver } = Promise.withResolvers();

const settings = {
    enabled: null,
    autocorrectEmojis: null,
    autocorrectEmojiShortcodes: null,
    autocomplete: null,
    autocompleteSelect: null
};

/** Leaf node */
const LEAF = Symbol("leaf");

let autocorrections = {};

/** Longest autocorrection */
let longest = 0;

/** @type {RegExp|null} */
let symbolpatterns = null;

/**
 * Exceptions, do not autocorrect for these patterns
 *
 * @type {RegExp|null}
 */
let antipatterns = null;

const emojiShortcodes = {};

/** This Promise is pending while setSettings() is in progress, and is resolved at all other times. */
let settingsReady = Promise.resolve();

/**
 * Traverse Trie tree of objects to create RegEx.
 *
 * @param {Object.<string, object | boolean>} tree
 * @returns {string}
 */
function createRegEx(tree) {
    const alternatives = [];
    const characterClass = [];

    /** escape special characters */
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
        ({ symbolpatternsRegexpString, antipatternsRegexpString } = await browser.storage.session.get({
            symbolpatternsRegexpString: "",
            antipatternsRegexpString: ""
        }));
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
                        ({ length } = y);
                    } else if (aindex === index && y.length > length) {
                        ({ length } = y);
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
    /** @type {{promise: Promise<void>, resolve: () => void}} */
    const { promise, resolve } = Promise.withResolvers();
    settingsReady = promise;

    settings.enabled = autocorrect.enabled;
    settings.autocorrectEmojis = autocorrect.autocorrectEmojis;
    settings.autocorrectEmojiShortcodes = autocorrect.autocorrectEmojiShortcodes;
    settings.autocomplete = autocorrect.autocompleteEmojiShortcodes;
    settings.autocompleteSelect = autocorrect.autocompleteSelect;

    if (settings.enabled) {
        await applySettings(/* forceRebuild= */ modified);
    }

    resolve();
}

/**
 * Send autocorrect settings to content scripts.
 *
 * @param {object} autocorrect
 * @returns {Promise<void>}
 */
async function sendSettings(autocorrect) {
    const wasEnabled = settings.enabled;
    settingsReady = setSettings(autocorrect, /* modified= */ true);
    await settingsReady;

    const IS_CHROME = await isChrome();

    try {
        const tabs = await browser.tabs.query({});
        await Promise.allSettled(
            tabs.map((tab) => sendSettingsToTab(tab, IS_CHROME))
        );
    } catch (error) {
        console.error("Error querying tabs:", error);
    }

    // If transitioning to disabled, stop future injections
    if (wasEnabled && !settings.enabled) {
        await unregisterAutocorrectScript();
    }
}

/**
 * Send autocorrect settings to a specific tab.
 *
 * @param {browser.tabs.Tab} tab
 * @param {boolean} isChrome
 * @returns {Promise<void>}
 */
async function sendSettingsToTab(tab, isChrome) {
    if (!tab.id) {
        return;
    }
    try {
        await browser.tabs.sendMessage(tab.id, autocorrectContentMessage(isChrome));
    } catch (error) {
        console.error(
            `Error sending autocorrect settings to tab ${tab.id}:`,
            error
        );
    }
};

/**
 * Return the message object containing autocorrect settings and patterns to be sent to content scripts.
 *
 * @param {boolean} isChrome
 * @returns {object}
 */
function autocorrectContentMessage(isChrome) {
    return {
        type: COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_CONTENT,
        enabled: settings.enabled,
        autocomplete: settings.autocomplete,
        autocompleteSelect: settings.autocompleteSelect,
        autocorrections,
        longest,
        symbolpatterns: isChrome ? symbolpatterns.source : symbolpatterns,
        antipatterns: isChrome ? antipatterns.source : antipatterns,
        emojiShortcodes
    };
}

/**
 * Register the autocorrect content script dynamically.
 *
 * @returns {Promise<void>}
 */
async function registerAutocorrectScript() {
    const existing = await browser.scripting.getRegisteredContentScripts({ ids: ["autocorrect"] });
    if (existing.length > 0) {
        return;
    }

    await browser.scripting.registerContentScripts([{
        id: "autocorrect",
        matches: ["<all_urls>"],
        allFrames: true,
        js: ["/content_scripts/autocorrect.js"],
        persistAcrossSessions: true,
        runAt: "document_idle"
    }]);
}

/**
 * Unregister the autocorrect content script.
 *
 * @returns {Promise<void>}
 */
async function unregisterAutocorrectScript() {
    try {
        await browser.scripting.unregisterContentScripts({ ids: ["autocorrect"] });
    } catch {
        // Not registered. Safely ignore.
    }
}

/**
 * Inject the autocorrect script into all currently open tabs.
 * Used immediately after enabling autocorrect so existing tabs get the script
 * without requiring a page reload.
 *
 * @returns {Promise<void>}
 */
async function injectIntoExistingTabs() {
    const IS_CHROME = await isChrome();

    const tabs = await browser.tabs.query({}).catch(() => []);
    await Promise.allSettled(
        tabs.map(async (tab) => {
            if (!tab.id) {
                return;
            }
            try {
                await browser.scripting.executeScript({
                    target: { tabId: tab.id, allFrames: true },
                    files: ["/content_scripts/autocorrect.js"]
                });
                await sendSettingsToTab(tab, IS_CHROME);
            } catch {
                // Tabs such as about:, moz-extension:, and internal pages will throw. Safely ignore.
            }
        })
    );
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

    // Thunderbird
    // Replace this with manifest.json registration when the fix for this bug is deployed to Thunderbird ESR:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1902843
    browser.scripting?.compose?.registerScripts?.([
        {
            id: "autocorrect-compose",
            js: ["/content_scripts/autocorrect.js"]
        }
    ]);

    await setSettings(autocorrect, /* modified= */ false);
    initializedResolver();
}

BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_BACKGROUND, (request) => {
    // clear cache by reloading all options
    // await AddonSettings.loadOptions();

    return sendSettings(request.optionValue);
});

BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_REGISTER_SCRIPT, async () => {
    // Wait for any in-flight setSettings() from AUTOCORRECT_BACKGROUND to finish
    // before injecting, so content scripts get the latest patterns on initial load.
    await settingsReady;
    await registerAutocorrectScript();
    await injectIntoExistingTabs();
});

// Handle host permission being externally revoked (e.g., via browser settings UI)
browser.permissions.onRemoved?.addListener(async (permissions) => {
    if (permissions.origins?.includes("<all_urls>")) {
        await unregisterAutocorrectScript();
    }
});

browser.runtime.onMessage.addListener(async (message, _sender) => {
    const IS_CHROME = await isChrome();

    if (message.type === COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_CONTENT) {
        // Ensure autocorrect data is initialized before responding to content script requests.
        await isInitialized;
        return autocorrectContentMessage(IS_CHROME);
    }
});

console.warn("background: AutocorrectHandler loaded");
