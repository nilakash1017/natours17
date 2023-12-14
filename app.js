const express = require('express');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');

const app = express();

//setting pug engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

//Global Middleware

//serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//Set security http headers
app.use(helmet());

//show dev api calls made
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limiting the no of requests from an ip to prevent D-DOS/Brute Force attack
const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message:
    'You have exceeded the max number of requests. Please try again after an hour'
});
app.use('/api', limiter);

//body parser - reading data from body (req.body)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

//Data Sanitization
app.use(mongoSanitize());
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQty',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//Test middleware
app.use((req, res, next) => {
  //console.log(req.headers);
  //console.log(req.cookies);
  next();
});

//Mounting the routers

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//handling unhandled routes
app.all('*', (req, res, next) => {
  // const error = new Error(`Couldn't find ${req.originalUrl} on this server`);
  // error.status = 'Failed';
  // error.statusCode = 404;

  next(new AppError(`Couldn't find ${req.originalUrl} on this server`, 404));
});

//Creating a Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
