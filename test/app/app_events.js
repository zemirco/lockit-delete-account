
var path = require('path');
var http = require('http');
var express = require('express');
var request = require('supertest');
var should = require('should');
var utls = require('lockit-utils');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var config = require('./config.js');
var DeleteAccount = require('../../');

var app = express();
app.locals.basedir = __dirname + '/app/views';
app.set('port', 6500);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(cookieSession({
  secret: 'this is my super secret string'
}));
app.use(function(req, res, next) {
  req.session.redirectUrlAfterLogin = '/jep';
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  req.session.name = 'event';
  req.session.email = 'event@email.com';
  req.session.loggedIn = true;
  next();
});
app.get('/jep', function(req, res) {
  res.send(200);
});
var db = utls.getDatabase(config);
var adapter = require(db.adapter)(config);
var deleteAccount = new DeleteAccount(config, adapter);
app.use(deleteAccount.router);
http.createServer(app).listen(app.get('port'));

// create second app that manually handles responses
var config_two = JSON.parse(JSON.stringify(config));
config_two.deleteAccount.handleResponse = false;
var app_two = express();
app_two.locals.basedir = __dirname + '/app/views';
app_two.set('port', 6501);
app_two.set('views', __dirname + '/views');
app_two.set('view engine', 'jade');
app_two.use(bodyParser.urlencoded());
app_two.use(bodyParser.json());
app_two.use(cookieParser());
app_two.use(cookieSession({
  secret: 'this is my super secret string'
}));
app_two.use(express.static(path.join(__dirname, 'public')));
app_two.use(function(req, res, next) {
  req.session.name = 'event_two';
  req.session.email = 'event_two@email.com';
  req.session.loggedIn = true;
  next();
});
var deleteAccount_two = new DeleteAccount(config_two, adapter);
app_two.use(deleteAccount_two.router);
http.createServer(app_two).listen(app_two.get('port'));

describe('# event listeners', function() {

  before(function(done) {
    // create a user with verified email
    adapter.save('event', 'event@email.com', 'password', function() {
      adapter.save('event_two', 'event_two@email.com', 'password', done);
    });
  });

  describe('POST /delete-account', function() {

    it('should emit a "delete" event on success', function(done) {
      deleteAccount.on('delete', function(user, res) {
        user.name.should.equal('event');
        user.email.should.equal('event@email.com');
        done();
      });
      request(app)
        .post('/delete-account')
        .send({name: 'event', phrase: 'please delete my account forever', password: 'password'})
        .end(function(error, res) {
          res.statusCode.should.equal(200);
        });
    });

  });

  describe('POST /delete-account', function() {

    it('should allow manual response handling (handleResponse = false)', function(done) {
      deleteAccount_two.on('delete', function(user, res) {
        res.send('awesome');
      });
      request(app_two)
        .post('/delete-account')
        .send({name: 'event_two', phrase: 'please delete my account forever', password: 'password'})
        .end(function(error, res) {
          res.text.should.include('awesome');
          done();
        });
    });

  });

});
