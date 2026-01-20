"use strict";

// communication type
// directly include magic constant as a workaround as we cannot import modules in content scripts due to https://bugzilla.mozilla.org/show_bug.cgi?id=1451545
const AUTOCORRECT_CONTENT = "autocorrectContent";
const INSERT = "insert";

const segmenter = new Intl.Segmenter();

let insertedText; // Last insert text
let deletedText; // Last deleted text
let lastTarget; // Last target
let lastCaretPosition; // Last caret position

let enabled = false;
let autocomplete = true;
let autocompleteSelect = false;

let autocorrections = {};

let longest = 0;

// Regular expressions
let symbolpatterns = null;
// Exceptions, do not autocorrect for these patterns
let antipatterns = null;

let emojiShortcodes = {};

let running = false;

/**
 * Get caret position.
 *
 * @param {HTMLElement} target
 * @returns {number|null}
 */
function getCaretPosition(target) {
    // ContentEditable elements
    if (target.isContentEditable || document.designMode === "on") {
        target.focus();
        const selection = document.getSelection();
        if (selection.rangeCount !== 1) {
            return null;
        }
        const arange = selection.getRangeAt(0);
        if (!arange.collapsed) {
            return null;
        }
        const range = arange.cloneRange();
        const temp = document.createTextNode("\0");
        range.insertNode(temp);
        const caretposition = target.innerText.indexOf("\0");
        temp.remove();
        return caretposition;
    }
    // input and textarea fields
    if (target.selectionStart !== target.selectionEnd) {
        return null;
    }
    return target.selectionStart;
}

/**
 * Insert at caret in the given element.
 * Adapted from: https://www.everythingfrontend.com/posts/insert-text-into-textarea-at-cursor-position.html
 *
 * @param {HTMLElement} target
 * @param {string} atext
 * @throws {Error} if nothing is selected
 * @returns {void}
 */
function insertAtCaret(target, atext) {
    // document.execCommand is deprecated, although there is not yet an alternative: https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
    // insertReplacementText
    if (document.execCommand("insertText", false, atext)) {
        return;
    }

    // Firefox input and textarea fields: https://bugzilla.mozilla.org/show_bug.cgi?id=1220696
    if (target.setRangeText) {
        const start = target.selectionStart;
        const end = target.selectionEnd;

        if (start != null && end != null) {
            target.setRangeText(atext);

            target.selectionStart = target.selectionEnd = start + atext.length;

            // Notify any possible listeners of the change
            const event = document.createEvent("UIEvent");
            event.initEvent("input", true, false);
            target.dispatchEvent(event);

            return;
        }
    }

    throw new Error("nothing selected");
}

/**
 * Insert at caret in the given element and select.
 *
 * @param {HTMLElement} target
 * @param {string} atext
 * @returns {void}
 */
function insertAndSelect(target, atext) {
    insertAtCaret(target, atext);
    // ContentEditable elements
    if (target.isContentEditable || document.designMode === "on") {
        const range = document.getSelection().getRangeAt(0);
        range.setStart(range.startContainer, range.startOffset - atext.length);
    }
    // input and textarea fields
    else {
        target.selectionStart -= atext.length;
    }
}

/**
 * Insert into page.
 *
 * @param {string} atext
 * @returns {void}
 */
function insertIntoPage(atext) {
    return insertAtCaret(document.activeElement, atext);
}

/**
 * Count Unicode characters.
 * Adapted from: https://blog.jonnew.com/posts/poo-dot-length-equals-two
 *
 * @param {string} str
 * @returns {number}
 */
function countChars(str) {
    // removing the Unicode joiner chars \u200D
    return Array.from(segmenter.segment(str.replaceAll("\u200D", ""))).length;
}

/**
 * Delete at caret.
 *
 * @param {HTMLElement} target
 * @param {string} atext
 * @returns {void}
 */
function deleteCaret(target, atext) {
    const count = countChars(atext);
    if (count > 0) {
        // document.execCommand is deprecated, although there is not yet an alternative: https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
        if (document.execCommand("delete", false)) {
            for (let i = 0; i < count - 1; ++i) {
                document.execCommand("delete", false);
            }
        }
        // Firefox input and textarea fields: https://bugzilla.mozilla.org/show_bug.cgi?id=1220696
        else if (target.setRangeText) {
            const start = target.selectionStart;

            target.selectionStart = start - atext.length;
            target.selectionEnd = start;
            target.setRangeText("");

            // Notify any possible listeners of the change
            const e = document.createEvent("UIEvent");
            e.initEvent("input", true, false);
            target.dispatchEvent(e);
        }
    }
}

/**
 * Autocorrect on text input even by evaluating the keys and replacing the characters/string.
 *
 * @param {InputEvent} event
 * @returns {void}
 */
function autocorrect(event) {
    // console.log('beforeinput', event.inputType, event.data);
    if (!["insertText", "insertCompositionText", "insertParagraph", "insertLineBreak"].includes(event.inputType)) {
        return;
    }
    if (!symbolpatterns) {
        throw new Error("Emoji autocorrect settings have not been received. Do not autocorrect.");
    }
    if (running) {
        return;
    }
    running = true;
    const { target } = event;
    const caretposition = getCaretPosition(target);
    if (caretposition != null) {
        const value = target.value || target.innerText;
        let deletecount = 0;
        let insert = ["insertLineBreak", "insertParagraph"].includes(event.inputType) ? "\n" : event.data;
        const inserted = insert;
        let output = false;
        const previousText = value.slice(caretposition < longest ? 0 : caretposition - longest, caretposition);
        const regexResult = symbolpatterns.exec(previousText);
        // Autocorrect :colon: Emoji Shortcodes and/or Emoticon Emojis and/or Unicode Symbols
        if (regexResult) {
            const length = longest - 1;
            const text = value.slice(caretposition < length ? 0 : caretposition - length, caretposition) + inserted;
            const aregexResult = symbolpatterns.exec(text);
            if (!antipatterns.test(text) && (!aregexResult || (caretposition <= longest ? regexResult.index < aregexResult.index : regexResult.index <= aregexResult.index))) {
                const [autocorrection] = regexResult;
                insert = autocorrections[autocorrection] + inserted;
                deletecount = autocorrection.length;
                output = true;
            }
        } else {
            // Autocomplete :colon: Emoji Shortcodes
            if (autocomplete) {
                // Emoji Shortcode
                const re = /:[a-z0-9-+_]+$/u;
                const length = longest - 2;
                const text = value.slice(caretposition < length ? 0 : caretposition - length, caretposition) + inserted;
                const regexResult = re.exec(text);
                if (regexResult) {
                    const [shortcode] = regexResult;
                    const aregexResult = Object.keys(emojiShortcodes).filter((item) => item.indexOf(shortcode) === 0);
                    if (aregexResult.length >= 1 && (shortcode.length > 2 || aregexResult[0].length === 3)) {
                        const ainsert = aregexResult[0].slice(shortcode.length);
                        if (autocompleteSelect || aregexResult.length > 1) {
                            event.preventDefault();

                            insertAtCaret(target, inserted);
                            insertAndSelect(target, ainsert);
                        } else {
                            insert = inserted + ainsert;
                            output = true;
                        }
                    }
                }
            }
        }
        if (output) {
            event.preventDefault();

            const text = deletecount ? value.slice(caretposition - deletecount, caretposition) : "";
            if (text) {
                lastTarget = null;
                deleteCaret(target, text);
            }
            insertAtCaret(target, insert);

            insertedText = insert;
            deletedText = text + inserted;
            console.debug("Autocorrect: “%s” was replaced with “%s”.", deletedText, insertedText);

            lastTarget = target;
            lastCaretPosition = caretposition - deletecount + insert.length;

            if (deletedText && insertedText.startsWith(deletedText)) {
                insertedText = insertedText.slice(deletedText.length);
                deletedText = "";
            }
        }
    }
    running = false;
}

/**
 * Undo autocorrect in case the backspace has been pressed.
 *
 * @param {InputEvent} event
 * @returns {void}
 */
function undoAutocorrect(event) {
    // console.log('beforeinput', event.inputType, event.data);
    // Backspace
    if (event.inputType !== "deleteContentBackward") {
        return;
    }
    if (running) {
        return;
    }
    running = true;
    const { target } = event;
    const caretposition = getCaretPosition(target);
    if (caretposition != null) {
        if (target === lastTarget && caretposition === lastCaretPosition) {
            event.preventDefault();

            if (insertedText) {
                lastTarget = null;
                deleteCaret(target, insertedText);
            }
            if (deletedText) {
                insertAtCaret(target, deletedText);
            }
            console.debug("Undo autocorrect: “%s” was replaced with “%s”.", insertedText, deletedText);
        }

        lastTarget = null;
    }
    running = false;
}

/**
 * Handle response from the autocorrect module.
 *
 * @param {Object} message
 * @param {Object} sender
 * @returns {void}
 */
function handleResponse(message, sender) {
    if (message.type === AUTOCORRECT_CONTENT) {
        ({
            enabled,
            autocomplete,
            autocompleteSelect,
            autocorrections,
            longest,
            symbolpatterns,
            antipatterns,
            emojiShortcodes
        } = message);
        symbolpatterns = (typeof symbolpatterns === "string") ? new RegExp(symbolpatterns, "u") : symbolpatterns;
        antipatterns = (typeof antipatterns === "string") ? new RegExp(antipatterns, "u") : antipatterns;

        if (enabled) {
            addEventListener("beforeinput", undoAutocorrect, true);
            addEventListener("beforeinput", autocorrect, true);
        } else {
            removeEventListener("beforeinput", undoAutocorrect, true);
            removeEventListener("beforeinput", autocorrect, true);
        }
    } else if (message.type === INSERT) {
        insertIntoPage(message.text);
    }
}

/**
 * Handle errors from messages and responses.
 *
 * @param {string} error
 * @returns {void}
 */
function handleError(error) {
    console.error(`Error: ${error}`);
}

browser.runtime.sendMessage({ type: AUTOCORRECT_CONTENT }).then(handleResponse, handleError);
browser.runtime.onMessage.addListener(handleResponse);
console.log("AwesomeEmoji autocorrect module loaded.");
