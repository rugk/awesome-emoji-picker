/**
 * Starter module for popup.
 *
 */

import * as EmojiSettings from "./module/EmojiSettings.js";
import * as EmojiPicker from "./module/EmojiPicker.js";

/**
 * Creates the emoji picker.
 *
 * @private
 * @returns {Promise}
 */
async function createPicker() {
    EmojiPicker.init(
        await EmojiSettings.getAllSettings()
    ).catch(console.error);
}

createPicker();
