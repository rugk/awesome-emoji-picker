/**
 * Creates and manages the Emoji picker.
 *
 * @public
 */

import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as PageHandler from "./PageHandler.js";
import * as ConfirmationHint from "./ConfirmationHint.js";

let emojiPicker = null;
let optionPickerResult = {};

const EMOJI_SHEET_DIR = "/popup/img/emoji-images";
const CLIPBOARD_WRITE_PERMISSION = {
    permissions: ["clipboardWrite"]
};

let addonHasClipboardWritePermission = false;

/**
 * Hardcoded settings for emoji-mart picker
 *
 * @private
 * @type {Object}
 */
export const hardcodedSettings = Object.freeze({
    color: "#ffb03b", // or #d42ecc ?
    i18n: getEmojiMartLocalised(),
    autoFocus: true,
    onSelect: copyEmoji,
    style: { "border": "none" },
    backgroundImageFn: getEmojiSheet
});

/**
 * Return the translated strings for emoji-mart.
 *
 * @private
 * @returns {Object}
 * @see https://github.com/missive/emoji-mart#i18n
 */
function getEmojiMartLocalised() {
    return {
        search: browser.i18n.getMessage("emojiMartSearch"),
        clear: browser.i18n.getMessage("emojiMartClear"), // Accessible label on "clear" button
        notfound: browser.i18n.getMessage("emojiMartNoEmojiFound"),
        skintext: browser.i18n.getMessage("emojiMartSkinText"),
        categories: {
            search: browser.i18n.getMessage("emojiMartCategorySearch"),
            recent: browser.i18n.getMessage("emojiMartCategoryRecent"),
            people: browser.i18n.getMessage("emojiMartCategoryPeople"),
            nature: browser.i18n.getMessage("emojiMartCategoryNature"),
            foods: browser.i18n.getMessage("emojiMartCategoryFoods"),
            activity: browser.i18n.getMessage("emojiMartCategoryActivity"),
            places: browser.i18n.getMessage("emojiMartCategoryPlaces"),
            objects: browser.i18n.getMessage("emojiMartCategoryObjects"),
            symbols: browser.i18n.getMessage("emojiMartCategorySymbols"),
            flags: browser.i18n.getMessage("emojiMartCategoryFlags"),
            custom: browser.i18n.getMessage("emojiMartCategoryCustom"),
        },
        categorieslabel: browser.i18n.getMessage("emojiMartCategoriesLabel"), // Accessible title for the list of categories
        skintones: {
            1: browser.i18n.getMessage("emojiMartSkintone1"),
            2: browser.i18n.getMessage("emojiMartSkintone2"),
            3: browser.i18n.getMessage("emojiMartSkintone3"),
            4: browser.i18n.getMessage("emojiMartSkintone4"),
            5: browser.i18n.getMessage("emojiMartSkintone5"),
            6: browser.i18n.getMessage("emojiMartSkintone6"),
        }
    };
}

/**
 * Copy the Emoji to clipboard, once it has been selected.
 *
 * @private
 * @param {Object} emoji
 * @returns {void}
 */
async function copyEmoji(emoji) {
    // get HTML element that was clicked
    const clickedEmoji = document.activeElement || getEmojiHtml(emoji);

    // destructure config
    const {
        resultType,
        automaticInsert,
        emojiCopyOnlyFallback,
        closePopup
    } = optionPickerResult;
    let emojiCopy = optionPickerResult.emojiCopy;

    console.log("Action triggered for emoji:", emoji);

    // get type to use
    const emojiText = emoji[resultType];

    // insert emoji
    let emojiInsertResult = Promise.resolve(); // successful by default
    if (automaticInsert) {
        emojiInsertResult = PageHandler.insertIntoPage(emojiText).then(console.log);
    }

    // wait for successful execution, if wanted
    if (emojiCopyOnlyFallback) {
        await (emojiInsertResult.then(() => {
            // if successful, do not copy emoji
            emojiCopy = false;
        }).catch(() => {
            console.error("Insertion into page failed. Use emoji copy fallback.");

            if (addonHasClipboardWritePermission) {
                emojiCopy = true;
            } else {
                console.error("Well, actually…, we cannot fallback, as we miss the clipboardWrite permission");
                // Note: We cannot request the permission now, because of the same reason why we cannot actually
                // copy without clipboardWrite permission (this is no user action anymore)

                // TODO: show visible error to the user!!
            }

            // resolve promise, so await continues
        }));
    }

    // copy to clipboard
    let emojiCopyResult = Promise.resolve(); // successful by default
    if (emojiCopy) {
        // WARNING: If there is an asyncronous waiting (await) before, we need to
        // request the clipboardWrite permission to be able to do this, as the
        // function call is then not anymore assigned to a click handler
        // TODO: rejection with undefined error -> MOZILA BUG
        emojiCopyResult = navigator.clipboard.writeText(emojiText);
    }

    return Promise.all([emojiInsertResult, emojiCopyResult]).finally(async () => {
        await ConfirmationHint.show(clickedEmoji, "emojiCopied");

        if (closePopup) {
            window.close();
        }
    });
}

/**
 * Return the emoji sheet to use.
 *
 * @private
 * @param {string} set
 * @param {string} sheetSize
 * @returns {string} the URL to the emoji sheet
 */
function getEmojiSheet(set, sheetSize) {
    // returns local saved version to speed up loading
    return browser.runtime.getURL(`${EMOJI_SHEET_DIR}/${set}-${sheetSize}.png`);

    // default online source would be this one
    // const EMOJI_DATASOURCE_VERSION = "latest"; // with a fixed version, however
    // return `https://unpkg.com/emoji-datasource-${set}@${EMOJI_DATASOURCE_VERSION}/img/${set}/sheets-256/${sheetSize}.png`;
}

/**
 * Change the properties of the Emoji selector.
 *
 * @public
 * @param {Object} properties
 * @returns {void}
 */
export function setAttribute(properties) {
    emojiPicker.setAttribute("props-json", JSON.stringify(properties));
}

/**
 * Return the HtmlElement that contains the emoji.
 *
 * @public
 * @param {Object|string} emoji
 * @returns {HtmlElement}
 */
export function getEmojiHtml(emoji) {
    const emojiQuestion = emoji.native || emoji;
    return document.querySelector(`.emoji-mart-scroll [aria-label^="${emojiQuestion}"]`);
}

/**
 * Creates the emoji picker.
 *
 * @public
 * @param {Object} settings
 * @returns {Promise}
 */
export async function init(settings) {
    const initProperties = Object.assign(settings, hardcodedSettings);

    // request it/preload it here, so we need no async request to access it
    // later
    optionPickerResult = await AddonSettings.get("pickerResult");
    // query permission values, so they can be accessed syncronously
    addonHasClipboardWritePermission = await browser.permissions.contains(CLIPBOARD_WRITE_PERMISSION);

    console.debug("Using these emoji-mart settings:", initProperties);

    const promiseCreateElement = window.emojiMart.definePicker("emoji-picker", initProperties);

    return promiseCreateElement.then(() => {
        emojiPicker = document.createElement("emoji-picker");
        document.body.appendChild(emojiPicker);
    });
}
