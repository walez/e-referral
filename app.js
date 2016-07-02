var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session  = require('express-session');
var MongoStore = require('connect-mongo')(session);

//connect mongoose to mongoDB
mongoose.connect('mongodb://127.0.0.1:27017/e-referral', function(err)  {
    if(err){
		
      console.log('Connection Error:' + err);
      console.log('Trying with local mongo instance');
	}
        
    else
        console.log("Connected");
});


//require route path
var routes = require('./routes/index');
var users = require('./routes/users');
var patients = require('./routes/patient');
var pcp = require('./routes/pcp');
var admin = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({'secret': 'doomsday',
                 'store': new MongoStore({mongooseConnection: mongoose.connection, 
                                          ttl: 3600})}));

app.use('/', routes);
app.use('/users', users);
app.use(patients);
app.use(pcp);
app.use(admin);
app.get('/logout', function (req, res, next){
  req.session.destroy(function(error){
    if(error) throw error;
    res.redirect('/pcp/login');
  });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(3000, function(){
   console.log("e-referral running on port:" + 3000); 
});

module.exports = app;
