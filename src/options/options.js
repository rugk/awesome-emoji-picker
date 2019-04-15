/**
 * Starter module for addon settings site.
 *
 * @requires modules/OptionHandler
 */

import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";
import * as AutomaticSettings from "/common/modules/AutomaticSettings/AutomaticSettings.js";
import * as CustomOptionTriggers from "./modules/CustomOptionTriggers.js";

// init modules
window.trigger = window.trigger || 0;
window.trigger++;
console.error("OPTIONS PAGE INIT CODE TRIGGERED", window.trigger);
CustomOptionTriggers.registerTrigger();
AutomaticSettings.setDefaultOptionProvider(AddonSettings.getDefaultValue);
AutomaticSettings.init();
