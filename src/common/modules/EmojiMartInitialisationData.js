import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

const EMOJI_SHEET_DIR = "/popup/img/emoji-images";

/**
 * Hardcoded settings for emoji-mart picker
 *
 * @private
 * @type {Object}
 */
export const hardcodedSettings = Object.freeze({
    // color: "#ffb03b", // or #d42ecc ?
    // i18n: getEmojiMartLocalised(),
    autoFocus: true,
    // style: { border: "none" },
    theme: "auto",
    getSpritesheetURL: getEmojiSheet,
    locale: getBaseLanguageTag(),
    dynamicWidth: false, // will not work with WebExtension popups, the content defines the width
    emojiVersion: 15,
    previewEmoji: "star-struck"
});

/**
* Get all the settings for the Emoji picker.
*
* @public
* @returns {Promise<Object>}
*/
export async function getAllSettings() {
   return await AddonSettings.get("emojiPicker");
}

/**
 * Return the emoji sheet to use.
 *
 * Called from:
 * @link {https://github.com/missive/emoji-mart/blob/16978d04a766eec6455e2e8bb21cd8dc0b3c7436/packages/emoji-mart/src/components/Emoji/Emoji.tsx#L34}
 *
 * For more information see the download script in the `/scripts` directory.
 *
 * @private
 * @param {string} set
 * @returns {string} the URL to the emoji sheet
 */
function getEmojiSheet(set) {
    const sheetSize = 64;
    // returns local saved version to speed up loading
    return browser.runtime.getURL(`${EMOJI_SHEET_DIR}/${set}-${sheetSize}.png`);

    // default online source would be this one
    // const EMOJI_DATASOURCE_VERSION = "latest"; // with a fixed version, however
    // return `https://cdn.jsdelivr.net/npm/emoji-datasource-${set}@${EMOJI_DATASOURCE_VERSION}/img/${set}/sheets-256/64.png`;
}

/**
 * Fetching an URL in the browser and returns `null` in case of an error.
 *
 * Note: This implements some special handling for not found files, see:
 * https://github.com/mdn/content/issues/39197
 * https://chatgpt.com/share/68037901-df7c-8009-b91c-77cb44c8c93d
 *
 * @param {string} nonBrowserifiedUrl
 * @returns {Promise<null|Object>}
 */
async function tryFetchJson(nonBrowserifiedUrl) {
    try {
        console.log("Fetching", nonBrowserifiedUrl);
        const url = browser.runtime.getURL(nonBrowserifiedUrl);
        const response = await fetch(url);
        if (!response.ok) {
            console.warn("Non-ok response for", nonBrowserifiedUrl, response);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.warn("Fetch failed for", nonBrowserifiedUrl, error);
        return null;
    }
}

/**
 * Returns the basic language tag e.g. `en` only in `en-US`. `
 *
 * @returns string
 */
function getBaseLanguageTag() {
    return browser.i18n.getUILanguage().split("-")[0];
}

/**
 * Calculate whether the emoji picker title should be the long one (true) or not (false).
 *
 * It determinates this based on the emoji size and emojis shown per line.
 * It is manually crafted to make sure no line break occurs in the title. So when would occur,
 *
 * @param {Object} settings
 * @returns bool
 */
function shouldUseLongEmojiPickerTitle(settings) {
    switch (settings.emojiSize) {
        case 16:
            return settings.perLine >= 11;
        case 24:
            return settings.perLine >= 9;
        case 32:
            return settings.perLine >= 8;
        case 40:
            return settings.perLine >= 7;
        case 48:
            return settings.perLine >= 6;
        default:
            console.error(new RangeError(`EmojiSize ${settings.emojiSize} is out of range.`));
            return true;
    }
}

/**
 * Return emoji-mart data for it's initialisation.
 *
 * This can be passed to `init` or `new EmojiMart.Picker()`.
 *
 * @param {Object} [customSettings=null] The optionally adjusted settings. Addon settings et al. are already automatically loaded.
 * @returns {Promise<{
 *   data: () => Promise<import("../../node_modules/@emoji-mart/data/sets/15/native.json")>,
 *   i18n: () => Promise<import("../../node_modules/@emoji-mart/data/i18n/en.json")>,
 *   emojiButtonSize: number,
 *   autoFocus: boolean,
 *   theme: string,
 *   getSpritesheetURL: (set: string) => string,
 *   locale: string,
 *   dynamicWidth: boolean,
 *   emojiVersion: number,
 *   previewEmoji: string
 * }>}
 */
export async function getEmojiMartInitialisationData(customSettings = null) {
    const initProperties = {
        ...hardcodedSettings,
        ...await getAllSettings(),
        ...customSettings
    };
    initProperties.emojiButtonSize = initProperties.emojiSize + 12;

    console.debug("Using these emoji-mart settings:", initProperties);

    const initialisationData = {
        ...initProperties,
        data: async () => {
            const response = await fetch(browser.runtime.getURL(`/node_modules/@emoji-mart/data/sets/${initProperties.emojiVersion}/${initProperties.set}.json`));

            return await response.json();
        },
        i18n: async () => {
            let locale = browser.i18n.getUILanguage();
            console.log("Getting i18n for", locale);

            let i18nData = await tryFetchJson(`/node_modules/@emoji-mart/data/i18n/${locale}.json`)
                || await tryFetchJson(`/node_modules/@emoji-mart/data/i18n/${getBaseLanguageTag()}.json`)
                || await tryFetchJson("/node_modules/@emoji-mart/data/i18n/en.json");

            if (!i18nData) {
                console.error("Getting response fallback failed.");
            }

            // show the extension name by default
            if (shouldUseLongEmojiPickerTitle(initProperties)) {
                i18nData.pick = browser.i18n.getMessage("extensionName");
            } else {
                i18nData.pick = browser.i18n.getMessage("extensionNameShort");
            }
            return i18nData;
        },
    };

    console.debug("Initialisation data for emoji-mart:", initialisationData);
    return initialisationData;
}
