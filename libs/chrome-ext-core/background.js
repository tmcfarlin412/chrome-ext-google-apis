Core.IS_CONTENT_SCRIPT = false
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var async = false // if sendResponse will be called asyncronously, set to true
    if (request.method == "getAuthToken") {
        let options = { interactive: request.interactive }
        if (request.scopes) {
            options.scopes = request.scopes;
        }
        chrome.identity.getAuthToken(options, function (token) {
            if (chrome.runtime.lastError) {
                Core.logd(chrome.runtime.lastError)
            }
            sendResponse({ status: 'success', authToken: token })
        });
        async = true
    }
    return async
})
