/**
 * Return the options for the emoji picker.
 *
 * @public
 */

import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

let emojiMartStorage = {};

/**
 * Get the specific setting for an element.
 *
 * @todo create
 * @public
 * @param {string} emoji
 * @returns {string}
 */
export function copyEmoji(emoji) {
    navigator.clipboard.writeText(emoji.native);
}

/**
 * Get all the settings for the Emoji picker.
 *
 * @public
 * @returns {Object}
 */
export async function getAllSettings() {
    const settings = await AddonSettings.get("emojiPicker");
    settings.autoFocus = true;
    return settings;
}

/**
 * Sets the emoji-mart data storage.
 *
 * @private
 * @returns {void}
 * @see https://github.com/missive/emoji-mart#storage
 */
export async function initEmojiMartStorage() {
    // get saved values
    emojiMartStorage = await AddonSettings.get("emojiMart");

    window.emojiMart.setDataStore({
        getter: (key) => {
            return emojiMartStorage[key];
        },

        setter: (key, value) => {
            emojiMartStorage[key] = value;

            // and actually save the new value
            // and return promise so async things are noticed
            return AddonSettings.set("emojiMart", emojiMartStorage);
        }
    });
}
