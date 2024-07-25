//
//  JSDeprecated.js
//  AppleMediaServicesUI
//
//  Created by Daniel Jackson on 09/30/19.
//  Copyright © 2019 Apple, Inc. All rights reserved.
//

//////////////////////////////
//////////////////////////////
//////////////////////////////
////
////   DEPRECATED
////
////   This file has been deprecated
////
//////////////////////////////
//////////////////////////////
//////////////////////////////

class AMSLog {
    static send(level, msg) {
        if (AMS.device.buildType == "internal") {
            AMS.run({ actionClass: "AMSLogAction", level: level, message: msg });
        }
    }
    
    static debug(msg) {
        this.send(AMSLog.LOG_LEVEL.DEBUG, msg);
    }
    
    static default(msg) {
        this.send(AMSLog.LOG_LEVEL.DEFAULT, msg);
    }
    
    static error(msg) {
        this.send(AMSLog.LOG_LEVEL.ERROR, msg);
    }
    
    static info(msg) {
        this.send(AMSLog.LOG_LEVEL.INFO, msg);
    }
    
    static fault(msg) {
        this.send(AMSLog.LOG_LEVEL.FAULT, msg);
    }
}

AMSLog.LOG_LEVEL = {
    DEBUG: 0,
    DEFAULT: 1,
    ERROR: 2,
    INFO: 3,
    FAULT: 4,
};

// ---------------
// Helpers
// ---------------

AMS.runDialog = function(action) {
    if (!(action instanceof AMSDialogAction)) {
        return;
    }
    
    var promise = AMS.run(action)
    promise.then(function(result) {
        // Locate original button
        var selectedButton = null;
        for (var i = 0; i < action.buttons.length; i++) {
            var button = action.buttons[i];
            if (button.identifier == result.identifier || button.title == action.title) {
                selectedButton = button;
                break;
            }
        }
                 
        if (typeof selectedButton.callback !== "undefined") {
            selectedButton.callback(result);
        }
    });
    return promise;
}
AMS.dialog = AMS.runDialog;

AMS.loadPlugin = function(action) {
    if (!(action instanceof AMSLoadPluginAction)) {
        return;
    }
    return AMS.run(action);
}

// ---------------
// ACTIONS
// ---------------

class AMSAction {
    constructor() {
        this.actionClass = this.constructor.name;
        this.actionMetric = null;
    }
}

class AMSAccountAction extends AMSAction {
    constructor(account) {
        super();
        this.account = account;
    }
}

class AMSAppQueryAction extends AMSAction {
    constructor(bundleIDs, storeItemIDs) {
        super();
        this.bundleIDs = bundleIDs;
        this.enabled = true;
        this.storeItemIDs = storeItemIDs;
    }
}

class AMSAuthenticateAction extends AMSAction {
    constructor(dsid) {
        super();
        this.account = null;
        this.canMakeAccountActive = true;
        this.dsid = dsid;
        this.defaultButtonText = null;
        this.headers = {};
        this.makeCurrentAccount = true;
        this.promptTitle = null;
        this.type = 2;
        this.username = null;
    }
}

AMSAuthenticateAction.AUTH_TYPES = {
    SILENT_PREFERRED: 0,
    SILENT: 1,
    INTERACTIVE: 2
};

class AMSAuthorizeApplePayEnrollmentAction extends AMSAction {
    constructor(paymentSession) {
        super();
        this.confirmationStyle = 0;
        this.passSerialNumber = null;
        this.passTypeIdentifier = null;
        this.paymentSession = paymentSession;
    }
}

AMSAuthorizeApplePayEnrollmentAction.CONFIRMATION_STYLE = {
    ADD: 0,
    CONFIRM: 1
};

class AMSBagAction extends AMSAction {
    constructor(keys) {
        super();
        this.keys = keys;
    }
}

AMSBagAction.VALUE_TYPES = {
    ARRAY: 0,
    BOOL: 1,
    DOUBLE: 2,
    INTEGER: 3,
    STRING: 4,
    URL: 5,
    DICTIONARY: 6,
};

class AMSBuyAction extends AMSAction {
    constructor(buyParams, dsid) {
        super();
        this.account = null;
        this.buyParameters = buyParams;
        this.dsid = dsid;
        this.legacyBuy = false;
        this.makeCurrentAccount = false;
        this.metricsOverlay = null;
        this.profile = null;
        this.profileVersion = null;
        this.requiresAccount = true;
        this.type = 0;
    }
}

AMSBuyAction.PURCHASE_TYPES = {
    BUY_PRODUCT: 0,
    BACKGROUND_UPDATE_PRODUCT: 1,
    DOWNLOAD_PRODUCT: 2,
    IN_APP_BUY: 3,
    UPDATE_PRODUCT: 4,
    VOLUME_STORE_DOWNLOAD_PRODUCT: 5,
};

class AMSCallbackAction extends AMSAction {
    constructor(service) {
        super();
        this.service = service;
        this.data = {};
    }
}

class AMSDelegateAction extends AMSAction {
    constructor() {
        super();
        this.data = {};
    }
}

class AMSDialogAction extends AMSAction {
    constructor(title, buttons) {
        super();
        this.message = null;
        this.title = title;
        this.buttons = buttons;
        this.style = 0;
    }
}

AMSDialogAction.DIALOG_STYLE = {
    DEFAULT: 0,
    ALERT: 1,
    ACTION_SHEET: 2
};

class AMSFamilyAction extends AMSAction {
    constructor() {
        super();
        this.account = null;
    }
}

class AMSFetchAttestationVersionAction extends AMSAction {
    constructor(account) {
        super();
        this.account = account;
    }
}

AMSFetchAttestationVersionAction.BIOMETRICS_ACTION_TYPE = {
    PRIMARY_TOUCH_ID: 0,
    PRIMARY_FACE_ID: 1,
    PRIMARY_SECURITY_PREVENT_REPLAY: 2,
    PRIMARY_CARD_ENROLLMENT: 3,
    PRIMARY_PAYMENT_DIRECTIVE_PASSWORD: 4,
    PRIMARY_PAYMENT_DIRECTIVE_PASSCODE: 5,
    EXTENDED_TOUCH_ID: 6,
    EXTENDED_FACE_ID: 7
};

class AMSFetchCardDataAction extends AMSAction {
    constructor() {
        super();
        this.merchantID = null;
        this.storeFrontCountryCode = null;
    }
}

class AMSFetchCardMetadataAction extends AMSAction {
    constructor() {
        super();
        this.cardArtworkSize = null;
        this.passTypeIdentifier = null;
        this.serialNumber = null;
    }
}

const PASS_TYPE_ID_APPLE_CARD = "com.apple.AppleMediaServices.PassTypeIdentifier.AppleCard"

class AMSFlowAction extends AMSAction {
    constructor(presentationType) {
        super();
        this.actionData = {};
        this.animationType = 0;
        this.deferredPresentation = false;
        this.backgroundColor = null;
        this.loadingPage = null;
        this.modalWindowSize = null;
        this.navigationBar = null;
        this.popToRelativeIndex = null;
        this.presentationType = presentationType;
        this.replacementType = 0;
        this.replacementPage = null;
    }
}

AMSFlowAction.ANIMATION_TYPES = {
    NONE: 0,
    DEFAULT: 1,
    CROSS_DISOLVE: 2,
    COVER_VERTICAL: 3,
};

AMSFlowAction.PRESENTATION_TYPES = {
    REPLACE: 0,
    FULLSCREEN: 1,
    PUSH: 2,
    FORM_SHEET: 3,
    DISMISS: 4,
    POP: 5,
};

AMSFlowAction.REPLACEMENT_TYPES = {
    RELOAD: 0,
    PAGE: 1,
};

class AMSLoadPluginAction extends AMSAction {
    constructor(bundleIdentifier) {
        super();
        this.bundleIdentifier = bundleIdentifier;
    }
}

class AMSMarketingItemAction extends AMSAction {
    constructor(clientIdentifier, clientVersion, placement, serviceType, dsid) {
        super();
        this.account = null;
        this.clientIdentifier = clientIdentifier;
        this.clientVersion = clientVersion;
        this.placement = placement;
        this.serviceType = serviceType;
        this.dsid = dsid;
        this.contextInfo = null;
    }
}

class AMSMediaAction extends AMSAction {
    constructor(type) {
        super();
        this.type = type;
        this.bundleIdentifiers = null;
        this.clientIdentifier = null;
        this.clientVersion = null;
        this.itemIdentifiers = null;
        this.includedResultKeys = null;
    }
}

AMSMediaAction.MEDIA_TYPES = {
    APP: 0,
    APP_BUNDLE: 1,
    IN_APP: 2,
};

class AMSMetricsAction extends AMSAction {
    constructor(events) {
        super();
        this.events = events;
        this.flush = false;
    }
}

class AMSMetricsEvent {
    constructor(topic, fields, dsid) {
        this.account = null;
        this.dsid = dsid;
        this.fields = fields;
        this.topic = topic;
    }
}

class AMSNetworkAction extends AMSAction {
    constructor(url) {
        super();
        this.account = null;
        this.body = null;
        this.dsid = null;
        this.headers = {};
        this.method = "GET";
        this.url = url;
        this.includeiCloudTokens = false;
    }
}

class AMSOpenSafariAction extends AMSAction {
    constructor(url) {
        super();
        this.callbackScheme = null;
        this.url = url;
    }
}

class AMSOpenFamilyCircleAction extends AMSAction {
    constructor() {
        super();
        this.clientName = null;
    }
}

class AMSOpenURLAction extends AMSAction {
    constructor(url) {
        super();
        this.type = 0;
        this.url = url;
    }
}

AMSOpenURLAction.OPEN_TYPE = {
    STANDARD: 0,
    ATTEMPT_APP: 1,
    UNIVERSAL_LINK: 2,
}

class AMSOTPAction extends AMSAction {
    constructor() {
        super();
        
        this.enabled = true;
    }
}

class AMSPluginAction extends AMSAction {
    constructor(bundleIdentifier, actionIdentifier) {
        super();
        this.actionIdentifier = actionIdentifier;
        this.bundleIdentifier = bundleIdentifier;
        this.options = null;
    }
}

class AMSSendSMSAction extends AMSAction {
    constructor(body, digits) {
        super();
        this.body = body;
        this.countryCode = null;
        this.digits = digits;
    }
}

class AMSSubscriptionAction extends AMSAction {
    constructor() {
        super();
        this.cachePolicy = 0;
        this.mediaType = 1;
        this.extendedCarrierCheck = false;
    }
}

AMSSubscriptionAction.CACHE_POLICY = {
    CACHE_PREFERRED: 0,
    IGNORE_CACHE: 1,
    CACHE_ONLY: 2,
};

AMSSubscriptionAction.MEDIA_TYPES = {
    ACTIVITY: 0,
    APP_STORE: 1,
    MUSIC: 2,
    NEWS: 3,
    TV: 4,
    ICLOUD: 5,
    PODCAST: 6,
};

AMSSubscriptionAction.RESPONSE_STATUS = {
    NOT_ENTITLED: 0,
    ENTITLED: 1,
    REQUIRES_VERIFICATION: 2,
    UNLINKED: 3,
};

AMSSubscriptionAction.RESPONSE_SOURCE = {
    UNKNOWN: 0,
    Apple: 1,
    Carrier: 2
};

class AMSVerifyCredentialsAction extends AMSAction {
    constructor() {
        super();
        this.account = null;
        this.buttonText = null;
        this.ephemeral = false;
        this.serviceIdentifier = null;
        this.serviceType = 0;
        this.subtitle = null;
        this.title = null;
        this.usernameEditable = false;
    }
}

AMSVerifyCredentialsAction.SERVICE_TYPE = {
    STORE: 0,
    ICLOUD: 1
}

class AMSVerifyPaymentSetupFeatureAction extends AMSAction {
    constructor(referrerIdentifier) {
        super();
        this.referrerIdentifier = referrerIdentifier;
    }
}


// ---------------
// MODELS
// ---------------

class AMSModel {
    constructor() {
        this.modelClass = this.constructor.name;
    }
}

class AMSPageModel extends AMSModel {
    constructor() {
        super();
        this.backgroundColor = null;
        this.impressionEvent = null;
        this.navigationBar = null;
        this.windowSize = null;
    }
}

class AMSButtonModel extends AMSModel {
    constructor(title) {
        super();
        this.action = null;
        this.activityIndicator = null;
        this.bold = false;
        this.title = title;
        this.enabled = true;
        this.style = 0;
    }
}

AMSButtonModel.STYLE = {
    DEFAULT: 0,
    DESTRUCTIVE: 1,
    CANCEL: 2,
    DISMISS: 3,
};

class AMSActivityIndicatorModel extends AMSModel {
    constructor() {
        super();
        
        this.animate = true;
    }
}

class AMSCameraReaderPageModel extends AMSPageModel {
    constructor() {
        super();
        this.pageType = 0;
        this.primaryLabel = null;
        this.secondaryLabel = null;
        this.bottomLinkLabel = null;
        this.bottomLinkAction = null;
    }
}

AMSCameraReaderPageModel.PAGE_TYPES = {
    CREDIT_CARD_READER: 0,
    GIFT_CARD_READER: 1,
};

class AMSConditionalButtonModel extends AMSModel {
    constructor() {
        super();
        this.button = null;
        this.hideOnModal = false;
        this.hideOnPush = false;
    }
}

class AMSDialogButtonModel extends AMSButtonModel {
    constructor(title, callback) {
        super(title);
        this.callback = callback;
        this.identifier = null;
    }
}

class AMSDynamicPageModel extends AMSPageModel {
    constructor(url) {
        super();
        this.account = null;
        this.clientOptions = null;
        this.metricsOverlay = null;
        this.url = url;
    }
}

class AMSErrorPageModel extends AMSPageModel {
    constructor() {
        super();
        this.action = null;
        this.actionButtonTitle = null;
        this.errorMessage = null;
        this.errorMessageInternalOnly = false;
        this.errorTitle = null;
    }
}

class AMSLoadingPageModel extends AMSPageModel {
    constructor() {
        super();
        this.disableDelay = false;
        this.message = null;
    }
}

class AMSNavigationBarModel extends AMSModel {
    constructor() {
        super();
        this.backButtonTitle = null;
        this.hideBackButton = false;
        this.leftButton = null;
        this.rightButton = null;
        this.style = 0;
        this.title = "";
    }
}

AMSNavigationBarModel.STYLES = {
    INHERIT: 0,
    HIDDEN: 1,
    DEFAULT: 2,
    LARGE: 3,
    SEMI_TRANSPARENT: 4,
    TRANSPARENT: 5,
    SEMI_TRANSPARENT_SOLID: 6,
    ROUNDED_BUTTONS: 7,
}

class AMSWebPageModel extends AMSPageModel {
    constructor() {
        super();
    }
}

// ---------------
// OTHER
// ---------------

AMS.SERVICES = {
    PAGE_DATA: "PageData"
};

AMS.EVENT_TYPES = {
    ACCOUNT_CHANGE: "AccountChange",
    APP_QUEUE_CHANGE: "AppQueryResultsChange",
    BUY_CONFIRMED: "BuyConfirmed",
    SUBSCRIPTION_CHANGED: "SubscriptionChanged",
    SAFARI_DATA_UPDATE: "SafariDataUpdate",
    DID_APPEAR: "DidAppear",
    DID_DISAPPEAR: "DidDisappear",
};
