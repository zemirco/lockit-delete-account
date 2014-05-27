# Lockit delete account

[![Build Status](https://travis-ci.org/zemirco/lockit-delete-account.svg?branch=master)](https://travis-ci.org/zemirco/lockit-delete-account)
[![NPM version](https://badge.fury.io/js/lockit-delete-account.svg)](http://badge.fury.io/js/lockit-delete-account)
[![Dependency Status](https://david-dm.org/zemirco/lockit-delete-account.svg)](https://david-dm.org/zemirco/lockit-delete-account)

Delete user accounts in your Express app. The module is part of [Lockit](https://github.com/zemirco/lockit).

## Installation

`npm install lockit-delete-account`

```js
var DeleteAccount = require('lockit-delete-account');
var utils = require('lockit-utils');
var config = require('./config.js');

var db = utils.getDatabase(config);
var adapter = require(db.adapter)(config);

var app = express();

// express settings
// ...
// sessions are required - either cookie or some sort of db
app.use(cookieParser());
app.use(cookieSession({
  secret: 'this is my super secret string'
}));

// create new DeleteAccount instance
var deleteAccount = new DeleteAccount(config, adapter);

// use deleteAccount.router with your app
app.use(deleteAccount.router);
```

## Configuration

More about configuration at [Lockit](https://github.com/zemirco/lockit).

## Features

 - input validation
 - match public phrase
 - session verification
 - kill current session
 - remove user from db

## Routes included

 - GET /delete-account
 - POST /delete-account

## REST API

If you've set `exports.rest` in your `config.js` the module behaves as follows.

 - all routes have `/rest` prepended
 - `GET /rest/delete-account` is `next()`ed and you can catch `/delete-account` on the client
 - `POST /rest/delete-account` stays the same but sends JSON

## Test

`grunt`

## License

MIT
