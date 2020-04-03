import * as PageHandler from "./PageHandler.js";

const CLIPBOARD_WRITE_PERMISSION = {
    permissions: ["clipboardWrite"]
};

let addonHasClipboardWritePermission = false;

// cache Firefox version
let currentBrowserData = "";
browser.runtime.getBrowserInfo().then((data) => {
    currentBrowserData = data;
});

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
 * @param {Object} text
 * @param {Object} options
 * @param {boolean} options.insertIntoPage whether to try to insert it into the active page
 * @param {boolean} options.copyOnlyOnFallback whether to fallback to copying emojis (alos requires copyToClipboard=true)
 * @param {boolean} options.copyToClipboard whether the text should be copied into the page
 * @returns {Promise}
 * @throws {Error}
 */
export async function insertOrCopy(text, options) {
    // destructure config
    const {
        insertIntoPage,
        copyOnlyOnFallback,
    } = options;
    let copyToClipboard = options.copyToClipboard;

    console.log("Action triggered for emoji:", text);

    // insert emoji
    let emojiInsertResult = Promise.resolve(); // successful by default
    if (insertIntoPage) {
        emojiInsertResult = PageHandler.insertIntoPage(text).then(console.log);
    }

    // wait for successful execution, if wanted
    if (insertIntoPage && copyOnlyOnFallback) {
        await (emojiInsertResult.then(() => {
            // if successful, do not copy emoji
            copyToClipboard = false;
        }).catch(() => {
            console.error("Insertion into page failed. Use emoji copy fallback.");

            // do not require clipboardCopy permission for Firefox >= 74
            // ref https://github.com/rugk/awesome-emoji-picker/issues/90
            if (currentBrowserData.name === "Firefox" &&
                currentBrowserData.version.startsWith("74.")) {
                return; // resolve promise, so await continues
            }

            if (addonHasClipboardWritePermission) {
                copyToClipboard = true;
            } else {
                console.error("Well, actually…, we cannot fallback, as we miss the clipboardWrite permission.");
                // Note: We cannot request the permission now, because of the same reason why we cannot actually
                // copy without clipboardWrite permission (this is no user action anymore)

                throw new PermissionError("Permisson missing for clipboardWrite.");
            }

            // resolve promise, so await continues
        }));
    }

    // copy to clipboard
    let copyResult = Promise.resolve(); // successful by default
    if (copyToClipboard) {
        // WARNING: If there is an asyncronous waiting (await) before, we need to
        // request the clipboardWrite permission to be able to do this, as the
        // function call is then not anymore assigned to a click handler
        // Reported at: https://bugzilla.mozilla.org/show_bug.cgi?id=1554855
        copyResult = navigator.clipboard.writeText(text);
    }

    // find out results of operations
    let isCopied = copyToClipboard, isInserted = insertIntoPage;

    // wait for both to succeed or fail (and set status)
    await emojiInsertResult.catch(() => {
        isInserted = false;
    });
    await copyResult.catch(() => {
        isCopied = false;
    });

    return {
        isInserted,
        isCopied
    };
}

/**
 * Init module.
 *
 * @public
 * @returns {Promise}
 */
export async function init() {
    // query permission values, so they can be accessed syncronously
    addonHasClipboardWritePermission = await browser.permissions.contains(CLIPBOARD_WRITE_PERMISSION);
}

// automatically init module.
init();
