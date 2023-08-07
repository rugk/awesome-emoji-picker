"use strict";

/**
 * Return the username, you want to follow.
 *
 * @function
 * @param {string} newText
 * @returns {void}
 */
function insertIntoPage(newText) { // eslint-disable-line no-unused-vars
    const elFocused = document.activeElement;

    // does not work in Firefox currently for text fields, only for context editable
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=1220696
    if (document.execCommand("insertText", false, newText)) {
        return elFocused.value;
    }

    const start = elFocused.selectionStart;
    const end = elFocused.selectionEnd;

    if (start != null && end != null) {
        elFocused.setRangeText(newText, start, end, "end");
        return elFocused.value;
    }

    throw new Error("nothing selected");
}
