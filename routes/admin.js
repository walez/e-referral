var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

//Get Mongoose Model Objects
var Admin = require('../models/admin');
var Pcp = require('../models/pcp');
var Patient = require('../models/patient');
var Referral = require('../models/referral');
var Clinic = require('../models/clinic');
var Feedback = require('../models/feedback');


var pageData = {
  'title' : 'Admin ',
}

/* GET PCP login. */
router.get('/admin/login', function(req, res, next) {
  
  pageData.title = 'Admin Login';
  res.render('admin_login', pageData);
  
});

/* Auth PCP agent. */
router.post('/admin/login', function(req, res, next) {
  
  Admin.findOne({username: req.body.username})
    .populate('clinic')
    .exec(function (error, admin){
      if(error) throw error;

      if(admin){
        admin.comparePassword(req.body.password, function (error, isMatch){
          if(error) throw error;

          if(isMatch){
            req.session.admin = admin;
            res.redirect('/admin/referrals');
          }
          else
            res.redirect('/admin/login');
        });
      }else{
        res.redirect('/admin/login');
      }
    
    });
});

router.get('/admin/pcps', function(req, res, next){
  if(!req.session.admin)
    res.redirect('/admin/login');

  var admin = req.session.admin;console.log(admin);

  Pcp.find({'clinic_id': admin.clinic._id}, function(error, pcps){
    if(error) throw error;

    pageData.pcps = pcps;
    res.render('admin_pcp_list', pageData);
  });
})

/* GET PCP referral list. */
router.get('/admin/referrals', function(req, res, next) {
  
  if(!req.session.admin)
    res.redirect('/admin/login');
  
  var admin = req.session.admin;console.log(admin);
  var adminId = admin._id;
  var clinicId = admin.clinic._id;
  if(req.query.action && req.query.action == 'sent'){
    Referral.find( { 'referringProviderId': clinicId} )
    .populate('referingPcpId referedProviderId referingProviderId')
    .exec( function (error, referrals) {
      if(error){
        console.log(error);
        next(error);
      }

      pageData.title = pageData.title + 'Referrals';
      pageData.referrals = referrals;
      res.render('admin_referral_list', pageData);
    });
  
  }else{
    Referral.find( {'$or': [{ 'referingProviderId': clinicId}, {'referedProviderId': clinicId}]} )
    .populate('referingPcpId referedProviderId referingProviderId')
    .sort({'created': -1})
    .exec( function (error, referrals) {
      if(error){
        console.log(error);
        next(error);
      }
      
      pageData.title =  'Admin Referrals';
      pageData.clinicName = admin.clinic.name;
      pageData.referrals = referrals;
      res.render('admin_referral_list', pageData);
    });
  
  }
});

/* GET referral detail page. */
router.get('/admin/referral/:referral_id', function(req, res, next) {
  
  if(!req.session.admin)
    res.redirect('/admin/login');
  
  Referral.findById( req.params.referral_id).populate('patientId referingProviderId referingPcpId')
    .populate('referedProviderId referedPcpId')
    .exec(function (error, referral) {
      if(error){
        console.log(error);
        next(error);
      }
      var clinicId = req.session.admin.clinic._id;
      if(!referral.adminSent){
        
        Pcp.find({"clinic_id": clinicId}).exec(function(error, pcps){
          if(error) throw error
          
          console.log(referral);
          if( clinicId == referral.referingProviderId._id)
            pageData.referingClinic = true;
          else
            pageData.referingClinic = false;
          pageData.pcps = pcps;
          pageData.adminSent = false;
          pageData.title = 'Admin Referral Detail';
          pageData.referral = referral;
          res.render('admin_referral_status', pageData);
        });
      }else{

        if( clinicId == referral.referingProviderId._id)
            pageData.referingClinic = true;
          else
            pageData.referingClinic = false;

        pageData.adminSent = true;
        pageData.title = 'Admin Referral Detail';
        pageData.referral = referral;
        res.render('admin_referral_status', pageData);
      }
      
  });
  
});

router.post('/admin/send/referral', function(req, res, next){
  
  console.log(req.body);
  var pcpId = req.body.pcpId;
  var referralId = req.body.referralId;
  var response = {};
  
  Referral.findById(referralId).exec(function(error, referral){
    if(error) throw error;
    
    referral.adminSent = true;
    referral.referedPcpId = pcpId;
    referral.save(function(error){
      if(error){
        throw error;
        response.status = "error";
      }else
        response.status = "success";
      res.json(response);
      
    });
  });
});

//Add PCP
router.post('/admin/new/pcp', function(req, res, next){
  
  var pcp = new Pcp({
    title           : req.body.title,
    firstname       : req.body.firstname,
    lastname        : req.body.lastname,
    gender          : req.body.gender,
    username	      : req.body.username,
	  password        : req.body.password,
    phone           : req.body.phone,
    maritalStatus   : req.body.maritalStatus,
    specialtyLevel  : req.body.specialityLevel,
    clinic_id       : req.session.admin.clinic._id
  });
  
  pcp.save(function (error){
    if(error) throw error;
    
    res.redirect("back");
  });
  
});


module.exports = router;