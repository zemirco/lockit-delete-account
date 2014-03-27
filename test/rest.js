var request = require('supertest');
var should = require('should');
var utls = require('lockit-utils');

var config = require('./app/config.js');
var app = require('./app/app.js');

var db = utls.getDatabase(config);
var adapter = require(db.adapter)(config);

var _config = JSON.parse(JSON.stringify(config));
_config.port = 5000;
_config.rest = true;
var _app = app(_config);

describe('# rest enabled', function() {

  // add a dummy user to db
  before(function(done) {
    adapter.save('john', 'john@email.com', 'password', done);
  });
  
  describe('GET /delete-account', function() {

    it('should render the default route (REST)', function(done) {
      request(_app)
        .get('/rest/delete-account')
        .end(function(err, res) {
          res.statusCode.should.equal(404);
          done();
        });
    });
    
  });
  
  describe('POST /delete-account', function() {

    it('should show an error message when an input field is empty (REST)', function(done) {
      request(_app)
        .post('/rest/delete-account')
        .send({username: '', phrase: 'lorem', password: 'secret'})
        .end(function(error, res) {
          res.statusCode.should.equal(403);
          res.text.should.equal('{"error":"All fields are required"}');
          done();
        });
    });

    it('should show an error message when phrase is incorrect', function(done) {
      request(_app)
        .post('/rest/delete-account')
        .send({username: 'john', phrase: 'please do not delete my account forever', password: 'secret'})
        .end(function(error, res) {
          res.statusCode.should.equal(403);
          res.text.should.equal('{"error":"Phrase doesn\'t match"}');
          done();
        });
    });

    it('should show an error message when session doesn\'t match username', function(done) {
      request(_app)
        .post('/rest/delete-account')
        .send({username: 'jack', phrase: 'please delete my account forever', password: 'secret'})
        .end(function(error, res) {
          res.statusCode.should.equal(403);
          res.text.should.equal('{"error":"You can only delete your own account. Please enter your username"}');
          done();
        });
    });

    it('should show an error message when password is incorrect', function(done) {
      request(_app)
        .post('/rest/delete-account')
        .send({username: 'john', phrase: 'please delete my account forever', password: 'secret'})
        .end(function(error, res) {
          res.statusCode.should.equal(403);
          res.text.should.equal('{"error":"Password is wrong"}');
          done();
        });
    });

    it('should delete a user from db when everything is fine', function(done) {
      request(_app)
        .post('/rest/delete-account')
        .send({username: 'john', phrase: 'please delete my account forever', password: 'password'})
        .end(function(error, res) {
          res.statusCode.should.equal(204);
          done();
        });
    });
    
  });
  
});
