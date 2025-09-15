import { getBrowserValue } from "/common/modules/BrowserCompat/BrowserCompat.js";

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
}
