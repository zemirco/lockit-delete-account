
var path = require('path');
var http = require('http');
var express = require('express');
var request = require('supertest');
var should = require('should');
var utls = require('lockit-utils');

var config = require('./app/config.js');
var DeleteAccount = require('../');

var app = express();
app.locals.basedir = __dirname + '/app/views';
app.set('port', 6500);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.urlencoded());
app.use(express.json());
app.use(express.cookieParser('your secret here'));
app.use(express.cookieSession());
app.use(function(req, res, next) {
  req.session.username = 'event';
  req.session.email = 'event@email.com';
  next();
});
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
http.createServer(app).listen(app.get('port'));

var db = utls.getDatabase(config);
var adapter = require(db.adapter)(config);

var deleteAccount = new DeleteAccount(app, config, adapter);

// create second app that manually handles responses
var config_two = JSON.parse(JSON.stringify(config));
config_two.deleteAccount.handleResponse = false;
var app_two = express();
app_two.locals.basedir = __dirname + '/app/views';
app_two.set('port', 6501);
app_two.set('views', __dirname + '/views');
app_two.set('view engine', 'jade');
app_two.use(express.urlencoded());
app_two.use(express.json());
app_two.use(express.cookieParser('your secret here'));
app_two.use(express.cookieSession());
app_two.use(function(req, res, next) {
  req.session.username = 'event_two';
  req.session.email = 'event_two@email.com';
  next();
});
app_two.use(app_two.router);
app_two.use(express.static(path.join(__dirname, 'public')));
http.createServer(app_two).listen(app_two.get('port'));

var deleteAccount_two = new DeleteAccount(app_two, config_two, adapter);

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
        user.username.should.equal('event');
        user.email.should.equal('event@email.com');
        done();
      });
      request(app)
        .post('/delete-account')
        .send({username: 'event', phrase: 'please delete my account forever', password: 'password'})
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
        .send({username: 'event_two', phrase: 'please delete my account forever', password: 'password'})
        .end(function(error, res) {
          res.text.should.include('awesome');
          done();
        });
    });

  });

});
