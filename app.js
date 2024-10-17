var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var { create } = require('express-handlebars')
var {connectDB}=require('./config/dbconnect')
var session = require('express-session');
var fileUpload=require('express-fileupload')

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');




var app = express();
//for cookies
const cors = require('cors');
app.use(cors());

const hbs = create({
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
  extname: 'hbs',
  defaultLayout: 'lay',
  layoutsDir: path.join(__dirname, 'views/layout'),
  partialsDir: path.join(__dirname, 'views/partials')
});

// Set Handlebars as the view engine
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

connectDB().catch(err => console.error('Failed to connect to database', err));

app.use(session({
  secret: '789key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 10 } // 10 minutes
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())


app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.set('views', path.join(__dirname, 'views'));
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
