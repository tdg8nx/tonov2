/// Wrap everything in an anonymous function to capture internal scope
(function() {

    /// Create the local datastore
    const localDatastore = {};

    /// Add the 'add' function to the object
    Object.defineProperty(localDatastore, 'add', {
        writable: false,
        value: function(objects) {
            for (let [key, value] of Object.entries(objects)) {
                this[key] = value;
            }

            /// Post a message to webkit to indicate the local datastore has add values
            window.webkit.messageHandlers.applenews.postMessage({
                "name": "localDatastore",
                "localDatastore": JSON.stringify(this)
            });
        }
    });

    /// Add the 'remove' function to the object
    Object.defineProperty(localDatastore, 'remove', {
        writable: false,
        value: function(keys) {
            if (Array.isArray(keys)) {
                for (let key of keys) {
                    delete this[key];
                }
            } else {
                delete this[keys];
            }

            /// Post a message to webkit to indicate the local datastore has removed values
            window.webkit.messageHandlers.applenews.postMessage({
                "name": "localDatastore",
                "localDatastore": JSON.stringify(this)
            });
        }
    });

    /// Define the datastore property on the applenews object
    Object.defineProperty(applenews, 'localDatastore', {
        writable: false,
        value: localDatastore
    });

    /// Enumerate the key-value pairs in the injected local datastore
    for (let [key, value] of Object.entries( %@)) {
        applenews.localDatastore[key] = value;
    }
})();
