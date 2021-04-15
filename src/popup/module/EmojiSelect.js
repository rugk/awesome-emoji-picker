import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as CommonMessages from "/common/modules/MessageHandler/CommonMessages.js";

import * as EmojiInteraction from "/common/modules/EmojiInteraction.js";

import * as ConfirmationHint from "./ConfirmationHint.js";

/**
 * Saves the last click that selected an emoji.
 *
 * @private
 * @property {int} posX
 * @property {int} posY
 * @property {Object} forEmoji
 * @type {Object}
 */
const lastClick = {};

let optionPickerResult;

/**
 * Save the position of the click, if needed.
 *
 * @public
 * @param {Object} emoji
 * @param {Object} event
 * @returns {void}
 */
export function saveClickPosition(emoji, event) {
    // in case of an invalid event, ignore it
    // see https://github.com/missive/emoji-mart/issues/342
    if (event.pageX === 0 && event.pageY === 0) {
        return;
    }

    lastClick.posX = event.pageX;
    lastClick.posY = event.pageY;
    lastClick.forEmoji = emoji;
}

/**
 * Return the HtmlElement that contains the emoji.
 *
 * Attention: As the frequently used emoji list duplicates the emoji, this just
 * always returns the first emoji it can find.
 *
 * @public
 * @param {Object|string} emoji
 * @returns {HTMLElement}
 */
export function getEmojiHtml(emoji) {
    const emojiQuestion = emoji.native || emoji;
    return document.querySelector(`.emoji-mart-scroll [aria-label^="${emojiQuestion}"]`);
}

/**
 * Get the text for the confirmation message.
 *
 * @private
 * @param {boolean} isEmojiInserted
 * @param {boolean} isEmojiCopied
 * @returns {Promise}
 */
function getUserMessageForResult(isEmojiInserted, isEmojiCopied) {
    let messageToBeShown;
    if (isEmojiInserted && isEmojiCopied) {
        messageToBeShown = "EmojiCopiedAndInserted";
    } else if (isEmojiInserted) {
        messageToBeShown = "EmojiInserted";
    } else if (isEmojiCopied) {
        messageToBeShown = "EmojiCopied";
    } else {
        // some other error happened
        messageToBeShown = "";
    }

    return messageToBeShown;
}

/**
 * When an emoji is selected, .
 *
 * @public
 * @param {Object} emoji
 * @returns {Promise}
 */
export async function triggerOnSelect(emoji) {
    const {
        closePopup,
        showConfirmationMessage,
        resultType
    } = optionPickerResult;

    // get HTML element that was clicked
    let clickedEmoji = document.activeElement || getEmojiHtml(emoji);

    // if we clicked on the exact same emoji, use the last click psoition
    // (object reference comparison deliberately!)
    if (lastClick.forEmoji === emoji) {
        clickedEmoji = {
            left: lastClick.posX,
            top: lastClick.posY,
        };
    }

    const {
        isInserted,
        isCopied
    } = await EmojiInteraction.insertOrCopy(emoji[resultType], {
        insertIntoPage: optionPickerResult.automaticInsert,
        copyOnlyOnFallback: optionPickerResult.emojiCopyOnlyFallback,
        copyToClipboard: optionPickerResult.emojiCopy
    });

    const messageToBeShown = getUserMessageForResult(isInserted, isCopied);

    if (!messageToBeShown) {
        CommonMessages.showError("couldNotDoAction", true);
    } else {
        // if no error happened, show confirmation message
        if (showConfirmationMessage) {
            await ConfirmationHint.show(clickedEmoji, messageToBeShown);
        }

        if (closePopup) {
            window.close();
        }
    }
}

/**
 * Init module.
 *
 * @public
 * @returns {Promise}
 */
export async function init() {
    // request it/preload it here, so we need no async request to access it
    // later
    optionPickerResult = await AddonSettings.get("pickerResult");
}

// automatically init module.
init();
