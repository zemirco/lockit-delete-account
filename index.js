
var path = require('path');
var events = require('events');
var util = require('util');
var express = require('express');
var pwd = require('couch-pwd');
var utils = require('lockit-utils');



/**
 * Internal helper functions
 */
function join(view) {
  return path.join(__dirname, 'views', view);
}



/**
 * DeleteAccount constructor function.
 *
 * @constructor
 * @param {Object} config
 * @param {Object} adapter
 */
var DeleteAccount = module.exports = function(config, adapter) {

  if (!(this instanceof DeleteAccount)) return new DeleteAccount(config, adapter);

  this.config = config;
  this.adapter = adapter;

  // call super constructor function
  events.EventEmitter.call(this);

  // set default route
  var route = config.deleteAccount.route || '/delete-account';

  // add prefix when rest is active
  if (config.rest) route = '/rest' + route;

  /**
   * Routes
   */

  var router = express.Router();
  router.get(route, utils.restrict(config), this.getDelete.bind(this));
  router.post(route, utils.restrict(config), this.postDelete.bind(this));
  this.router = router;

};

util.inherits(DeleteAccount, events.EventEmitter);



/**
 * GET /delete-account.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
DeleteAccount.prototype.getDelete = function(req, res, next) {
  var config = this.config;

  // do not handle the route when REST is active
  if (config.rest) return next();

  // custom or built-in view
  var view = config.deleteAccount.views.remove || join('get-delete-account');

  res.render(view, {
    title: 'Delete account',
    basedir: req.app.get('views')
  });
};



/**
 * POST /delete-account.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
DeleteAccount.prototype.postDelete = function(req, res, next) {
  var config = this.config;
  var adapter = this.adapter;
  var that = this;

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
    error = 'Please enter your username';
  }

  // custom or built-in view
  var view = config.deleteAccount.views.remove || join('get-delete-account');

  if (error) {
    // do not handle the route when REST is active
    if (config.rest) return res.json(403, {error: error});

    res.status(403);
    res.render(view, {
      title: 'Delete account',
      error: error,
      basedir: req.app.get('views')
    });
    return;
  }

  // get user from db
  adapter.find('name', name, function(err, user) {
    if (err) return next(err);

    // no need to check if user exists in db since we are already checking against current session

    // if user comes from couchdb it has an 'iterations' key
    if (user.iterations) pwd.iterations(user.iterations);

    // verify user password
    pwd.hash(password, user.salt, function(err, hash) {
      if (err) return next(err);

      // compare hash with hash from db
      if (hash !== user.derived_key) {
        error = 'Password is wrong';

        // do not handle the route when REST is active
        if (config.rest) return res.json(403, {error: error});

        res.status(403);
        res.render(view, {
          title: 'Delete account',
          error: error,
          basedir: req.app.get('views')
        });
        return;

      }

      // delete user from db :(
      adapter.remove(name, function(err) {
        if (err) return next(err);

        // kill session
        utils.destroy(req, function() {

          // emit 'delete' event
          that.emit('delete', user, res);

          if (config.deleteAccount.handleResponse) {

            // do not handle the route when REST is active
            if (config.rest) return res.send(204);

            view = config.deleteAccount.views.removed || join('post-delete-account');

            // render success message
            res.render(view, {
              title: 'Account deleted',
              basedir: req.app.get('views')
            });

          }

        });

      });

    });

  });
};
