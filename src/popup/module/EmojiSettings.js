/**
 * Return the options for the emoji picker.
 *
 * @public
 */

import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as EmojiMart from "../../node_modules/emoji-mart/dist/module.js";

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
 * @see https://github.com/missive/emoji-mart/blob/main/packages/emoji-mart/src/helpers/store.ts
 */
export async function initEmojiMartStorage() {
    // get saved values
    emojiMartStorage = await AddonSettings.get("emojiMart");

    /**
     * Retrieves a stored value by key.
     * @param {string} key - The key of the stored value.
     * @returns {any} The retrieved value.
     */
    EmojiMart.Store.get = (key) => {
        const requestedSetting = emojiMartStorage[key];
        console.info(`Value was requested for '${key}' (got:`, requestedSetting, ")");
        return requestedSetting;
    };

    /**
     * Stores a value under a specific key.
     * @param {string} key - The key to store the value under.
     * @param {any} value - The value to store.
     */
    EmojiMart.Store.set = (key, value) => {
        console.info("Saving", value, `in '${key}'`);
        emojiMartStorage[key] = value;

        // and actually save the new value
        // and return promise so async things are noticed
        return AddonSettings.set("emojiMart", emojiMartStorage);
    }
}
