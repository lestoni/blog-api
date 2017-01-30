// Load Module Dependencies
var async   = require('async');

var User    = require('../models/user');

function authorize(types) {

  return function middleware(req, res, next) {
    // IF type is not okay - return error
    // 401
    //
    // if okay call next
    //
    //

    // Iterater through the types asynchronously
    // and find the if any of the types is present
    // hence is allowed!!
    //
    // Returns true if any of the types match the user
    // type else returns false
    async.some(types, function worker(type, done) {
      User.findOne({ type: req._user.type }, function lookup(err, user) {
        if(err) {
          return done(err);
        }

        done(null, user);

      });
    }, function complete(err, isOk) {
      if(err) {
        return next(err);
      }

      if(isOk) {
        return next();
      } else {
        res.status(401);
        res.json({
          error: true,
          message: 'You are not authorized to complete this action! Go home!'
        });

        return;
      }
    });

  };

}
