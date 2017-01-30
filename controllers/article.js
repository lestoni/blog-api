// Load Module Dependencies
var Article = require('../dal/article');


// Get All Articles
exports.getArticles = function getArticles(req, res, next) {

  // Retrieve all the Articles
  Article.getCollection({}, function getAllArticles(err, docs) {
    if(err) {
      return next(err);
    }

    res.json(docs);
  });
};

// Get a specific article
exports.getArticle = function getArticle(req, res, next) {
  var articleId = req.params.articleId;

  // Query DB for an article with the given ID
  Article.get(articleId, function cb(err, article) {
    if(err) {
      return next(err);
    }

    // If article find return it
    if(article) {
      res.json(article);

    } else {
      res.status(404);
      res.json({
        error: true,
        message: 'Article Requested Not Found!',
        status: 404
      });

    }
  });
};

// Get Article Comments
exports.getArticleComments = function getArticleComments(req, res, next) {
  var articleId = req.params.articleId;

  // Query DB for comments of a specific article with the given ID
  Comment.getCollection({ article: articleId }, function cb(err, comments) {
    if(err) {
      return next(err);
    }

    res.json(comments);

  });

};

// Create Article
exports.createArticle = function createArticle(req, res, next) {
  var body    = req.body;
  var now     = new Date();

  Article.create(body, function done(err, article) {
    if(err) {
      return next(err);
    }

    res.json(article);
  });

  // CREATE AN ARTICLE TYPE
  var newArticle = new Article({
    author: body.author,
    content: body.content,
    title: body.title,
    last_updated: now,
    created_at: now
  });

  // SAVE THE NEW ARTICLE TO THE DB
  newArticle.save(function cb(err, article) {
    if(err) {
      return next(err);
    }

    // Return Article
    res.status(201);
    res.json(article);

  });

};


// Delete all Articles
exports.deleteArticles = function deleteArticles(req, res, next) {
  // Remove All Documents in the articles collection
  Article.delete({}, function removeAll(err) {
    if(err) {
      return next(err);
    }

    res.json({
      message: 'Articles Deleted!'
    });
  });
};

// Update Article Comments
exports.updateArticleComments = function updateArticleComments(req, res, next) {
  var body      = req.body;
  var articleId = req.params.articleId;

  // Update comments of  the given Article using the body data
  Article.update(articleId, { $set: { comments: body } }, function update(err, article) {
    if(err) {
      return next(err);
    }

    if(!article) {
      res.status(404);
      res.json({
        error: true,
        message: 'Article To Be Updated Not Found!',
        status: 404
      });
      return;

    } else {
      res.json(article);

    }
  });
};

// Update Article
exports.deleteArticle = function deleteArticle(req, res, next) {
  var articleId = req.params.articleId;

  // Find an article with the given Id and remove
  Article.delete({ _id: articleId }, function removeArticle(err, article) {
    if(err) {
      return next(err);
    }

    if(!article) {
      res.status(404);
      res.json({
        error: true,
        message: 'Article To Be Deleted Not Found!',
        status: 404
      });
      return;
    }

    // Find Related Comments and Remove Consequently
    Comment.delete({ article: article._id }, function removeComments(err) {
      if(err) {
        return next(err);
      }

      res.json(article);
    });
  });

};
