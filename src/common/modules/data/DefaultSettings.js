/**
 * Specifies the default settings of the add-on.
 *
 * @module data/DefaultSettings
 */

/**
 * An object of all default settings.
 *
 * @private
 * @const
 * @type {Object}
 */
const defaultSettings = {
    popupIconColored: true,
    randomTips: {
        tips: {}
    },
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
        emojiCopyOnlyFallback: false,
        resultType: "native",
        showConfirmationMessage: true,
        closePopup: true,
    contextMenu: {
        insertEmoji: true
    },
    },
    emojiSearch: {
        enabled: false,
        resultType: "native",
        action: "copy"
    },
    emojiMart: {}
};

// freeze the inner objects, this is strongly recommend
Object.values(defaultSettings).map(Object.freeze);

/**
 * Export the default settings to be used.
 *
 * @public
 * @const
 * @type {Object}
 */
export const DEFAULT_SETTINGS = Object.freeze(defaultSettings);
