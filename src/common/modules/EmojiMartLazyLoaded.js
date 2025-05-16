import * as EmojiMartInitialisationData from "/common/modules/EmojiMartInitialisationData.js";
import * as EmojiMartDataStore from "/common/modules/EmojiMartDataStore.js";
import { uniqBy } from "./uniqBy.js";

/**
 * Return the last used (“current”) skin from emoji-mart.
 *
 * It is ensured that in any case of failure the default skin (0) is returned.
 * **Attention:** Ensure to reload the {@link EmojiMartDataStore} before calling this function to get fresh results.
 *
 * @returns {Promise<number>} the current skin as ID or the default skin
 */
export async function getCurrentSkinIndex() {
    const lastSkin = await EmojiMartDataStore.get("skin");

    if (!lastSkin) {
        // because undefined|null are valid entries
        return 0;
    } else if (Number.isNaN(lastSkin)) {
        console.error(new TypeError(`Invalid skin value: ${lastSkin}, should be a number.`), "using default skin 0 instead of", lastSkin);
        return 0;
    }
    return Math.max((lastSkin - 1), 0) || 0;
}

/**
 * Lazy-load the emoji-mart library.
 *
 * This consumes some memory (RAM).
 *
 * @private
 * @returns {Promise<import("../../node_modules/emoji-mart/dist/index.d.js")>}
 */
async function loadEmojiMart() {
    //cache emoji-mart into global variable
    globalThis.EmojiMart = await import("../../node_modules/emoji-mart/dist/module.js");
    console.info("emoji-mart loaded:", globalThis.EmojiMart);

    EmojiMartDataStore.initEmojiMartStorage(globalThis.EmojiMart);

    globalThis.EmojiMart.init(
        await EmojiMartInitialisationData.getEmojiMartInitialisationData()
    );

    return globalThis.EmojiMart;
}

/**
 * Get emoji-mart, if needed load it.
 *
 * @returns {Promise<import("../../node_modules/emoji-mart/dist/index.d.js")>}
 */
export async function getEmojiMart() {
    return globalThis.EmojiMart || await loadEmojiMart();
}

/**
 * Get list of frequently used emojis.
 *
 * ·@param {number} [maximumNumberOfElements=10] The number of emojis to return (at most!).
 * @returns {Promise<string[]>}
 */
export async function getFrequentlyUsedEmojiList(maximumNumberOfElements = 10) {
    /** {@type string[]|null} */
    let frequentlyUsed = null;
    try {
        /** @type {typeof import("../../node_modules/emoji-mart/dist/index.d.js").FrequentlyUsed._get1} */
        // @ts-ignore
        const frequentlyUsedGetter = ((await getEmojiMart()).FrequentlyUsed).get;

        /** {@type string[] */
        frequentlyUsed = frequentlyUsedGetter({
            maxFrequentRows: maximumNumberOfElements,
            perLine: 1
        });
        console.debug("Frequently used emojis found via getter:", frequentlyUsed);
    } catch (error) {
        console.warn("Error while frequently used was retrieved via getter:", error);
    }

    if (!frequentlyUsed) {
        console.warn("No frequently used emojis found via FrequentlyUsed getter, falling back to custom implementation.");

        await EmojiMartDataStore.reloadCachedSettings();
        /** @type {Record<string, number>} */
        frequentlyUsed = await EmojiMartDataStore.get("frequently");
        console.debug("Frequently used emojis manually:", frequentlyUsed);
        frequentlyUsed = Object.keys(frequentlyUsed);
    }

    if (frequentlyUsed.length < maximumNumberOfElements) {
        const defaults = (await (await getEmojiMart()).FrequentlyUsed)?.DEFAULTS;
        frequentlyUsed.push(...defaults);
        // deduplicate results
        frequentlyUsed = uniqBy(frequentlyUsed, (x) => x);
    }

    return frequentlyUsed.slice(0, maximumNumberOfElements);
}

/**
 * Get list of frequently used emojis.
 *
 *·@param {number} [maximumNumberOfElements=10] The number of emojis to return (at most!).
 * @returns {Promise<import("/common/modules/EmojiSearched.d.ts").EmojiSearched[]>}
 */
export async function getFrequentlyUsedEmojis(maximumNumberOfElements = 10) {
    const frequentlyUsedIds = await getFrequentlyUsedEmojiList(maximumNumberOfElements);

    const emojiMart = await getEmojiMart();
    const frequentlyUsedEmojis = await Promise.all(frequentlyUsedIds.map(async (emojiId) =>
        {
            /** @type {import("/common/modules/EmojiSearched.d.ts").EmojiSearched[]} */
            const searchResults = await emojiMart.SearchIndex.search(emojiId, {
                maxResults: 1,
                caller: "getFrequentlyUsedEmojis"
            });
            return searchResults[0];
        }
    ));

    console.debug("Comverted frequently used emojis:", frequentlyUsedEmojis);
    return frequentlyUsedEmojis;
}


/**
 * Get the current emoji skin from an emoji.
 *
 * This is likely just the default skin respectively the last used one via
 * {@link getCurrentSkinIndex}
 * .
 * **Attention:** Ensure to reload the {@link EmojiMartDataStore} before calling
 * this function to get fresh results.
 *
 * @param {import("../../node_modules/@emoji-mart/data/index.d.ts").Emoji | import("/common/modules/EmojiSearched.d.ts").EmojiSearched } emoji
 * @returns {Promise<import("../../node_modules/@emoji-mart/data/index.d.ts").Skin |  | import("/common/modules/EmojiSearched.d.ts").SkinSearched>}
 */
export async function getCurrrentEmojiSkinFromEmoji(emoji) {
    if (!emoji) {
        return null;
    }

    const currentSkin = await getCurrentSkinIndex();
    const chosenSkin = emoji.skins[currentSkin] || emoji.skins[0];
    return chosenSkin;
}
