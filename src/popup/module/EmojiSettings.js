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
 * @returns {void}
 */
export function copyEmoji(emoji) {
    navigator.clipboard.writeText(emoji.native);
}

/**
 * Get all the settings for the Emoji picker.
 *
 * @public
 * @returns {Promise<Object>}
 */
export async function getAllSettings() {
    const settings = await AddonSettings.get("emojiPicker");
    return settings;
}

/**
 * Sets the emoji-mart data storage.
 *
 * @private
 * @returns {Promise<void>}
 * @see https://github.com/missive/emoji-mart#storage
 */
export async function initEmojiMartStorage() {
    // get saved values
    emojiMartStorage = await AddonSettings.get("emojiMart");

    // globalThis.emojiMart.setDataStore({
    //     getter: (key) => {
    //         return emojiMartStorage[key];
    //     },

    //     setter: (key, value) => {
    //         emojiMartStorage[key] = value;

    //         // and actually save the new value
    //         // and return promise so async things are noticed
    //         return AddonSettings.set("emojiMart", emojiMartStorage);
    //     }
    // });
}
