/**
 * Request an optional permission from users, if needed.
 *
 * @module modules/PermissionRequest
 */

import * as CommonMessages from "/common/modules/MessageHandler/CommonMessages.js";
import * as CustomMessages from "/common/modules/MessageHandler/CustomMessages.js";

const optionalPermissions = {};

/**
 * Compares, whether the permissions equal.
 *
 * Because comparing object references if often not enough.
 *
 * @private
 * @param {browser.permissions.Permissions} permissions
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions}
 * @returns {boolean}
 */
function permissionToString(permissions) {
    const permissionCopy = Object.assign(permissions);

    permissionCopy.origins = permissionCopy.origins || [];
    permissionCopy.permissions = permissionCopy.permissions || [];

    return `[origins: ${permissionCopy.origins.toString()}, permissions: ${permissionCopy.permissions.toString()}]`;
}

/**
 * Compares, whether the permissions equal.
 *
 * Because comparing object references if often not enough.
 *
 * @private
 * @param {browser.permissions.Permissions} permissions1
 * @param {browser.permissions.Permissions} permissions2
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions}
 * @returns {boolean}
 */
function permissionsEqual(permissions1, permissions2) {
    // if object references are the same, this is obviously the same
    if (permissions1 === permissions2) {
        return true;
    }

    return permissionToString(permissions1) === permissionToString(permissions2);
}

/**
 * Update the permission status of a specific permission.
 *
 * @private
 * @param {browser.permissions.Permissions} [permissions] the permission you got as input
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @returns {Promise}
 */
async function updatePermissionStatus(permissions) {
    const permissionIndexString = permissionToString(permissions);
    const thisPermission = optionalPermissions[permissionToString(permissions)];
    thisPermission.isGranted = await browser.permissions.contains(permissions);

    optionalPermissions[permissionIndexString] = thisPermission;
}

/**
 * Return the previously registered data for a permission.
 *
 * @private
 * @param {browser.permissions.Permissions} [permissions] the permission you got as input
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @returns {Object} "thisPermission"
 * @throws {TypeError} if not registered
 */
function getInternalPermissionData(permissions) {
    const thisPermission = optionalPermissions[permissionToString(permissions)];
    if (!thisPermission) {
        throw new TypeError("Permission has not been registered before. Please call registerPermissionMessageBox to register the permission.");
    }

    return thisPermission;
}

/**
 * Hides the message box.
 *
 * @private
 * @param {Object} messageBox the message
 * @param {Symbol} [messageBox.messageId]
 * @param {string} [messageBox.messageText]
 * @returns {void}
 */
function hideMessageBox(messageBox) {
    return CustomMessages.hideMessage(messageBox.messageId, {animate: true});
}

/**
 * Show the permission request message to the user.
 *
 * @private
 * @param {Object} messageBox the message
 * @param {Symbol} [messageBox.messageId]
 * @param {string} [messageBox.messageText]
 * @param {boolean} showButton shows an action button if
 * @param {browser.permissions.Permissions} [permissions] the permission to request, if button is clicked
 * can obviously you can omit it when you do not want to show that button (i.e. if showButton = false)
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/onAdded}
 * @returns {void}
 */
function showPermissionMessageBox(messageBox, showButton, permissions) {
    let actionButton = null;
    if (showButton && permissions) {
        actionButton = (param) => {
            return requestPermission(permissions,
                param.event,
                messageBox.messageId, {
                    hideMessageOnError: false
                }
            ).catch(() => {
                // show own message wuth button again
                return showPermissionMessageBox(messageBox, showButton, permissions);
            });
        };
    }

    CustomMessages.showMessage(messageBox.messageId,
        messageBox.messageText,
        false,
        {
            text: "buttonRequestPermission",
            action: actionButton
        }
    );
}

/**
 * Triggered, when a permission is added.
 *
 * Hides the message boxes that we showed for this permission.
 *
 * @private
 * @param {browser.permissions.Permissions} permissions the permission(s) to request,
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/onAdded}
 * @returns {void}
 */
function permissionAdded(permissions) {
    const thisPermission = getInternalPermissionData(permissions);

    updatePermissionStatus(permissions);

    // hides all message boxes that were registered for this permission
    if (thisPermission.messageBoxes) {
        thisPermission.messageBoxes.forEach((messageBox) => {
            CustomMessages.hideMessage(messageBox.messageId, {animate: true});
        });
    }
}

/**
 * Triggered, when a permission is removed. Shows the message boxes that want
 * for this permission.
 *
 * @private
 * @param {browser.permissions.Permissions} permissions the permission(s) to request,
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/onAdded}
 * @returns {void}
 */
function permissionsRemoved(permissions) {
    const thisPermission = getInternalPermissionData(permissions);

    updatePermissionStatus(permissions);

    // shows all message boxes that were registered for this permission
    if (thisPermission.messageBoxes) {
        thisPermission.messageBoxes.forEach((messageBox) => {
            return showPermissionMessageBox(messageBox, true, permissions);
        });
    }
}

/**
 * Register the permission(s) and message box(es) for fallback.
 *
 * Actually, you can call this multiple times to also register multiple message
 * boxes per permission.
 *
 * Please await the Promise and DO NOT register multiple messages asyncronously
 * (at the same time), because this can lead to timing issues and some registered
 * messages may be lost!
 *
 * @public
 * @param {browser.permissions.Permissions} permissions the permission(s) to request,
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @param  {string} messageId the message that should be shown as a fallback if
 * requesting the permission is not possible
 * @param {HTMLElement} elMessageBox the message box for this ID.
 * @param  {string} messageText the text of the message that should be shown as a
 * fallback to ask the user to confirm the message
 * @returns {Promise}
 */
export async function registerPermissionMessageBox(permissions, messageId, elMessageBox, messageText) {
    // register custom message
    CustomMessages.registerMessageType(messageId, elMessageBox);

    // add permission, if needed
    const permissionIndexString = permissionToString(permissions);
    const thisPermission = optionalPermissions[permissionIndexString] || {};
    thisPermission.messageBoxes = thisPermission.messageBoxes || [];
    thisPermission.messageBoxes.push({
        messageId,
        messageText
    });

    // same as updatePermissionStatus() does
    thisPermission.isGranted = await browser.permissions.contains(permissions);

    optionalPermissions[permissionIndexString] = thisPermission;
}

/**
 * Request the permission if possible.
 *
 * If we cannot request it now, we show a message to the user noticing them about
 * the missing permission, using CustomMessages.
 * You need to register the permission & message box via registerPermissionMessageBox.
 *
 * IMPORTANT: Do not use asyncronous actions (async/await) before calling this,
 * as we then cannot request the permission in any case.
 *
 * It rejects, when the permission has been rejected or cannot be requested.
 *
 * @public
 * @param {browser.permissions.Permissions} permissions the permission to request,
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @param  {Object} event the original event that triggered this
 * @param  {string} messageId the message that should be shown as a fallback if
 *                              requesting the permission is not possible
 * @param {Object} [options] additonal options
 * @param {Object} [options.hideMessageOnError=true]
 * @returns {Promise}
 * @throws {TypeError}
 */
export function requestPermission(permissions, event, messageId, options = {}) {
    if (options.hideMessageOnError === undefined || options.hideMessageOnError === null) {
        options.hideMessageOnError = true;
    }

    // find out whether this has been triggered by a click/user action, so we can request a permission
    const isUserInteractionHandler = event && (event.type === "input" || event.type === "click" || event.type === "change");

    const thisPermission = getInternalPermissionData(permissions);

    const messageBox = thisPermission.messageBoxes.find((messageBox) => messageBox.messageId === messageId);
    if (!messageBox) {
        throw new TypeError("messageId has not been registered before. Please call registerPermissionMessageBox to register the message box.");
    }

    // if we cannot actually request the permission, let's show a useful
    // message, at least
    // if we can, show it anyway, so we have some background information on
    // what/why it is requested.
    showPermissionMessageBox(messageBox, !isUserInteractionHandler, permissions);

    // if we were called from an input handler, we can request the permission
    // otherwise, we return now
    if (!isUserInteractionHandler) {
        return Promise.resolve();
    }

    const permissionRequestResult = browser.permissions.request(permissions).catch((error) => {
        console.error(error);
        // convert error to negative return value
        return null;
    }).then(async (permissionSuccessful) => {
        switch (permissionSuccessful) {
        case true: // permission granted!
            await updatePermissionStatus(permissions); // should change the setting cache to be "true"
            return Promise.resolve();
        case null:
            CommonMessages.showError("Requesting permission failed.", true); // TODO: localize
            break;
        case false:
            // CommonMessages.showError("This feature cannot be used without the permission.", true);
            break;
        default:
            console.error("Unknown value for permissionSuccessful:", permissionSuccessful);
        }

        throw new Error("permission request error");
    });

    // decide whether to hide the error message
    permissionRequestResult.catch((error) => {
        if (options.hideMessageOnError) {
            return; // convert to resolved Promise
        } else {
            // re-throw
            throw error;
        }
    }).then(() => {
        // hide all message boxs for this permission
        thisPermission.messageBoxes.forEach(hideMessageBox);
    });

    return permissionRequestResult;
}

/**
 * **Syncronously** checks whether the permission has is granted.
 *
 * This also *only* works for permissions registered before via registerPermissionMessageBox!
 * It also only returns cached values, mostly the last one set when you've registered the
 * permission.
 *
 * @public
 * @param {browser.permissions.Permissions} permissions the permission to test,
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @returns {boolean}
*/
export function isPermissionGranted(permissions) {
    const thisPermission = getInternalPermissionData(permissions);
    return thisPermission.isGranted;
}

/**
 * Inits the module.
 *
 * @private
 * @returns {void}
*/
function init() {
    // NOTE: NOT supported in Firefox yet.
    if (browser.permissions.onAdded && browser.permissions.onRemoved) {
        browser.permissions.onAdded.addListener(permissionAdded);

        // Attention: the following can cause issues in your logic!
        // It shows all message boxes that were registered.
        browser.permissions.onRemoved.addListener(permissionsRemoved);
    }
}

// automatically init it
init();
