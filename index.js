
var path = require('path');
var pwd = require('couch-pwd');
var utils = require('lockit-utils');

// require event emitter
var events = require('events');
var util = require('util');

/**
 * Internal helper functions
 */

function join(view) {
  return path.join(__dirname, 'views', view);
}

/**
 * Let's get serious
 */

var DeleteAccount = module.exports = function(app, config, adapter) {

  if (!(this instanceof DeleteAccount)) return new DeleteAccount(app, config, adapter);

  var that = this;

  // shorten config
  var cfg = config.deleteAccount;

  // set default route
  var route = cfg.route || '/delete-account';

  // add prefix when rest is active
  if (config.rest) route = '/rest' + route;

  /**
   * Routes
   */

  app.get(route, utils.restrict(config), getDelete);
  app.post(route, utils.restrict(config), postDelete);

  /**
   * Route handlers
   */

  // GET /delete-account
  function getDelete(req, res, next) {
    // do not handle the route when REST is active
    if (config.rest) return next();

    // custom or built-in view
    var view = cfg.views.remove || join('get-delete-account');

    res.render(view, {
      title: 'Delete account'
    });
  }

  // POST /delete-account
  function postDelete(req, res) {
    // verify input fields
    var name = req.body.name;
    var phrase = req.body.phrase;
    var password = req.body.password;

    var error = null;

    // check for valid inputs and valid session
    if (!name || !phrase || !password) {
      error = 'All fields are required';
    } else if (phrase !== 'please delete my account forever') {
      error = 'Phrase doesn\'t match';
    } else if (req.session.name !== name) {
      error = 'You can only delete your own account. Please enter your username';
    }

    // custom or built-in view
    var view = cfg.views.remove || join('get-delete-account');

    if (error) {
      // do not handle the route when REST is active
      if (config.rest) return res.json(403, {error: error});

      res.status(403);
      res.render(view, {
        title: 'Delete account',
        error: error
      });
      return;
    }

    // get user from db
    adapter.find('name', name, function(err, user) {
      if (err) console.log(err);

      // no need to check if user exists in db since we are already checking against current session

      // if user comes from couchdb it has an 'iterations' key
      if (user.iterations) pwd.iterations(user.iterations);

      // verify user password
      pwd.hash(password, user.salt, function(err, hash) {
        if (err) console.log(err);

        // compare hash with hash from db
        if (hash !== user.derived_key) {
          error = 'Password is wrong';

          // do not handle the route when REST is active
          if (config.rest) return res.json(403, {error: error});

          res.status(403);
          res.render(view, {
            title: 'Delete account',
            error: error
          });
          return;

        }

        // delete user from db :(
        adapter.remove(name, function(err) {
          if (err) console.log(err);

          // kill session
          req.session = null;

          // emit 'delete' event
          that.emit('delete', user, res);

          if (cfg.handleResponse) {

            // do not handle the route when REST is active
            if (config.rest) return res.send(204);

            view = cfg.views.removed || join('post-delete-account');

            // render success message
            res.render(view, {
              title: 'Account deleted'
            });

          }

        });

      });

    });
  }

  events.EventEmitter.call(this);

};

util.inherits(DeleteAccount, events.EventEmitter);
