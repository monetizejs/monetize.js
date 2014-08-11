/**
 * # monetize.js
 *
 * MonetizeJS official client-side library.
 *
 * #### Import from CDN
 *
 * ```html
 * <script src="//cdn.monetizejs.com/api/js/latest/monetize.min.js"></script>
 * ```
 *
 * #### Or, install via bower
 *
 * ```bash
 * bower install monetizejs
 * ```
 *
 */
(function() {

	var onReady = (function() {
		// Credit: https://github.com/ded/domready
		var queue = [],
			loaded = /^loaded|c/.test(document.readyState);

		var fn, domContentLoaded = 'DOMContentLoaded';
		document.addEventListener(domContentLoaded, fn = function() {
			document.removeEventListener(domContentLoaded, fn, false);
			loaded = 1;
			while((fn = queue.shift())) {
				fn();
			}
		}, false);

		return function(fn) {
			loaded ? fn() : queue.push(fn);
		};
	})();

	var monetizejsUrl = 'https://monetizejs.com',
		postMsgIframeElt,
		jsonpScriptElt,
		popupWidth = 1000,
		popupHeight = 700,
		timeout = 30000, // 30 sec
		tokenRefreshMargin = 300000, // 5 min
		iframeCb,
		popupCb,
		jsonpCb,
		lastMsg,
		timeoutError = 'Request timeout',
		iframeTimeoutId,
		scriptTimeoutId,
		noResponseError = 'Please check your JS console';

	window.addEventListener('message', function(e) {
		if(e.origin == monetizejsUrl) {
			lastMsg = e.data;
			if(lastMsg.expiresIn) {
				lastMsg.refreshDate = Date.now() + lastMsg.expiresIn - tokenRefreshMargin;
			}
			if(lastMsg.popup) {
				popupCb && popupCb(lastMsg);
			}
			else {
				clearTimeout(iframeTimeoutId);
				iframeCb && iframeCb(lastMsg);
			}
		}
	});

	function getPostMsgIframeElt() {
		if(postMsgIframeElt) {
			return postMsgIframeElt;
		}
		var iframeStyle = {
			width: '1px',
			height: '1px',
			position: 'absolute',
			top: '-100px'
		};
		postMsgIframeElt = document.createElement("iframe");
		postMsgIframeElt.setAttribute("style", Object.keys(iframeStyle).map(function(key) {
			return key + ':' + iframeStyle[key];
		}).join(';'));
		document.body.appendChild(postMsgIframeElt);
		postMsgIframeElt.onerror = postMsgIframeElt.onload = function() {
			setTimeout(function() {
				iframeCb && iframeCb({
					error: noResponseError
				});
			}, 10);
		};
		return postMsgIframeElt;
	}

	function formatUrl(path, qs) {
		var url = monetizejsUrl + path;
		qs.q = Date.now(); // Prevent caching
		qs = qs && Object.keys(qs).map(function(key) {
			return key + '=' + encodeURIComponent(qs[key]);
		}).join('&');
		return qs ? url + '?' + qs : url;
	}

	function postMsgIframe(options, fn) {
		iframeCb = function(msg) {
			iframeCb = undefined;
			fn(msg);
		};
		var qs = {
			immediate: true,
			response_type: 'token',
			client_id: options.applicationID,
			redirect_uri: options.redirectURL
		};
		onReady(function() {
			getPostMsgIframeElt().src = formatUrl('/authorize', qs);
			clearTimeout(iframeTimeoutId);
			iframeTimeoutId = setTimeout(function() {
				iframeCb && iframeCb({
					error: timeoutError
				});
			}, timeout);
		});
	}

	function setOptions(qs, options) {
		if(options.pricingOptions && options.pricingOptions.length) {
			qs.pricing_options = options.pricingOptions.join ? options.pricingOptions.join(',') : options.pricingOptions;
		}
		if(options.summary) {
			qs.summary = true;
		}
	}

	function popupWindow(options, fn) {
		popupCb = function(msg) {
			popupCb = undefined;
			fn(msg);
		};
		var qs = {
			popup: true,
			response_type: 'token',
			client_id: options.applicationID,
			redirect_uri: options.redirectURL
		};
		setOptions(qs, options);
		var windowFeatures = {
			toolbar: 'no',
			location: 'no',
			directories: 'no',
			status: 'no',
			menubar: 'no',
			scrollbars: 'no',
			resizable: 'no',
			copyhistory: 'no',
			width: popupWidth,
			height: popupHeight,
			left: (screen.width - popupWidth) / 2,
			top: (screen.height - popupHeight) / 2
		};
		window.open(formatUrl('/authorize', qs), undefined,
			Object.keys(windowFeatures).map(function(key) {
				return key + '=' + windowFeatures[key];
			}).join(',')
		);
	}

	window._monetizeJsonpCallback = function jsonpCallback(res) {
		// Check that callback is not proxied
		if(window._monetizeJsonpCallback !== jsonpCallback) {
			return jsonpCb && jsonpCb({
				error: 'Callback replaced!'
			});
		}
		clearTimeout(scriptTimeoutId);
		jsonpCb && jsonpCb({
			payments: res
		});
	};

	function getJsonpScriptElt() {
		if(jsonpScriptElt) {
			document.body.removeChild(jsonpScriptElt);
		}
		jsonpScriptElt = document.createElement("script");
		jsonpScriptElt.onerror = jsonpScriptElt.onload = function() {
			setTimeout(function() {
				jsonpCb && jsonpCb({
					error: noResponseError
				});
			}, 10);
		};

		document.body.appendChild(jsonpScriptElt);
		return jsonpScriptElt;
	}

	function getPaymentsJsonp(fn) {
		jsonpCb = function(msg) {
			jsonpCb = undefined;
			fn(msg);
		};
		var qs = {
			access_token: lastMsg.token,
			callback: '_monetizeJsonpCallback'
		};
		onReady(function() {
			getJsonpScriptElt().src = formatUrl('/api/payments', qs);
			clearTimeout(scriptTimeoutId);
			scriptTimeoutId = setTimeout(function() {
				jsonpCb && jsonpCb({
					error: timeoutError
				});
			}, timeout);
		});
	}

	function redirect(options) {
		var qs = {
			client_id: options.applicationID,
			redirect_uri: options.redirectURL
		};
		setOptions(qs, options);
		window.location = formatUrl('/authorize', qs);
	}

	function extend(obj, source) {
		for(var prop in source) {
			obj[prop] = source[prop];
		}
	}

	var defaultOptions = {
		redirectURL: window.location.href
	};

	/**
	 * Create and initialize a MonetizeJS object.
	 *
	 * @example
	 *
	 * var monetize = MonetizeJS(options);
	 *
	 * @param {Object} options optional set of top-level options.
	 *
	 */
	function MonetizeJS(options) {
		var initOptions = {};
		extend(initOptions, defaultOptions);
		extend(initOptions, options || {});

		function paramSanitizer(fn) {
			return function(options, cb) {
				if(typeof options === 'function') {
					cb = options;
					options = {};
				}
				var extendedOptions = {};
				extend(extendedOptions, initOptions);
				extend(extendedOptions, options || {});
				fn(extendedOptions, cb);
			};
		}

		var monetize = {};

		/**
		 * Attempt to get an access token without a redirection.
		 *
		 * @example
		 *
		 * monetize.getTokenImmediate(options, function(err, token) {
         *     if(err) {
		 *         console.error(err);
		 *     }
		 *     else if(token) {
		 *         console.log(token);
		 *     }
		 * });
		 *
		 * @param {Object} options optional set of options overriding the init options:
		 *
		 *      - **applicationID**: *String*, the application ID.
		 *
		 * @param {Function} cb a callback to be called with the following parameters:
		 *
		 *      - **err**: *Error*, in case of failure.
		 *
		 *      - **token**: *String*, the access token.
		 */
		monetize.getTokenImmediate = paramSanitizer(function(options, cb) {
			if(lastMsg && lastMsg.token && lastMsg.refreshDate > Date.now()) {
				return cb(undefined, lastMsg.token);
			}
			postMsgIframe(options, function(msg) {
				cb(msg.error, msg.token);
			});
		});

		/**
		 * Attempt to get user's payment object without a redirection.
		 *
		 * @example
		 *
		 * monetize.getPaymentsImmediate(options, function(err, payments) {
         *     if(err) {
		 *         console.error(err);
		 *     }
		 *     else if(token) {
		 *         console.log(payments.chargeOption);
		 *         console.log(payments.subscriptionOption);
		 *     }
		 * });
		 *
		 * @param {Object} options same as `getTokenImmediate`
		 *
		 * @param {Function} cb a callback to be called with the following parameters:
		 *
		 *      - **err**: *Error*, in case of failure
		 *
		 *      - **payments**: *Object*, the payment object.
		 *
		 *      > This object contains the fields `chargeOption` and `subscriptionOption` that you have to validate.
		 */
		monetize.getPaymentsImmediate = paramSanitizer(function(options, cb) {
			if(lastMsg && lastMsg.token && lastMsg.refreshDate > Date.now()) {
				return getPaymentsJsonp(function(msg) {
					cb(msg.error, msg.payments);
				});
			}
			postMsgIframe(options, function(msg) {
				cb(msg.error, msg.payments);
			});
		});

		/**
		 * Perform a redirection to the MonetizeJS platform for login and/or payment and get an access token as a result.
		 *
		 * @example
		 *
		 * monetize.getTokenInteractive(options, function(err, token) {
         *     if(err) {
		 *         console.error(err);
		 *     }
		 *     else if(token) {
		 *         console.log(token);
		 *     }
		 * });
		 *
		 * @param {Object} options optional set of options overriding the init options:
		 *
		 *      - **applicationID**: *String*, the application ID.
		 *
		 *      - **redirectURL**: *String*, in case of full page redirection, MonetizeJS will redirect the user to that URL.
		 *
		 *      > If redirect URL isn't provided, user will be redirected to the current page.
		 *
		 *      - **summary**: *Boolean*, forces the whole list of pricing options to be shown to the user.
		 *
		 *      > This option lets users review their current charge/subscription and manage their payments for your app.
		 *
		 *      - **pricingOptions**: *Array*, a list of pricing option aliases.
		 *
		 *      > Unless "summary" is enabled, the user interface will be limited to the specified pricing options.
		 *      If no pricing option is specified or user already has one of the specified pricing options, only login will be performed.
		 *
		 * @param {Function} cb same as `getTokenImmediate`.
		 *
		 *      > If the callback is provided, the redirection will be performed in a popup window.
		 *      > If no callback is provided, a full page redirection will be performed and you will have to call `getTokenImmediate` once redirected back to your page.
		 */
		monetize.getTokenInteractive = paramSanitizer(function(options, cb) {
			if(!cb) {
				return redirect(options);
			}
			popupWindow(options, function(msg) {
				cb(msg.error, msg.token);
			});
		});

		/**
		 * Perform a redirection to the MonetizeJS platform for login and/or payment and get user's payment object as a result.
		 *
		 * @example
		 *
		 * monetize.getTokenInteractive(options, function(err, token) {
         *     if(err) {
		 *         console.error(err);
		 *     }
		 *     else if(token) {
		 *         console.log(token);
		 *     }
		 * });
		 *
		 * @param {Object} options same as `getTokenInteractive`.
		 *
		 * @param {Function} cb same as `getPaymentsImmediate`.
		 *
		 *      > If the callback is provided, the redirection will be performed in a popup window.
		 *      > If no callback is provided, a full page redirection will be performed and you will have to call `getPaymentsImmediate` once redirected back to your page.
		 */
		monetize.getPaymentsInteractive = paramSanitizer(function(options, cb) {
			if(!cb) {
				return redirect(options);
			}
			popupWindow(options, function(msg) {
				cb(msg.error, msg.payments);
			});
		});

		/**
		 * Shortcut for `getTokenImmediate` and `getTokenInteractive`.
		 *
		 * @example
		 *
		 * monetize.getToken({
		 *     immediate: true
		 * }, cb);
		 *
		 * @param {Object} options optional set of options overriding the init options:
		 *
		 *      - **immediate**: *Boolean*, whether to call `getTokenImmediate` or `getTokenInteractive`.
		 *
		 * @param {Function} cb same as `getTokenImmediate` or `getTokenInteractive`.
		 *
		 */
		monetize.getToken = paramSanitizer(function(options, cb) {
			return (options.immeditate ? monetize.getTokenImmediate : monetize.getTokenInteractive)(options, cb);
		});

		/**
		 * Shortcut for `getPaymentsImmediate` and `getPaymentsInteractive`.
		 *
		 * @example
		 *
		 * monetize.getPayments({
		 *     immediate: true
		 * }, cb);
		 *
		 * @param {Object} options optional set of options overriding the init options:
		 *
		 *      - **immediate**: *Boolean*, whether to call `getPaymentsImmediate` or `getPaymentsInteractive`.
		 *
		 * @param {Function} cb same as `getPaymentsImmediate` or `getPaymentsInteractive`.
		 *
		 */
		monetize.getPayments = paramSanitizer(function(options, cb) {
			return (options.immeditate ? monetize.getPaymentsImmediate : monetize.getPaymentsInteractive)(options, cb);
		});

		return monetize;
	}

	window.MonetizeJS = MonetizeJS;

	if(typeof define === "function" && define.amd) {
		define("monetizejs", [], function() {
			return MonetizeJS;
		});
	}
})();