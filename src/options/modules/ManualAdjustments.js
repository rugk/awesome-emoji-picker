import { getBrowserValue } from "/common/modules/BrowserCompat.js";

/**
 * Initializes module.
 *
 * Applies the adjustments.
 *
 * @returns {Promise}
 */
export function init() {
    getBrowserValue({
        firefox: "https://addons.mozilla.org/firefox/addon/unicodify-text-transformer/?utm_source=unicodify-addon&utm_medium=addon&utm_content=unicodify-addon-settings-inline&utm_campaign=unicodify-addon-settings-inline",
        thunderbird: "https://addons.thunderbird.net/thunderbird/addon/unicodify-text-transformer/?utm_source=unicodify-addon&utm_medium=addon&utm_content=unicodify-addon-settings-inline&utm_campaign=unicodify-addon-settings-inline",
        chrome: "https://chrome.google.com/webstore/detail/unicodify-text-transformer/",
    }).then((browserUrl) => {
        document.getElementById("link-unicodify").href = browserUrl;
    });
}
