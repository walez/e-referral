var express = require('express');
var router = express.Router();
var request = require('request');
var GoogleMapsAPI = require('googlemaps');

var Patient = require('../models/patient');
var Pcp     = require('../models/pcp');
var Clinic   = require('../models/clinic');
var Admin   = require('../models/admin');


//https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=12+Idowu+Martins+St,Lagos,Nigeria&destinations=5+Pelewura+Crescent,Apapa,Lagos,Nigeria&key=AIzaSyAihbCBztqb-A2Tu2JQH5hsYe0ZrvXUcB0

var globalConfig = {
  key: 'AIzaSyAihbCBztqb-A2Tu2JQH5hsYe0ZrvXUcB0',
  secure: true
};

var placeSearchConfig = {
    radius: '500',
    types:   'hospital',
    location: '6.5243793,3.3792057'
  };
  
var providerLevels = ['SCP', 'THP', 'PCP'];
var servicesAvailable = ['LAB', 'RAD', 'MED'];



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/setup', function(req, res, next){
  Clinic.find({}, function(error, providers){
    if(error) throw error;
    
    res.render('setup', {providers: providers});
  });
});

router.post('/setup/patient', function(req, res, next){
  
  var patient = new Patient({
      title           : req.body.title,
      firstName       : req.body.firstname,
      lastName        : req.body.lastname,
      age             : req.body.age,
      gender          : req.body.gender,
      userName	      : req.body.username,
	    password        : req.body.password,
      bloodGroup      : req.body.bloodGroup,
      height          : req.body.height,
      weight          : req.body.weight,
      bmi             : req.body.bmi,
      temperature     : req.body.temperature,
      bloodPressure   : req.body.bloodPressure,
      pulse           : req.body.pulse,
      respiration     : req.body.respiration,
      birthDay        : req.body.birthDay,
      maritalStatus   : req.body.maritalStatus,
      occupation      : req.body.occupation,
      homeAddress     : req.body.homeAddress,
      phone           : req.body.phone,
      email           : req.body.email
  });
  
  patient.save(function(error){
    if(error) throw error;
    
    res.redirect('back');
  });
});

router.post('/setup/admin', function(req, res, next){
  var admin = new Admin({
    firstname       : req.body.firstname,
    lastname        : req.body.lastname,
    username	      : req.body.username,
	  password        : req.body.password,
    clinic          : req.body.provider
  });
  
  admin.save(function (error){
    if(error) throw error;
    res.redirect('back');
  });
});

router.get('/populate/patient', function (req, res, next) {
  var patient = new Patient({
      firstName       : 'Wale',
      lastName        : 'Martins',
      age             : 21,
      gender          : 'Male',
      title           : 'Mr',
      userName	      : 'Walez',
	    password        : '123456',
  });
  
  patient.save(function(error){
    if(error) throw error;
    
    Patient.findOne({}, function(error, user){
      if(error) throw error;
      
      user.comparePassword('123456', function (error, isMatch){
        if(error) throw error;
        
        console.log(isMatch);
        res.json(user);
      });
    });
  });
});

router.get('/populate/pcp', function (req, res, next){
  var pcp = new Pcp({
    title           : 'Dr',
    firstname       : "Testing",
    lastname        : 'Tester',
    age             : 51,
    gender          : 'Female',
    username	      : 'tester',
	  password        : '12345',
    email           : 'test@gmail.com',
    phone           : '0811221212',
    maritalStatus   : 'Married',
    specialtyLevel  : ['specialist'],
    clinic_id       : '57545d52afa411bc1084754d'
  });
  
  pcp.save(function (error){
    if(error) throw error;
    
    res.send("Hello");
  });
  
});

router.get('/populate/admin', function (req, res, next){
  var admin = new Admin({
    firstname       : "Mark",
    lastname        : 'Anders',
    username	      : 'anders',
	  password        : '12345',
    clinic          : '57545d52afa411bc10847544'
  });
  
  admin.save(function (error){
    if(error) throw error;
    res.send("Hello");
  });
  
});

router.get('/populate/clinic', function (req, res, next){
  var clinic = new Clinic({
    name          : 'Dowen Hospital',
    services      : ['LAB', 'RAD', 'MED'],
    waitTime      : 300,
    providerLevel : 'SCP',
    state         : 'Lagos',
    district	    : 'Somewhere',
    location      : 'Nowhere',
  });
  
  clinic.save(function (error){
    if(error) throw error;
    
    Clinic.findOne({}, function (error, clinic){
      if(error) throw error;
      
      res.json(clinic);
    });
  });
});

router.get('/fetch/clinic', function (req, res, next) {
  fetchHospitalsFromGMaps(res);
});

module.exports = router;


function fetchHospitalsFromGMaps(res){
  var lagosLatLng = {
    lat: '6.5243793',
    lng: '3.3792057'
  };
  
  var googleMaps = new GoogleMapsAPI(globalConfig);
  googleMaps.placeSearch(placeSearchConfig, function(error, data) {
    if(error) throw error;
    
    var clinics = data.results;
    var nextPageToken = data.next_page_token;
    addClinics(clinics);
    placeSearchConfig.pagetoken = nextPageToken;
    googleMaps.placeSearch(placeSearchConfig, function(error, data){
      if(error) throw error;
      
      var clinics = data.results;
      addClinics(clinics);
    });
    res.json(data);
  });
}

function addClinics(clinics){
  clinics.forEach(function(clinic){
      var fields = {};
      fields.name = clinic.name;
      fields.waitTime = Math.random() * 1000;
      fields.providerLevel = providerLevels[(Math.random() * 10) % 3];
      fields.services = servicesAvailable;
      fields.address = clinic.vicinity;
      fields.location = clinic.geometry.location;
      
      var clinicObj = new Clinic(fields);
      clinicObj.save(function (error){
        if(error) throw error;
      });
    });
}