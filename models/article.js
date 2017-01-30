// Load Module Dependencies
var mongoose = require('mongoose');


// Article:
//  - id
//  - author
//  - title
//  - content
//  - comments
//  - created_at
//  - last_updated
//
var ArticleSchema = new mongoose.Schema({
  author:     { type: String },
  title:      { type: String },
  content:    { type: String },
  comments:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  created_at:   { type: Date  },
  last_updated: { type: Date }
});


module.exports = mongoose.model('Article', ArticleSchema);
