/* eslint-disable */
//const stripe = Stripe(process.env.STRIPE_PUBLIC_KEY);
const { showAlert } = require('./alerts');

export const bookTour = async tourId => {
  try {
    //get session from api
    const response = await fetch(`/api/v1/bookings/checkout-session/${tourId}`);
    const data = await response.json();
    const sessionId = data.session.id;
    console.log(data);
    console.log(sessionId);
    if (data.status === 'success') {
      console.log('here');
      const bookingData = {
        tour: data.tour.id,
        price: data.tour.price,
        user: data.user
      };
      console.log(bookingData);
      const bookingResponse = await fetch('/api/v1/bookings/create-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const bookingResponseData = await bookingResponse.json();
      console.log(bookingResponseData);
      if (bookingResponseData.status === 'Success') {
        showAlert('success', bookingResponseData.message);
        window.setTimeout(() => {
          location.assign('/');
        }, 1500);
      }
    }
    // await stripe.redirectToCheckout({
    //   session: data.session.id
    // });
  } catch (error) {
    showAlert('error', error);
  }
};
