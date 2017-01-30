// Load Module Dependencies
var mongoose  = require('mongoose');

var UserSchema  = new mongoose.Schema({
  type:   { type: String },
  key:    { type: mongoose.Schema.Types.ObjectId, ref: 'APIKey' },
  created_at:     { type: Date  },
  last_updated:   { type: Date }
});

module.exports= mongoose.model('User', UserSchema);
