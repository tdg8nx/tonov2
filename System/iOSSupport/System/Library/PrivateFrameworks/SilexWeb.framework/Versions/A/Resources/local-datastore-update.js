/// Wrap everything in a function to prevent globally exposing temporary state
(function() {
    /// Capture the old and new local datastores
    let newDatastore = %@;
    let oldDatastore = %@;
    let session = %@;

    /// Enumerate the old values and remove them from the local datastore
    for (let [key, value] of Object.entries(oldDatastore)) {
        delete applenews.localDatastore[key];
    }

    /// Enumerate the new values and add them to the local datastore without triggering messages
    for (let [key, value] of Object.entries(newDatastore)) {
        applenews.localDatastore[key] = value;
    }

    /// Send out change event
    let event = new CustomEvent('ANLocalDatastoreChanged', {
        detail: {
            newDatastore: newDatastore,
            oldDatastore: oldDatastore,
            session: session
        }
    });
    document.dispatchEvent(event);
})()
