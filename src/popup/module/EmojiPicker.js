/**
 * Creates and manages the Emoji picker.
 *
 * @public
 */

import * as EmojiSelect from "./EmojiSelect.js";
import data from "/node_modules/@emoji-mart/data";
import * as EmojiMart from "/node_modules/emoji-mart/dist/index.js";

let emojiPicker = null;

const EMOJI_SHEET_DIR = "/popup/img/emoji-images";

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
    onSelect: EmojiSelect.triggerOnSelect,
    onClick: EmojiSelect.saveClickPosition,
    style: { "border": "none" },
    theme: "auto",
    backgroundImageFn: getEmojiSheet,
    title: browser.i18n.getMessage("extensionNameShort"), // show the extension name by default
    emoji: "star-struck" // default emoji
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
 * Creates the emoji picker.
 *
 * @public
 * @param {Object} settings
 * @returns {Promise}
 */
export function init(settings) {
    const initProperties = Object.assign(settings, hardcodedSettings);

    console.debug("Using these emoji-mart settings:", initProperties);

    const emojiPicker = new EmojiMart.Picker({ ...initProperties, data: data });
    document.body.appendChild(emojiPicker);
}
