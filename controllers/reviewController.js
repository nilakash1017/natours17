const Review = require('./../models/reviewModel');
//const AppError = require('./../utils/appError');
//const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourData = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

//Getting all Reviews
exports.getAllReviews = factory.getAll(Review);

//Getting a single review
exports.getReview = factory.getOne(Review);

//Creating a review
exports.addReview = factory.createOne(Review);

//Updating a review
exports.updateReview = factory.updateOne(Review);

//deleting a review
exports.deleteReview = factory.deleteOne(Review);
