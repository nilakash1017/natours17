const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res) => {
  //Get tour data from collection
  const tours = await Tour.find();
  //Build Template
  //Render the template using tour data
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //get the data for the requested tour including reviews and guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with this name', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your Account'
  });
});

exports.getAccountData = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account Details'
  });
};

exports.getMyTours = catchAsync(async (req, res) => {
  //find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  //find all tours with the tour ids
  const tourIds = bookings.map(el => el.tour);
  const tours = await Tour.find({
    _id: {
      $in: tourIds
    }
  });
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});
