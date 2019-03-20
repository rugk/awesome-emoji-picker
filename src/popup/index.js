/**
 * Starter module for popup.
 *
 */
"use strict";

function copyEmoji(emoji) {
    navigator.clipboard.writeText(emoji.native);
}

window.defineEmojiMartElement("emoji-picker", {
    native: true,
    emojiTooltip: true,
    onSelect:copyEmoji
});
const picker = document.createElement("emoji-picker");
document.body.appendChild(picker);
