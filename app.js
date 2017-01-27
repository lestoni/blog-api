// Load Module Dependencies
var express      = require('express');
var bodyParser   = require('body-parser');
var responseTime = require('response-time');
var xtend        = require('xtend');
var mongoose     = require('mongoose');

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
  set_auth: false
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
}

function authorize(types) {

  return function middleware(req, res, next) {
    // IF type is not okay - return error
    // 401
    //
    // if okay call next
    //
    //
    var user = req._user;
    var _isOk = false;

    types.forEach(function iter(type) {
      if(user.type === type) {
        _isOk = true;
      }
    });

    if(!_isOk) {
      res.status(401);
      res.json({
        error: true,
        message: 'You are not authorized to complete this action! Go home!'
      });

      return;

    } else {
      next();

    }

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
app.get('/articles', function getArticles(req, res, next) {

  Article.find({}, function getAllArticles(err, docs) {
    if(err) {
      return next(err);
    }

    res.json(docs);
  });

});

// GET /comments
// @TODO Add Authorization
// ONLY ADMIN CAN VIEW/PROCEED

app.get('/comments', function getComments(req, res, next) {

});

// GET /comments/:id
app.get('/comments/:commentId',  function getComment(req, res, next) {

  var commentId = req.params.commentId;
  var comment;

  DB.comments.forEach(function iterator(item, index, arr) {
    if(commentId === item.id) {
      comment = item;
    }
  });

  if(comment) {
    res.json(comment);

  } else {
    res.status(404);
    res.json({
      error: true,
      message: 'Comment Requested Not Found!'
    });
  }

});

// GET /articles/:id
app.get('/articles/:articleId', function getArticles(req, res, next) {

  var articleId = req.params.articleId;
  var article;

  Article.findById(articleId, function cb(err, article) {
    if(err) {
      return next(err);
    }

    res.json(article);
  });

});

// GET /articles/:id/comments
app.get('/articles/:articleId/comments', function getArticleComments(req, res, next) {

  var articleId = req.params.articleId;
  var comments  = [];

  DB.comments.forEach(function iterator(item, index, arr) {
    if(articleId === item.article) {
      comments.push(item);
    }
  });

  res.json(comments);

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
  var article = new Article({
    author: body.author,
    content: body.content,
    title: body.title,
    last_updated: now,
    created_at: now
  });

  // SAVE THE NEW ARTICLE TO THE DB
  article.save(function cb(err, article) {
    if(err) {
      return next(err);
    }

    res.status(201);
    res.json(article);

  });



});

// POST /comments
app.post('/comments', function createComment(req, res, next) {
  var body    = req.body;
  var now     = new Date();

  var comment = {
    id: '' + DB.comments.length,
    article: body.article,
    content: body.content,
    author: body.author,
    last_updated: now,
    created_at: now
  };

  DB.articles.forEach(function iter(article) {
    if(body.article === article.id) {
      article.comments.push(comment.id);
    }
  });


  DB.comments.push(comment);

  res.json(comment);
});

// - DELETE(Deleting a resource)
//  - /articles
//  - /comments
//  - /articles/:id
//  - /comments/:id
//  - /articles/:id/comments

// DELETE /articles
// @TODO Add Authorization
app.delete('/articles', function deleteArticles(req, res, next) {
  DB.articles = [];

  res.json({
    message: 'Articles Deleted!'
  });
});

// DELETE /comments
// @TODO Add Authorization
app.delete('/comments', function deleteComment(req, res, next) {
  DB.comments = [];

  res.json({
    message: 'Comments Deleted!'
  });
});

// DELETE /articles/:id
app.delete('/articles/:articleId', function deleteArticle(req, res, next) {

  var articleId = req.params.articleId;
  var article;

  DB.articles.forEach(function iterator(item, index, arr) {
    if(articleId === item.id) {
      article = item;
    }
  });

  if(article) {
    DB.comments = DB.comments.filter(function iter(item, index, arr) {
      return item.article !== article.id;
    });

    DB.articles.splice(article.id, 1);
  }

  res.json(article || {});
});

// DELETE /comments/:id
app.delete('/comments/:commentId', function deleteComment(req, res, next) {

  var commentId = req.params.commentId;
  var comment;
  var article;

  DB.comments.forEach(function iterator(item, index, arr) {
    if(commentId === item.id) {
      comment = item;
    }
  });

  if(comment) {
    DB.articles.forEach(function iter2(item) {
      if(comment.article === item.id) {
        article = item;
      }
    });

    article.comments = article.comments.filter(function iter(item, index, arr) {
      return item !== comment.id;
    });

    DB.comments.splice(comment.id, 1);
  }

  res.json(comment || {});
});

// DELETE /articles/:id/comments
app.delete('/articles/:articleId/comments', function deleteArticleComments(req, res, next) {

  var articleId = req.params.articleId;
  var comment;
  var article;

  DB.articles.forEach(function iterator(item, index, arr) {
    if(articleId === item.id) {
      item.comments = [];
      article = item;
    }
  });


  res.json(article || {});
});

// - PUT(Updating a resource)
//  - /articles
//  - /comments
//  - /articles/:id
//  - /comments/:id
//  - /articles/:id/comments

// PUT /articles
// @TODO Add Authorization
app.put('/articles', function updateArticles(req, res, next) {
  var body = req.body;

  var _keys = Object.keys(body);

  DB.articles.forEach(function iter1(article, index, arr) {
    _keys.forEach(function iter2(attr) {
      if(article[attr]) {
        article[attr] = body[attr];
      }
    });
  });

  res.json({
    message: 'All Articles updated successfully'
  });
});

// PUT /comments
// @TODO Add Authorization
app.put('/comments', function updateComments(req, res, next) {
  var body = req.body;

  var _keys = Object.keys(body);

  DB.comments.forEach(function iter1(comment, index, arr) {
    _keys.forEach(function iter2(attr) {
      if(comment[attr]) {
        comment[attr] = body[attr];
      }
    });
  });

  res.json({
    message: 'All comments updated successfully'
  });
});

// PUT /articles/:id
app.put('/articles/:articleId', function updateArticle(req, res, next) {
  var body      = req.body;
  var articleId = req.params.articleId;
  var _keys     = Object.keys(body);
  var article;

  DB.articles.forEach(function iterator(item, index, arr) {
    if(articleId === item.id) {
      article = item;

      _keys.forEach(function iter2(attr) {
        if(article[attr]) {
          article[attr] = body[attr];
        }
      });
    }
  });

  res.json(article || {});

});

// PUT /comments/:id
app.put('/comments/:commentId', function updateComment(req, res, next) {
  var body      = req.body;
  var commentId = req.params.commentId;
  var _keys     = Object.keys(body);
  var comment;

  DB.comments.forEach(function iterator(item, index, arr) {
    if(commentId === item.id) {
      comment = item;

      _keys.forEach(function iter2(attr) {
        if(comment[attr]) {
          comment[attr] = body[attr];
        }
      });
    }
  });

  res.json(comment || {});

});

// PUT /articles/:id/comments
app.put('/articles/:articleId/comments', function updateArticle(req, res, next) {
  var body      = req.body;
  var articleId = req.params.articleId;
  var _keys     = Object.keys(body);
  var article;

  DB.articles.forEach(function iterator(item, index, arr) {
    if(articleId === item.id) {
      article = item;

      article.comments.forEach(function iter1(comment) {
        _keys.forEach(function iter2(attr) {
          if(comment[attr]) {
            comment[attr] = body[attr];
          }
        });
      });

    }
  });

  res.json(article || {});

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
