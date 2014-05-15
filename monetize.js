(function() {
    /**
     * Credit: https://github.com/ded/domready
     * domready (c) Dustin Diaz 2014 - License MIT
     */
    var domready = (function() {

        var fns = [],
            fn, f = false,
            doc = document,
            domContentLoaded = 'DOMContentLoaded',
            readyState = 'readyState',
            loaded = /^loaded|c/.test(doc[readyState]);

        function flush(f) {
            loaded = 1;
            while (f = fns.shift()) f()
        }

        doc.addEventListener(domContentLoaded, fn = function() {
            doc.removeEventListener(domContentLoaded, fn, f);
            flush();
        }, f);

        return function(fn) {
            loaded ? fn() : fns.push(fn);
        };
    })();

    var monetizejsURL = 'http://localhost:3000';
    var postMessageIframeElt;
    var jsonpScriptElt;
    var popupWidth = 1000;
    var popupHeight = 700;
    var tokenRefreshMargin = 300000; // 5 min

    var postMessageCbs = [];
    var lastMessage;
    var timeoutErrorId;
    window.addEventListener('message', function(e) {
        if(e.origin == monetizejsURL) {
            clearTimeout(timeoutErrorId);
            lastMessage = e.data;
            if(lastMessage.expiresIn) {
                lastMessage.refreshDate = Date.now() + lastMessage.expiresIn - tokenRefreshMargin;
            }
            while (cb = postMessageCbs.shift()) cb(lastMessage);
        }
    });
    function getPostMessageIframeElt() {
        if(postMessageIframeElt) {
            return postMessageIframeElt;
        }
        postMessageIframeElt = document.createElement("iframe");
        postMessageIframeElt.setAttribute("style", "width: 1px; height: 1px; position: absolute; top: -100px;");
        document.body.appendChild(postMessageIframeElt);
        postMessageIframeElt.onload = function() {
            timeoutErrorId = setTimeout(function() {
                while (cb = postMessageCbs.shift()) cb({
                    error: 'Unknown'
                });
            }, 200);
        };
        return postMessageIframeElt;
    }
    
    function postMessageIframe(cb) {
        postMessageCbs.push(cb);
        domready(function() {
            getPostMessageIframeElt().setAttribute('src',
            monetizejsURL + 
            '/authorize?immediate=true&response_type=token&client_id=' + encodeURIComponent(options.applicationID) +
            '&redirect_uri=' + encodeURIComponent(window.location.href) +
            '&' + Date.now());
        });
    }
    
    var jsonpCbs = [];
    window._monetizeJsonpCallback = function(res) {
        while (cb = jsonpCbs.shift()) cb(res);
    };
    function getJsonpScriptElt() {
        if(jsonpScriptElt) {
            document.head.removeChild(jsonpScriptElt);
        }
        jsonpScriptElt = document.createElement("script");
        document.head.appendChild(jsonpScriptElt);
        return jsonpScriptElt;
    }
    
    function getPaymentsJsonp(cb) {
        jsonpCbs.push(cb);
        domready(function() {
            getJsonpScriptElt().setAttribute('src',
            monetizejsURL + 
            '/api/payments?access_token=' + lastMessage.token +
            '&callback=_monetizeJsonpCallback&' + Date.now());
        });
    }
    
    var monetize = {};
    var options = {};
    
    monetize.init = function(params) {
        options = params || {};
    };

    monetize.getTokenImmediate = function(cb) {
        if(lastMessage && lastMessage.token && lastMessage.refreshDate > Date.now()) {
            return cb(undefined, lastMessage.token);
        }
        postMessageIframe(function(message) {
            cb(message.error, message.token);
        });
    };

    monetize.getPaymentsImmediate = function(cb) {
        if(lastMessage && lastMessage.token && lastMessage.refreshDate > Date.now()) {
            return getPaymentsJsonp(function(payments) {
                cb(undefined, payments);
            });
        }
        postMessageIframe(function(message) {
            cb(message.error, message.payments);
        });
    };

    monetize.getTokenInteractive = function(cb) {
        if(!cb) {
            var redirectURL = encodeURIComponent(options.redirectURL || window.location.href);
            window.location = monetizejsURL + '/authorize?response_type=token&client_id=' + encodeURIComponent(options.applicationID) + '&redirect_uri=' + redirectURL;
            return;
        }
        postMessageCbs.push(function(message) {
            cb(message.error, message.token);
        });
        var url = monetizejsURL + '/authorize?popup=true&response_type=token&client_id=' + encodeURIComponent(options.applicationID) + '&redirect_uri=' + encodeURIComponent(window.location.href);
        var left = (screen.width - popupWidth) / 2;
        var top = (screen.height - popupHeight) / 2;
        return window.open(url, undefined,
        'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + popupWidth +
        ', height=' + popupHeight +
        ', top=' + top +
        ', left=' + left
        );
    };

    window.monetize = monetize;
})();