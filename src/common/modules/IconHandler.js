import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

const POPUP_ICON_OPTION = "popupIconColored";

/**
 * Sets a popup icon variant.
 *
 * @private
 * @param {string|null} icon version or "null"/"undefined" to reset to default
 * @returns {Promise}
 */
function setPopupIcon(icon) {
    // verify parameter
    switch (icon) {
    case "dark": // fall through
    case "light":
    case "colored":
    case null:
        // ok
        break;
    default:
        throw new TypeError(`invalid parameter: ${icon}`);
    }

    // Thunderbird
    const browserAction = globalThis.messenger ? browser.composeAction : browser.action;

    // ignore request if API is not available
    if (!browserAction.setIcon) {
        return Promise.resolve();
    }

    if (icon == null) {
        return browserAction.setIcon({path: null});
    }

    // set colored icon
    if (icon === "colored") {
        // WTF: For whatever reason, these paths need to be absolute...
        return browserAction.setIcon({path: {
            16: "/icons/icon_32.png",
            32: "/icons/icon_32.png",
            64: "/icons/icon_64.png",
            128: "/icons/icon_128.png"
        }});
    }

    return browserAction.setIcon({path: `/icons/fa-grin-${icon}.svg`});
}

/**
 * Set icon depending on whether it should be colored, or not.
 *
 * @public
 * @param {boolean} popupIconColored if popupIconColored is colored or not
 * @returns {Promise}
 */
export function changeIconIfColored(popupIconColored) {
    if (popupIconColored === true) {
        return setPopupIcon("colored");
    }
    // reset icon
    return setPopupIcon(null);
}

/**
 * Init icon module.
 *
 * @public
 * @returns {Promise<void>}
 */
export async function init() {
    const popupIconColored = await AddonSettings.get(POPUP_ICON_OPTION);
    return await changeIconIfColored(popupIconColored);
}
