
var request = require('supertest');
var should = require('should');
var cookie = require('cookie');
var utls = require('lockit-utils');

var config = require('./app/config.js');
var app = require('./app/app.js');

var db = utls.getDatabase(config);
var adapter = require(db.adapter)(config);

var _config = JSON.parse(JSON.stringify(config));
_config.port = 7000;
_config.csrf = true;
var _app = app(_config);

describe('# csrf', function() {

  describe('GET /delete-account', function() {

    it('should include the token in the view', function(done) {
      request(_app)
        .get('/delete-account')
        .end(function(err, res) {
          var cookies = cookie.parse(res.headers['set-cookie'][0]);
          var token = cookies.csrf;
          res.text.should.containEql('name="_csrf" value="' + token + '"');
          res.statusCode.should.equal(200);
          done();
        });
    });

  });

});
