// grab the mongoose module
var mongoose = require('mongoose');

var ReferralSchema = new mongoose.Schema({
  patientId              : {type: mongoose.Schema.Types.ObjectId, 
                            ref: 'Patient'},
  referingProviderId     : {type: mongoose.Schema.Types.ObjectId, 
                            ref: 'Clinic'},
  referingPcpId          : {type: mongoose.Schema.Types.ObjectId, 
                            ref: 'Pcp'},
  referedProviderId      : {type: mongoose.Schema.Types.ObjectId, 
                            ref: 'Clinic'},
  referedPcpId           : {type: mongoose.Schema.Types.ObjectId, 
                            ref: 'Pcp'},
  referralType           : String,
  referralCategory       : String,
  requiredServices       : [String],
  diagnosis              : String,
  status                 : String,
  note                   : String,
  files                  : [String],
  adminSent              : {type: Boolean, default:false},
  created                : Date,
	updated                : {type: Date, default: Date.now()},
  
});

// define our Referral model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Referral', ReferralSchema);