/**
 * Check if the current browser is Chrome/Chromium.
 *
 * @returns {boolean}
 */
export function isChrome() {
    return (
        navigator.userAgentData?.brands.find(
            ({ brand }) => brand.toLowerCase() === "chromium"
        ) !== undefined
    );
}
