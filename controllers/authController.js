const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const EmailHandler = require('./../utils/emailHandler');

//creating the jwt token
const signToken = id => {
  return jwt.sign(
    {
      id
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES
    }
  );
};

//common function for creating and sending JWT
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  //cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create({
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.passwordConfirm,
  //   passwordChangedAt: req.body.passwordChangedAt,
  //   role: req.body.role
  // });

  const newUser = await User.create(req.body);
  const url = 'http://localhost:3000/my_account';
  await new EmailHandler(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please enter your email and password', 400));
  }
  //check if the user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect user credentials', 401));
  }
  //send token as a response
  createSendToken(user, 200, res);
});

//function to log out users
exports.logout = (req, res, next) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'Success',
    message: 'You have logged out. Please log in again'
  });
};

//Middleware function to protect getAllTours route
exports.protectRoute = catchAsync(async (req, res, next) => {
  //Getting the token and checking if its there
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        `You aren't logged in. Please sign in to view the tours`,
        401
      )
    );
  }
  //Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);
  //Check if the user still exists. What if the users gets deleted meantime but the token still exists?
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user associated with this token cant be found', 401)
    );
  }
  //Check if the user changed password after the token was issued
  //   if (freshUser.changedPasswordAfter(decoded.iat)) {
  //     return next(
  //       new AppError(
  //         'You have recently changed your password. Please sign in again',
  //         401
  //       )
  //     );
  //   }

  //Grant access to the protected route
  res.locals.user = currentUser; //passing user data to the template
  req.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      res.locals.user = currentUser; //passing user data to the template
      req.user = currentUser;
      return next();
    }
  } catch (error) {
    return next();
  }

  next();
};

//We cannot pass arguments to middleware functions. Therefore, we use a wrapper function which will return the middleware function
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Operation Failed!!! You don't have permission to perform this action`,
          403
        )
      );
    }
    next();
  };
};

//Password Reset
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Get user details based on posted mail id
  const user = await User.findOne({
    email: req.body.email
  });
  if (!user) {
    return next(
      new AppError(
        `Sorry!! The user with ${req.body.email} doesn't exist. Please enter the correct mail id`,
        404
      )
    );
  }

  //generate token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //send the token to the user's email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/reset_password/${resetToken}`;

  try {
    await new EmailHandler(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'Success',
      message: 'token sent to your mail id'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({
      validateBeforeSave: false
    });
    return next(
      new AppError(
        'Looks like there is an error sending the email. Please try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get the user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now()
    }
  });
  //if the token hasn't expired and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid/expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  //Update the changedPasswordAt property for the user
  //Log the user in , send JWT
  createSendToken(user, 200, res);
});

//Changing password for logged in users without password reset functionality
exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get user details
  const user = await User.findById(req.user.id).select('+password');
  //Check if the entered password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError(
        'Your current password is wrong. Please enter the correct password',
        401
      )
    );
  }
  //Update password if correct
  user.password = req.body.password;
  user.passwordConfirm = req.body.password;
  await user.save();
  //log the user in with JWT
  createSendToken(user, 200, res);
});
