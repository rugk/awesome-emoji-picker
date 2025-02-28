/**
 * Handling features for current page.
 *
 */

import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

/**
 * Insert emoji into page.
 *
 * Returns a Promise that results in the text that has been modified.
 *
 * @public
 * @param {string} text
 * @returns {Promise[]}
 */
export async function insertIntoPage(text) {
    const tabs = await browser.tabs.query({
        currentWindow: true,
        active: true
    });

    const promises = tabs.map((tab) => {
        // send request to insert emoji
        return browser.tabs.sendMessage(tab.id, {
            type: COMMUNICATION_MESSAGE_TYPE.INSERT,
            text
        });
    });

    return Promise.all(promises).then((array) => array.flat());
}
