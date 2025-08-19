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
    permissions: [/** @type {browser._manifest.OptionalPermission} */ ("clipboardWrite")]
};
const TABS_PERMISSION = {
    permissions: [/** @type {browser._manifest.OptionalPermission} */ ("tabs")]
};
const MESSAGE_EMOJI_COPY_PERMISSION_SEARCH = "searchActionCopyPermissionInfo";
const MESSAGE_TABS_PERMISSION = "tabsPermissionInfo";

// Thunderbird
// https://bugzilla.mozilla.org/show_bug.cgi?id=1641573
const IS_THUNDERBIRD = Boolean(globalThis.messenger);

/**
 * Adjust UI if QR code size option is changed.
 *
 * @private
 * @param  {boolean} optionValue
 * @returns {void}
 */
function applyPopupIconColor(optionValue) {
    IconHandler.changeIconIfColored(optionValue);
}

/**
 * Requests the permission for pickerResult settings.
 *
 * @private
 * @param  {object} optionValue
 * @returns {Promise}
 */
function applyPickerResultPermissions(optionValue) {
    // switch status of sub-child
    const elFallback = /** @type {HTMLInputElement|null} */(document.getElementById("emojiCopyOnlyFallback"));
    if (!elFallback) {
        throw new Error('Element with id "emojiCopyOnlyFallback" not found.');
    }
    if (optionValue.emojiCopy) {
        elFallback.disabled = false;
    } else {
        elFallback.disabled = true;
    }

    return Promise.resolve();
}

/**
 * Requests the permission for autocorrect settings.
 *
 * @private
 * @param  {object} optionValue
 * @param  {string} [_option]
 * @param  {object} [event]
 * @returns {Promise<any>}
 */
function applyAutocorrectPermissions(optionValue, _option, event) {
    if (optionValue.enabled) {
        /** @type {HTMLInputElement} */(document.getElementById("autocorrectEmojiShortcodes")).disabled = false;
        /** @type {HTMLInputElement} */(document.getElementById("autocorrectEmojis")).disabled = false;
        /** @type {HTMLInputElement} */(document.getElementById("autocompleteEmojiShortcodes")).disabled = false;
        /** @type {HTMLInputElement} */(document.getElementById("autocompleteSelect")).disabled = false;
    } else {
        /** @type {HTMLInputElement} */(document.getElementById("autocorrectEmojiShortcodes")).disabled = true;
        /** @type {HTMLInputElement} */(document.getElementById("autocorrectEmojis")).disabled = true;
        /** @type {HTMLInputElement} */(document.getElementById("autocompleteEmojiShortcodes")).disabled = true;
        /** @type {HTMLInputElement} */(document.getElementById("autocompleteSelect")).disabled = true;
    }

    let retPromise = Promise.resolve();

    if (PermissionRequest.isPermissionGranted(TABS_PERMISSION) // and not already granted
    ) {
        PermissionRequest.cancelPermissionPrompt(TABS_PERMISSION, MESSAGE_TABS_PERMISSION);
    } else {
        retPromise = PermissionRequest.requestPermission(
            TABS_PERMISSION,
            MESSAGE_TABS_PERMISSION,
            event
        );
    }

    // trigger update for current session
    browser.runtime.sendMessage({
        type: COMMUNICATION_MESSAGE_TYPE.AUTOCORRECT_BACKGROUND,
        optionValue
    });

    return retPromise;
}

/**
 * Apply the new context menu settings.
 *
 * @private
 * @param  {object} optionValue
 * @returns {void}
 */
function applyContextMenuSettings(optionValue) {
    // trigger update for current session
    browser.runtime.sendMessage({
        type: COMMUNICATION_MESSAGE_TYPE.CONTEXT_MENU,
        optionValue
    });
}

/**
 * Adjusts the emoji size setting for saving.
 *
 * @private
 * @param {object} param
 * @param {object} param.optionValue the value of the changed option
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
 * @param {object} param
 * @param {object} param.optionValue the value of the option to be loaded
 * @param {string} param.option the name of the option that has been changed
 * @param {HTMLElement} param.elOption where the data is supposed to be loaded
 *                     into
 * @param {object} param.optionValues result of a storage.[…].get call, which
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
 * @param {object} param
 * @param {object} param.optionValue the value of the changed option
 * @param {string} param.option the name of the option that has been changed
 * @param {Array} param.saveTriggerValues all values returned by potentially
 *                                          previously run safe triggers
 * @returns {Promise}
 */
function adjustPickerResultTypeOption(param) {
    param.optionValue.resultType = param.optionValue.resultType ? "colons" : "native";

    return AutomaticSettings.Trigger.overrideContinue(param.optionValue);
}

/**
 * Gets the plural form of the quiet zone translation, depending on the option value.
 *
 * @private
 * @param {string|undefined?} language
 * @param {number} optionValue
 * @returns {string} messageName
 */
function getPluralForm(language, optionValue) {
    language ||= "en";

    switch (language) {
    case "tr":
        return optionValue > 1 ? "optionEmojisPerLineStatusPlural" : "optionEmojisPerLineStatusSingular";
        // en, de
    default:
        return optionValue === 1 ? "optionEmojisPerLineStatusSingular" : "optionEmojisPerLineStatusPlural";
    }
}

/**
 * Adjust UI of emojis per line status (the "N emojis" text). Triggers once
 * after the options have been loaded and when the option value is updated by the user.
 *
 * @private
 * @param {object} optionValue
 * @param {string} _option the name of the option that has been changed
 * @param {Event?} event the event (input or change) that triggered saving
 *                      (may not always be defined, e.g. when loading)
 * @returns {void}
 * @throws {Error} if no translation could be found
 */
function updatePerLineStatus(optionValue, _option, event = null) {
    // only handle per line status (or if initialisation without event)
    if (
        event &&
        "target" in event &&
        event.target &&
        /** @type {HTMLInputElement} */ (event.target).name !== "perLine"
    ) {
        return;
    }
    const perLineValue = optionValue.perLine;

    const elEmojisPerLineStatus = document.getElementById("emojisPerLineStatus");
    if (!elEmojisPerLineStatus) {
        throw new Error('Element with id "elEmojisPerLineStatus" not found.');
    }

    const messageName = getPluralForm(document.querySelector("html")?.getAttribute("lang"), perLineValue);
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
 * @param {object} optionValue
 * @param {string} _option the name of the option that has been changed
 * @param {Event} event the event (input or change) that triggered saving
 *                      (may not always be defined, e.g. when loading)
 * @returns {void}
 * @throws {Error} if no translation could be found
 */
function updateEmojiPerLineMaxViaEmojiSize(optionValue, _option, event) {
    // only handle per line status (or if initialisation without event)
    if (
        event &&
        "target" in event &&
        event.target &&
        /** @type {HTMLInputElement} */ (event.target).name !== "emojiSize"
    ) {
        return;
    }

    const emojiSizeValue = Number(optionValue.emojiSize);
    const elEmojisPerLine = /** @type {HTMLInputElement|null} */(document.getElementById("emojisPerLine"));

    if (!elEmojisPerLine) {
        throw new Error('Element with id "emojisPerLine" not found.');
    }

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
    const oldEmojisPerLineValue = Number(elEmojisPerLine.value);
    elEmojisPerLine.max = String(newMaxValue);

    // adjust value if current one is too large
    if (oldEmojisPerLineValue > newMaxValue) {
        elEmojisPerLine.value = String(newMaxValue);

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
 * @param  {object} optionValue
 * @param  {string} [_option]
 * @param  {object} [event]
 * @returns {Promise}
 */
function applyEmojiSearch(optionValue, _option, event = {}) {
    // switch status of dependent settings
    if (optionValue.enabled) {
        /** @type {HTMLInputElement} */ (document.getElementById("searchCopyAction")).disabled = false;
        /** @type {HTMLInputElement} */ (document.getElementById("emojipediaAction")).disabled = false;
        /** @type {HTMLInputElement} */ (document.getElementById("searchBarDemo")).disabled = false;
        /** @type {HTMLInputElement} */ (document.getElementById("enableFillingResults")).disabled = false;
        /** @type {HTMLInputElement} */ (document.getElementById("maximumResults")).disabled = false;
    } else {
        /** @type {HTMLInputElement} */ (document.getElementById("searchCopyAction")).disabled = true;
        /** @type {HTMLInputElement} */ (document.getElementById("emojipediaAction")).disabled = true;
        /** @type {HTMLInputElement} */ (document.getElementById("searchBarDemo")).disabled = true;
        /** @type {HTMLInputElement} */ (document.getElementById("enableFillingResults")).disabled = true;
        /** @type {HTMLInputElement} */ (document.getElementById("maximumResults")).disabled = true;
    }

    // trigger update for current session
    browser.runtime.sendMessage({
        type: COMMUNICATION_MESSAGE_TYPE.OMNIBAR_TOGGLE,
        toEnable: optionValue.enabled
    });

    const reloadEmojiSearchStatus = () => {
        // get new settings, because they could have been changed
        // TODO: generalize in AutomaticSettings
        const isEnabled = /** @type {HTMLInputElement} */ (document.getElementById("omnibarIntegration")).checked;

        const newOptionValue = {
            enabled: isEnabled
        };

        if (/** @type {HTMLInputElement} */(document.getElementById("searchCopyAction")).checked) {
            newOptionValue.action = /** @type {HTMLInputElement} */ (document.getElementById("searchCopyAction")).value;
        } else if (/** @type {HTMLInputElement} */(document.getElementById("emojipediaAction")).checked) {
            newOptionValue.action = /** @type {HTMLInputElement} */ (document.getElementById("emojipediaAction")).value;
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
    }
    PermissionRequest.cancelPermissionPrompt(CLIPBOARD_WRITE_PERMISSION, MESSAGE_EMOJI_COPY_PERMISSION_SEARCH);

    return Promise.resolve();
}


/**
 * Binds the triggers.
 *
 * This is basically the "init" method.
 *
 * @returns {Promise}
 */
export async function registerTrigger() {
    // override load/safe behaviour for custom fields
    AutomaticSettings.Trigger.addCustomSaveOverride("emojiPicker", adjustEmojiSize);

    AutomaticSettings.Trigger.addCustomLoadOverride("resultType", preparePickerResultTypeOptionForInput);
    AutomaticSettings.Trigger.addCustomSaveOverride("pickerResult", adjustPickerResultTypeOption);
    // loading does not need to be overwritten, as we are fine with an extra string saved

    // update slider status
    AutomaticSettings.Trigger.registerSave("pickerResult", applyPickerResultPermissions);
    AutomaticSettings.Trigger.registerSave("autocorrect", applyAutocorrectPermissions);
    AutomaticSettings.Trigger.registerSave("contextMenu", applyContextMenuSettings);
    AutomaticSettings.Trigger.registerSave("popupIconColored", applyPopupIconColor);
    AutomaticSettings.Trigger.registerSave("emojiPicker", updatePerLineStatus);
    AutomaticSettings.Trigger.registerSave("emojiPicker", updateEmojiPerLineMaxViaEmojiSize);
    // Thunderbird
    if (IS_THUNDERBIRD) {
        const browserElement = document.getElementById("browser");
        if (!browserElement) {
            throw new Error('Element with id "browser" not found.');
        }
        browserElement.style.display = "none";
    } else {
        AutomaticSettings.Trigger.registerSave("emojiSearch", applyEmojiSearch);
    }

    // handle loading of options correctly
    AutomaticSettings.Trigger.registerAfterLoad(AutomaticSettings.Trigger.RUN_ALL_SAVE_TRIGGER);

    // permission request init
    await PermissionRequest.registerPermissionMessageBox(
        CLIPBOARD_WRITE_PERMISSION,
        MESSAGE_EMOJI_COPY_PERMISSION_SEARCH,
        document.getElementById("searchActionCopyPermissionInfo"),
        "permissionRequiredClipboardWrite"
    );
    await PermissionRequest.registerPermissionMessageBox(
        TABS_PERMISSION,
        MESSAGE_TABS_PERMISSION,
        document.getElementById("tabsPermissionInfo"),
        // "permissionRequiredTabs" // TODO(to: 'rugk'): This will need to be localized
        "Permission to send any updated options to your open tabs is required to prevent you having to reload all of them manually."
    );
}
