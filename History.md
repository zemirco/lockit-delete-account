
##### 1.0.0 - 2014-04-19

- requires Express 4.x
- makes use of `express.Router()`. No need to pass `app` around as argument.

  **old**

  ```js
  var DeleteAccount = require('lockit-delete-account');

  var deleteAccount = new DeleteAccount(app, config, adapter);
  ```

  **new**

  ```js
  var DeleteAccount = require('lockit-delete-account');

  var deleteAccount = new DeleteAccount(config, adapter);
  app.use(deleteAccount.router);
  ```

- proper Error handling. All Errors are piped to next middleware.

  **old**

  ```js
  if (err) console.log(err);
  ```

  **new**

  ```js
  if (err) return next(err);
  ```

  Make sure you have some sort of error handling middleware at the end of your
  routes (is included by default in Express 4.x apps if you use the `express-generator`).

##### 0.6.0 - 2014-04-11

- `username` becomes `name`
