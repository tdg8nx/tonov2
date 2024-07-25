/// Wrap everything in a function to prevent globally exposing temporary state
(function() {
    /// Consume all keys on init
    let datastore = %@;

    /// Enumerate the new values and add them to the local datastore without triggering messages
    for (let [key, value] of Object.entries(datastore)) {
        applenews.datastore[key] = value;
    }
})()
