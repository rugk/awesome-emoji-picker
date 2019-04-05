import * as AddonSettings from "/common/modules/AddonSettings/AddonSettings.js";

import * as OmniboxSearch from "./modules/OmniboxSearch.js";

// init modules
const emojiSearch = AddonSettings.get("emojiSearch");
if (emojiSearch) {
    OmniboxSearch.init();
}
