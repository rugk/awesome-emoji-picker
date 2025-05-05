import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as CommonMessages from "/common/modules/MessageHandler/CommonMessages.js";
import * as EmojiInteraction from "/common/modules/EmojiInteraction.js";
import * as ConfirmationHint from "./ConfirmationHint.js";

let pickerSettings;

/**
 * Return the HtmlElement that contains the emoji.
 *
 * Attention: As the frequently used emoji list duplicates the emoji, this just
 * always returns the first emoji it can find.
 *
 * @public
 * @param {Object|string} emoji
 * @returns {HTMLElement|null|undefined}
 */
export function getEmojiHtml(emoji) {
    const emojiQuestion = emoji.native || emoji;
    return document.querySelector("em-emoji-picker")?.shadowRoot?.querySelector(`.scroll [aria-label^="${emojiQuestion}"]`);
}

/**
 * Get the text for the confirmation message.
 *
 * @private
 * @param {boolean} isEmojiInserted
 * @param {boolean} isEmojiCopied
 * @returns {string|null}
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
        messageToBeShown = null;
    }

    return messageToBeShown;
}

/**
 * When an emoji is selected, .
 *
 * @public
 * @param {Object} emoji
 * @param {Event} event
 * @returns {Promise}
 */
export async function triggerOnSelect(emoji, event) {
    let confirmationPosition = null;
    if (event instanceof MouseEvent) {
        confirmationPosition = {
            left: event.pageX,
            top: event.pageY
        };
    }

    // get emoji that was clicked, note the target may often be the search box if the keyboard is used for emoji selection
    let clickedEmoji = getEmojiHtml(emoji) || event.target;

    const {
        closePopup,
        showConfirmationMessage,
        resultType
    } = pickerSettings;

    const {
        isInserted,
        isCopied
    } = await EmojiInteraction.insertOrCopy(emoji[resultType], {
        insertIntoPage: pickerSettings.automaticInsert,
        copyOnlyOnFallback: pickerSettings.emojiCopyOnlyFallback,
        copyToClipboard: pickerSettings.emojiCopy
    });

    const messageToBeShown = getUserMessageForResult(isInserted, isCopied);

    if (messageToBeShown) {
        // if no error happened, show confirmation message
        if (showConfirmationMessage) {
            await ConfirmationHint.show(confirmationPosition || clickedEmoji, messageToBeShown);
        }

        if (closePopup) {
            window.close();
        }
    } else {
        CommonMessages.showError("couldNotDoAction", true);
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
    pickerSettings = await AddonSettings.get("pickerResult");
}

// automatically init module.
init();
