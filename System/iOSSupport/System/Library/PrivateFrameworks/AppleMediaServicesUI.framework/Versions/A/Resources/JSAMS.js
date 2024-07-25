//
//  JSProperties.js
//  AppleMediaServicesUI
//
//  Created by Daniel Jackson on 09/30/19.
//  Copyright © 2019 Apple, Inc. All rights reserved.
//

const AMS = {
    
    _eventTarget: new EventTarget(),

    _serviceListeners: {},
    
    run: (action) => {
        return new Promise((resolve, reject) => {
            let jsonData = JSON.stringify(action);
            window.webkit.messageHandlers.callback.postMessage({ command: "run", data: jsonData })
            .then((result) => {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    resolve(result);
                }
            })
            .catch((error) => {
                try {
                    reject(JSON.parse(error.message));
                } catch (e) {
                    reject(error.message);
                }
            });
        });
    },
    
    // Event Listener
    
    addEventListener: (type, listener, useCapture, wantsUntrusted) => {
        return AMS._eventTarget.addEventListener(type, listener, useCapture, wantsUntrusted);
    },
    
    dispatchEvent: (event) => {
        return AMS._eventTarget.dispatchEvent(event);
    },
    
    removeEventListener: (type, listener, useCapture) => {
        return AMS._eventTarget.removeEventListener(type, listener, useCapture);
    },
    
    // Service Registration
    
    /*
     Rejection format:
         return Promise.reject({
             message: "TEST ERROR",
             userInfo: {
                 errorPageModel: model, // An AMSErrorPageModel
             }
         });
     */
    callService: (name, data) => {
        let object = data;
        if ((typeof object === 'string' || object instanceof String) && object.length > 0) {
            try {
                object = JSON.parse(object);
            } catch (e) {
                object = data;
            }
        }
        
        let result = null;
        let service = AMS._serviceListeners[name];
        if (typeof service === "function") {
            result = new Promise(function(resolve, reject) {
                var serviceResult = service(object);
                if (serviceResult instanceof Promise) {
                    serviceResult.then(function(value) {
                        if (typeof value === 'object' && value !== null) {
                            resolve(JSON.stringify(value));
                        }
                        else {
                            resolve(value);
                        }
                    })
                    serviceResult.catch(function(error) {
                        if (typeof error === 'object' && error && error.message) {
                            error = JSON.stringify({
                                message: error.message,
                                userInfo: {
                                    column: error.column,
                                    line: error.line,
                                    sourceURL: error.sourceURL,
                                    ...(error.userInfo ?? {})
                                },
                            });
                        }
                        reject(error);
                    });
                }
                else {
                    resolve(serviceResult);
                }
            });
        }

        if (result == null) {
            if (name === "PageRender") {
                result = Promise.resolve(true);
            } else {
                result = Promise.reject("Service Callback Unset: " + name);
            }
        }

        return result;
    },
    
    registerService: (name, callback) => {
        if (name == null || callback == null) {
            return;
        }
        AMS._serviceListeners[name] = callback;
        
        if (name == 'PageData') {
            window.webkit.messageHandlers.callback.postMessage({ command: "pageDataServiceRegistered", data: {} })
        }
    },
    
    unregisterService: (name, callback) => {
        if (callback) {
            if (callback === AMS._serviceListeners[name]) {
                delete AMS._serviceListeners[name];
            }
        }
        else {
            delete AMS._serviceListeners[name];
        }
    },
    
    // Internal
    
    updateProperties: (data) => {
        let percentEncodedStr = atob(data).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('');
        let decoded = decodeURIComponent(percentEncodedStr);
        
        let properties = JSON.parse(decoded);
        for (var key in properties) {
            if (typeof AMS[key] !== "function") {
                AMS[key] = properties[key];
            }
        }
        return true;
    }
}

window.AMS = AMS;

AMS.registerService("_PostEvent", function(object) {
    var event = new CustomEvent(object.name, { detail: object.options });
    AMS.dispatchEvent(event);
});

const __oldConsoleLogFunc = window.console.log;
window.console.log = function(...args) {
    // NOTE: This will drop the log line in the inspector, but it's worth it to see them in the sysdiagnose.
    __oldConsoleLogFunc(...args);
    AMS.run({ actionClass: "AMSLogAction", level: 1, message: args.join() });
};

const __oldConsoleErrorFunc = window.console.error;
window.console.error = function(...args) {
    // NOTE: This will drop the log line in the inspector, but it's worth it to see them in the sysdiagnose.
    __oldConsoleErrorFunc(...args);
    AMS.run({ actionClass: "AMSLogAction", level: 2, message: args.join() });
};
