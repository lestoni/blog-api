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
          message: 'Very Funny!!'
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

        var isKnown = false;
        var _user;

        DB.users.forEach(function iter(user) {
          if(user.key === tokens[1]) {
            _user = user;
            isKnown = true;
          }
        });

        if(!isKnown) {
          res.status(403);
          res.json({
            error: true,
            message: 'Authentication Token Is Not Recognized!'
          });

          return;
        }


        req._user = _user;

      }

        next();
    }

  };
};
