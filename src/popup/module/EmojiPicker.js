/**
 * Creates and manages the Emoji picker.
 *
 * @public
 */

import * as EmojiSelect from "./EmojiSelect.js";
import * as EmojiMart from "../../node_modules/emoji-mart/dist/module.js";
import * as EmojiMartInitialisationData from "/common/modules/EmojiMartInitialisationData.js";
import * as EmojiMartDataStore from "/common/modules/EmojiMartDataStore.js";

/**
 * Sets the emoji-mart data storage.
 *
 * @private
 * @returns {void}
 * @see https://github.com/missive/emoji-mart#storage
 */
export function initEmojiMartStorage() {
    EmojiMartDataStore.initEmojiMartStorage(EmojiMart);
}

/**
 * Creates the emoji picker.
 *
 * @public
 * @returns {Promise<void>}
 */
export async function init() {
    const emojiPicker = new EmojiMart.Picker(await EmojiMartInitialisationData.getEmojiMartInitialisationData({
        onEmojiSelect: EmojiSelect.triggerOnSelect,
    }));

    // NOTE: Typing is not updated yet, so cannot be used here: https://github.com/missive/emoji-mart/issues/576
    // @ts-ignore
    document.body.append(emojiPicker);
    console.info("Created EmojiPicker component:", emojiPicker);
}
