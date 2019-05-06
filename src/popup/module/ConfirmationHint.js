/**
 * Module for showing a confirmation to the user.
 *
 * Adapted from Firefox source code {@link https://searchfox.org/mozilla-central/source/browser/base/content/browser.js#8462}.
 * Licensed under the Mozilla Public License, see the LICENSE.md.
 *
 * @public
 */

const elPanel = document.getElementById("confirmation-hint");
const elAnimationBox = document.getElementById("confirmation-hint-checkmark-animation-container");
const elMessage = document.getElementById("confirmation-hint-message");
const elDescription = document.getElementById("confirmation-hint-description");

/**
 * Actually attach the popup to the position we want.
 *
 * @param  {HtmlElement} elPanel The panel to show..
 * @param  {HtmlElement} anchor The anchor for the panel.
 * @returns {void}
 */
function openPopup(elPanel, anchor) {
    const position = anchor.getBoundingClientRect();

    elPanel.style.top = `${position.bottom}px`;
    elPanel.style.left = `${position.right}px`;

    elPanel.classList.remove("invisible");
}

/**
 * Actually attach the popup to the position we want.
 *
 * @param  {HtmlElement} elPanel The panel to show..
 * @returns {void}
 */
function hidePopup(elPanel) {
    elPanel.classList.add("invisible");
}

/**
 * element, usually used in response to a user action to reaffirm that it was
 * successful and potentially provide extra context. Examples for such hints:
 * - "Saved to Library!" after bookmarking a page
 * - "Sent!" after sending a tab to another device
 * - "Queued (offline)" when attempting to send a tab to another device
 *   while offline
 *
 * @param  {HtmlElement} anchor
 *         The anchor for the panel.
 * @param  {string} messageId
 *         For getting the message string from i18n translation:
 *         confirmationHint.<messageId>.label
 * @param  {HtmlElement} options An object with the following optional properties:
 * @param  {event} [options.event] The event that triggered the feedback.
 * @param  {boolean} [options.showDescription] show description text (confirmationHint.<messageId>.description)
 * @returns {void}
 */
export function show(anchor, messageId, options = {}) {
    return new Promise((resolve) => {
        elMessage.textContent =
        browser.i18n.getMessage(`confirmationHint${messageId}`) || "example";

        if (options.showDescription) {
            elDescription.textContent =
            browser.i18n.getMessage(`confirmationHint${messageId}Description`);
            elDescription.hidden = false;
            elPanel.classList.add("with-description");
        } else {
            elDescription.hidden = true;
            elPanel.classList.remove("with-description");
        }

        // The timeout value used here allows the panel to stay open for
        // 1.5s second after the text transition (duration=120ms) has finished.
        // If there is a description, we show for 4s after the text transition.
        const DURATION = options.showDescription ? 4000 : 1500;

        // show popup
        openPopup(elPanel, anchor);

        elAnimationBox.setAttribute("animate", "true");

        setTimeout(() => {
            hidePopup(elPanel);

            elAnimationBox.removeAttribute("animate");
            resolve();
        }, DURATION + 120);
    });
}
