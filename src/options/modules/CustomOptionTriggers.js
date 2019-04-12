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
 * Adjusts the emoji set setting for saving.
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
 * Adjusts the emoji size setting for saving.
 *
 * @private
 * @param {Object} param
 * @param {Object} param.optionValue the value of the changed option
 * @param {string} param.option the name of the option that has been changed
 * @param {Array} param.saveTriggerValues all values returned by potentially
 *                                          previously run safe triggers
 * @returns {Promise}
 */
function adjustEmojiSize(param) {
    // convert emoji size to number
    param.optionValue.emojiSize = Number(param.optionValue.emojiSize);

    return AutomaticSettings.Trigger.overrideContinue(param.optionValue);
}

/**
 * Adjusts the copyEmojiColons setting for saving.
 *
 * @private
 * @param {Object} param
 * @param {Object} param.optionValue the value of the option to be loaded
 * @param {string} param.option the name of the option that has been changed
 * @param {HTMLElement} param.elOption where the data is supposed to be loaded
 *                     into
 * @param {Object} param.optionValues result of a storage.[…].get call, which
 *                  contains the values that should be applied to the file
 *                  Please prefer "optionValue" instead of this, as this may not
 *                  always contain a value here.
 * @returns {Promise}
 */
function prepareEmojiCopyOptionForInput(param) {
    switch (param.optionValue) {
    case "colons":
        param.optionValue = true;
        break;
    case "native":
        param.optionValue = false;
        break;
    default:
        throw new Error("invalid parameter: ", param.option, param.optionValue);
    }

    return AutomaticSettings.Trigger.overrideContinue(param.optionValue);
}

/**
 * Adjusts the copyEmojiColons setting for saving.
 *
 * @private
 * @param {Object} param
 * @param {Object} param.optionValue the value of the changed option
 * @param {string} param.option the name of the option that has been changed
 * @param {Array} param.saveTriggerValues all values returned by potentially
 *                                          previously run safe triggers
 * @returns {Promise}
 */
function adjustEmojiCopyOption(param) {
    if (param.optionValue) {
        param.optionValue = "colons";
    } else {
        param.optionValue = "native";
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
 * Adjust maximum value of emojis per line when the emoji size is adjusted.
 *
 * @private
 * @param {integer} optionValue
 * @param {string} option the name of the option that has been changed
 * @param {Event} event the event (input or change) that triggered saving
 *                      (may not always be defined, e.g. when loading)
 * @returns {void}
 * @throws {Error} if no translation could be found
 */
function updateEmojiPerLineMaxViaEmojiSize(optionValue, option, event) {
    // only handle per line status (or if initialisation without event)
    if (event && "target" in event && event.target.name !== "emojiSize") {
        return;
    }

    const emojiSizeValue = Number(optionValue.emojiSize);
    const elEmojisPerLine = document.getElementById("emojisPerLine");

    // popup max with = 800px
    // see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/user_interface/Popups#Popup_resizing
    //
    // x = emoji per line
    // emoji border: 6px
    // outer border: 13px
    // tolerance: 5px
    //
    // calculation for width:

    // x = (width - 2*outer border - tolerance) / (emoji + 2*emoji border)
    const newMaxValue = Math.floor((800 - 2 * 13 - 5) / (emojiSizeValue + 2 * 6));
    // width = (emoji + 2*emoji border) * x + 2*outer border (+ tolerance)
    const estimatedWidth = (emojiSizeValue + 2 * 6) * newMaxValue + 2 * 13;
    console.log("Caluclated a maximum number of emojis per line of", newMaxValue,
        "for emojis of size", `${emojiSizeValue}px,`, "resulting in an estimated with of", `${estimatedWidth}px.`);

    // apply new max value
    const oldEmojisPerLineValue = elEmojisPerLine.value;
    elEmojisPerLine.max = newMaxValue;

    // adjust value if current one is too large
    if (oldEmojisPerLineValue > newMaxValue) {
        elEmojisPerLine.value = newMaxValue;

        // manualyl update value/trigger trigger
        updatePerLineStatus({
            perLine: newMaxValue
        }, "emojiPicker");

        // not best practise, but we just modify the to-be-saved object here, as
        // manually triggering an InputEvent could lead to race conditions etc.
        optionValue.perLine = newMaxValue;
    }
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
    AutomaticSettings.Trigger.addCustomSaveOverride("emojiPicker", adjustEmojiSize);
    AutomaticSettings.Trigger.addCustomLoadOverride("copyEmoji", prepareEmojiCopyOptionForInput);
    AutomaticSettings.Trigger.addCustomSaveOverride("copyEmoji", adjustEmojiCopyOption);
    // loading does not need to be overwritten, as we are fine with an extra string saved

    // update slider status
    AutomaticSettings.Trigger.registerSave("popupIconColored", applyPopupIconColor);
    AutomaticSettings.Trigger.registerSave("emojiPicker", updatePerLineStatus);
    AutomaticSettings.Trigger.registerSave("emojiPicker", updateEmojiPerLineMaxViaEmojiSize);

    // handle loading of options correctly
    AutomaticSettings.Trigger.registerAfterLoad(AutomaticSettings.Trigger.RUN_ALL_SAVE_TRIGGER);
}
