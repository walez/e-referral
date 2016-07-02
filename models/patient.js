// grab the mongoose module
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var PatientSchema = new mongoose.Schema({
  firstName       : String,
  lastName        : String,
  age             : Number,
  gender          : String,
  title           : String,
  
  bloodGroup      : String,
  height          : String,
  weight          : String,
  bmi             : String,
  temperature     : String,
  bloodPressure   : String,
  pulse           : String,
  respiration     : String,
  medical_history : [],
  
  picture         : String,
  birthDay        : String,
  maritalStatus   : String,
  occupation      : String,
  homeAddress     : String,
  phone           : String,
  email           : String,
  userName	      : String,
	password        : String,
});

PatientSchema.pre('save', function (next){
  var user = this;
  if(!user.isModified('password')) return next();
  
  bcrypt.genSalt(10, function(error, salt){
    if(error) return next(error);
    
    bcrypt.hash(user.password, salt, null,function (error, hash){
      if(error) return next(salt);
      
      user.password = hash;
      next();
    });
  });
});

PatientSchema.methods.comparePassword = function (candidatePassword, cb){
  bcrypt.compare(candidatePassword, this.password, function (error, isMatch){
    if(error) return cb(error);
    cb(null, isMatch);
  })
}

// define our Admin model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Patient', PatientSchema);