/**
 * Return the options for the emoji picker.
 *
 * @public
 */

import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

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
export function getAllSettings() {
    return AddonSettings.get("emojiPicker");
}
