
/**
 * Lazy-load the emoji-mart library.
 *
 * This consumes some memory (RAM).
 *
 * @private
 * @returns {Promise<import("../../node_modules/emoji-mart/dist/module.js")>}
 */
async function loadEmojiMart() {
    //cache emoji-mart into global variable
    globalThis.EmojiMart = await import("../../node_modules/emoji-mart/dist/module.js");
    console.info("emoji-mart loaded:", globalThis.EmojiMart);

    return globalThis.EmojiMart;
}

/**
 * Get emoji-mart, if needed load it.
 *
 * @returns {Promise<import("../../node_modules/emoji-mart/dist/module.js")>}
 */
export function getEmojiMart() {
    return globalThis.EmojiMart || loadEmojiMart();
}
