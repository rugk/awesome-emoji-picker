/**
 * Specifies the default settings of the add-on.
 *
 * @module data/DefaultSettings
 */

export const DEFAULT_SETTINGS = Object.freeze({
    popupIconColored: true,
    emojiPicker: {
        set: "native",
        native: true,
        perLine: 9,
        emojiTooltip: false,
        emojiSize: 24
    },
    pickerResult: {
        automaticInsert: true,
        emojiCopy: true,
        // emojiCopyOnlyFallback MUST NOT be true, as optional clipboardWrite
        // permission is required for this
        emojiCopyOnlyFallback: true,
        resultType: "native",
    },
    emojiMart: {}
});
