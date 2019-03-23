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
    await EmojiPicker.init(
        await EmojiSettings.getAllSettings()
    ).catch(console.error);

    window.setTimeout(() => {
        // EmojiPicker.setAttribute({autoFocus: false});
        // EmojiPicker.setAttribute({autoFocus: true});
    }, 1000);
        window.setTimeout(() => {
            // EmojiPicker.setAttribute({autoFocus: false});
            EmojiPicker.setAttribute({autoFocus: true});
        }, 2000);
}

createPicker();
