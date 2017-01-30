// Load Module Dependencies
var mongoose = require('mongoose');

var APIKeySchema = new mongoose.Schema({
  value:          { type: String },
  created_at:     { type: Date  },
  last_updated:   { type: Date }
});

module.exports  = mongoose.model('APIKey', APIKeySchema);
