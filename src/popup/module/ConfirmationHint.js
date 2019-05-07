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
 * @param  {HTMLElement} elPanel The panel to show..
 * @param  {HTMLElement|Object} position where to put the message (top left border)
 * puts it at the bottom right border of the HTMLElement, if you pass that
 * @param  {number} position.left if no HTMLElement is given, set a manual position here
 * @param  {number} position.top if no HTMLElement is given, set a manual position here
 * @returns {void}
 */
function openPopup(elPanel, position) {
    if (position instanceof HTMLElement) {
        position = position.getBoundingClientRect();
        position = {
            top: position.bottom,
            left: position.right
        };
    }

    elPanel.style.top = `${position.top}px`;
    elPanel.style.left = `${position.left}px`;

    elPanel.classList.remove("invisible");
}

/**
 * Actually attach the popup to the position we want.
 *
 * @param  {HTMLElement} elPanel The panel to show..
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
 * @param  {HTMLElement|Object} position where to put the message (top left border)
 * puts it at the bottom right border of the HTMLElement, if you pass that
 * @param  {number} position.left if no HTMLElement is given, set a manual position here
 * @param  {number} position.top if no HTMLElement is given, set a manual position here
 * @param  {string} messageId
 *         For getting the message string from i18n translation:
 *         confirmationHint.<messageId>.label
 * @param  {HTMLElement} options An object with the following optional properties:
 * @param  {event} [options.event] The event that triggered the feedback.
 * @param  {boolean} [options.showDescription] show description text (confirmationHint.<messageId>.description)
 * @returns {Promise}
 */
export function show(position, messageId, options = {}) {
    return new Promise((resolve) => {
        elMessage.textContent =
        browser.i18n.getMessage(`confirmationHint${messageId}`);

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
        openPopup(elPanel, position);

        elAnimationBox.setAttribute("animate", "true");

        setTimeout(() => {
            hidePopup(elPanel);

            elAnimationBox.removeAttribute("animate");
            resolve();
        }, DURATION + 120);
    });
}
