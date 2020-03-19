/**
 * Starter module for popup.
 *
 */

import { tips } from "/common/modules/data/Tips.js";
import * as RandomTips from "/common/modules/RandomTips/RandomTips.js";
import * as EnvironmentDetector from "/common/modules/EnvironmentDetector/EnvironmentDetector.js";
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
createPicker().then(async () => {
    // to be sure, trigger focus manually afterwards
    // auto-focus does not always work properly, see
    // https://github.com/rugk/awesome-emoji-picker/issues/28
    document.querySelector(".emoji-mart-search > input").focus();

    // adjust with of picker, if it overflows
    await EnvironmentDetector.waitForPopupOpen().catch(() => {}); // ignore errors
    const isOverflowMenu = EnvironmentDetector.getPopupType() === EnvironmentDetector.POPUP_TYPE.OVERFLOW;

    if (isOverflowMenu) {
        // prevent overflow and stretch GUI (even if it is a upt o 20% underflow)
        if (EnvironmentDetector.getOverflowInPercentage(EnvironmentDetector.SIZE.WIDTH) > -20) {
            // make popup smaller, so it fits
            document.querySelector(".emoji-mart").style.width = `${window.innerWidth-20}px`;
            document.querySelector(".emoji-mart").style.height = `${window.innerHeight+20}px`;

            setTimeout(() => {
                document.querySelector(".emoji-mart").style.width = "100vw";
            }, 50);

            // re-enlarge it at next redraw, so no scrollbars are shown
            setTimeout(() => {
                document.querySelector(".emoji-mart").style.width = `${window.innerWidth}px`;
                document.querySelector(".emoji-mart").style.removeProperty("height");
            }, 60);

            setTimeout(() => {
                // uhm re-focus // TODO: report bugzilla BUGGG!
                document.querySelector(".emoji-mart-search > input").focus();
            }, 70);
        } else {
            // center popup
            document.body.style.alignSelf = "center"; // flex center
        }

    }
});

RandomTips.init(tips).then(() => {
    RandomTips.setContext("popup");
    RandomTips.showRandomTipIfWanted();
});
