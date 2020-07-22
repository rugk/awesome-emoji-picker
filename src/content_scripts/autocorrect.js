"use strict";

const fractions = Object.freeze({
	"¼": 1.0 / 4.0,
	"½": 1.0 / 2.0,
	"¾": 3.0 / 4.0,
	"⅐": 1.0 / 7.0,
	"⅑": 1.0 / 9.0,
	"⅒": 1.0 / 10.0,
	"⅓": 1.0 / 3.0,
	"⅔": 2.0 / 3.0,
	"⅕": 1.0 / 5.0,
	"⅖": 2.0 / 5.0,
	"⅗": 3.0 / 5.0,
	"⅘": 4.0 / 5.0,
	"⅙": 1.0 / 6.0,
	"⅚": 5.0 / 6.0,
	"⅛": 1.0 / 8.0,
	"⅜": 3.0 / 8.0,
	"⅝": 5.0 / 8.0,
	"⅞": 7.0 / 8.0
});

const constants = Object.freeze({
	"π": Math.PI,
	"e": Math.E
});

// communication type
// directly include magic constant as a workaround as we cannot import modules in content scripts due to https://bugzilla.mozilla.org/show_bug.cgi?id=1451545
const AUTOCORRECT_CONTENT = "autocorrectContent";

let insertedText; // Last insert text
let deletedText; // Last deleted text
let lastTarget; // Last target
let lastCaretPosition; // Last caret position

let autocomplete = true;
let quotes = true;
let fracts = true;

let autocorrections = {};

let longest = 0;

// Regular expressions
let symbolpatterns = null;
// Do not autocorrect for these patterns
let apatterns = null;

let emojiShortcodes = {};

/**
 * Get caret position.
 *
 * @param {Object} target
 * @returns {number}
 */
function getCaretPosition(target) {
	if (target.isContentEditable) {
		target.focus();
		let _range = document.getSelection().getRangeAt(0);
		let range = _range.cloneRange();
		let temp = document.createTextNode("\0");
		range.insertNode(temp);
		const caretposition = target.innerText.indexOf("\0");
		temp.parentNode.removeChild(temp);
		return caretposition;
	}
	else {
		return target.selectionStart;
	}
}

/**
 * Insert at caret.
 * Adapted from: https://www.everythingfrontend.com/posts/insert-text-into-textarea-at-cursor-position.html
 *
 * @param {Object} target
 * @param {string} atext
 * @returns {void}
 */
function insertCaret(target, atext) {
	const isSuccess = document.execCommand("insertText", false, atext);

	// Firefox input and textarea fields: https://bugzilla.mozilla.org/show_bug.cgi?id=1220696
	if (!isSuccess && typeof target.setRangeText === "function") {
		const start = target.selectionStart;
		target.setRangeText(atext);

		target.selectionStart = target.selectionEnd = start + atext.length;

		// Notify any possible listeners of the change
		const event = document.createEvent("UIEvent");
		event.initEvent("input", true, false);
		target.dispatchEvent(event);
	}
}

/**
 * Insert into page.
 *
 * @param {string} atext
 * @returns {void}
 */
function insertIntoPage(atext) {
	return insertCaret(document.activeElement, atext);
}

/**
 * Count Unicode characters.
 * Adapted from: https://blog.jonnew.com/posts/poo-dot-length-equals-two
 *
 * @param {string} str
 * @returns {number}
 */
function countChars(str) {
	// removing the joiners
	const split = str.split("\u{200D}");
	let count = 0;

	for (const s of split) {
		// removing the variation selectors
		count += Array.from(s.split(/[\ufe00-\ufe0f]/).join("")).length;
	}

	return count;
}

/**
 * Delete at caret.
 *
 * @param {Object} target
 * @param {string} atext
 * @returns {void}
 */
function deleteCaret(target, atext) {
	const count = countChars(atext);
	if (count > 0) {
		const isSuccess = document.execCommand("delete", false);
		if (isSuccess) {
			for (let i = 0; i < count - 1; ++i) {
				document.execCommand("delete", false);
			}
		}
		// Firefox input and textarea fields: https://bugzilla.mozilla.org/show_bug.cgi?id=1220696
		else if (typeof target.setRangeText === "function") {
			const start = target.selectionStart;

			target.selectionStart = start - atext.length;
			target.selectionEnd = start;
			target.setRangeText('');

			// Notify any possible listeners of the change
			const e = document.createEvent("UIEvent");
			e.initEvent("input", true, false);
			target.dispatchEvent(e);
		}
	}
}

/**
 * Convert fractions and constants to Unicode characters.
 * Adapted from: https://github.com/tdulcet/Tables-and-Graphs/blob/master/graphs.hpp
 *
 * @param {number} anumber
 * @param {number} afraction
 * @returns {string}
 */
function outputLabel(anumber, afraction) {
	let output = false;

	const number = parseFloat(anumber);
	let intpart = Math.trunc(number);
	const fractionpart = afraction ? parseFloat(afraction) : Math.abs(number % 1);

	let strm = '';

	for (const fraction in fractions) {
		if (Math.abs(fractionpart - fractions[fraction]) < Number.EPSILON) {
			if (intpart !== 0) {
				strm += intpart;
			}

			strm += fraction;

			output = true;
			break;
		}
	}

	if (Math.abs(number) >= Number.EPSILON && !output) {
		for (const constant in constants) {
			if (!output && number % constants[constant] === 0) {
				intpart = number / constants[constant];

				if (intpart === -1) {
					strm += "-";
				}
				else if (intpart !== 1) {
					strm += intpart;
				}

				strm += constant;

				output = true;
				break;
			}
		}
	}

	if (!output) {
		strm += anumber;
	}

	return strm;
}

/**
 * Get first difference index.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function firstDifferenceIndex(a, b) {
	if (a === b) {
		return -1;
	}
	let i = 0;
	while (a[i] === b[i])
		++i;
	return i;
}

/**
 * Autocorrect.
 *
 * @param {Object} event
 * @returns {void}
 */
function autocorrect(event) {
	// console.log('keydown', event.key, event.key.length, event.keyCode);
	if (!((event.key.length === 0 || event.key.length === 1 || event.keyCode === 13 || event.key === 'Unidentified') && !event.ctrlKey && !event.metaKey && !event.altKey)) {
		return;
	}
	const target = event.target;
	const caretposition = getCaretPosition(target);
	if (caretposition) {
		const value = target.value || target.innerText;
		let deletecount = 0;
		let insert = value.slice(caretposition - 1, caretposition); // event.key;
		let output = false;
		// Use Unicode smart quotes
		if (quotes && (insert === "'" || insert === '"')) {
			const prevouschar = value.slice(caretposition < 2 ? 0 : caretposition - 2, caretposition - 1);
			// White space
			const re = /^\s*$/;
			if (insert === "'") {
				insert = re.test(prevouschar) ? '‘' : '’';
			}
			else if (insert === '"') {
				insert = re.test(prevouschar) ? '“' : '”';
			}
			deletecount = 1;
			output = true;
		}
		const prevoustext = value.slice(caretposition < (longest + 1) ? 0 : caretposition - (longest + 1), caretposition - 1);
		let regexResult = symbolpatterns.exec(prevoustext);
		// Autocorrect :colon: Emoji Shortcodes and/or Emoticon Emojis and/or Unicode Symbols
		if (regexResult) {
			const text = value.slice(caretposition < longest ? 0 : caretposition - longest, caretposition);
			let aregexResult = symbolpatterns.exec(text);
			let aaregexResult = apatterns.exec(text);
			if (!aaregexResult && (!aregexResult || (caretposition <= longest ? regexResult.index < aregexResult.index : regexResult.index <= aregexResult.index))) {
				insert = autocorrections[regexResult[0]] + (event.keyCode === 13 ? '\n' : insert);
				deletecount = regexResult[0].length + 1;
				output = true;
			}
		} else {
			// Autocomplete :colon: Emoji Shortcodes
			if (autocomplete) {
				// Emoji Shortcode
				const re = /:[a-z0-9-+_]+$/;
				const text = value.slice(caretposition < (longest - 1) ? 0 : caretposition - (longest - 1), caretposition);
				let regexResult = re.exec(text);
				if (regexResult) {
					const aregexResult = Object.keys(emojiShortcodes).filter((item) => item.indexOf(regexResult[0]) === 0);
					if (aregexResult.length === 1 && (regexResult[0].length > 2 || aregexResult[0].length === 3)) {
						insert = aregexResult[0].slice(regexResult[0].length);
						output = true;
					}
				}
			}
			// Convert fractions and mathematical constants to Unicode characters
			if (!output && fracts) {
				// Numbers: https://regex101.com/r/7jUaSP/2
				const re = /[0-9]+(\.[0-9]+)?$/;
				const prevoustext = value.slice(0, caretposition - 1);
				let regexResult = re.exec(prevoustext);
				if (regexResult) {
					const text = value.slice(0, caretposition);
					let aregexResult = re.exec(text);
					if (!aregexResult) {
						const label = outputLabel(regexResult[0], regexResult[1]);
						const index = firstDifferenceIndex(label, regexResult[0]);
						if (index >= 0) {
							insert = label.slice(index) + (event.keyCode === 13 ? '\n' : insert);
							deletecount = regexResult[0].length - index + 1;
							output = true;
						}
					}
				}
			}
		}
		if (output) {
			const text = value.slice(caretposition - deletecount, caretposition);
			deleteCaret(target, text);
			insertCaret(target, insert);
			console.debug("Autocorrect: “%s” was replaced with “%s”.", text, insert);

			insertedText = insert;
			deletedText = text;

			lastTarget = target;
			lastCaretPosition = caretposition - deletecount + insert.length;
		}
	}
}

/**
 * Undo autocorrect.
 *
 * @param {Object} event
 * @returns {void}
 */
function undoAutocorrect(event) {
	// console.log('keyup', event.key, event.key.length, event.keyCode);
	if (!(!event.ctrlKey && !event.metaKey && !event.altKey)) {
		return;
	}
	// Backspace
	if (event.keyCode === 8) {
		const target = event.target;
		const caretposition = getCaretPosition(target);
		if (caretposition) {
			if (target === lastTarget && caretposition === lastCaretPosition) {
				event.preventDefault();

				if (insertedText) {
					deleteCaret(target, insertedText);
				}
				if (deletedText) {
					insertCaret(target, deletedText);
				}
				console.debug("Undo autocorrect: “%s” was replaced with “%s”.", insertedText, deletedText);
			}
		}
	}

	lastTarget = null;
}

/**
 * Handle response from the autocorrect module.
 *
 * @param {Object} message
 * @param {Object} sender
 * @returns {void}
 */
function handleResponse(message, sender) {
	if (message.type !== AUTOCORRECT_CONTENT) {
		return;
	}
	autocomplete = message.autocomplete;
	quotes = message.quotes;
	fracts = message.fracts;
	autocorrections = message.autocorrections;
	longest = message.longest;
	symbolpatterns = message.symbolpatterns;
	apatterns = message.apatterns;
	emojiShortcodes = message.emojiShortcodes;
	// console.log(message);
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

browser.runtime.sendMessage({ "type": AUTOCORRECT_CONTENT }).then(handleResponse, handleError);
browser.runtime.onMessage.addListener(handleResponse);
window.addEventListener('keydown', undoAutocorrect, true);
window.addEventListener('keyup', autocorrect, true);
console.log("AwesomeEmoji autocorrect module loaded");
