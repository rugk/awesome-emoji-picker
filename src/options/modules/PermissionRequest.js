/**
 * Request an optional permission from users, if needed.
 *
 * @module modules/PermissionRequest
 */

import * as CommonMessages from "/common/modules/MessageHandler/CommonMessages.js";
import * as CustomMessages from "/common/modules/MessageHandler/CustomMessages.js";

const optionalPermissions = {};

export class PermissionError extends Error {
    constructor(message, ...params) {
        super(
            message || "No permission for this action.",
            ...params
        );
    }
}

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
 * @param {boolean} showButton shows an action button if
 * @param {browser.permissions.Permissions} [permissions] the permission to request, if button is clicked
 * can obviously you can omit it when you do not want to show that button (i.e. if showButton = false)
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @param {Object} [options] additonal options, see {@link requestPermission()}
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/onAdded}
 * @returns {Promise}
 */
function showPermissionMessageBox(messageBox, showButton, permissions, options) {
    return new Promise((resolve, reject) => {
        let actionButton = null;
        if (showButton && permissions) {
            actionButton = (param) => {
                return requestPermission(permissions,
                    messageBox.messageId,
                    param.event, options
                ).then(resolve).catch(reject);
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
    });
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
 * Request the permission from the user, if possible.
 *
 * You need to register the permission & message box via {@link registerPermissionMessageBox()}.
 *
 * Note, however, that due to security constraints of the browser WebExtension API,
 * we can only request the permission if this call is a "click handler", see
 * {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Request_the_right_permissions#Request_permissions_at_runtime}.
 * That is why we urge you to pass an "event" parameter, if you have it.
 *
 * Thus, it may happen that you call this function when we cannot actually request
 * the permission right now from the user.
 * If that happens, we show a message to the user noticing them about the missing
 * permission, using the CustomMessages module. If the user accepts the permission
 * prompt (at any time), the returned Promise will be resolved.
 * This basically implies the nagUserEndless option. (see details below)
 *
 * IMPORTANT: There are two cases, where we certainly cannot request any permission
 * right now, from the user:
 * * when you do not pass the event parameter.
 *   However, this is a valid way to use this function and supported.
 * * when you use an asyncronous actions (async/await) before calling this.
 *   This is a thing that should never happen, as it breaks our logic, as we
 *   cannot use the event parameter to check, whether this call is a click
 *   handler.
 *
 * It rejects, if the permission cannot be requested or when the user declines the
 * permission when it is initially shown we reject this permission.
 * When you set `options.nagUserEndless` to `true` and the user declines
 * the permission, we nag them again with a message box that asks them whether we can
 * get their permission. As such, you should, in this particular case, *not*
 * assume the returned Promise will ever reject. It will only reject in case
 * of an error. Usually, it will just be pending unless the user approves the
 * permission.
 *
 * @public
 * @param {browser.permissions.Permissions} permissions the permission to request,
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @param  {string} messageId the message that should be shown as a fallback if
 *                              requesting the permission is not possible
 * @param  {Object} [event] the original event that triggered this, pass it if
 *                  you have it, so we can trigger the permission immediately.
 * @param {Object} [options] additonal options
 * @param {Object} [options.hideMessageOnError=true] hide the message box, when
 *                  the user declines the permission or another error happens
 * @param {Object} [options.retry=false] true to retry indefinitively, or a number
 *                  to limit retries, false basically means it does not retry (same as =1)
 * @returns {Promise} resolves, if the permission has been granted
 * @throws {TypeError}
 */
export function requestPermission(permissions, messageId, event, options = {}) {
    if (options.hideMessageOnError === undefined || options.hideMessageOnError === null) {
        options.hideMessageOnError = true;
    }
    if (options.retry === undefined || options.retry === null) {
        options.retry = false;
    }

    // validate parameters
    if (options.retry !== true && options.retry !== false && options.retry < 1) {
        throw new TypeError(`invalid options.retry value of ${options.retry} passed.`);
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
    const resultOfDeferredRequest = showPermissionMessageBox(messageBox, !isUserInteractionHandler, permissions, options);

    // if we were called from an input handler, we can request the permission
    // otherwise, we return now
    if (!isUserInteractionHandler) {
        return resultOfDeferredRequest;
    }

    options.retryCount = options.retryCount || 0;
    options.retryCount++;

    const requestPermission = browser.permissions.request(permissions).catch((error) => {
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

            throw new PermissionError("permission request declined");
        default:
            console.error("Unknown value for permissionSuccessful:", permissionSuccessful);
        }

        throw new Error("permission request failed due to internal problems");
    });

    const retryAllowed = options.retry === true || (options.retryCount < options.retry);

    // handle case when permission is declined, optionally retry
    // also decoupled, so the message box hiding is not affected by it
    const returnPermission = requestPermission.catch((error) => {
        if ((error instanceof PermissionError) && retryAllowed) {
            return showPermissionMessageBox(messageBox, true, permissions, options);
        }

        // re-throw
        throw error;
    });

    // message box hiding decoupled from returned Promise value
    requestPermission.catch((error) => {
        // decide whether to hide the error message
        if (( // if we defer a retry, never hide message
            !(error instanceof PermissionError) ||
            !retryAllowed
        ) && // and only hide if option is set
            options.hideMessageOnError
        ) {
            hideMessageBox(messageBox);
        }

        // re-throw
        throw error;
    }).then(() => {
        // hide all message boxes for this permission
        thisPermission.messageBoxes.forEach(hideMessageBox);
    });

    return returnPermission;
}

/**
 * Cancels the permission prompt.
 *
 * Due to technical limitations, it cannot actually close the permission prompt. It can just hide the own
 * Thus, if a permission is currently being requested, this may lead to strange side-effects if the permission
 * is granted anyway, because the old Promise will still be fullfilled then.
 *
 * @public
 * @param {browser.permissions.Permissions} permissions the permission request to close,
 * see https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/permissions/Permissions
 * @returns {void}
 */
export function cancelPermissionPrompt(permissions) {
    const thisPermission = getInternalPermissionData(permissions);

    thisPermission.messageBoxes.forEach(hideMessageBox);
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
