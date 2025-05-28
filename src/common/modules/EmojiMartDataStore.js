/**
 * Return the options for the emoji picker.
 *
 * @public
 */

import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

let emojiMartStorage = {};

/**
 * Reloads the cached settings from the AddonSettings.
 *
 * This is used to ensure that the syncronous settings are up-to-date.
 * See {@see https://github.com/missive/emoji-mart/issues/987} for why this is needed.
 *
 * Make sure to call this before {@see get} in order to have fresh data. This is especially
 * important when you cann this form a long-running process like the background script.
 *
 * @private
 * @returns {Promise<void>}
 */
export async function reloadCachedSettings() {
    await AddonSettings.loadOptions();
    emojiMartStorage = await AddonSettings.get("emojiMart");
}

/**
 * Retrieves a stored value by key.
 * @param {string} key - The key of the stored value.
 * @returns {any} The retrieved value.
 */
export function get(key) {
    if (!emojiMartStorage) {
        console.warn("emojiMartStorage is not set, reloading, this should not happen and can cause missing data");
        reloadCachedSettings();
    }

    const requestedSetting = emojiMartStorage[key];
    console.info(`Value was requested for '${key}' (got:`, requestedSetting, ")");
    return requestedSetting;
};

/**
 * Stores a value under a specific key.
 * @param {string} key - The key to store the value under.
 * @param {any} value - The value to store.
 * @returns {Promise<void>} A promise that resolves when the value is stored. **Note:** This is incompatible aka not-used by/with emoji-mart.
 */
export function set(key, value) {
    console.debug("Saving", value, `in '${key}'`);
    emojiMartStorage[key] = value;

    // and actually save the new value
    // and return promise so async things may be noticed
    return AddonSettings.set("emojiMart", emojiMartStorage);
}

/**
 * Sets the emoji-mart data storage for the instance of emoji-mart.
 *
 * @returns {Promise<void>}
 * @seealso https://github.com/missive/emoji-mart/blob/main/packages/emoji-mart/src/helpers/store.ts
 * @param {import("../../node_modules/emoji-mart/dist/index.d.js")} [emojiMartInstance]
 */
export async function initEmojiMartStorage(emojiMartInstance) {
    if (!emojiMartInstance) {
        throw new TypeError("emojiMartInstance is not set");
    }

    // get saved values
    await reloadCachedSettings();

    emojiMartInstance.Store.get = get;
    emojiMartInstance.Store.set = set;
}

