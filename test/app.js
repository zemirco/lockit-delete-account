
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

// require delete account middleware
var deleteAccount = require('../index.js');

function start(config) {

  config = config || require('./config.js');
  
  var app = express();

// set basedir so views can properly extend layout.jade
  app.locals.basedir = __dirname + '/views';

// all environments
  app.set('port', process.env.PORT || config.port || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  // make JSON output simpler for testing
  app.set('json spaces', 0);
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.cookieSession());

// set a dummy session for testing purpose
  app.use(function(req, res, next) {
    req.session.username = 'john';
    req.session.email = 'john@email.com';
    next();
  });

// use delete account middleware with testing options
  deleteAccount(app, config);

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));

// development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  app.get('/', routes.index);
  app.get('/users', user.list);

  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
  
  return app;
  
}

// export app for testing
if(require.main === module){
  // called directly
  start();
} else {
  // required as a module -> from test file
  module.exports = function(config) {
    return start(config);
  };
}