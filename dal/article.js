// Load Module Dependencies
var Article = require('../models/article');

// - create
// - get
// - delete
// - update
// - getCollection

exports.create = function create(data, cb) {
  var newArticle  = new Article(data);

  newArticle.save(function done(err, article) {
    if(err) {
      return cb(err);
    }

    cb(null, article);
  });
};

exports.get   = function get(query, cb) {
  Article.findOne(query, function done(err, article) {
    if(err) {
      return cb(err);
    }

    cb(null, article || {});
  });
};

exports.delete = function delete(query, cb) {
  exports.get(query, function done(err, article) {
    if(err) {
      return cb(err);
    }

    if(article._id) {
      Article.remove(article, function complete(err) {
        if(err) {
          return cb(err);
        }

        return cb(null, article);
      });
    } else {
      return cb(null, article);
    }
  });
};

exports.update = function update(query, data, cb) {
  Article.findOneAndUpdate(query, data, function done(err, article) {
    if(err) {
      return cb(err);
    }

    cb(null, article || {});
  });
};

exports.getCollection = function getCollection(query, cb) {
  Article.find(query, function done(err, docs) {
    if(err) {
      return cb(err);
    }

    cb(null, docs);
  });
};
