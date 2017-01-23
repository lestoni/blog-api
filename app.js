// Load Module Dependencies
var express      = require('express');
var bodyParser   = require('body-parser');
var responseTime = require('response-time');

var app = express();

var DB = {
  articles: [],
  comments: []
};

console.log(DB);

// Setup Middleware
app.use(bodyParser.json());
app.use(responseTime());

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

// Add CRUD endpoints
// - GET(Reading/getting a resource)
//  - /articles
//  - /comments
//  - /comments/:id
//  - /articles/:id
//  - /articles/:id/comments

// GET /articles
app.get('/articles', function getArticles(req, res, next) {
  res.json(DB.articles);
});

// GET /comments
app.get('/comments', function getComments(req, res, next) {
  res.json(DB.comments);
});

// GET /comments/:id
app.get('/comments/:commentId', function getComment(req, res, next) {

  var commentId = req.params.commentId;
  var comment;

  DB.comments.forEach(function iterator(item, index, arr) {
    if(commentId === item.id) {
      comment = item;
    }
  });

  res.json(comment || {});

});

// GET /articles/:id
app.get('/articles/:articleId', function getArticles(req, res, next) {

  var articleId = req.params.articleId;
  var article;


  DB.articles.forEach(function iterator(item, index, arr) {
    if(articleId === item.id) {
      article = item;
    }
  });

  res.json(article || {});

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

  var article = {
    id: '' + DB.articles.length,
    author: body.author,
    content: body.content,
    title: body.title,
    comments: [],
    last_updated: now,
    created_at: now
  };


  DB.articles.push(article);

  res.json(article);
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
app.delete('/articles', function deleteArticles(req, res, next) {
  DB.articles = [];

  res.json({
    message: 'Articles Deleted!'
  });
});

// DELETE /comments
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

app.listen(8000, function connectionListener() {
  console.log('API Server running on port 8000');
});
