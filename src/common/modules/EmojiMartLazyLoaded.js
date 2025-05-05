import * as EmojiMartInitialisationData from "/common/modules/EmojiMartInitialisationData.js";

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

    globalThis.EmojiMart.init(
        await EmojiMartInitialisationData.getEmojiMartInitialisationData()
    );

    return globalThis.EmojiMart;
}

/**
 * Get emoji-mart, if needed load it.
 *
 * @returns {Promise<import("../../node_modules/emoji-mart/dist/module.js")>}
 */
export async function getEmojiMart() {
    return globalThis.EmojiMart || await loadEmojiMart();
}
