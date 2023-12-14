const express = require('express');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

router.use(authController.protectRoute);

router
  .route('/checkout-session/:tourId')
  .get(bookingController.getCheckoutSession);

router.route('/create-booking').post(bookingController.createBookingCheckout);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .post(bookingController.createBooking)
  .get(bookingController.getAllBookings);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
