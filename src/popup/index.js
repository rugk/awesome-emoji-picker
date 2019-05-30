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
createPicker().then(() => {
    // to be sure, trigger focus manually afterwards
    // auto-focus does not always work properly, see
    // https://github.com/rugk/awesome-emoji-picker/issues/28
    document.querySelector(".emoji-mart-search > input").focus();
});

RandomTips.init(tips).then(() => {
    RandomTips.setContext("popup");
    RandomTips.showRandomTipIfWanted();
});
