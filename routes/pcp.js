var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var GoogleMapsAPI = require('googlemaps');

//Get Mongoose Model Objects
var Pcp = require('../models/pcp');
var Patient = require('../models/patient');
var Referral = require('../models/referral');
var Clinic = require('../models/clinic');
var Feedback = require('../models/feedback');

var gMapsApiKey = 'AIzaSyAihbCBztqb-A2Tu2JQH5hsYe0ZrvXUcB0';
var globalConfig = {
  key: 'AIzaSyAihbCBztqb-A2Tu2JQH5hsYe0ZrvXUcB0',
  secure: true
};

var pageData = {
  'title' : 'PCP '
}

var services = {
  "LAB":  "Laboratory",
  "PAE":  "Paediatric",
  "SUR":  "Surgical Services",
  "MAT":  "Maternity",
  "PHY":  "Physiotheraphy",
  "PHA":  "Pharmacy",
  "DENT":  "Dental Care",
  "ORT":  "Orthopaedic",
  "DER":  "Dermatology",
  "OBST":  "Obstetrics",
  "CAR":  "Cardiology",
  "DIET":  "Dietetics",
  "DIA":  "Diabetes",
  "NEU":  "Neurology",
  "OPHT":  "Ophthalmic",
  "PSY": "Psychiatry",
  "MDS": "Medical Diagnostic Services",  
};

/* GET PCP login. */
router.get('/pcp/login', function(req, res, next) {
  pageData.pcp = null;
  pageData.title = pageData.title + 'Login';
  res.render('pcp_login', pageData);
  
});

/* Auth PCP agent. */
router.post('/pcp/login', function(req, res, next) {
  console.log('Param:' + req.params.username, 'Body' + req.body.username, 'Query:' + req.query.username);
  Pcp.findOne({username: req.body.username})
  .populate("clinic_id")
  .exec(function (error, pcp){
    if(error) throw error;
    
    if(pcp){
      pcp.comparePassword(req.body.password, function (error, isMatch){
        if(error) throw error;
        
        if(isMatch){
          req.session.pcp = pcp;
          pageData.pcp = pcp;
          res.redirect('/pcp/referrals');
        }
        else
          res.redirect('/pcp/login');
      });
    }else{
      res.redirect('/pcp/login');
    }
    
  });
});



/* GET PCP referral list. */
router.get('/pcp/referrals', function(req, res, next) {
  
  if(!req.session.pcp)
    res.redirect('/pcp/login');
  
  var pcp = req.session.pcp;
  var pcpId = pcp._id;
  if(req.query.action && req.query.action == 'sent'){
    Referral.find( { 'referingPcpId': pcpId} )
    .populate('referingPcpId referingProviderId referedProviderId')
    .exec( function (error, referrals) {
      if(error){
        console.log(error);
        next(error);
      }

      pageData.title = pageData.title + 'Referrals';
      pageData.referrals = referrals;
      res.render('referral_list', pageData);
    });
  
  }else{
    Referral.find( {'$or': [{ 'referingPcpId': pcpId}, {'referedPcpId': pcpId}]} )
    .populate('referingPcpId referingProviderId referedProviderId')
    .sort({'created': -1})
    .exec( function (error, referrals) {
      if(error){
        console.log(error);
        next(error);
      }

      pageData.title = pageData.title + 'Referrals';
      pageData.referrals = referrals;
      console.log(referrals);
      res.render('referral_list', pageData);
    });
  
  }
});

/* GET referral detail page. */
router.get('/pcp/referral/:referral_id', function(req, res, next) {
  
  if(!req.session.pcp)
    res.redirect('/pcp/login');
  
  var pcp = req.session.pcp;
  Referral.findById( req.params.referral_id).populate('patientId referingProviderId referingPcpId')
    .populate('referedProviderId referedPcpId')
    .exec(function (error, referral) {
      if(error){
        console.log(error);
        next(error);
      }
    
      if(pcp._id != referral.referingPcpId._id)
        pageData.referingPcp = false;
      else
        pageData.referingPcp = true;
    
      pageData.title = pageData.title + 'Referral Detail';
      pageData.referral = referral;
      res.render('referral_status', pageData);
  });
  
});

/* create referral */
router.post('/pcp/referral/', function(req, res, next) {
  if(!req.session.pcp)
    res.redirect('/pcp/login');
  
  var referralData = {
    patientId              : req.body.patientId,
    referingProviderId     : req.session.pcp.clinic_id,
    referingPcpId          : req.session.pcp._id,
    referedProviderId      : req.body.provider,
    referralType           : req.body.referralType,
    referralCategory       : req.body.referralCategory,
    requiredServices       : req.body.requiredServices,
    diagnosis              : req.body.diagnosis,
    status                 : 'Pending',
    note                   : req.body.note,
    created                : Date.now()
  };
  
  var referral = new Referral(referralData);
  
  referral.save(function (error) {
    var response = {}
    if(error){
      console.log(error);
      response.status = 'error';
    }else
      response.status = 'success';
    
    res.json(response);
  });
  
});

//Accept Referral
router.get('/pcp/referral/:referral_id/accept', function (req, res, next){
  if(!req.session.pcp)
    res.redirect('/pcp/login');
  
  Referral.findById(req.params.referral_id, function (error, referral){
    if(error) throw error;
    referral.status = 'Accepted';
    referral.referedPcpId = req.session.pcp._id;
    referral.save(function(error){
      if(error) throw error;
      
      res.redirect('back');
    });
  });
});

router.get('/pcp/referral/:referral_id/reject', function (req, res, next){
  if(!req.session.pcp)
    res.redirect('/pcp/login');
  
  Referral.findById(req.params.referral_id, function (error, referral){
    if(error) throw error;
    referral.status = 'Rejected';
    referral.save(function(error){
      if(error) throw error;
      
      res.redirect('back');
    });
  });
});

/* GET referral settings page. */
router.get('/pcp/settings', function(req, res, next) {
  
  if(!req.session.pcp)
    res.redirect('/pcp/login');
  
  pageData.title = pageData.title + 'Settings';
  res.render('settings', pageData);
});


/* Search Endpoint */
router.post('/pcp/search', function(req, res, next){
  
  if(!req.session.pcp)
    res.redirect('/pcp/login');
  
  var results = {};
  var searchQuery = req.body.query;
  var regexQuery = { '$regex': '' + searchQuery + '', '$options': 'i' };
  
  
  if(mongoose.Types.ObjectId.isValid(searchQuery)){
    Patient.findById(searchQuery, function (error, patients){
    
      if(error) console.log(error);

      if(patients)
        results.patients = patients;

      Referral.findById(searchQuery, function (error, referral){
        if(error) console.log(error);

        if(referral)
          results.referral = referral;

        console.log("Results:",results);
        pageData.results = results;
        pageData.searchTerm = searchQuery;
        res.render('searchListing', pageData);
      });
    });
    
  }else{
    
    Patient.find({'$or': [{'lastName': regexQuery}, 
                        {'firstName': regexQuery} ]}, function (error, patients){
    
        if(error) console.log(error);

        if(patients)
          results.patients = patients;

        console.log("Results:",results);
        pageData.results = results;
        pageData.searchTerm = searchQuery;
        res.render('searchListing', pageData);
      });
  
  }
});

/* GET patient detail page. */
router.get('/pcp/patient/:patient_id', function(req, res, next) {
  
  if(!req.session.pcp)
    res.redirect('/pcp/login');
  
  Patient.findById(req.params.patient_id, function (error, patient){
    if(error) throw error;
    
    pageData.patient = patient;
    pageData.services = services;
    pageData.title = pageData.title + 'Patient Detail';
    res.render('patient_detail', pageData);
    
  });
});

router.get('/pcp/ref/providers', function (req, res, next){
//  console.log(req.params, req.body, req.query);
  
  var referralType = req.query.referralType;
  var referralCategory = req.query.referralCategory;
  var requiredServices = req.query.requiredServices || [/\w+/];
  
  var pcpClinic = req.session.pcp.clinic_id;
  console.log(pcpClinic);
  Clinic.findById(pcpClinic, function(error, clinic){
    if(error) throw error;
    
    Clinic.find({ services: { '$in': requiredServices}}, function(error, clinics) {
      if(error) throw error;

      clinics = clinics.splice(0,20);
      
      var promises = [];
      for(var i = 0; i < clinics.length; i++){
        promises[i] = new Promise(function (index){
          return function (resolve, reject){
            setDistance(clinic, clinics[index], resolve, reject);
          }
        }(i));
      }
      Promise.all(promises).then(function (providers){
        providers.forEach(setDistanceWeight);
        providers.forEach(setProviderLevelWeight);
        providers.forEach(setProviderWaitWeight);
        calculateProviderDetWeight(referralType, providers);
        
        var promises2 = [];
        for(var i = 0; i < providers.length; i++){
          promises2[i] = new Promise(function (index){
            return function (resolve, reject){
              calculatePatientFeedback(providers[index], resolve, reject);
            }
          }(i));
        }
        Promise.all(promises2).then(function (providers2){
          providers2.forEach(calculateProviderRanking);
          providers2 = providers2.filter(function(provider){
            if(provider._id == pcpClinic._id)
              return false;
            else
              return true;
          });
          res.json(providers2);
        }, function (error){
          res.json(error);
        });
      }, function(error){
        res.json(error);
      });
    });
  });
  
  
});

function calculateProviderRanking(provider){
  provider.rankSum = (provider.patientRankSum + provider.providerRankSum) / 2.0;
}

function calculatePatientFeedback(provider, resolve, reject){
  
  provider.feedback = {
    access: 0.0,
    safeEffective     : 0.0,
    waitTimes	        : 0.0,
    satisfaction      : 0.0,
    painComfortLevel  : 0.0,
    doctorExperience  : 0.0,
  };
  provider.patientRankSum = 0.0;
  
  Feedback.find({providerId: provider._id}, function (error, feedbacks){
    if(error) reject(error);
    
    var accessSum = 0.0;
    var safeSum = 0.0;
    var waitSum = 0.0;
    var satisSum = 0.0;
    var comfortSum = 0.0;
    var doctorSum = 0.0;
    var nurseSum = 0.0;
    var admissionSum = 0.0;
    
    feedbacks.forEach(function (feedback){
      accessSum += feedback.access;
      safeSum += feedback.safeEffective;
      waitSum += feedback.waitTimes;
      satisSum += feedback.satisfaction;
      comfortSum += feedback.painComfortLevel;
      doctorSum += feedback.doctorExperience;
      nurseSum += feedback.nurseExperience;
      admissionSum += feedback.admissionProcess;
    });
    
    var size = feedbacks.length;
    if(size >= 1 ){
      provider.feedback.access = (accessSum / size) * 0.15;
      provider.feedback.safeEffective = (safeSum / size) * 0.12;
      provider.feedback.waitTimes = (waitSum / size) * 0.12;
      provider.feedback.satisfaction = (satisSum / size) * 0.12;
      provider.feedback.painComfortLevel = (comfortSum / size) * 0.12;
      provider.feedback.doctorExperience = (doctorSum / size) * 0.13;
      provider.feedback.nurseExperience = (nurseSum / size) * 0.12;
      provider.feedback.admissionProcess = (admissionSum/size) * 0.12;
      
      provider.patientRankSum += provider.feedback.access;
      provider.patientRankSum += provider.feedback.safeEffective;
      provider.patientRankSum += provider.feedback.waitTimes;
      provider.patientRankSum += provider.feedback.satisfaction;
      provider.patientRankSum += provider.feedback.painComfortLevel;
      provider.patientRankSum += provider.feedback.doctorExperience;
      provider.patientRankSum += provider.feedback.nurseExperience;
      provider.patientRankSum += provider.feedback.admissionProcess;
    }
    resolve(provider);
    
  });
}

function calculateProviderDetWeight(referralCategory, providers){
  if(referralCategory == "emergency")
    return calculateProviderDetEmergencyWeight(providers);
  else
    return calculateProviderDetRegularWeight(providers);
}

function calculateProviderDetEmergencyWeight(providers){
  
  providers.forEach(function(provider){
    var rankSum = 0.0;
    rankSum += (0.40 * provider.distanceWeight);
    rankSum += (0.35 * provider.waitTimeWeight);
    rankSum += (0.25 * provider.providerLevelWeight);
    provider.providerRankSum = rankSum;
  });
}

function calculateProviderDetRegularWeight(providers){
  
  providers.forEach(function(provider){
    var rankSum = 0.0;
    rankSum += (0.35 * provider.distanceWeight);
    rankSum += (0.40 * provider.waitTimeWeight);
    rankSum += (0.25 * provider.providerLevelWeight);
    provider.providerRankSum = rankSum;
  });
}


function setDistance(fromClinic, toClinic, resolve, reject){
  var googleMaps = new GoogleMapsAPI(globalConfig);
  var distanceConfig = {
    origins: fromClinic.location[0].lat + "," + fromClinic.location[0].lng,
    destinations: toClinic.location[0].lat + "," + toClinic.location[0].lng
  };
  googleMaps.distance(distanceConfig, function(error, response){
    if(error) reject(error);
    
    if(response.rows[0] && response.rows[0].elements[0]){
      toClinic = toClinic.toObject();
      toClinic.duration = response.rows[0].elements[0].duration.value;
      toClinic.distance = response.rows[0].elements[0].distance.value;
      resolve(toClinic);
    }
  });
}

function setDistanceWeight (clinic){
  var distance = clinic.distance;
  if(distance < 1000)
    clinic.distanceWeight = 1;
  else if(distance >= 1000 && distance < 5000)
    clinic.distanceWeight = 0.8;
  else if(distance >= 5000 && distance < 10000)
    clinic.distanceWeight = 0.6;
  else if(distance >= 10000 && distance < 25000)
    clinic.distanceWeight = 0.4;
  else if(distance >= 25000 && distance < 50000)
    clinic.distanceWeight = 0.2;
  else if(distance >= 50000)
    clinic.distanceWeight = 0;
}

function setProviderWaitWeight(clinic){
  var waitTime = clinic.waitTime;
  if(waitTime < 240)
    clinic.waitTimeWeight = 1;
  else if(waitTime >= 240 && waitTime < 480)
    clinic.waitTimeWeight = 0.8;
  else if(waitTime >= 480 && waitTime < 960)
    clinic.waitTimeWeight = 0.6;
  else if(waitTime >= 960 && waitTime < 1000)
    clinic.waitTimeWeight = 0.4;
  else if(waitTime >= 1000)
    clinic.waitTimeWeight = 0.0;
  
}

function setProviderLevelWeight (clinic){
  var providerLevel = clinic.providerLevel;
  if(providerLevel == "SCP")
    clinic.providerLevelWeight = 1;
  else if(providerLevel == "THP")
    clinic.providerLevelWeight = 0.7;
  else if(providerLevel == "PCP")
    clinic.providerLevelWeight = 0.3
}

module.exports = router;
