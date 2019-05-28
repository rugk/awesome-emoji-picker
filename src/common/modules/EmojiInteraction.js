import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

import * as PageHandler from "./PageHandler.js";

const CLIPBOARD_WRITE_PERMISSION = {
    permissions: ["clipboardWrite"]
};

let optionPickerResult = {};
let addonHasClipboardWritePermission = false;

/**
 * Errors in QR code generation
 *
 * @module QrLib/QrError
 */

export class PermissionError extends Error {
    constructor(message, ...params) {
        super(
            message || "No permission for this action.",
            ...params
        );
    }
}

/**
 * As per users settings, insert emoji into web page or copy to clipboard.
 *
 * @private
 * @param {Object} emoji
 * @returns {Promise}
 * @throws {Error}
 */
export async function insertOrCopy(emoji) {
    // destructure config
    const {
        resultType,
        automaticInsert,
        emojiCopyOnlyFallback
    } = optionPickerResult;
    let emojiCopy = optionPickerResult.emojiCopy;

    console.log("Action triggered for emoji:", emoji);

    // get type to use
    const emojiText = emoji[resultType];

    // insert emoji
    let emojiInsertResult = Promise.resolve(); // successful by default
    if (automaticInsert) {
        emojiInsertResult = PageHandler.insertIntoPage(emojiText).then(console.log);
    }

    // wait for successful execution, if wanted
    if (automaticInsert && emojiCopyOnlyFallback) {
        await (emojiInsertResult.then(() => {
            // if successful, do not copy emoji
            emojiCopy = false;
        }).catch(() => {
            console.error("Insertion into page failed. Use emoji copy fallback.");

            if (addonHasClipboardWritePermission) {
                emojiCopy = true;
            } else {
                console.error("Well, actually…, we cannot fallback, as we miss the clipboardWrite permission");
                // Note: We cannot request the permission now, because of the same reason why we cannot actually
                // copy without clipboardWrite permission (this is no user action anymore)

                throw new PermissionError("Permisson missing for clipboardWrite.");
            }

            // resolve promise, so await continues
        }));
    }

    // copy to clipboard
    let emojiCopyResult = Promise.resolve(); // successful by default
    if (emojiCopy) {
        // WARNING: If there is an asyncronous waiting (await) before, we need to
        // request the clipboardWrite permission to be able to do this, as the
        // function call is then not anymore assigned to a click handler
        // TODO: rejection with undefined error -> MOZILA BUG
        emojiCopyResult = navigator.clipboard.writeText(emojiText);
    }

    // find out results of operations
    let isEmojiCopied = emojiCopy, isEmojiInserted = automaticInsert;

    // wait for both to succeed or fail (and set status)
    await emojiInsertResult.catch(() => {
        isEmojiInserted = false;
    });
    await emojiCopyResult.catch(() => {
        isEmojiCopied = false;
    });

    return {
        isEmojiInserted,
        isEmojiCopied
    };
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
    // query permission values, so they can be accessed syncronously
    addonHasClipboardWritePermission = await browser.permissions.contains(CLIPBOARD_WRITE_PERMISSION);
}

// automatically init module.
init();
