/**
 * Creates and manages the Emoji picker.
 *
 * @public
 */

let emojiPicker = null;

// How many ms to wait between checking whether emoji mart is already loaded.
export const EMOJI_MART_POLLING = 10; // ms
export const EMOJI_MART_WAIT_TRIES = 30; // 100ms * 30 = 3 seconds

let emojiMartWaitCounter = 0;

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
    onSelect: copyEmoji
});

/**
 * Waits until Emoji-Mart is loaded.
 *
 * @private
 * @returns {void}
 */
function waitForEmojiMartLoaded() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (window.defineEmojiMartElement !== undefined) {
                resolve();
            } else {
                emojiMartWaitCounter++;

                if (emojiMartWaitCounter > EMOJI_MART_WAIT_TRIES) {
                    reject(new Error("Timeout reached. Emoji-mart could not be found and was likely not loaded."));
                }
            }
        });
    });
}

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
export async function init(settings) {
    const initProperties = Object.assign(settings, hardcodedSettings);

    // if (window.defineEmojiMartElement !== undefined) {
    //     // await waitForEmojiMartLoaded();
    // }
    const promiseCreateElement = window.defineEmojiMartElement("emoji-picker", initProperties);

    return promiseCreateElement.then(() => {
        emojiPicker = document.createElement("emoji-picker");
        document.body.appendChild(emojiPicker);
    });
}
