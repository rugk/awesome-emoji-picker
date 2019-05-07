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
 * Calculate/correct the position, so it dos not overflow.the window (popup).
 *
 * @private
 * @param  {Object} position where to put the message (top left border)
 * @param  {number} position.left manual position
 * @param  {number} position.top manual position
 * @param  {number} height the height of the popup
 * @param  {number} width the width of the popup
 * @returns {Object} the ficed position
 */
function keepMessageInsideOfPopup(position, height, width) {
    const TOLERANCE = 3; // px

    if (position instanceof HTMLElement) {
        position = position.getBoundingClientRect();
        position = {
            top: position.bottom,
            left: position.right
        };
    }

    // fix overflow top
    if (position.top < 0) {
        position.top = 0 + TOLERANCE;
    }
    // fix overflow left
    if (position.left < 0) {
        position.left = 0 + TOLERANCE;
    }
    // fix overflow bottom
    if (position.top + height > document.body.scrollHeight) {
        position.top = document.body.scrollHeight - height - TOLERANCE;
    }
    // fix overflow right
    if (position.left + width > document.body.scrollWidth) {
        position.left = document.body.scrollWidth - width - TOLERANCE;
    }

    return position;
}

/**
 * Actually attach the popup to the position we want.
 *
 * @private
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

    // we need to show it now, already, because the we cannot otherwise calculate the size
    // but we make it invisible
    elPanel.style.top = "0px"; // but make sure, it does not overflow while we temporarily show it
    elPanel.style.top = "0px";
    elPanel.style.visibility = "hidden";
    elPanel.classList.remove("invisible");

    position = keepMessageInsideOfPopup(position, elPanel.scrollHeight, elPanel.scrollWidth);

    elPanel.style.top = `${position.top}px`;
    elPanel.style.left = `${position.left}px`;

    // finally show it
    elPanel.style.visibility = "";
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
