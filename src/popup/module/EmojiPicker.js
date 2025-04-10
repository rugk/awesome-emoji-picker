/**
 * Creates and manages the Emoji picker.
 *
 * @public
 */

import * as EmojiSelect from "./EmojiSelect.js";
import * as EmojiMart from "../../node_modules/emoji-mart/dist/module.js";

let emojiPicker = null;

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
    onEmojiSelect: EmojiSelect.triggerOnSelect,
    // onClickOutside: EmojiSelect.saveClickPosition, // TOOD: ??
    // style: { border: "none" },
    theme: "auto",
    getSpritesheetURL: getEmojiSheet,
    // title: browser.i18n.getMessage("extensionNameShort"), // show the extension name by default
    dynamicWidth: false, // will not work with WebExtension popups, the content defines the width
    // emojiButtonColors:  // TODO: ??,
    emojiVersion: 15 // TODO: maybe re-enable auto-detection when fetch workaround works
});

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
 * @returns {void}
 */
export function init(settings) {
    const initProperties = Object.assign(settings, hardcodedSettings);
    initProperties.emojiButtonSize = initProperties.emojiSize + 12;

    console.debug("Using these emoji-mart settings:", initProperties);

    const emojiPicker = new EmojiMart.Picker({ ...initProperties, data: async () => {
        const response = await fetch(browser.runtime.getURL(`/node_modules/@emoji-mart/data/sets/${initProperties.emojiVersion}/${initProperties.set}.json`));

        return await response.json();
    }});

    // NOTE: Typing is not updated yet, so cannot be used here: https://github.com/missive/emoji-mart/issues/576
    // @ts-ignore
    document.body.append(emojiPicker);
    console.info("Created EmojiPicker component:", emojiPicker);
}
