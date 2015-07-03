
var request = require('supertest');
var should = require('should');
var utls = require('lockit-utils');

var config = require('./app/config.js');
var app = require('./app/app.js');

var db = utls.getDatabase(config);
var adapter = require(db.adapter)(config);

// create a second app for testing custom views
var _config = JSON.parse(JSON.stringify(config));
_config.port = 4000;
_config.deleteAccount.views = {
  remove: 'custom/remove.jade',
  removed: 'custom/removed.jade'
};
var _app = app(_config);

describe('# custom views', function() {

  // add a dummy user to db
  before(function(done) {
    adapter.save('john', 'john@email.com', 'password', done);
  });

  describe('GET /delete-account', function() {

    it('should work with custom views', function(done) {
      request(_app)
        .get('/delete-account')
        .end(function(err, res) {
          res.text.should.containEql('Please don\'t go!');
          done();
        });
    });

  });

  describe('POST /delete-account', function() {

    it('should work with custom error view', function(done) {
      request(_app)
        .post('/delete-account')
        .send({name: 'john', phrase: 'please delete my account forever', password: 'secret'})
        .end(function(error, res) {
          res.text.should.containEql('Please don\'t go!');
          done();
        });
    });

    it('should work with custom success view', function(done) {
      request(_app)
        .post('/delete-account')
        .send({name: 'john', phrase: 'please delete my account forever', password: 'password'})
        .end(function(error, res) {
          res.text.should.containEql('We will miss you!');
          done();
        });
    });

  });

});
