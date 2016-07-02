// grab the mongoose module
var mongoose = require('mongoose');

var FeedbackSchema = new mongoose.Schema({
  providerId        : mongoose.Schema.Types.ObjectId,
  access            : Number,
  safeEffective     : Number,
  waitTimes	        : Number,
  satisfaction      : Number,
  painComfortLevel  : Number,
  doctorExperience  : Number,
  admissionProcess  : Number,
  nurseExperience	: Number
  
});

// define our Feedback model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Feedback', FeedbackSchema);