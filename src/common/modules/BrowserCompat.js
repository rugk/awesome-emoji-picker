/**
 * Helper functions useful for ensuring browser compatibility.
 *
 * @public
 * @module BrowserCompat
 */

/**
 * Returns a value based on what browser this is running in.
 *
 * @private
 * @param  {Object} switchBrowser an object with values to return per browser
 * @returns {string}
 */
export async function getBrowserValue(switchBrowser) {
    if (browser.runtime.getBrowserInfo) {
        const browserInfo = await browser.runtime.getBrowserInfo();

        if (browserInfo.name === "Thunderbird") {
            return switchBrowser.thunderbird;
        } else {
            return switchBrowser.firefox;
        }
    } else {
        return switchBrowser.chrome;
    }
}
