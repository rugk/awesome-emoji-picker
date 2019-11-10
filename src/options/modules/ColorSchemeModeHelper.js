/**
 * This function changes the screenshot in the options menu as per user's OS theme preference. By default the
 * user sees a light-themed screenshot,* * * * * *  but if the user has selected a dark themed OS, the screenshot
 * will also appear dark.
 *
 * @private
 * @note does not work in Firefox currently due to https://bugzilla.mozilla.org/show_bug.cgi?id=1595037
 * @param  {Object} darkQuery
 * @returns {void}
 */
function changeScreenshotTheme(darkQuery) {
    if (darkQuery.matches) {
        document.getElementById("searchBarDemo").src = "./img/emojiSearchDog_dark.png";
    } else {
        document.getElementById("searchBarDemo").src = "./img/emojiSearchDog_light.png";
    }
}

/**
 * Initiates the module.
 *
 * @public
 * @returns {void}
 */
export function init() {
    const dark = window.matchMedia("(prefers-color-scheme: dark)");

    dark.addListener(changeScreenshotTheme);

    return changeScreenshotTheme(dark);
}
