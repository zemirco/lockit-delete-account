
var path = require('path');
var bcrypt = require('bcrypt');

module.exports = function(app, config) {

  // load additional modules
  var adapter = require('lockit-' + config.db + '-adapter')(config);

  // GET /delete-account
  app.get('/delete-account', function(req, res) {
    res.render(path.join(__dirname, 'views', 'get-delete-account'), {
      title: 'Delete account'
    });
  });
  
  // POST /delete-account
  app.post('/delete-account', function(req, res) {
    
    // verify input fields
    var username = req.body.username;
    var phrase = req.body.phrase;
    var password = req.body.password;

    var error = null;

    // check for valid inputs and valid session
    if (!username || !phrase || !password) {
      error = 'All fields are required';
    } else if (phrase !== 'please delete my account forever') {
      error = 'Phrase doesn\'t match';
    } else if (req.session.username !== username) {
      error = 'You can only delete your own account. Please enter your username';
    }

    if (error) {
      res.status(403);
      res.render(path.join(__dirname, 'views', 'get-delete-account'), {
        title: 'Delete account',
        error: error
      });
      return;
    }
    
    // get user from db
    adapter.find('username', username, function(err, user) {
      if (err) console.log(err);
      
      // no user found - kind of duplicate check after session verification ?!?
      if (!user) {
        res.status(403);
        res.render(path.join(__dirname, 'views', 'get-delete-account'), {
          title: 'Delete account',
          error: 'Username not found'
        });
        return;
      }
      
      // verify user password
      bcrypt.compare(password, user.hash, function(err, valid) {

        if (err) console.log(err);
        
        // compare hash with hash from db
        if (!valid) {

          res.status(403);
          res.render(path.join(__dirname, 'views', 'get-delete-account'), {
            title: 'Delete account',
            error: 'Password is wrong'
          });
          return;

        }
        
        // delete user from db :(
        adapter.remove('username', username, function(err) {
          if (err) console.log(err);
          
          // kill session
          req.session = null;

          // render success message
          res.render(path.join(__dirname, 'views', 'post-delete-account'), {
            title: 'Account deleted'
          });
        });
        
      });

    });
    
  });
  
};