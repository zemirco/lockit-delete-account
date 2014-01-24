
var request = require('supertest');
var should = require('should');
var utls = require('lockit-utils');

var config = require('./config.js');
var app = require('./app.js')(config);

var db = utls.getDatabase(config);
var adapter = require(db.adapter)(config);

// create a second app for testing custom views
var config_2 = JSON.parse(JSON.stringify(config));
config_2.port = 4000;
config_2.deleteAccount.views = {
  remove: 'custom/remove.jade',
  removed: 'custom/removed.jade'
};
var app_2 = require('./app.js')(config_2);

// add a dummy user to db
before(function(done) {
  adapter.save('john', 'john@email.com', 'password', function(err, user) {
    if (err) console.log(err);
    done();
  });
});

describe('delete account', function() {
  
  describe('GET /delete-account', function() {

    it('should render the default route', function(done) {

      request(app)
        .get('/delete-account')
        .end(function(err, res) {
          res.statusCode.should.equal(200);
          res.text.should.include('Once you delete your account, there is no going back');
          res.text.should.include('<title>Delete account</title>');
          done();
        });

    });

    it('should work with custom views', function(done) {

      request(app_2)
        .get('/delete-account')
        .end(function(err, res) {
          res.text.should.include('Please don\'t go!');
          done();
        });

    });
    
  });
  
  describe('POST /delete-account', function() {
    
    it('should show an error message when an input field is empty', function(done) {

      request(app)
        .post('/delete-account')
        .send({username: '', phrase: 'lorem', password: 'secret'})
        .end(function(error, res) {
          res.statusCode.should.equal(403);
          res.text.should.include('All fields are required');
          done();
        });
      
    });

    it('should show an error message when phrase is incorrect', function(done) {

      request(app)
        .post('/delete-account')
        .send({username: 'john', phrase: 'please do not delete my account forever', password: 'secret'})
        .end(function(error, res) {
          res.statusCode.should.equal(403);
          res.text.should.include('Phrase doesn\'t match');
          done();
        });

    });

    it('should show an error message when session doesn\'t match username', function(done) {

      request(app)
        .post('/delete-account')
        .send({username: 'jack', phrase: 'please delete my account forever', password: 'secret'})
        .end(function(error, res) {
          res.statusCode.should.equal(403);
          res.text.should.include('You can only delete your own account. Please enter your username');
          done();
        });

    });
    
    it('should show an error message when password is incorrect', function(done) {

      request(app)
        .post('/delete-account')
        .send({username: 'john', phrase: 'please delete my account forever', password: 'secret'})
        .end(function(error, res) {
          res.statusCode.should.equal(403);
          res.text.should.include('Password is wrong');
          done();
        });
      
    });

    it('should work with custom error view', function(done) {

      request(app_2)
        .post('/delete-account')
        .send({username: 'john', phrase: 'please delete my account forever', password: 'secret'})
        .end(function(error, res) {
          res.text.should.include('Please don\'t go!');
          done();
        });

    });
    
    it('should delete a user from db when everything is fine', function(done) {

      request(app)
        .post('/delete-account')
        .send({username: 'john', phrase: 'please delete my account forever', password: 'password'})
        .end(function(error, res) {
          res.statusCode.should.equal(200);
          res.text.should.include('<title>Account deleted</title>');
          res.text.should.include('Your accout has been deleted.');
          done();
        });
      
    });

    it('should work with custom success view', function(done) {
      
      // reactivate user - has to be the same because of current session
      // session is set before middleware so it is renewed although destroyed 
      // by test before
        adapter.save('john', 'john@email.com', 'password', function(err, user) {
          if (err) console.log(err);

          request(app_2)
            .post('/delete-account')
            .send({username: 'john', phrase: 'please delete my account forever', password: 'password'})
            .end(function(error, res) {
              res.text.should.include('We will miss you!');
              done();
            });
          
        });

    });
    
  });
  
});