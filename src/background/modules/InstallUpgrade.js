/**
 * Upgrades user data on installation of new updates.
 *
 * @module InstallUpgrade
 */

/**
 * Upgrade the emoji sets to replaced removed/deprecated ones.
 *
 * Changes removed emoji sets to best existing/matching one.
 *
 * @param {typeof import("/common/modules/data/DefaultSettings.js").DEFAULT_SETTINGS.emojiPicker} settings
 * @returns {{ settings: Object, changed: boolean }}
 */
function updateEmojiSet(settings) {
    const result = { ...settings };
    let changed = false;

    switch (settings.set) {
        case "emojione": // removed in v3.0.0 of emoji-mart https://github.com/missive/emoji-mart/blob/master/CHANGELOG.md#v300
            result.set = "twitter";
            // @ts-ignore
            result.setMigratedToTwitterFrom = "emojione";
            changed = true;
            break;
        case "messenger": // removed in v3.0.0 of emoji-mart https://github.com/missive/emoji-mart/blob/master/CHANGELOG.md#v300
            result.set = "facebook";
            // @ts-ignore
            result.setMigratedToFacebookFrom = "messenger";
            changed = true;
            break;
        // no default: if it’s not one of the deprecated sets, we leave it alone
    }

    return { settings: result, changed };
}

/**
 * Upgrade the emoji data for emoji-mart v5 removing some not required properties.
 *
 * @param {typeof import("/common/modules/data/DefaultSettings.js").DEFAULT_SETTINGS.emojiPicker} settings
 * @returns {{ settings: Object, changed: boolean }}
 */
function updateEmojiMart5Data(settings) {
    const { native, emojiTooltip, ...clean } = settings;
    const changed = native !== undefined || emojiTooltip !== undefined;
    return { settings: clean, changed };
}

/**
 * Persist to storage.
 *
 * @param {typeof import("/common/modules/data/DefaultSettings.js").DEFAULT_SETTINGS.emojiPicker} emojiPickerSettings
 * @returns {Promise<void>}
 */
async function saveEmojiPickerData(emojiPickerSettings) {
    console.log("Saving upgraded settings:", emojiPickerSettings);
    await browser.storage.sync.set({ emojiPicker: emojiPickerSettings });
    console.info("Save complete:", await browser.storage.sync.get());
}

/**
 * Run all upgrades, then save if anything changed.
 *
 * @param {typeof import("/common/modules/data/DefaultSettings.js").DEFAULT_SETTINGS.emojiPicker} originalSettings
 * @returns {Promise<void>}
 */
async function upgradeEmojiPicker(originalSettings) {
    // clone so we never accidentally mutate the caller’s object
    let current = { ...originalSettings };
    let didChange = false;

    // 1) migrate old sets
    const setResult = updateEmojiSet(current);
    current = setResult.settings;
    didChange ||= setResult.changed;

    // 2) strip legacy props
    const emojiMart5Result = updateEmojiMart5Data(current);
    current = emojiMart5Result.settings;
    didChange ||= emojiMart5Result.changed;

    // 3) save only if any change happened
    if (didChange) {
        await saveEmojiPickerData(current);
    } else {
        console.log("No emoji-picker upgrade needed, data: setResult:", setResult, "emojiMart5Result:", emojiMart5Result);
    }
}

/**
 * Checks whether an upgrade is needed.
 *
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled}
 *
 * @private
 * @param {Object} details
 */
async function handleInstalled(details) {
    // only trigger for usual addon updates
    if (details.reason !== "update") {
        return;
    }

    console.log(`Upgrading from v${details.previousVersion}…`, details);

    /** {@type typeof import("/common/modules/data/DefaultSettings.js").DEFAULT_SETTINGS} */
    const oldData = await browser.storage.sync.get();
    console.log("Settings oldData:", oldData);
    await upgradeEmojiPicker(oldData.emojiPicker);
}

browser.runtime.onInstalled.addListener(handleInstalled);
console.warn("background: InstallUpgrade loaded");
