/**
 * this function changes screenshot in the options menu as per user's OS theme preference. By default the
 * user would see a light-themed screenshot but if the user has selected a dark themed OS, the screenshot
 * would also appear dark.
 * 
 * @private
 * does not work in Firefox currently due to https://bugzilla.mozilla.org/show_bug.cgi?id=1595037
 * @param  {Object} darkQuery
 */
const dark = window.matchMedia("(prefers-color-scheme: dark)");
function changeScreenshotTheme(darkQuery){
    if (darkQuery.matches) {
        document.getElementById("searchBarDemo").src = "./img/emojiSearchDog_dark.png";
    } else {
        document.getElementById("searchBarDemo").src = "./img/emojiSearchDog_light.png";
    }
}

dark.addListener(changeScreenshotTheme);
/**
 * Returns the function which changes screenshot according to theme
 *
 * @public
 */
export function init(){
    return changeScreenshotTheme(dark);
}