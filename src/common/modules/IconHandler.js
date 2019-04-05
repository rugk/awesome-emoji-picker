import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

/**
 * Copy the Emoji to clipboard, once it has been selected.
 *
 * @private
 * @param {Object} emoji
 * @returns {void}
 */
export async function copyEmoji(emoji) {
    const emojiCopyOption = await AddonSettings.get("copyEmoji");
    switch (emojiCopyOption) {
    case "native":
        navigator.clipboard.writeText(emoji.native);
        break;
    case "colons":
        navigator.clipboard.writeText(emoji.colons);
        break;
    default:
        throw new Error("invalid option:", "copyEmoji", emojiCopyOption);
    }
}
