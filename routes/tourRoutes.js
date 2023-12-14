//Routes
//Creating the routers
const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

//param middleware
//router.param('id', tourController.checkId);

//mounting routers
//Post /tour/<id>/reviews
//Get /tour/<id>/reviews
router.use('/:tourId/reviews', reviewRouter);

//Aliasing - top 5 best and cheapest tours by implementing middleware
router
  .route('/top-5-best-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

//busiest month of Natours
router
  .route('/monthly-plan/:year')
  .get(
    authController.protectRoute,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

//Geospatial Queries
router
  .route('/tours-within/:distance/centre/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

//Calculating distances from the tour locations to the starting point
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

//Getting the Tour Stats
router.route('/tour-stats').get(tourController.getTourStats);

//Chaining multiple middleware functions
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protectRoute,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protectRoute,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protectRoute,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
