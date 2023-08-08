/**
 * Handling features for current page.
 *
 */

/**
 * Insert emoji into page.
 *
 * Returns a Promise that results in the text that has been modified.
 *
 * @public
 * @param {string} text
 * @returns {Promise}
 */
export async function insertIntoPage(text) {
    const tabs = await browser.tabs.query({
        currentWindow: true,
        active: true
    });

    const promises = tabs.map(/* async */ (tab) => {
        /* // make sure content script is inserted
        await browser.tabs.executeScript(tab.id, {
            code: "insertIntoPage;",
            allFrames: true,
            runAt: "document_end"
        }).catch(() => {
            // ends here if insertIntoPage == undefined
            // insert function, if needed
            return browser.tabs.executeScript(tab.id, {
                file: "/content_scripts/insertIntoPage.js",
                allFrames: true,
                runAt: "document_end"
            });
        }); */

        // send request to insert emoji
        // This will not work in Manifest V3: https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#executing-arbitrary-strings
        return browser.tabs.executeScript(tab.id, {
            code: `insertIntoPage(${JSON.stringify(text)});`,
            allFrames: true,
            runAt: "document_end"
        });
    });

    return Promise.all(promises).then((array) => array.flat());
}
