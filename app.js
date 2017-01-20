// Load Module Dependencies
var express      = require('express');
var bodyParser   = require('body-parser');
var responseTime = require('response-time');

var app = express();

var DB = {
  articles: [],
  comments: []
};

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


// - POST(Creating a resource)
//  - /articles
//  - /comments
//  - /articles/:id/comments

// POST /articles
app.post('/articles', function createArticle(req, res, next) {
  var body    = req.body;
  var now     = new Date();

  // Create Article
  var article = {
    id: DB.articles.length,
    author: body.author,
    content: body.content,
    title: body.title,
    comments: [],
    last_updated: now,
    created_at: now
  };


  // Insert Article into DB
  DB.articles.push(article);

  // Response
  res.json(article);
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
    message: 'All is not lost! :)'
  });
});

// - PUT(Updating a resource)
//  - /articles
//  - /comments
//  - /articles/:id
//  - /comments/:id
//  - /articles/:id/comments


app.listen(8000, function connectionListener() {
  console.log('API Server running on port 8000');
});
