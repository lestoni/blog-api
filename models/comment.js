// Load Module Dependencies
var mongoose = require('mongoose');

// Comment:
//  - id
//  - article(Reference)
//  - content
//  - created_at
//  - last_updated
//  - author
var CommentSchema = new mongoose.Schema({
  article:    { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  content:    { type: String },
  author:     { type: String },
  created_at:     { type: Date  },
  last_updated:   { type: Date }
});

module.exports = mongoose.model('Comment', CommentSchema);
