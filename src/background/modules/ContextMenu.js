import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as BrowserCommunication from "/common/modules/BrowserCommunication/BrowserCommunication.js";
import { isMobile } from "/common/modules/MobileHelper.js";

import { COMMUNICATION_MESSAGE_TYPE } from "/common/modules/data/BrowserCommunicationTypes.js";

// Thunderbird
const IS_THUNDERBIRD = typeof messenger !== "undefined";

// Chrome
const IS_CHROME = Object.getPrototypeOf(browser) !== Object.prototype;

const EMOJI = "emoji";
const menus = browser.menus || browser.contextMenus; // fallback for Thunderbird

/**
 * Handle context menu click.
 *
 * @param {Object} info
 * @param {Object} tab
 * @returns {void}
 */
function handle(info, tab) {
    if (info.menuItemId === EMOJI) {
        // Thunderbird
        // Not yet enabled by Chrome: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/openPopup#browser_compatibility
        (IS_THUNDERBIRD ? browser.composeAction : browser.browserAction).openPopup();
    }
}

/**
 * Apply new context menu settings.
 *
 * @param {Object} contextMenu
 * @returns {Promise<void>}
 */
async function applySettings(contextMenu) {
    menus.removeAll();

    if (contextMenu.insertEmoji) {
        // find command
        const allCommands = await browser.commands.getAll();
        const commandToFind = IS_THUNDERBIRD ? "_execute_compose_action" : "_execute_browser_action";
        const popupOpenCommand = allCommands.find((command) => command.name === commandToFind);

        const menuText = `${popupOpenCommand.description || "Insert Emoji"} (${popupOpenCommand.shortcut})`;

        if (IS_CHROME) {
            menus.create({
                id: EMOJI,
                title: menuText,
                contexts: ["editable"]
            });
        } else {
            menus.create({
                id: EMOJI,
                title: menuText,
                command: commandToFind,
                contexts: ["editable"]
            });
        }
    }
}

/**
 * Init context menu module.
 *
 * @public
 * @returns {Promise<void>}
 */
export async function init() {
    // Remove once https://bugzilla.mozilla.org/show_bug.cgi?id=1595822 is fixed
    if (await isMobile()) {
        return;
    }

    const contextMenu = await AddonSettings.get("contextMenu");

    applySettings(contextMenu);

    if (IS_CHROME) {
        menus.onClicked.addListener(handle);
    }
}

BrowserCommunication.addListener(COMMUNICATION_MESSAGE_TYPE.CONTEXT_MENU, (request) => {
    // clear cache by reloading all options
    // await AddonSettings.loadOptions();

    return applySettings(request.optionValue);
});
