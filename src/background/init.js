import * as IconHandler from "/common/modules/IconHandler.js";
import * as AutocorrectHandler from "/common/modules/AutocorrectHandler.js";
import * as ContextMenu from "./modules/ContextMenu.js";

IconHandler.init();
AutocorrectHandler.init();

browser.runtime.onInstalled.addListener(async () => {
    await ContextMenu.init();
});

console.warn("background: init loaded");
