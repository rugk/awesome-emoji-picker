/**
 * Starter module for popup.
 *
 */

import { tips } from "/common/modules/data/Tips.js";
import * as RandomTips from "/common/modules/RandomTips/RandomTips.js";
import * as EmojiSettings from "./module/EmojiSettings.js";
import * as EmojiPicker from "./module/EmojiPicker.js";

/**
 * Sets the emoji-mart data storage.
 *
 * @private
 * @returns {void}
 * @see https://github.com/missive/emoji-mart#storage
 */
function initEmojiMartStorage() {
    EmojiSettings.initEmojiMartStorage();
}

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
}

initEmojiMartStorage();
createPicker();

RandomTips.init(tips).then(() => {
    RandomTips.setContext("popup");
    RandomTips.showRandomTipIfWanted();
});
