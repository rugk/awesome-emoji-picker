/**
 * This modules contains the custom triggers for some options that are added.
 *
 * @module modules/CustomOptionTriggers
 */

import * as AutomaticSettings from "/common/modules/AutomaticSettings/AutomaticSettings.js";

// used to apply options
import * as IconHandler from "/common/modules/IconHandler.js";

/**
 * Adjust UI if QR code size option is changed.
 *
 * @function
 * @private
 * @param  {boolean} optionValue
 * @param  {string} [option]
 * @returns {void}
 */
function applyPopupIconColor(optionValue) {
    IconHandler.changeIconIfColored(optionValue);
}

/**
 * Adjusts the emoji set setting for saving when .
 *
 * @private
 * @param {Object} param
 * @param {Object} param.optionValue the value of the changed option
 * @param {string} param.option the name of the option that has been changed
 * @param {Array} param.saveTriggerValues all values returned by potentially
 *                                          previously run safe triggers
 * @returns {Promise}
 */
function saveEmojiSet(param) {
    if (param.optionValue.set === "native") {
        param.optionValue.native = true;
    } else {
        param.optionValue.native = false;
    }

    return AutomaticSettings.Trigger.overrideContinue(param.optionValue);
}

/**
 * Gets the plural form of the quiet zone translation, depending on the option value.
 *
 * @private
 * @param {string} language
 * @param {integer} optionValue
 * @returns {string} messageName
 */
function getPluralForm(language, optionValue) {
    if (!language) {
        language = "en";
    }

    switch(language) {
    case "tr":
        return optionValue > 1 ? "optionEmojisPerLineStatusPlural" : "optionEmojisPerLineStatusSingular";
        // en, de
    default:
        return optionValue !== 1 ? "optionEmojisPerLineStatusPlural" : "optionEmojisPerLineStatusSingular";
    }
}

/**
 * Adjust UI of emojis per line status (the "N emojis" text). Triggers once
 * after the options have been loaded and when the option value is updated by the user.
 *
 * @private
 * @param {integer} optionValue
 * @param {string} option the name of the option that has been changed
 * @param {Event} event the event (input or change) that triggered saving
 *                      (may not always be defined, e.g. when loading)
 * @returns {void}
 * @throws {Error} if no translation could be found
 */
function updatePerLineStatus(optionValue, option, event) {
    // only handle per line status (or if initialisation without event)
    if (event && "target" in event && event.target.name !== "perLine") {
        return;
    }
    const perLineValue = optionValue.perLine;

    const elEmojisPerLineStatus = document.getElementById("emojisPerLineStatus");
    const messageName = getPluralForm(document.querySelector("html").getAttribute("lang"), perLineValue);
    const translatedMessage = browser.i18n.getMessage(messageName, perLineValue);

    if (!translatedMessage) {
        throw new Error(`no translation string for "${messageName}" could be found`);
    }

    elEmojisPerLineStatus.textContent = translatedMessage;
}

/**
 * Binds the triggers.
 *
 * This is basically the "init" method.
 *
 * @function
 * @returns {void}
 */
export function registerTrigger() {
    // override load/safe behaviour for custom fields
    AutomaticSettings.Trigger.addCustomSaveOverride("emojiPicker", saveEmojiSet);
    // loading does not need to be overwritten, as we are fine with an extra string saved

    // update slider status
    AutomaticSettings.Trigger.registerSave("popupIconColored", applyPopupIconColor);
    AutomaticSettings.Trigger.registerSave("emojiPicker", updatePerLineStatus);

    // handle loading of options correctly
    AutomaticSettings.Trigger.registerAfterLoad(AutomaticSettings.Trigger.RUN_ALL_SAVE_TRIGGER);
}
