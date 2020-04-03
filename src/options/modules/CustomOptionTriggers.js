/**
 * This modules contains the custom triggers for some options that are added.
 *
 * @module modules/CustomOptionTriggers
 */

import * as AutomaticSettings from "/common/modules/AutomaticSettings/AutomaticSettings.js";

import * as PermissionRequest from "/common/modules/PermissionRequest/PermissionRequest.js";

import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

// used to apply options
import * as IconHandler from "/common/modules/IconHandler.js";

const CLIPBOARD_WRITE_PERMISSION = {
    permissions: ["clipboardWrite"]
};
const MESSAGE_EMOJI_COPY_PERMISSION_FALLBACK = "emojiCopyOnlyFallbackPermissionInfo";
const MESSAGE_EMOJI_COPY_PERMISSION_SEARCH = "searchActionCopyPermissionInfo";

// cache Firefox version
let currentBrowserData = "";
browser.runtime.getBrowserInfo().then((data) => {
    currentBrowserData = data;
});

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
 * Requests the permission for pickerResult settings.
 *
 * @private
 * @param  {Object} optionValue
 * @param  {string} [option]
 * @param  {Object} [event]
 * @returns {Promise}
 */
function applyPickerResultPermissions(optionValue, option, event) {
    let retPromise;

    // switch status of sub-child
    if (optionValue.emojiCopy) {
        document.getElementById("emojiCopyOnlyFallback").disabled = false;
    } else {
        document.getElementById("emojiCopyOnlyFallback").disabled = true;
    }

    // do not require clipboardCopy permission for Firefox >= 74
    // ref https://github.com/rugk/awesome-emoji-picker/issues/90
    if (currentBrowserData.name === "Firefox" &&
        currentBrowserData.version.startsWith("74.")) {
        return retPromise;
    }

    if (optionValue.emojiCopy && // only if actually enabled
        optionValue.emojiCopyOnlyFallback && // if we require a permission
        !PermissionRequest.isPermissionGranted(CLIPBOARD_WRITE_PERMISSION) // and not already granted
    ) {
        retPromise = PermissionRequest.requestPermission(
            CLIPBOARD_WRITE_PERMISSION,
            MESSAGE_EMOJI_COPY_PERMISSION_FALLBACK,
            event
        ).catch(() => {
            // if permission is rejected (user declined), force disabling the setting
            optionValue.emojiCopyOnlyFallback = false;
            document.getElementById("emojiCopyOnlyFallback").checked = false;
        });
    } else {
        PermissionRequest.cancelPermissionPrompt(CLIPBOARD_WRITE_PERMISSION, MESSAGE_EMOJI_COPY_PERMISSION_FALLBACK);
    }

    return retPromise;
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
 * Adjusts the pickerResult->resultType setting for saving.
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
function preparePickerResultTypeOptionForInput(param) {
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
 * Adjusts the pickerResult->resultType setting for saving.
 *
 * @private
 * @param {Object} param
 * @param {Object} param.optionValue the value of the changed option
 * @param {string} param.option the name of the option that has been changed
 * @param {Array} param.saveTriggerValues all values returned by potentially
 *                                          previously run safe triggers
 * @returns {Promise}
 */
function adjustPickerResultTypeOption(param) {
    if (param.optionValue.resultType) {
        param.optionValue.resultType = "colons";
    } else {
        param.optionValue.resultType = "native";
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

        // manually update value/trigger trigger
        updatePerLineStatus({
            perLine: newMaxValue
        }, "emojiPicker");

        // not best practise, but we just modify the to-be-saved object here, as
        // manually triggering an InputEvent could lead to race conditions etc.
        optionValue.perLine = newMaxValue;
    }
}

/**
 * Adjust options page when emojiSearch is changed.
 *
 * @private
 * @param  {Object} optionValue
 * @param  {string} [option]
 * @param  {Object} [event]
 * @returns {Promise}
 */
function applyEmojiSearch(optionValue, option, event = {}) {
    // switch status of dependent settings
    if (optionValue.enabled) {
        document.getElementById("searchCopyAction").disabled = false;
        document.getElementById("emojipediaAction").disabled = false;
        document.getElementById("searchBarDemo").removeAttribute("disabled");
    } else {
        document.getElementById("searchCopyAction").disabled = true;
        document.getElementById("emojipediaAction").disabled = true;
        document.getElementById("searchBarDemo").setAttribute("disabled", "");
    }

    // trigger update for current session
    browser.runtime.sendMessage({
        type: COMMUNICATION_MESSAGE_TYPE.OMNIBAR_TOGGLE,
        toEnable: optionValue.enabled
    });

    const reloadEmojiSearchStatus = () => {
        // get new settings, because they could have been changed
        // TODO: generalize in AutomaticSettings
        const isEnabled = document.getElementById("omnibarIntegration").checked;

        const newOptionValue = {
            enabled: isEnabled
        };

        if (document.getElementById("searchCopyAction").checked) {
            newOptionValue.action = document.getElementById("searchCopyAction").value;
        } else if (document.getElementById("emojipediaAction").checked) {
            newOptionValue.action = document.getElementById("emojipediaAction").value;
        }

        // we can only all hope, this won't end in an inifnitive loop
        applyEmojiSearch(newOptionValue);
    };

    // request permission from user
    if (optionValue.enabled && // only if actually enabled
        optionValue.action === "copy" && // if we require a permission for copying
        !PermissionRequest.isPermissionGranted(CLIPBOARD_WRITE_PERMISSION) // and not already granted
    ) {
        return PermissionRequest.requestPermission(
            CLIPBOARD_WRITE_PERMISSION,
            MESSAGE_EMOJI_COPY_PERMISSION_SEARCH,
            event,
            {retry: true}
        ).finally(() => {
            // Note: Error (rejection) will never happen, because we have infinite retries enabled
            // So this is equivalent to a "then".
            reloadEmojiSearchStatus();
        });
    } else {
        PermissionRequest.cancelPermissionPrompt(CLIPBOARD_WRITE_PERMISSION, MESSAGE_EMOJI_COPY_PERMISSION_SEARCH);
    }

    return Promise.resolve();
}


/**
 * Binds the triggers.
 *
 * This is basically the "init" method.
 *
 * @function
 * @returns {Promise}
 */
export async function registerTrigger() {
    // override load/safe behaviour for custom fields
    AutomaticSettings.Trigger.addCustomSaveOverride("emojiPicker", saveEmojiSet);
    AutomaticSettings.Trigger.addCustomSaveOverride("emojiPicker", adjustEmojiSize);

    AutomaticSettings.Trigger.addCustomLoadOverride("resultType", preparePickerResultTypeOptionForInput);
    AutomaticSettings.Trigger.addCustomSaveOverride("pickerResult", adjustPickerResultTypeOption);
    // loading does not need to be overwritten, as we are fine with an extra string saved

    // update slider status
    AutomaticSettings.Trigger.registerSave("pickerResult", applyPickerResultPermissions);
    AutomaticSettings.Trigger.registerSave("popupIconColored", applyPopupIconColor);
    AutomaticSettings.Trigger.registerSave("emojiPicker", updatePerLineStatus);
    AutomaticSettings.Trigger.registerSave("emojiPicker", updateEmojiPerLineMaxViaEmojiSize);
    AutomaticSettings.Trigger.registerSave("emojiSearch", applyEmojiSearch);

    // handle loading of options correctly
    AutomaticSettings.Trigger.registerAfterLoad(AutomaticSettings.Trigger.RUN_ALL_SAVE_TRIGGER);

    // permission request init
    await PermissionRequest.registerPermissionMessageBox(
        CLIPBOARD_WRITE_PERMISSION,
        MESSAGE_EMOJI_COPY_PERMISSION_FALLBACK,
        document.getElementById("emojiCopyOnlyFallbackPermissionInfo"),
        "permissionRequiredClipboardWrite"
    );
    await PermissionRequest.registerPermissionMessageBox(
        CLIPBOARD_WRITE_PERMISSION,
        MESSAGE_EMOJI_COPY_PERMISSION_SEARCH,
        document.getElementById("searchActionCopyPermissionInfo"),
        "permissionRequiredClipboardWrite"
    );
}
