'use strict';

// Load Module Dependencies
var express      = require('express');
var bodyParser   = require('body-parser');
var responseTime = require('response-time');
var xtend        = require('xtend');
var mongoose     = require('mongoose');
var async        = require('async');

// Load Controllers
var articleController = require('./controllers/article');
var commentController = require('./controllers/comment');

var authenticate      = require('./lib/authenticate');
var authorize         = require('./lib/authorize');

var app = express();

mongoose.connect('mongodb://localhost/blog');

mongoose.connection.on('connected', function connectionListener() {
  console.log('I cant wait to go home!');
});

// Setup Middleware
app.use(bodyParser.json());

app.use(responseTime());

app.use(authenticate({
  set_auth: true
}));


// - ARTICLES -

// GET /articles
app.get('/articles', authorize(['admin']), articleController.getArticles);
// GET /articles/:id
app.get('/articles/:articleId', authorize(['admin', 'consumer']), articleController.getArticle);
// GET /articles/:id/comments
app.get('/articles/:articleId/comments', authorize(['admin', 'consumer']), articleController.getArticleComments);
// POST /articles
app.post('/articles', authorize(['admin', 'consumer']), articleController.createArticle);
// DELETE /articles
app.delete('/articles', authorize(['admin']),  articleController.deleteArticles);
// PUT /articles/:id/comments
app.put('/articles/:articleId/comments', articleController.updateArticle);
// DELETE /articles/:id
app.delete('/articles/:articleId', authorize(['admin', 'consumer']),  deleteArticle);



// - COMMENTS -

// GET /comments
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
