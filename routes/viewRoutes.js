const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.route('/').get(authController.isLoggedIn, viewsController.getOverview);
router
  .route('/tour/:slug')
  .get(authController.isLoggedIn, viewsController.getTour);
router
  .route('/login')
  .get(authController.isLoggedIn, viewsController.getLoginForm);

router
  .route('/my_account')
  .get(authController.protectRoute, viewsController.getAccountData);

router
  .route('/my-tours')
  .get(authController.protectRoute, viewsController.getMyTours);

module.exports = router;
