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

// init modules
CustomOptionTriggers.registerTrigger();
AutomaticSettings.setDefaultOptionProvider(AddonSettings.getDefaultValue);
AutomaticSettings.init();
ColorSchemeModeHelper.init();
ManualAdjustments.init();

RandomTips.init(tips).then(() => {
    RandomTips.setContext("options");
    RandomTips.showRandomTipIfWanted();
});
