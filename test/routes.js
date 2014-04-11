

var request = require('supertest');
var should = require('should');
var utls = require('lockit-utils');

var config = require('./app/config.js');
var app = require('./app/app.js');

var db = utls.getDatabase(config);
var adapter = require(db.adapter)(config);

var _config = JSON.parse(JSON.stringify(config));
_config.port = 5100;
_config.deleteAccount.route = '/delete-me';
var _app = app(_config);

describe('# custom routes', function() {

  describe('GET /delete-account', function() {

    it('should work with custom routes', function(done) {
      request(_app)
        .get('/delete-me')
        .end(function(err, res) {
          res.statusCode.should.equal(200);
          res.text.should.include('Once you delete your account, there is no going back');
          done();
        });
    });

  });

  describe('POST /delete-account', function() {

    it('should work with custom routes', function(done) {
      request(_app)
        .post('/delete-me')
        .send({name: '', phrase: 'lorem', password: 'secret'})
        .end(function(error, res) {
          res.statusCode.should.equal(403);
          res.text.should.include('All fields are required');
          done();
        });
    });

  });

});
