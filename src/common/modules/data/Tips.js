/**
 * The settings/constraints for a tip, represented in an object.
 *
 * @public
 * @typedef {Object} TipObject
 * @property {string} id just some ID
 * @property {integer|null} requiredShowCount Shows the message x times; set
 * to `null` to show infinitively. This is the maximum value.
 * @property {bool} [allowDismiss=true] set to false to disallow dismissing
 * the message. This likely makes no sense for any tip, so the default is true.
 * @property {bool|integer} [requireDismiss=false] show the message, if it is
 * not, at least, dismissed for x times. Alternatively set to true to require
 * that message is dismissed the exact same number as requiredShowCount states,
 * i.e. only dismissed count as "tip shown".
 * @property {integer|null} [maximumDismiss=null] hides the message, if it
 * has been dismissed x times.
 * @property {integer} [requiredTriggers=10] require some displays ("triggers")
 * of (any) add-on page before showing tip. This is effectively just a minimum
 * limit, so it is not shown too "early".
 * @property {Object.<string, integer>} [showInContext] a key-value object with
 * context -> num to require the tip to be shown in a specific context for the
 * given number of times. See {@link RandomTips.setContext}.
 * @property {Object.<string, integer>} [maximumInContest] a key-value object with
 * context -> num to only show the tip in a specific context at most for the
 * given number of times. See {@link RandomTips.setContext}.
 * @property {bool|integer} [randomizeDisplay=false] Randomizes the display with a
 * chance of 50% by default (when set to `true`). You can override that percentage
 * by specifying an integer < 1 (e.g. 0.2 for a 20% chance) as a propbability.
 * The chance is the chance that the tip *is shown*, i.e. the tip is shown for
 * <= p and not shown for < p if p is the propbability you pass.
 * Note that the tip message display in general is already randomized
 * with a chance of 20%, see {@link RandomTips.GLOBAL_RANDOMIZE}.
 * @property {string} text The text to actually show. It is passed to the
 * {@link MessageHandler}, so you can (& should) use a translatable string here.
 * @property {Object} [actionButton] adds an action button to the message, is
 * passed as-is to the {@link MessageHandler} module.
 * @property {string} actionButton.text the text to use for the button
 * @property {string|function} actionButton.action the link or function to
 * execute on click
 * @property {callbackShowTip} [showTip] evaluate via a custom function
 * whether to show or not to show the tip
 */

/**
 * Custom function to check whether a tip shall be shown or not.
 *
 * **Attention:** This is evaluated before all other constraints were evaluated.
 * Be careful before returning `true`, you may actually want to return `null`.
 *
 * * If you return `true`, it means you **force**(!) the tip to be shown. This
 *   overrides the usual conditions and shows the tip immediately.
 * * If you return `false`, it means you disallow the tip to be shown.
 * * If `null` is returned, the usual (other) conditions that determinate whether
 *   to show the tip are evaluated.
 * If you throw something, this cancels the whole tip selection process.
 *
 * Note that you can actually _modify_ the values of the first two parameters, i.e.
 * `tipSpec` and `thisTipConfig`. If you modify the config, it will be saved
 * automatically.
 * The difference between `tipSpec` and `tipSpecOrig` is, that in `tipSpec` the
 * default values of the tips have been added/modified, if needed and that
 * `tipSpecOrig` is the original as you have specified it in {@link TipObject}.
 *
 * For stylistic reasons, it is recommend to not hardcode the function into the
 * this file, but use a separate file/module.
 *
 * @public
 * @callback callbackShowTip
 * @param  {TipObject} tipSpec the TipObject, merged with default values
 * @param  {module:RandomTips~TipConfigObject} thisTipConfig the settings of the tip
 * @param  {TipObject} tipSpecOrig the original, unmodified (frozen) TipObject
 *                                  of the tip
 * @param  {module:RandomTips~ModuleConfig} moduleConfig the whole config of this module
 * @return {boolean|null}
 */

import {isMobile} from "../MobileHelper.js";
import {userSpeaksLocaleNotYetTranslated} from "../LanguageHelper.js";
import { getBrowserValue } from "../BrowserCompat.js";

// Thunderbird
// https://bugzilla.mozilla.org/show_bug.cgi?id=1641573
const IS_THUNDERBIRD = typeof messenger !== "undefined";

const DEFAULT_POPUP_HOT_KEY = "Ctrl+Shift+Period";

/**
 * An array of all tips.
 *
 * @private
 * @const
 * @type {Array.<TipObject>}
 */
const tipArray = [
    {
        id: "likeAddon",
        requiredShowCount: 3,
        requireDismiss: 1,
        maximumDismiss: 2,
        requiredTriggers: 10,
        showInContext: {
            popup: 1
        },
        randomizeDisplay: false,
        text: "tipYouLikeAddon",
        actionButton: {
            text: "tipYouLikeAddonButton",
            action: ""
        },
        showTip: async (tipSpec, thisTipConfig) => {
            tipSpec.actionButton.action = await getBrowserValue({
                firefox: "https://addons.mozilla.org/firefox/addon/awesome-emoji-picker/reviews/?utm_source=addon-tips&utm_medium=addon&utm_content=addon-tips-tipYouLikeAddon&utm_campaign=addon-tips",
                thunderbird: "https://addons.thunderbird.net/thunderbird/addon/awesome-emoji-picker/reviews/?utm_source=addon-tips&utm_medium=addon&utm_content=addon-tips-tipYouLikeAddon&utm_campaign=addon-tips",
                chrome: "https://chrome.google.com/webstore/detail/awesome-emoji-picker/?utm_source=addon-tips&utm_medium=addon&utm_content=addon-tips-tipYouLikeAddon&utm_campaign=addon-tips",
            });
            return null;
        }
    },
    {
        id: "popupCodeHotkey",
        requiredShowCount: 3,
        maximumDismiss: 1,
        requiredTriggers: 2,
        randomizeDisplay: false,
        text: "tipPopupCodeHotkey",
        showTip: async () => {
            // do not show if user is on Android
            if (await isMobile()) {
                return false;
            }

            // find command
            const allCommands = await browser.commands.getAll();
            const commandToFind = IS_THUNDERBIRD ? "_execute_compose_action" : "_execute_browser_action";
            const popupOpenCommand = allCommands.find((command) => command.name === commandToFind);

            // if shortcut is modified, do not show tip
            if (popupOpenCommand.shortcut !== DEFAULT_POPUP_HOT_KEY) {
                return false;
            }

            return null; // continue as normal
        }
    },
    {
        id: "translateAddon",
        requiredShowCount: 5,
        maximumDismiss: 1,
        requiredTriggers: 10,
        randomizeDisplay: false,
        text: "tipTranslateAddon",
        actionButton: {
            text: "tipLearnMore",
            action: "tipTranslateAddonLink"
        },
        showTip: async (tipSpec) => {
            // do not show tip if add-on is already translated into a locale the
            // user speaks
            if (!await userSpeaksLocaleNotYetTranslated()) {
                // Instead of returning false, we "just" make it unlikely that
                // the tip is shown.
                // This means we can be sure the tip is shown anyway to some
                // users, who may speak a language we already have the add-on
                // translated into it, as they can still improve translations etc.
                tipSpec.randomizeDisplay = 0.1; // 10%

                return null;
            }

            return null; // continue as normal
        }
    }
];

// freeze it all, this is strongly recommend
for (const object of tipArray) {
    Object.freeze(object);
}

/**
 * The list of all tips. (now exported)
 *
 * @public
 * @const
 * @type {Array.<TipObject>}
 */
export const tips = Object.freeze(tipArray);
