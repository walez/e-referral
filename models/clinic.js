// grab the mongoose module
var mongoose = require('mongoose');

var ClinicSchema = new mongoose.Schema({
  name          : String,
  services      : [],
  waitTime      : Number,
  providerLevel : String,
  state         : String,
  district	    : String,
  address       : String,
	location      : [],
});

// define our Clinic model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Clinic', ClinicSchema);