/**
 * Upgrades user data on installation of new updates.
 *
 * Attention: Currently you must not include this script asynchronously. See
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1506464 for details.
 *
 * @module InstallUpgrade
 */

/**
 * Upgrade the emoji sets to replaced removed/deprecated ones.
 *
 * @private
 * @param {Object} emojiPickerSettings
 * @returns {Promise}
 */
async function upgradeEmojiSet(emojiPickerSettings) {
    // change removed emoji sets to best existing one
    switch (emojiPickerSettings.set) {
    case "emojione": // removed in v3.0.0 of emoji-mart https://github.com/missive/emoji-mart/blob/master/CHANGELOG.md#v300
        emojiPickerSettings.set = "twitter"; // upgrade set from EmojiOne to Twitter
        emojiPickerSettings.setMigratedToTwitterFrom = "emojione"; // save old setting to be able to return to that later
        break;
    case "messenger": // removed in v3.0.0 of emoji-mart https://github.com/missive/emoji-mart/blob/master/CHANGELOG.md#v300
        emojiPickerSettings.set = "facebook"; // upgrade set from Messenger to Facebook
        emojiPickerSettings.setMigratedToFacebookFrom = "messenger"; // save old setting to be able to return to that later
        break;
    default: // no upgrade needed
        // eslint-disable-next-line no-case-declarations
        const text = "No emoji set upgrade needed.";
        console.log(text);
        return Promise.reject(new Error(text));
    }

    console.log("Doing emoji set upgrade.");
    await browser.storage.sync.set({
        emojiPicker: emojiPickerSettings
    });

    console.info("Emoji set upgrade successful.", await browser.storage.sync.get());
    return Promise.resolve();
}

/**
 * Checks whether an upgrade is needed.
 *
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled}
 * @private
 * @param {Object} details
 * @returns {Promise}
 */
async function handleInstalled(details) {
    // only trigger for usual addon updates
    if (details.reason !== "update") {
        return;
    }

    console.log(`Doing upgrade from ${details.previousVersion}.`, details);
    const oldData = await browser.storage.sync.get();

    // ignore returned promise, because it just carries the update status and is already logged
    upgradeEmojiSet(oldData.emojiPicker).catch(() => {});
}

/**
 * Inits module.
 *
 * @private
 * @returns {void}
 */
function init() {
    browser.runtime.onInstalled.addListener(handleInstalled);
}

init();
