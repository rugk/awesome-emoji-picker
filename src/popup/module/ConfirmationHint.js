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
 * @param  {boolean} [options.hideArrow] Optionally hide the arrow.
 * @param  {boolean} [options.showDescription] show description text (confirmationHint.<messageId>.description)
 * @returns {void}
 */
export function show(anchor, messageId, options = {}) {
    debugger;
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

    if (options.hideArrow) {
        elPanel.setAttribute("hidearrow", "true");
    }

    // The timeout value used here allows the panel to stay open for
    // 1.5s second after the text transition (duration=120ms) has finished.
    // If there is a description, we show for 4s after the text transition.
    const DURATION = options.showDescription ? 4000 : 1500;
    elPanel.addEventListener("popupshown", () => {
        elAnimationBox.setAttribute("animate", "true");

        setTimeout(() => {
            elPanel.hidePopup(true);
        }, DURATION + 120);
    }, {once: true});

    elPanel.addEventListener("popuphidden", () => {
        elPanel.removeAttribute("hidearrow");
        elAnimationBox.removeAttribute("animate");
    }, {once: true});

    elPanel.hidden = false;
    elPanel.openPopup(anchor, {
        position: "bottomcenter topleft",
        triggerEvent: options.event,
    });
}

show(
    null,
    "someTranslation"
);
