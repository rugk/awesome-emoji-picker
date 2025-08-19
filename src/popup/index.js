/**
 * Starter module for popup.
 *
 */

import { tips } from "/common/modules/data/Tips.js";
import * as RandomTips from "/common/modules/RandomTips/RandomTips.js";
import * as EnvironmentDetector from "/common/modules/EnvironmentDetector/EnvironmentDetector.js";
import * as EmojiPicker from "./module/EmojiPicker.js";

/**
 * Creates the emoji picker.
 *
 * @private
 * @returns {Promise}
 */
function createPicker() {
    return EmojiPicker.init();
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
 * @param {number} [retries] how often to retry at most
 * @param {number} [delay] how many ms to re-check
 * @returns {Promise<any>}
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
        return Promise.resolve();
    }

    if (retries <= 0) {
        throw new TypeError("no re-tries left for focusing"); // will be converted into rejected promise
    }

    await wait(delay);

    // retry
    return focusElement(element, retries - 1, delay);
}

/**
 * Resizes the element so it does not overflow anymore or alternatively moves it down.
 *
 * Only works on {@see EmojiPicker}/emoji-mart.
 *
 * @param {HTMLElement} emojiMartComponent
 * @param {symbol} popupType
 */
function centerOrResizeDependingOnOverflowOrUnderflow(emojiMartComponent, popupType) {
    console.info("Detected popup type", popupType, ", centering picker.");
    emojiMartComponent.style.removeProperty("border");
    document.body.classList.add("center-picker");

    // setAttribute with boolean flags does not work
    // see https://github.com/missive/emoji-mart/issues/992
    emojiMartComponent.setAttribute("dynamicWidth", "true");
    // @ts-ignore
    emojiMartComponent.props.dynamicWidth = true;
}

EmojiPicker.initEmojiMartStorage();
createPicker().then(async () => {
    // adjust with of picker, if it overflows
    await EnvironmentDetector.waitForPopupOpen().catch(() => {}); // ignore errors
    const popupType = EnvironmentDetector.getPopupType();
    const emojiMartComponent = document.querySelector("em-emoji-picker");

    if (!(emojiMartComponent instanceof HTMLElement)) {
        throw new TypeError("Emoji-mart component is not created, but should already have been!");
    }

    if (popupType === EnvironmentDetector.POPUP_TYPE.OVERFLOW ||
        popupType === EnvironmentDetector.POPUP_TYPE.NEW_PAGE) {
        // WORKAROUND: Needs to execute when the element has been rendered already, otherwise the overflow detection fails.
        // TODO: may need to be changed into a MutationObserver or so.
        setTimeout(() => {
            centerOrResizeDependingOnOverflowOrUnderflow(emojiMartComponent, popupType);
        }, 100);
    } else {
        document.body.classList.add("in-popup");
    }

    setTimeout(() => {
        document.body.classList.add("loaded");
    }, 200);
});

RandomTips.init(tips).then(() => {
    RandomTips.setContext("popup");
    RandomTips.showRandomTipIfWanted();
});
