
// settings for test
exports.db = 'http://127.0.0.1:5984/test';

exports.signup = {
  tokenExpiration: '1 day'
};

exports.deleteAccount = {
  route: '/delete-account',
  views: {
    remove: '',         // input fields 'username', 'phrase', 'password' | POST /'deleteAccount.route' | local variable 'error'
    removed: ''         // message that account has been deleted
  }
};