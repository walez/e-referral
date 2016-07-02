// grab the mongoose module
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var AdminSchema = new mongoose.Schema({
  firstname  : String,
  lastname   : String,
  username	 : String,
	password   : String,
  clinic     : {type: mongoose.Schema.Types.ObjectId, 
                            ref: 'Clinic'}
});

AdminSchema.pre('save', function (next){
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

AdminSchema.methods.comparePassword = function (candidatePassword, cb){
  bcrypt.compare(candidatePassword, this.password, function (error, isMatch){
    if(error) return cb(error);
    cb(null, isMatch);
  });
}


// define our Admin model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Admin', AdminSchema);