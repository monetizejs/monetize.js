# monetize.js

MonetizeJS official client side library.

## MonetizeJS()

Create and initialize a MonetizeJS object.


#### Example:

```js
var monetize = MonetizeJS(options);
```

#### Parameters:

- **options**: *Object*, optional set of default options.

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

Attempt to get user's payments without a redirection.


#### Example:

```js
monetize.getPaymentsImmediate(options, function(err, payments) {
    if(err) {
        console.error(err);
    }
    else if(token) {
        console.log(payments.currentCharge);
        console.log(payments.currentSubscription);
    }
});
```

#### Parameters:

- **options**: *Object*, same as `getTokenImmediate` 

- **cb**: *Function*, a callback to be called with the following parameters: 
     - **err**: *Error*, in case of failure

     - **payments**: *Object*, the payment object.

     > This object contains the fields `currentCharge` and `currentSubscription` that you have to validate.

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

     - **pricingOptions**: *String*, a comma separated list of pricing option aliases.

     > Unless "summary" is enabled, the user interface will be limited to the specified pricing options.
     If no pricing option is specified or user already has one of the specified pricing options, only login will be performed.


- **cb**: *Function*, same as `getTokenImmediate`. 
     > If the callback is provided, the redirection will be performed in a popup window.
     > If no callback is provided, a full page redirection will be performed and you will have to call `getTokenImmediate` once redirected back to your page.

## monetize.getPaymentsInteractive()

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

- **options**: *Object*, same as `getTokenInteractive`. 

- **cb**: *Function*, same as `getPaymentsImmediate`. 
     > If the callback is provided, the redirection will be performed in a popup window.
     > If no callback is provided, a full page redirection will be performed and you will have to call `getPaymentsImmediate` once redirected back to your page.

