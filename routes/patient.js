var express = require('express');
var router = express.Router();
var Patient = require('../models/patient');
var Clinic = require('../models/clinic');
var Feedback = require('../models/feedback');

/* GET patient login. */
router.get('/patient/login', function(req, res, next) {
  res.render('patient_login', {'title': 'Patient Login'});
});

/* Auth patient. */
router.post('/patient/login', function(req, res, next) {
  console.log('Param:' + req.params.username, 'Body' + req.body.username, 'Query:' + req.query.username);
  Patient.findOne({userName: req.body.username}, function (error, patient){
    if(error) throw error;
    
    if(patient){
      patient.comparePassword(req.body.password, function (error, isMatch){
        if(error) throw error;
        
        if(isMatch){
          req.session.patient = patient;
          res.redirect('/patient/feedback');
        }
        else
          res.redirect('/patient/login');
      });
    }else{
      res.redirect('/patient/login');
    }
    
  });
});

/* GET patient feedback. */
router.get('/patient/feedback', function(req, res, next) {
  var pageData = {'title': 'Patient Feedback'};
  
  Clinic.find({}, function(error, clinics){
    if(error) throw error;
    
    if(req.session.feedStatus){
      pageData.status = req.session.feedStatus;
      req.session.feedStatus = null;
    }
    
    pageData.providers = clinics;
    res.render('patient_feedback', pageData);
  });
});

router.post('/patient/feedback', function(req, res, next) {
  
  var feedbackData = {
    providerId        : req.body.provider,
    access            : req.body.accessRating,
    safeEffective     : req.body.safetyRating,
    waitTimes	        : req.body.waitTimeRating,
    satisfaction      : req.body.satisfactionRating,
    painComfortLevel  : req.body.comfortRating,
    doctorExperience  : req.body.doctorExpRating,
    nurseExperience   : req.body.nursingExpRating,
    admissionProcess  : req.body.admissionRating,
  };
  var feedback = new Feedback(feedbackData);
  feedback.save(function(error){
    
    if(error) req.session.feedStatus = 'failure';
    else  req.session.feedStatus = 'success';
    
    res.redirect('back');
  });
});

module.exports = router;
