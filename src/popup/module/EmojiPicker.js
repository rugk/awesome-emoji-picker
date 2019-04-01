/**
 * Creates and manages the Emoji picker.
 *
 * @public
 */

let emojiPicker = null;

const EMOJI_SHEET_DIR = "/popup/img/emoji-images";

/**
 * Hardcoded settings for emoji-mart picker
 *
 * @private
 * @type {Object}
 */
export const hardcodedSettings = Object.freeze({
    autoFocus: true,
    onSelect: copyEmoji,
    style: { "border": "none" },
    backgroundImageFn: getEmojiSheet,
    // emojiSize: 64
});

/**
 * Copy the Emoji to clipboard, once it has been selected.
 *
 * @private
 * @param {Object} emoji
 * @returns {void}
 */
function copyEmoji(emoji) {
    navigator.clipboard.writeText(emoji.native);
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

    const promiseCreateElement = window.emojiMart.definePicker("emoji-picker", initProperties);

    return promiseCreateElement.then(() => {
        emojiPicker = document.createElement("emoji-picker");
        document.body.appendChild(emojiPicker);
    });
}
