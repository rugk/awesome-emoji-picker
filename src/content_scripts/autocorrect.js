"use strict";

const fractions = Object.freeze(["¼", "½", "¾", "⅐", "⅑", "⅒", "⅓", "⅔", "⅕", "⅖", "⅗", "⅘", "⅙", "⅚", "⅛", "⅜", "⅝", "⅞"]);

const fractionValues = Object.freeze([1.0 / 4.0, 1.0 / 2.0, 3.0 / 4.0, 1.0 / 7.0, 1.0 / 9.0, 1.0 / 10.0, 1.0 / 3.0, 2.0 / 3.0, 1.0 / 5.0, 2.0 / 5.0, 3.0 / 5.0, 4.0 / 5.0, 1.0 / 6.0, 5.0 / 6.0, 1.0 / 8.0, 3.0 / 8.0, 5.0 / 8.0, 7.0 / 8.0]);

const constants = Object.freeze(["π", "e"]);

const constantValues = Object.freeze([Math.PI, Math.E]);

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
	else
		return target.selectionStart;
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
		const e = document.createEvent("UIEvent");
		e.initEvent("input", true, false);
		target.dispatchEvent(e);
	}
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
		if (isSuccess)
			for (let i = 0; i < count - 1; ++i) {
				document.execCommand("delete", false);
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

	for (let i = 0; i < fractions.length && !output; ++i) {
		if (Math.abs(fractionpart - fractionValues[i]) < Number.EPSILON) {
			if (intpart !== 0)
				strm += intpart;

			strm += fractions[i];

			output = true;
		}
	}

	if (Math.abs(number) >= Number.EPSILON) {
		for (let i = 0; i < constants.length && !output; ++i) {
			if (!output && number % constantValues[i] === 0) {
				intpart = number / constantValues[i];

				if (intpart === -1)
					strm += "-";
				else if (intpart !== 1)
					strm += intpart;

				strm += constants[i];

				output = true;
			}
		}
	}

	if (!output)
		strm += anumber;

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
	if (a === b)
		return -1;
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
	if ((event.key.length === 0 || event.key.length === 1 || event.keyCode === 13 || event.key === 'Unidentified') && !event.ctrlKey && !event.metaKey && !event.altKey) {
		let target = event.target;
		const caretposition = getCaretPosition(target);
		if (caretposition) {
			const value = target.value ? target.value : target.innerText;
			let deletecount = 0;
			let insert = value.slice(caretposition - 1, caretposition); // event.key;
			let output = false;
			if (quotes && (insert === "'" || insert === '"')) {
				const prevouschar = value.slice(caretposition < 2 ? 0 : caretposition - 2, caretposition - 1);
				// White space
				const re = /^\s*$/;
				if (insert === "'")
					insert = re.test(prevouschar) ? '‘' : '’';
				else if (insert === '"')
					insert = re.test(prevouschar) ? '“' : '”';
				deletecount = 1;
				output = true;
			}
			const prevoustext = value.slice(caretposition < (longest + 1) ? 0 : caretposition - (longest + 1), caretposition - 1);
			let array = symbolpatterns.exec(prevoustext);
			if (array) {
				const text = value.slice(caretposition < longest ? 0 : caretposition - longest, caretposition);
				let aarray = symbolpatterns.exec(text);
				let aaarray = apatterns.exec(text);
				if (!aaarray && (!aarray || (caretposition <= longest ? array.index < aarray.index : array.index <= aarray.index))) {
					insert = autocorrections[array[0]] + (event.keyCode === 13 ? '\n' : insert);
					deletecount = array[0].length + 1;
					output = true;
				}
			} else {
				if (autocomplete) {
					// Emoji Shortcode
					const re = /:[a-z0-9-+_]+$/;
					const text = value.slice(caretposition < (longest - 1) ? 0 : caretposition - (longest - 1), caretposition);
					let array = re.exec(text);
					if (array) {
						const aarray = Object.keys(emojiShortcodes).filter(function (item) { return item.indexOf(array[0]) === 0; });
						if (aarray.length === 1 && (array[0].length > 2 || aarray[0].length === 3)) {
							insert = aarray[0].slice(array[0].length);
							output = true;
						}
					}
				}
				if (!output && fracts) {
					// Numbers
					const re = /[0-9]+([.][0-9]*)?$/;
					const prevoustext = value.slice(0, caretposition - 1);
					let array = re.exec(prevoustext);
					if (array) {
						const text = value.slice(0, caretposition);
						let aarray = re.exec(text);
						if (!aarray) {
							const label = outputLabel(array[0], array[1]);
							const index = firstDifferenceIndex(label, array[0]);
							if (index >= 0) {
								insert = label.slice(index) + (event.keyCode === 13 ? '\n' : insert);
								deletecount = array[0].length - index + 1;
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
				console.log("Autocorrect: “%s” was replaced with “%s”.", text, insert);

				insertedText = insert;
				deletedText = text;

				lastTarget = target;
				lastCaretPosition = caretposition - deletecount + insert.length;
			}
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
	if (!event.ctrlKey && !event.metaKey && !event.altKey) {
		if (event.keyCode === 8) {
			let target = event.target;
			const caretposition = getCaretPosition(target);
			if (caretposition) {
				if (target === lastTarget && caretposition === lastCaretPosition) {
					event.preventDefault();

					if (insertedText)
						deleteCaret(target, insertedText);
					if (deletedText)
						insertCaret(target, deletedText);
					console.log("Undo autocorrect: “%s” was replaced with “%s”.", insertedText, deletedText);
				}
			}
		}

		lastTarget = undefined;
	}
}

/**
 * Handle response.
 *
 * @param {Object} message
 * @param {Object} sender
 * @param {function} sendResponse
 * @returns {void}
 */
function handleResponse(message, sender, sendResponse) {
	if (message.type == "autocorrectContent") {
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
}

/**
 * Handle error.
 *
 * @param {string} error
 * @returns {void}
 */
function handleError(error) {
	console.error(`Error: ${error}`);
}

browser.runtime.sendMessage({ "type": "autocorrectContent" }).then(handleResponse, handleError);
browser.runtime.onMessage.addListener(handleResponse);
window.addEventListener('keydown', undoAutocorrect, true);
window.addEventListener('keyup', autocorrect, true);
// console.log("Autocorrect");
