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

/**
 * Focus element.
 *
 * Needs to retry, because sometimes this does not work.
 *
 * By default it retries 20x in 50ms intervals, i.e. 1 second.
 *
 * @public
 * @param {HTMLElement} element the element to focus
 * @param {number} [retries=10] how often to retry at most
 * @param {number} [delay=10] how many ms to re-check
 * @returns {Promise}
 */
export async function focusElement(element, retries = 20, delay = 50) {
    const wait = (ms) => new Promise((func) => setTimeout(func, ms));

    element.focus();

    await wait();

    // if element is focussed, we are lucky
    if (document.activeElement === element) {
        console.log(element, "focussed with", retries, "retries left, at delay", delay);
        return;
    }

    if (retries <= 0) {
        throw new TypeError("no re-tries left for focussing"); // will be converted into rejected promise
    }

    await wait(delay);

    // retry
    return focusElement(element, retries - 1, delay);
}

initEmojiMartStorage();
createPicker().then(async () => {
    // to be sure, trigger focus manually afterwards
    // auto-focus does not always work properly, see
    // https://github.com/rugk/awesome-emoji-picker/issues/28 (now fixed)
    // https://github.com/rugk/awesome-emoji-picker/issues/86 / https://bugzilla.mozilla.org/show_bug.cgi?id=1623875
    focusElement(document.querySelector(".emoji-mart-search > input"));

    // adjust with of picker, if it overflows
    await EnvironmentDetector.waitForPopupOpen().catch(() => {}); // ignore errors
    const popupType = EnvironmentDetector.getPopupType();

    if (popupType === EnvironmentDetector.POPUP_TYPE.OVERFLOW ||
        popupType === EnvironmentDetector.POPUP_TYPE.NEW_PAGE) {
        // prevent overflow and stretch GUI (even if it is a up to 20% underflow)
        if (EnvironmentDetector.getOverflowInPercentage(EnvironmentDetector.SIZE.WIDTH) > -20) {
            // make popup smaller, so it fits
            document.querySelector(".emoji-mart").style.width = `${window.innerWidth - 20}px`;
            document.querySelector(".emoji-mart").style.height = `${window.innerHeight + 20}px`;

            setTimeout(() => {
                document.querySelector(".emoji-mart").style.width = "100vw";
            }, 50);

            // re-enlarge it at next redraw, so no scrollbars are shown
            setTimeout(() => {
                document.querySelector(".emoji-mart").style.width = `${window.innerWidth}px`;
                document.querySelector(".emoji-mart").style.removeProperty("height");

                // also vertically center on Android
                if (popupType === EnvironmentDetector.POPUP_TYPE.NEW_PAGE) {
                    document.querySelector(".emoji-mart").style.removeProperty("border");
                    document.documentElement.classList.add("center-picker");
                }
            }, 60);
        } else {
            // center popup
            document.querySelector(".emoji-mart").style.removeProperty("border");
            document.documentElement.classList.add("center-picker");
        }

    }
});

RandomTips.init(tips).then(() => {
    RandomTips.setContext("popup");
    RandomTips.showRandomTipIfWanted();
});
