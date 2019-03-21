/**
 * Creates and manages the Emoji picker.
 *
 * @public
 */

let emojiPicker = null;

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
    const promiseCreateElement = window.defineEmojiMartElement("emoji-picker", Object.assign({
        autoFocus: true,
        native: true,
        emojiTooltip: true,
        onSelect: copyEmoji
    }, settings));

    return promiseCreateElement.then(() => {
        emojiPicker = document.createElement("emoji-picker");
        document.body.appendChild(emojiPicker);
    });
}
