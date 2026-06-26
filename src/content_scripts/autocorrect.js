// Guard against double-initialization when injected via both registerContentScripts
// (persistent, fires on page load) and executeScript (immediate injection into open tabs).
if (!globalThis.__awesomeEmojiPickerAutocorrectLoaded) {
    globalThis.__awesomeEmojiPickerAutocorrectLoaded = true;

    // communication type
    // directly include magic constant as a workaround as we cannot import modules in content scripts due to https://bugzilla.mozilla.org/show_bug.cgi?id=1451545
    const AUTOCORRECT_CONTENT = "autocorrectContent";
    const INSERT = "insert";

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
     * Get the root editable element for a contenteditable/designMode edit.
     *
     * @param {EventTarget} target
     * @returns {HTMLElement|null}
     */
    function getEditingRoot(target) {
        if (document.designMode === "on") {
            return document.body || document.documentElement;
        }

        if (!target.isContentEditable) {
            return null;
        }

        let element = target;
        while (element.parentElement?.isContentEditable) {
            element = element.parentElement;
        }
        return element;
    }

    /**
     * Get a stable collapsed caret range without mutating the editing host.
     *
     * @param {InputEvent} event
     * @returns {Range|null}
     */
    function getCaretRange(event) {
        if (event.inputType.startsWith("insert") && event.getTargetRanges) {
            const ranges = event.getTargetRanges();
            if (ranges.length === 1) {
                const [range] = ranges;
                const arange = document.createRange();
                arange.setStart(range.startContainer, range.startOffset);
                arange.setEnd(range.endContainer, range.endOffset);
                if (!arange.collapsed) {
                    return null;
                }
                return arange;
            }
        }

        const selection = document.getSelection();
        if (!selection || selection.rangeCount !== 1) {
            return null;
        }

        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            return null;
        }

        return range.cloneRange();
    }

    /**
     * Get the text before the caret without mutating the page DOM.
     *
     * @param {HTMLElement|HTMLInputElement|HTMLTextAreaElement} target
     * @param {InputEvent} event
     * @returns {string|null}
     */
    function getTextBeforeCaret(target, event) {
        // ContentEditable elements
        const root = getEditingRoot(target);
        if (root) {
            const caretRange = getCaretRange(event);
            if (!caretRange) {
                return null;
            }

            const range = document.createRange();
            range.selectNodeContents(root);
            range.setEnd(caretRange.endContainer, caretRange.endOffset);
            return range.toString();
        }
        // input and textarea fields
        if (target.selectionStart !== target.selectionEnd) {
            return null;
        }
        return target.value.slice(0, target.selectionStart);
    }

    /**
     * Insert at the current selection/caret in the given element.
     * Adapted from: https://www.everythingfrontend.com/posts/insert-text-into-textarea-at-cursor-position.html
     *
     * @param {HTMLElement} target
     * @param {string} atext
     * @returns {boolean}
     */
    function insertAtCaret(target, atext) {
        // document.execCommand is deprecated, although there is not yet an alternative: https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
        // insertReplacementText
        if (document.execCommand("insertText", false, atext)) {
            return true;
        }

        // Firefox input and textarea fields: https://bugzilla.mozilla.org/show_bug.cgi?id=1220696
        if (target.setRangeText && target.selectionStart != null && target.selectionEnd != null) {
            target.setRangeText(atext, target.selectionStart, target.selectionEnd, "end");
            target.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: atext }));
            return true;
        }

        return false;
    }

    /**
     * Insert at caret in the given element and select the inserted text.
     *
     * @param {HTMLElement} target
     * @param {string} atext
     * @returns {boolean}
     */
    function insertAndSelect(target, atext) {
        if (!insertAtCaret(target, atext)) {
            return false;
        }

        const root = getEditingRoot(target);
        if (root) {
            const selection = document.getSelection();
            if (!selection || selection.rangeCount !== 1) {
                return true;
            }

            const caretRange = selection.getRangeAt(0);
            if (!caretRange.collapsed) {
                return true;
            }

            const range = getRangeBeforeCaret(root, caretRange, atext.length);
            if (!range || range.toString() !== atext) {
                return true;
            }

            selection.removeAllRanges();
            selection.addRange(range);
            return true;
        }

        target.selectionStart = target.selectionEnd - atext.length;

        return true;
    }

    /**
     * Insert into page.
     *
     * @param {string} atext
     * @returns {void}
     */
    function insertIntoPage(atext) {
        if (!insertAtCaret(document.activeElement, atext)) {
            throw new Error("nothing selected");
        }
    }

    /**
     * Return a DOM range covering the given number of UTF-16 code units before the caret.
     *
     * @param {HTMLElement} root
     * @param {Range} caretRange
     * @param {number} length
     * @returns {Range|null}
     */
    function getRangeBeforeCaret(root, caretRange, length) {
        const range = document.createRange();
        range.setEnd(caretRange.startContainer, caretRange.startOffset);

        if (!length) {
            range.collapse(false);
            return range;
        }

        let remaining = length;
        const textNodes = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            let endOffset;
            if (node === caretRange.startContainer) {
                endOffset = caretRange.startOffset;
            } else {
                const position = caretRange.comparePoint(node, node.length);
                if (position > 0) {
                    break;
                }
                endOffset = node.length;
            }

            if (endOffset > 0) {
                textNodes.push([node, endOffset]);
            }
        }

        for (const [node, endOffset] of textNodes.reverse()) {
            const take = Math.min(remaining, endOffset);
            remaining -= take;
            if (!remaining) {
                range.setStart(node, endOffset - take);
                return range;
            }
        }

        return null;
    }

    /**
     * Apply a prepared text replacement.
     *
     * @param {HTMLElement|HTMLInputElement|HTMLTextAreaElement} target
     * @param {InputEvent} event
     * @param {string} deleteText
     * @param {string} insertText
     * @returns {boolean}
     */
    function applyReplacement(target, event, deleteText, insertText) {
        const root = getEditingRoot(target);
        if (root) {
            const caretRange = getCaretRange(event);
            if (!caretRange) {
                return false;
            }

            const range = getRangeBeforeCaret(root, caretRange, deleteText.length);
            if (!range || range.toString() !== deleteText) {
                return false;
            }

            const selection = document.getSelection();
            if (!selection) {
                return false;
            }

            event.preventDefault();

            selection.removeAllRanges();
            selection.addRange(range);
            return insertAtCaret(root, insertText);
        }

        if (target.selectionStart !== target.selectionEnd) {
            return false;
        }

        const start = target.selectionStart - deleteText.length;
        if (start < 0 || target.value.slice(start, target.selectionStart) !== deleteText) {
            return false;
        }

        event.preventDefault();

        const end = target.selectionStart;
        target.selectionStart = start;
        target.selectionEnd = end;

        // "insertReplacementText"
        return insertAtCaret(target, insertText);
    }

    /**
     * Autocorrect on text input even by evaluating the keys and replacing the characters/string.
     *
     * @param {InputEvent} event
     * @returns {void}
     */
    function autocorrect(event) {
        // console.log('beforeinput', event.inputType, event.data);
        if (event.isComposing || event.cancelable === false || !["insertText", "insertParagraph", "insertLineBreak"].includes(event.inputType)) {
            return;
        }
        if (!symbolpatterns) {
            throw new Error("Emoji autocorrect settings have not been received. Do not autocorrect.");
        }
        if (running) {
            return;
        }
        running = true;
        try {
            const { target } = event;
            const value = getTextBeforeCaret(target, event);
            if (value == null) {
                return;
            }
            const caretposition = value.length;
            let deletecount = 0;
            let insert = ["insertLineBreak", "insertParagraph"].includes(event.inputType) ? "\n" : event.data;
            const inserted = insert;
            let output = false;
            const previousText = value.slice(-longest);
            const regexResult = symbolpatterns.exec(previousText);
            // Autocorrect :colon: Emoji Shortcodes and/or Emoticon Emojis and/or Unicode Symbols
            if (regexResult) {
                const length = longest - 1;
                const text = value.slice(-length) + inserted;
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
                    const text = value.slice(-length) + inserted;
                    const regexResult = re.exec(text);
                    if (regexResult) {
                        const [shortcode] = regexResult;
                        const aregexResult = Object.keys(emojiShortcodes).filter((item) => item.indexOf(shortcode) === 0);
                        if (aregexResult.length >= 1 && (shortcode.length > 2 || aregexResult[0].length === 3)) {
                            const ainsert = aregexResult[0].slice(shortcode.length);
                            if (autocompleteSelect || aregexResult.length > 1) {
                                if (applyReplacement(target, event, "", inserted)) {
                                    insertAndSelect(target, ainsert);
                                }
                                return;
                            }

                            insert = inserted + ainsert;
                            output = true;
                        }
                    }
                }
            }
            if (output) {
                const text = deletecount ? value.slice(caretposition - deletecount) : "";
                if (!applyReplacement(target, event, text, insert)) {
                    return;
                }

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
        } finally {
            running = false;
        }
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
        if (event.isComposing || event.cancelable === false || event.inputType !== "deleteContentBackward") {
            return;
        }
        if (running) {
            return;
        }
        running = true;
        try {
            const { target } = event;
            const value = getTextBeforeCaret(target, event);
            if (value == null) {
                return;
            }
            const caretposition = value.length;
            if (target === lastTarget && caretposition === lastCaretPosition && (!insertedText || value.endsWith(insertedText))) {
                if (applyReplacement(target, event, insertedText, deletedText)) {
                    console.debug("Undo autocorrect: “%s” was replaced with “%s”.", insertedText, deletedText);
                }
            }

            lastTarget = null;
        } finally {
            running = false;
        }
    }

    /**
     * Handle response from the autocorrect module.
     *
     * @param {object} message
     * @param {object} sender
     * @returns {void}
     */
    function handleResponse(message, _sender) {
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
            symbolpatterns = typeof symbolpatterns === "string" ? new RegExp(symbolpatterns, "u") : symbolpatterns;
            antipatterns = typeof antipatterns === "string" ? new RegExp(antipatterns, "u") : antipatterns;

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

    browser.runtime.sendMessage({ type: AUTOCORRECT_CONTENT }).then(handleResponse, (error) => {
        console.error(`Error: ${error}`);
    });
    browser.runtime.onMessage.addListener(handleResponse);
}
