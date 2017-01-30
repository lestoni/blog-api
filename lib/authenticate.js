// Load Module Dependencies
var xtend    = require('xtend');

var APIKey    = require('../models/api-key');
var User      = require('../models/user');

module.exports = function authenticate(opts) {

  var defaults = {
    open_endpoints: [],
    set_auth: true
  };

  defaults = xtend(defaults, opts);

  return function middleware(req, res, next) {
    if(!defaults.set_auth) {
      next();

    } else {
      var auth = req.get('Authorization');

      if(!auth) {
        res.status(403);
        res.json({
          error: true,
          message: 'Please set Authorization Key'
        });

        return;
      } else {

        var tokens = auth.trim().split(/\s+/);

        if(tokens[0] !== 'Bearer') {

          res.status(403);
          res.json({
            error: true,
            message: 'Authentication Realm should be Bearer'
          });

          return;
        }

        // Retrieve API Key
        APIKey.findOne({ value: tokens[1] }, function callback(err, key) {
          // Pass any err to the Error Handler
          if(err) {
            return next(err);
          }

          // If key not found === Key is not recognized
          if(!key) {
            res.status(403);
            res.json({
              error: true,
              message: 'Authentication Token Is Not Recognized!'
            });

            return;
          } else {
            // If Key found == Retrieve the given user
            User.findOne({ key: key._id }, function callback1(err, user) {
              if(err) {
                return next(err);
              }

              req._user = user;
              next();
            });
          }


        });


      }

    }

  };
};
