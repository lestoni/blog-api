// Load Module Dependencies
var express      = require('express');
var bodyParser   = require('body-parser');
var responseTime = require('response-time');
var xtend        = require('xtend');
var mongoose     = require('mongoose');
var async        = require('async');

var app = express();

mongoose.connect('mongodb://localhost/blog');

mongoose.connection.on('connected', function connectionListener() {
  console.log('I cant wait to go home!');
});

// DATA MODELLING
//
// Design models/entities
// Article:
//  - id
//  - author
//  - title
//  - content
//  - comments
//  - created_at
//  - last_updated
//
// Comment:
//  - id
//  - article(Reference)
//  - content
//  - created_at
//  - last_updated
//  - author

var ArticleSchema = new mongoose.Schema({
  author:     { type: String },
  title:      { type: String },
  content:    { type: String },
  comments:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  created_at:   { type: Date  },
  last_updated: { type: Date }
});
var Article = mongoose.model('Article', ArticleSchema);

var CommentSchema = new mongoose.Schema({
  article:    { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  content:    { type: String },
  author:     { type: String },
  created_at:     { type: Date  },
  last_updated:   { type: Date }
});
var Comment = mongoose.model('Comment', CommentSchema);

// - value
var APIKeySchema = new mongoose.Schema({
  value:          { type: String },
  created_at:     { type: Date  },
  last_updated:   { type: Date }
});
var APIKey  = mongoose.model('APIKey', APIKeySchema);

// - type
// - key
var UserSchema  = new mongoose.Schema({
  type:   { type: String },
  key:    { type: mongoose.Schema.Types.ObjectId, ref: 'APIKey' },
  created_at:     { type: Date  },
  last_updated:   { type: Date }
});
var User  = mongoose.model('User', UserSchema);

// Setup Middleware
app.use(bodyParser.json());

app.use(responseTime());

app.use(authenticate({
  set_auth: true
}));

// Authentication Middleware
// opts:
//g  - open_endpoints: []
//  - set_auth: true
function authenticate(opts) {

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
}

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

// AUTHORIZATION

// Add CRUD endpoints
// - GET(Reading/getting a resource)
//  - /articles
//  - /comments
//  - /comments/:id
//  - /articles/:id
//  - /articles/:id/comments

// GET /articles
app.get('/articles', authorize(['admin']), function getArticles(req, res, next) {

  // Retrieve all the Articles
  Article.find({}, function getAllArticles(err, docs) {
    if(err) {
      return next(err);
    }

    res.json(docs);
  });

});

// GET /comments
// ONLY ADMIN CAN VIEW/PROCEED
app.get('/comments', function getComments(req, res, next) {

  // Retrieve all the Comments
  Article.find({}, function getAllArticles(err, docs) {
    if(err) {
      return next(err);
    }

    res.json(docs);
  });

});

// GET /comments/:id
// Retrieve a specific Comment with a given id
app.get('/comments/:commentId', authorize(['consumer', 'admin']), function getComment(req, res, next) {

  var commentId = req.params.commentId;

  // Query DB for the specific comment with the given ID
  Comment.findById(commentId, function findComment(err, comment) {
    if(err) {
      return next(err);
    }

    // If comment find return it
    if(comment) {
      res.json(comment);

    } else {
      res.status(404);
      res.json({
        error: true,
        message: 'Comment Requested Not Found!',
        status: 404
      });

    }
  });

});

// GET /articles/:id
app.get('/articles/:articleId', authorize(['admin', 'consumer']), function getArticles(req, res, next) {

  var articleId = req.params.articleId;

  // Query DB for an article with the given ID
  Article.findById(articleId, function cb(err, article) {
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

});

// GET /articles/:id/comments
app.get('/articles/:articleId/comments', authorize(['admin', 'consumer']), function getArticleComments(req, res, next) {

  var articleId = req.params.articleId;

  // Query DB for comments of a specific article with the given ID
  Comment.find({ article: articleId }, function cb(err, comments) {
    if(err) {
      return next(err);
    }

    res.json(comments);

  });

});


// - POST(Creating a resource)
//  - /articles
//  - /comments
//  - /articles/:id/comments

// POST /articles
app.post('/articles', function createArticle(req, res, next) {

  var body    = req.body;
  var now     = new Date();

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



});

// POST /comments
app.post('/comments', authorize(['consumer', 'admin' ]), function createComment(req, res, next) {
  var body    = req.body;
  var now     = new Date();

  var newComment = {
    article: body.article,
    content: body.content,
    author: body.author,
    last_updated: now,
    created_at: now
  };

  // SAVE THE NEW COMMENT TO THE DB
  newComment.save(function cb(err, comment) {
    if(err) {
      return next(err);
    }

    // Return Comment
    res.status(201);
    res.json(comment);

  });

});

// - DELETE(Deleting a resource)
//  - /articles
//  - /comments
//  - /articles/:id
//  - /comments/:id
//  - /articles/:id/comments

// DELETE /articles
app.delete('/articles', authorize(['admin']),  function deleteArticles(req, res, next) {

  // Remove All Documents in the articles collection
  Article.remove({}, function removeAll(err) {
    if(err) {
      return next(err);
    }

    res.json({
      message: 'Articles Deleted!'
    });
  });
});

// DELETE /comments
app.delete('/comments', authorize(['admin']),  function deleteComment(req, res, next) {

  // Remove All Documents in the comments collection
  Comment.remove({}, function removeAll(err) {
    if(err) {
      return next(err);
    }

    res.json({
      message: 'Comments Deleted!'
    });
  });

});

// DELETE /articles/:id
app.delete('/articles/:articleId', authorize(['admin', 'consumer']),  function deleteArticle(req, res, next) {

  var articleId = req.params.articleId;

  // Find an article with the given Id and remove
  Article.findOneAndRemove({ _id: articleId }, function removeArticle(err, article) {
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
    Comment.remove({ article: article._id }, function removeComments(err) {
      if(err) {
        return next(err);
      }

      res.json(article);
    });
  });


});

// DELETE /comments/:id
app.delete('/comments/:commentId', authorize(['admin', 'consumer']),  function deleteComment(req, res, next) {

  var commentId = req.params.commentId;

  // Find the comment with the given Id and Remove it
  Comment.findOneAndRemove({ _id: commentId }, function removeComment(err, comment) {
    if(err) {
      return next(err);
    }

    if(!comment) {
      res.status(404);
      res.json({
        error: true,
        message: 'Comment To Be Deleted Not Found!',
        status: 404
      });
    }

    // Remove Comment from Article Consequently By Updating the comments attribute
    Article.findOneAndUpdate({ _id: comment.article }, { $pull: { comments: comment._id } }, function updateArticle(err, article) {
      if(err) {
        return next(err);
      }

      res.json(comment);
    });
  });

});

// DELETE /articles/:id/comments
app.delete('/articles/:articleId/comments', authorize(['admin']), function deleteArticleComments(req, res, next) {

  var articleId = req.params.articleId;

  // Reset Comments attribute for a given Article
  Article.findOneAndUpdate({ _id: comment.article }, { $set: { comments: [] } }, function updateArticle(err, article) {
    if(err) {
      return next(err);
    }

    res.json(article);
  });

});

// - PUT(Updating a resource)
//  - /articles
//  - /comments
//  - /articles/:id
//  - /comments/:id
//  - /articles/:id/comments

// PUT /articles
app.put('/articles', authorize(['admin']),  function updateArticles(req, res, next) {
  var body = req.body;

  // Update all articles using the given body data;
  Article.update(body, function updateAll(err) {
    if(err) {
      return next(err);
    }

    res.json({
      message: 'All Articles updated successfully'
    });

  });


});

// PUT /comments
app.put('/comments', authorize(['admin']), function updateComments(req, res, next) {
  var body = req.body;

  // Update all articles using the given body data;
  Comment.update(body, function updateAll(err) {
    if(err) {
      return next(err);
    }

    res.json({
      message: 'All Comments updated successfully'
    });

  });

});

// PUT /articles/:id
app.put('/articles/:articleId', authorize(['consumer', 'admin']),  function updateArticle(req, res, next) {
  var body      = req.body;
  var articleId = req.params.articleId;

  // Update the given Article using the body data
  Article.findByIdAndUpdate(articleId, body, function update(err, article) {
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

});

// PUT /comments/:id
app.put('/comments/:commentId', authorize(['admin', 'consumer']), function updateComment(req, res, next) {
  var body      = req.body;
  var commentId = req.params.commentId;

  // Update the given Comment using the body data
  Comment.findByIdAndUpdate(commentId, body, function update(err, comment) {
    if(err) {
      return next(err);
    }

    if(!comment) {
      res.status(404);
      res.json({
        error: true,
        message: 'Comment To Be Updated Not Found!',
        status: 404
      });
      return;

    } else {
      res.json(comment);

    }
  });

});

// PUT /articles/:id/comments
app.put('/articles/:articleId/comments', function updateArticle(req, res, next) {
  var body      = req.body;
  var articleId = req.params.articleId;

  // Update comments of  the given Article using the body data
  Article.findByIdAndUpdate(articleId, { $set: { comments: body } }, function update(err, article) {
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

});


// Error Handling Middleware
app.use(function errorHandler(err, req, res, next) {
  if(err.name === 'CastError') {
    err.STATUS = 400;
  }
  res.status(err.STATUS || 500);
  res.json({
    error: true,
    message: err.message,
    type: err.name,
    status: err.STATUS || 500
  });
});

app.listen(8000, function connectionListener() {
  console.log('API Server running on port 8000');
});
