/* this function changes screenshot in the options menu as per user's OS theme.By defualt 
a user will see light themed screenshot but if the user has enabled dark theme
in their OS the they would see dark-themed screenshot. It makes use of the following CSS media query
and detects its change of state by attaching a js listener to it.
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
changeScreenshotTheme(dark);
