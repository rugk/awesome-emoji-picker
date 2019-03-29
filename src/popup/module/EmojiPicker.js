/**
 * Creates and manages the Emoji picker.
 *
 * @public
 */

let emojiPicker = null;

// How many ms to wait between checking whether emoji mart is already loaded.
export const EMOJI_MART_POLLING = 10; // ms

/**
 * Hardcoded settings for emoji-mart picker
 *
 * @private
 * @type {Object}
 */
export const hardcodedSettings = Object.freeze({
    autoFocus: true,
    native: true,
    emojiTooltip: true,
    onSelect: copyEmoji,
    style: { "border": "none" }
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
