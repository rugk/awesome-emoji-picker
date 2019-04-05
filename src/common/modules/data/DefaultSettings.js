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
    copyEmoji: "native",
    emojiMart: {},
    emojiSearch: true
});
