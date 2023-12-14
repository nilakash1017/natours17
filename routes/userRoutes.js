//Routes
//Creating the routers
const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot_password', authController.forgotPassword);
router.patch('/reset_password/:token', authController.resetPassword);

router.use(authController.protectRoute);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUserById);
router.patch(
  '/updateAccountDetails',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateAccountDetails
);
router.delete('/deleteAccount', userController.deleteAccount);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createNewUser);

router
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
