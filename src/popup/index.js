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
    EmojiPicker.init(
        await EmojiSettings.getAllSettings()
    );
    return Promise.resolve();
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
    const wait = (ms) => new Promise((func) => {
        setTimeout(func, ms);
    });

    element.focus();

    await wait();

    // if element is focused, we are lucky
    if (document.activeElement === element) {
        console.log(element, "focused with", retries, "retries left, at delay", delay);
        return;
    }

    if (retries <= 0) {
        throw new TypeError("no re-tries left for focusing"); // will be converted into rejected promise
    }

    await wait(delay);

    // retry
    return focusElement(element, retries - 1, delay);
}

initEmojiMartStorage();
createPicker();

RandomTips.init(tips).then(() => {
    RandomTips.setContext("popup");
    RandomTips.showRandomTipIfWanted();
});
