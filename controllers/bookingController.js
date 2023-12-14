const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./../controllers/handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //find the tour wrt to the tour id
  const tour = await Tour.findById(req.params.tourId);
  //create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`
          },
          unit_amount: tour.price * 100
        },
        quantity: 1
      }
    ],
    mode: 'payment'
  });
  //send it to client
  res.status(200).json({
    status: 'success',
    session,
    tour,
    user: req.user.id
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.body;
  if (!tour && !user && !price) {
    return next();
  }
  try {
    await Booking.create({ tour, user, price });
    res.status(201).json({
      status: 'Success',
      message: 'Booking was successful'
    });
  } catch (error) {
    res.status(400).json({
      status: 'Failed',
      message: `Oops!!! Booking was not made. ${error.message}`
    });
  }
});

exports.createBooking = factory.createOne(Booking);

exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
