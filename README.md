# monetize.js

MonetizeJS official client-side library.

#### Import from CDN

```html
<script src="//cdn.monetizejs.com/api/js/latest/monetize.min.js"></script>
```

#### Or, install via bower

```bash
bower install monetizejs
```

## MonetizeJS()

Create and initialize a MonetizeJS object.


#### Example:

```js
var monetize = MonetizeJS(options);
```

#### Parameters:

- **options**: *Object*, optional set of top-level options.

## monetize.getTokenImmediate()

Attempt to get an access token without a redirection.


#### Example:

```js
monetize.getTokenImmediate(options, function(err, token) {
    if(err) {
        console.error(err);
    }
    else if(token) {
        console.log(token);
    }
});
```

#### Parameters:

- **options**: *Object*, optional set of options overriding the init options: 
     - **applicationID**: *String*, the application ID.


- **cb**: *Function*, a callback to be called with the following parameters: 
     - **err**: *Error*, in case of failure.

     - **token**: *String*, the access token.

## monetize.getPaymentsImmediate()

Attempt to get user's payment object without a redirection.


#### Example:

```js
monetize.getPaymentsImmediate(options, function(err, payments) {
    if(err) {
        console.error(err);
    }
    else if(token) {
        console.log(payments.chargeOption);
        console.log(payments.subscriptionOption);
    }
});
```

#### Parameters:

- **options**: *Object*, same as `getTokenImmediate` 

- **cb**: *Function*, a callback to be called with the following parameters: 
     - **err**: *Error*, in case of failure

     - **payments**: *Object*, the payment object.

     > This object contains the fields `chargeOption` and `subscriptionOption` that you have to validate.

## monetize.getTokenInteractive()

Perform a redirection to the MonetizeJS platform for login and/or payment and get an access token as a result.


#### Example:

```js
monetize.getTokenInteractive(options, function(err, token) {
    if(err) {
        console.error(err);
    }
    else if(token) {
        console.log(token);
    }
});
```

#### Parameters:

- **options**: *Object*, optional set of options overriding the init options: 
     - **applicationID**: *String*, the application ID.

     - **redirectURL**: *String*, in case of full page redirection, MonetizeJS will redirect the user to that URL.

     > If redirect URL isn't provided, user will be redirected to the current page.

     - **summary**: *Boolean*, forces the whole list of pricing options to be shown to the user.

     > This option lets users review their current charge/subscription and manage their payments for your app.

     - **pricingOptions**: *Array*, a list of pricing option aliases.

     > Unless "summary" is enabled, the user interface will be limited to the specified pricing options.
     If no pricing option is specified or user already has one of the specified pricing options, only login will be performed.


- **cb**: *Function*, same as `getTokenImmediate`. 
     > If the callback is provided, the redirection will be performed in a popup window.
     > If no callback is provided, a full page redirection will be performed and you will have to call `getTokenImmediate` once redirected back to your page.

## monetize.getPaymentsInteractive()

Perform a redirection to the MonetizeJS platform for login and/or payment and get user's payment object as a result.


#### Example:

```js
monetize.getTokenInteractive(options, function(err, token) {
    if(err) {
        console.error(err);
    }
    else if(token) {
        console.log(token);
    }
});
```

#### Parameters:

- **options**: *Object*, same as `getTokenInteractive`. 

- **cb**: *Function*, same as `getPaymentsImmediate`. 
     > If the callback is provided, the redirection will be performed in a popup window.
     > If no callback is provided, a full page redirection will be performed and you will have to call `getPaymentsImmediate` once redirected back to your page.

## monetize.getToken()

Shortcut for `getTokenImmediate` and `getTokenInteractive`.


#### Example:

```js
monetize.getToken({
    immediate: true
}, cb);
```

#### Parameters:

- **options**: *Object*, optional set of options overriding the init options: 
     - **immediate**: *Boolean*, whether to call `getTokenImmediate` or `getTokenInteractive`.


- **cb**: *Function*, same as `getTokenImmediate` or `getTokenInteractive`.

## monetize.getPayments()

Shortcut for `getPaymentsImmediate` and `getPaymentsInteractive`.


#### Example:

```js
monetize.getPayments({
    immediate: true
}, cb);
```

#### Parameters:

- **options**: *Object*, optional set of options overriding the init options: 
     - **immediate**: *Boolean*, whether to call `getPaymentsImmediate` or `getPaymentsInteractive`.


- **cb**: *Function*, same as `getPaymentsImmediate` or `getPaymentsInteractive`.

## License

The MIT License (MIT)

Copyright (c) 2014 MonetizeJS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
