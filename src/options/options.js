/**
 * Starter module for add-on settings site.
 *
 * @requires modules/OptionHandler
 */

import { tips } from "/common/modules/data/Tips.js";

import * as RandomTips from "/common/modules/RandomTips/RandomTips.js";
import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as AutomaticSettings from "/common/modules/AutomaticSettings/AutomaticSettings.js";
import * as CustomOptionTriggers from "./modules/CustomOptionTriggers.js";
import * as ColorSchemeModeHelper from "./modules/ColorSchemeModeHelper.js";
import * as ManualAdjustments from "./modules/ManualAdjustments.js";

document.getElementById("shortcut").addEventListener("click", (event) => {
    event.target.disabled = true;

    if (browser.commands.openShortcutSettings) {
        browser.commands.openShortcutSettings().finally(() => {
            event.target.disabled = false;
        });
    } else {
        alert("Unable to automatically open the Shortcut Settings (requires Firefox or Thunderbird 137 or greater).");
    }
});

// init modules
CustomOptionTriggers.registerTrigger().then(() => {
    AutomaticSettings.setDefaultOptionProvider(AddonSettings.getDefaultValue);
    AutomaticSettings.init();
});
ColorSchemeModeHelper.init();
ManualAdjustments.init();

RandomTips.init(tips).then(() => {
    RandomTips.setContext("options");
    RandomTips.showRandomTipIfWanted();
});
