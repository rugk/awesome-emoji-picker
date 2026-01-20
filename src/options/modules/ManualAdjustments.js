import { getBrowserValue } from "/common/modules/BrowserCompat/BrowserCompat.js";
import { isChrome } from "/common/modules/BrowserCompat/BrowserCompat.js";

/**
 * Adds a "link"/trigger to the shortcut option so that it opens.
 */
function addShortcutsLink() {
    document.getElementById("shortcut").addEventListener("click", async (event) => {
        event.target.disabled = true;

        if (browser.commands.openShortcutSettings) {
            browser.commands.openShortcutSettings().finally(() => {
                event.target.disabled = false;
            });
        } else if (await isChrome()) {
            browser.tabs.create({ url: "chrome://extensions/shortcuts" }).finally(() => {
                event.target.disabled = false;
            });
        } else {
            alert("Unable to automatically open the Shortcut Settings (requires Firefox or Thunderbird 137 or greater).");
        }
    });
}

/**
 * Initializes module.
 *
 * Applies the adjustments.
 *
 * @returns {void}
 */
export function init() {
    getBrowserValue({
        firefox: "https://addons.mozilla.org/firefox/addon/unicodify-text-transformer/?utm_source=awesomeEmojiPicker-addon&utm_medium=addon&utm_content=awesomeEmojiPicker-addon-settings-inline&utm_campaign=awesomeEmojiPicker-addon-settings-inline",
        thunderbird: "https://addons.thunderbird.net/thunderbird/addon/unicodify-text-transformer/?utm_source=awesomeEmojiPicker-addon&utm_medium=addon&utm_content=awesomeEmojiPicker-addon-settings-inline&utm_campaign=awesomeEmojiPicker-addon-settings-inline",
        chrome: "https://chrome.google.com/webstore/detail/unicodify-text-transformer/?utm_source=awesomeEmojiPicker-addon&utm_medium=addon&utm_content=awesomeEmojiPicker-addon-settings-inline&utm_campaign=awesomeEmojiPicker-addon-settings-inline"
    }).then((browserUrl) => {
        document.getElementById("link-unicodify").href = browserUrl;
    });

    addShortcutsLink();
}

