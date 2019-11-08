/**
 * // does not work in Firefox currently due to https://bugzilla.mozilla.org/show_bug.cgi?id=1595037
 * @param  {} darkQuery
 */
const dark = window.matchMedia("(prefers-color-scheme: dark)");
export function changeScreenshotTheme(darkQuery){
    if (darkQuery.matches) {
        document.getElementById("searchBarDemo").src = "./img/emojiSearchDog_dark.png";
    } else {
        document.getElementById("searchBarDemo").src = "./img/emojiSearchDog_light.png";
    }
}

dark.addListener(changeScreenshotTheme);
changeScreenshotTheme(dark);
